import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

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

function isNextRedirectError(error) {
  const digest = String(error?.digest || "");
  return digest.startsWith("NEXT_REDIRECT;");
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

  if (request.method === "POST" && contentType.includes("application/json")) {
    try {
      const json = await request.json();
      return {
        source: "json",
        payload: {
          ...queryEntries,
          ...json,
        },
      };
    } catch {
      return { source: "json", payload: queryEntries };
    }
  }

  return {
    source: "query",
    payload: queryEntries,
  };
}

async function handleCallback(request) {
  let orderId = "";

  try {
    const { source, payload } = await extractCallbackPayload(request);
    console.log("[Order Callback] Request received from source:", source, payload);

    // DigiKhata Webhook / Callback Handler
    const data = payload?.data || payload;
    const resultCode = String(payload?.resultCode ?? data?.resultCode ?? "");
    const resultStatus = String(payload?.resultStatus ?? data?.resultStatus ?? "").toLowerCase();

    const refId = data?.refId || data?.OrderId || data?.orderId || payload?.orderId;
    orderId = refId || "";

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Missing order reference ID" },
        { status: 400 },
      );
    }

    const isSuccess =
      resultCode === "000" ||
      resultStatus === "success" ||
      data?.TxnStatus === 3;

    const paymentStatus = isSuccess ? "success" : "failed";
    const orderStatus = isSuccess ? "paid" : "failed";

    const cleanId = String(orderId).replace(/[^a-zA-Z0-9]/g, "");
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { id: cleanId },
        ],
      },
    });

    if (!order) {
      console.warn("[Order Callback] Order not found for reference:", orderId);
      if (isBrowserRedirect(request)) {
        redirect(`/payment/status?id=${encodeURIComponent(orderId)}&status=error`);
      }
      return NextResponse.json(
        { resultCode: "404", resultStatus: "failed", resultMessage: "Order not found" },
        { status: 404 },
      );
    }

    const paidAmount = data?.amount
      ? Math.round(Number(data.amount))
      : (order.finalAmount ?? order.amount);

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        method: "DIGIKHATA_UPI",
        status: paymentStatus,
        amount: paidAmount,
        gatewayId: data?.id || data?.TransactionId || null,
        rrn: data?.rrn || data?.CustomerRefNo || null,
        payerAddress: data?.payerAddress || null,
        payerName: data?.payerName || null,
        responseCode: resultCode,
        rawResponse: payload,
        webhookVerified: true,
        webhookReceivedAt: new Date(),
        processedAt: new Date(),
      },
      create: {
        orderId: order.id,
        method: "DIGIKHATA_UPI",
        status: paymentStatus,
        amount: paidAmount,
        gatewayId: data?.id || data?.TransactionId || null,
        rrn: data?.rrn || data?.CustomerRefNo || null,
        payerAddress: data?.payerAddress || null,
        payerName: data?.payerName || null,
        responseCode: resultCode,
        rawResponse: payload,
        webhookVerified: true,
        webhookReceivedAt: new Date(),
        processedAt: new Date(),
      },
    });

    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        direction: "inbound",
        endpoint: "/api/order-callback",
        statusCode: 200,
        request: payload,
        response: { paymentStatus, orderStatus },
        note: `order-callback-${paymentStatus}`,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: orderStatus,
        paymentMethod: "DIGIKHATA_UPI",
        paymentId: payment.id,
      },
    });

    if (isBrowserRedirect(request)) {
      if (isSuccess) {
        redirect(`/order-confirmation?orderId=${encodeURIComponent(order.id)}&clearCart=1`);
      }
      redirect(`/payment/status?id=${encodeURIComponent(order.id)}&status=failed`);
    }

    // Forward notification to CowPay callback URL if configured
    const cowpayUrl =
      process.env.DIGIKHATA_CALLBACK_URL ||
      "https://api.cowpay.co/callback/pay/cowpayinrdigikhatatwo";

    if (cowpayUrl && !cowpayUrl.includes("novusmode.com")) {
      fetch(cowpayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NovusMode-OrderCallback/1.0",
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn("[Order Callback] Forward to CowPay callback failed:", err.message);
      });
    }

    return NextResponse.json({
      resultCode: "000",
      resultStatus: "success",
      resultMessage: "Order callback processed successfully",
    });
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("[Order Callback] Error:", error);

    if (isBrowserRedirect(request)) {
      redirect(`/payment/status?id=${encodeURIComponent(orderId || "unknown")}&status=error`);
    }

    return NextResponse.json(
      { error: "Unable to process order callback", details: error.message },
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
