import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { decryptSabPaisaResponse } from "@/lib/sabpaisa-crypto";

function isBrowserRedirect(request) {
  const secFetchMode = request.headers.get("sec-fetch-mode") || "";
  const accept = request.headers.get("accept") || "";
  const userAgent = request.headers.get("user-agent") || "";

  return (
    secFetchMode.toLowerCase() === "navigate" ||
    accept.includes("text/html") ||
    userAgent.includes("Mozilla")
  );
}

function mapOrderStatus(statusCode) {
  return statusCode === "0000"
    ? { paymentStatus: "success", orderStatus: "paid" }
    : { paymentStatus: "failed", orderStatus: "failed" };
}

function isNextRedirectError(error) {
  const digest = String(error?.digest || "");
  return digest.startsWith("NEXT_REDIRECT;");
}

function normalizeStatusCode(value) {
  return String(value || "").trim();
}

function isCallbackSuccess(parsed, statusCode) {
  const normalizedCode = normalizeStatusCode(statusCode);
  const gatewayStatus = String(parsed?.status || parsed?.sabpaisaStatus || "")
    .trim()
    .toUpperCase();

  return (
    normalizedCode === "0000" ||
    gatewayStatus === "SUCCESS" ||
    gatewayStatus === "CAPTURED"
  );
}

function isPaymentRecordSuccess(payment) {
  const paymentStatus = String(payment?.status || "")
    .trim()
    .toLowerCase();
  const responseCode = normalizeStatusCode(payment?.responseCode);

  return (
    paymentStatus === "success" ||
    paymentStatus === "paid" ||
    responseCode === "0000"
  );
}

async function extractCallbackPayload(request) {
  const queryEntries = Object.fromEntries(
    request.nextUrl.searchParams.entries(),
  );
  const contentType = request.headers.get("content-type") || "";

  if (
    request.method === "POST" &&
    (contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data"))
  ) {
    const formData = await request.formData();
    const formEntries = Object.fromEntries(formData.entries());

    return {
      source: "form",
      payload: {
        ...queryEntries,
        ...formEntries,
      },
    };
  }

  return {
    source: "query",
    payload: queryEntries,
  };
}

async function handleCallback(request) {
  let clientTxnId = "";

  try {
    const { source, payload } = await extractCallbackPayload(request);
    const encResponseValue =
      payload.encResponse ||
      payload.encresponse ||
      payload.encData ||
      payload.encdata ||
      payload.response;

    console.log("[SabPaisa][Callback] request source:", source);
    console.log("[SabPaisa][Callback] incoming payload:", payload);
    console.log(
      "[SabPaisa][Callback] raw encResponse:",
      encResponseValue || null,
    );
    console.log(
      "[SabPaisa][Callback] raw encResponse length:",
      typeof encResponseValue === "string" ? encResponseValue.length : null,
    );

    if (!encResponseValue || typeof encResponseValue !== "string") {
      return NextResponse.json(
        { error: "Malformed request: encResponse missing" },
        { status: 400 },
      );
    }

    const parsed = decryptSabPaisaResponse(encResponseValue);
    const statusCode = normalizeStatusCode(parsed.statusCode);
    clientTxnId = String(parsed.clientTxnId || "");

    console.log("[SabPaisa][Callback] decrypted payload:", parsed);
    console.log("[SabPaisa][Callback] statusCode:", statusCode);
    console.log("[SabPaisa][Callback] clientTxnId:", clientTxnId);

    if (!statusCode || !clientTxnId) {
      return NextResponse.json(
        {
          error: "Malformed decrypted payload: missing statusCode/clientTxnId",
        },
        { status: 400 },
      );
    }

    const callbackSuccess = isCallbackSuccess(parsed, statusCode);
    const { paymentStatus, orderStatus } = mapOrderStatus(
      callbackSuccess ? "0000" : "failed",
    );
    const order = await prisma.order.findUnique({
      where: { id: clientTxnId },
    });

    if (!order) {
      await prisma.paymentAttempt.create({
        data: {
          direction: "inbound",
          endpoint: "sabpaisa-callback",
          statusCode: 404,
          request: payload,
          response: { parsed, statusCode, clientTxnId },
          note: "callback received but order not found",
        },
      });

      if (isBrowserRedirect(request)) {
        const safeId = encodeURIComponent(clientTxnId || "unknown");
        redirect(`/payment/status?id=${safeId}&status=error`);
      }

      return NextResponse.json(
        { error: "Order not found for callback" },
        { status: 404 },
      );
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    if (existingPayment?.webhookVerified) {
      await prisma.paymentAttempt.create({
        data: {
          paymentId: existingPayment.id,
          direction: "inbound",
          endpoint: "sabpaisa-callback",
          statusCode: 200,
          request: payload,
          response: parsed,
          note: "duplicate callback ignored",
        },
      });

      if (isBrowserRedirect(request)) {
        if (isPaymentRecordSuccess(existingPayment)) {
          redirect(
            `/order-confirmation?orderId=${encodeURIComponent(clientTxnId)}&clearCart=1`,
          );
        }

        redirect(
          `/payment/status?id=${encodeURIComponent(clientTxnId)}&status=failed`,
        );
      }

      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    const amount =
      parsed.amount && !Number.isNaN(Number(parsed.amount))
        ? Math.round(Number(parsed.amount))
        : (order.finalAmount ?? order.amount);

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        method: "SABPAISA",
        status: paymentStatus,
        amount,
        gatewayId: parsed.sabpaisaTxnId || null,
        responseCode: statusCode,
        responseMessage: parsed.message || null,
        rawResponse: parsed,
        webhookVerified: true,
        webhookReceivedAt: new Date(),
        processedAt: new Date(),
      },
      create: {
        orderId: order.id,
        method: "SABPAISA",
        status: paymentStatus,
        amount,
        gatewayId: parsed.sabpaisaTxnId || null,
        responseCode: statusCode,
        responseMessage: parsed.message || null,
        rawResponse: parsed,
        webhookVerified: true,
        webhookReceivedAt: new Date(),
        processedAt: new Date(),
      },
    });

    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        direction: "inbound",
        endpoint: "sabpaisa-callback",
        statusCode: 200,
        request: payload,
        response: parsed,
        note: "callback processed",
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: orderStatus,
        paymentMethod: "SABPAISA",
        paymentId: payment.id,
      },
    });

    console.log("[SabPaisa][Callback] order updated:", {
      orderId: order.id,
      paymentId: payment.id,
      paymentStatus,
      orderStatus,
    });

    if (isBrowserRedirect(request)) {
      if (callbackSuccess) {
        redirect(
          `/order-confirmation?orderId=${encodeURIComponent(clientTxnId)}&clearCart=1`,
        );
      }

      redirect(
        `/payment/status?id=${encodeURIComponent(clientTxnId)}&status=failed`,
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    // In Next.js, redirect() throws a special error to stop execution.
    // Re-throw it so successful browser redirects are not treated as failures.
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("SabPaisa callback error", error);

    if (isBrowserRedirect(request)) {
      const safeId = encodeURIComponent(clientTxnId || "unknown");
      redirect(`/payment/status?id=${safeId}&status=error`);
    }

    return NextResponse.json(
      { error: "Unable to process SabPaisa callback" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  return handleCallback(request);
}

export async function POST(request) {
  return handleCallback(request);
}
