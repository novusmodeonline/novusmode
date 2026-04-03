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

function isNextRedirectError(error) {
  const digest = String(error?.digest || "");
  return digest.startsWith("NEXT_REDIRECT;");
}

function normalizeStatusCode(value) {
  return String(value || "").trim();
}

function normalizePaymentMode(paymentMode) {
  const mode = String(paymentMode || "")
    .trim()
    .toUpperCase();

  if (!mode) return null;

  if (mode.includes("UPI") || mode.includes("BHIM") || mode.includes("QR")) {
    return "UPI";
  }

  if (
    mode.includes("CARD") ||
    mode.includes("CREDIT") ||
    mode.includes("DEBIT") ||
    mode.includes("VISA") ||
    mode.includes("MASTERCARD") ||
    mode.includes("RUPAY")
  ) {
    return "Cards";
  }

  if (
    mode.includes("NETBANKING") ||
    mode.includes("BANKING") ||
    mode === "NB"
  ) {
    return "NetBanking";
  }

  if (
    mode.includes("WALLET") ||
    mode.includes("PAYTM") ||
    mode.includes("PHONEPE") ||
    mode.includes("MOBIKWIK") ||
    mode.includes("AMAZONPAY")
  ) {
    return "Wallet";
  }

  return "Other";
}

function isTerminalPaymentStatus(status) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  return (
    normalized === "success" ||
    normalized === "failed" ||
    normalized === "aborted"
  );
}

function mapSabPaisaCallback(statusCode, parsed) {
  const code = normalizeStatusCode(statusCode);
  const gatewayStatus = String(parsed?.status || parsed?.sabpaisaStatus || "")
    .trim()
    .toUpperCase();

  const byCode = {
    "0000": {
      paymentStatus: "success",
      orderStatus: "paid",
      redirectStatus: "success",
      reconciliationRequired: false,
      terminal: true,
    },
    "0300": {
      paymentStatus: "failed",
      orderStatus: "failed",
      redirectStatus: "failed",
      reconciliationRequired: false,
      terminal: true,
    },
    "0100": {
      paymentStatus: "initiated",
      orderStatus: "pending",
      redirectStatus: "pending",
      reconciliationRequired: false,
      terminal: false,
    },
    "0200": {
      paymentStatus: "aborted",
      orderStatus: "failed",
      redirectStatus: "failed",
      reconciliationRequired: false,
      terminal: true,
    },
    "0999": {
      paymentStatus: "unknown",
      orderStatus: "pending",
      redirectStatus: "pending",
      reconciliationRequired: true,
      terminal: false,
    },
    "0400": {
      paymentStatus: "challan_generated",
      orderStatus: "pending",
      redirectStatus: "pending",
      reconciliationRequired: false,
      terminal: false,
    },
    404: {
      paymentStatus: "not_found",
      orderStatus: "pending",
      redirectStatus: "pending",
      reconciliationRequired: true,
      terminal: false,
    },
  };

  if (byCode[code]) {
    return { ...byCode[code], code };
  }

  if (gatewayStatus === "SUCCESS" || gatewayStatus === "CAPTURED") {
    return {
      paymentStatus: "success",
      orderStatus: "paid",
      redirectStatus: "success",
      reconciliationRequired: false,
      terminal: true,
      code,
    };
  }

  return {
    paymentStatus: "unknown",
    orderStatus: "pending",
    redirectStatus: "pending",
    reconciliationRequired: true,
    terminal: false,
    code,
  };
}

function redirectPathForStatus(clientTxnId, redirectStatus) {
  const safeId = encodeURIComponent(clientTxnId || "unknown");

  if (redirectStatus === "success") {
    return `/order-confirmation?orderId=${safeId}&status=success&clearCart=1`;
  }

  if (redirectStatus === "failed") {
    return `/order-confirmation?orderId=${safeId}&status=failed`;
  }

  if (redirectStatus === "pending") {
    return `/order-confirmation?orderId=${safeId}&status=pending`;
  }

  return `/order-confirmation?orderId=${safeId}&status=error`;
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

    const callbackResult = mapSabPaisaCallback(statusCode, parsed);
    const paymentStatus = callbackResult.paymentStatus;
    const orderStatus = callbackResult.orderStatus;
    const normalizedMode = normalizePaymentMode(parsed.paymentMode);
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
        redirect(`/order-confirmation?orderId=${safeId}&status=error`);
      }

      return NextResponse.json(
        { error: "Order not found for callback" },
        { status: 404 },
      );
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    if (
      existingPayment?.webhookVerified &&
      isTerminalPaymentStatus(existingPayment.status)
    ) {
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
        const duplicateRedirectStatus = isPaymentRecordSuccess(existingPayment)
          ? "success"
          : "failed";
        redirect(redirectPathForStatus(clientTxnId, duplicateRedirectStatus));
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
        mode: normalizedMode,
        status: paymentStatus,
        amount,
        gatewayId: parsed.sabpaisaTxnId || null,
        responseCode: statusCode,
        responseMessage:
          parsed.sabpaisaMessage || parsed.status || parsed.message || null,
        payerName: parsed.payerName || null,
        rrn: parsed.rrn || null,
        rawResponse: parsed,
        webhookVerified: true,
        webhookReceivedAt: new Date(),
        processedAt: callbackResult.terminal ? new Date() : null,
        reconciliationRequired: callbackResult.reconciliationRequired,
        reconciliationStatus: callbackResult.reconciliationRequired
          ? "required"
          : "not_required",
        reconciliationAttempts: callbackResult.reconciliationRequired
          ? existingPayment?.reconciliationAttempts || 0
          : 0,
        lastReconciliationAt: callbackResult.reconciliationRequired
          ? existingPayment?.lastReconciliationAt || null
          : null,
      },
      create: {
        orderId: order.id,
        method: "SABPAISA",
        mode: normalizedMode,
        status: paymentStatus,
        amount,
        gatewayId: parsed.sabpaisaTxnId || null,
        responseCode: statusCode,
        responseMessage:
          parsed.sabpaisaMessage || parsed.status || parsed.message || null,
        payerName: parsed.payerName || null,
        rrn: parsed.rrn || null,
        rawResponse: parsed,
        webhookVerified: true,
        webhookReceivedAt: new Date(),
        processedAt: callbackResult.terminal ? new Date() : null,
        reconciliationRequired: callbackResult.reconciliationRequired,
        reconciliationStatus: callbackResult.reconciliationRequired
          ? "required"
          : "not_required",
        reconciliationAttempts: 0,
        lastReconciliationAt: null,
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
        note: callbackResult.reconciliationRequired
          ? "callback processed - reconciliation required"
          : "callback processed",
      },
    });

    if (callbackResult.reconciliationRequired) {
      await prisma.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          direction: "internal",
          endpoint: "sabpaisa-enquiry",
          statusCode: null,
          request: {
            clientTxnId,
            statusCode,
          },
          response: {
            queued: true,
            reason: "status requires transaction enquiry",
          },
          note: "enquiry queued",
        },
      });
    }

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
      redirect(
        redirectPathForStatus(clientTxnId, callbackResult.redirectStatus),
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
      redirect(`/order-confirmation?orderId=${safeId}&status=error`);
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
