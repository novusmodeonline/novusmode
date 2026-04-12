import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { buildRealisticIndianPhone } from "@/lib/invoice/getMockAddress";
import { getRandomIndianName } from "@/lib/invoice/getInvoiceName";
import { pickProductsForInvoice } from "@/lib/invoice/productPicker";
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

function buildPlaceholderEmail(clientTxnId) {
  const localPart = String(clientTxnId || "external-order")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${localPart || "external-order"}@external-placeholder.local`;
}

function normalizeExternalOrderEmail(rawEmail, clientTxnId) {
  const email = String(rawEmail || "")
    .trim()
    .toLowerCase();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return email;
  }

  return buildPlaceholderEmail(clientTxnId);
}

async function pickRandomAddressId() {
  const addresses = await prisma.address.findMany({
    select: { id: true },
    orderBy: { id: "asc" },
  });

  if (!addresses.length) {
    throw new Error(
      "No addresses found for external order creation. Seed the Address table first.",
    );
  }

  const randomIndex = Math.floor(Math.random() * addresses.length);
  return addresses[randomIndex].id;
}

function resolveExternalOrderWebhookUrl() {
  return (
    [
      process.env.EXTERNAL_ORDER_WEBHOOK_URL,
      process.env.EXTERNAL_ORDER_FORWARD_URL,
      process.env.THIRD_PARTY_VENDOR_WEBHOOK_URL,
    ].find((value) => String(value || "").trim()) || ""
  );
}

async function createExternalSyncLog({
  orderId,
  stage,
  status,
  existsInSabPaisa = null,
  localOrderFound = null,
  localOrderCreated = null,
  localRefreshSuccess = null,
  forwardedToVendor = null,
  vendorStatusCode = null,
  message = null,
  meta = null,
}) {
  if (!orderId) {
    return;
  }

  try {
    await prisma.externalOrderSyncLog.create({
      data: {
        batchId: null,
        orderId,
        source: "order-callback",
        stage,
        status,
        existsInSabPaisa,
        localOrderFound,
        localOrderCreated,
        localRefreshSuccess,
        forwardedToVendor,
        vendorStatusCode,
        message,
        meta,
      },
    });
  } catch (logError) {
    console.error("[order-callback] failed to write external sync log", {
      orderId,
      stage,
      status,
      error: logError?.message || logError,
    });
  }
}

async function forwardExternalOrderToVendor({
  clientTxnId,
  order,
  payment,
  payload,
  parsed,
  statusCode,
  callbackResult,
  externalOrderNote,
}) {
  const endpoint = resolveExternalOrderWebhookUrl();

  if (!endpoint) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_external_order_webhook_url",
      endpoint: null,
      requestBody: null,
      responseBody: null,
    };
  }

  const requestBody = {
    event: "sabpaisa.callback",
    note:
      externalOrderNote ||
      (order?.source === "external"
        ? "external-order-forward"
        : "callback-forward"),
    clientTxnId,
    order: {
      id: order?.id || null,
      source: order?.source || null,
      status: order?.status || null,
      amount: order?.amount ?? null,
      finalAmount: order?.finalAmount ?? null,
      discountAmount: order?.discountAmount ?? null,
      email: order?.email || null,
      phone: order?.phone || null,
      addressId: order?.addressId || null,
    },
    payment: {
      id: payment?.id || null,
      status: payment?.status || null,
      amount: payment?.amount ?? null,
      responseCode: payment?.responseCode || null,
      responseMessage: payment?.responseMessage || null,
      mode: payment?.mode || null,
      gatewayId: payment?.gatewayId || null,
      rrn: payment?.rrn || null,
    },
    callback: {
      statusCode,
      paymentStatus: callbackResult?.paymentStatus || null,
      orderStatus: callbackResult?.orderStatus || null,
      redirectStatus: callbackResult?.redirectStatus || null,
      payload: parsed,
      rawRequest: payload,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Novusmode-Event": "sabpaisa-callback",
        "X-Novusmode-Order-Source": order?.source || "external",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const responseText = await response.text();
    let responseBody = responseText || null;

    if (responseText) {
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }
    }

    return {
      ok: response.ok,
      skipped: false,
      endpoint,
      status: response.status,
      statusText: response.statusText,
      requestBody,
      responseBody,
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      endpoint,
      status: 0,
      statusText: "FETCH_ERROR",
      requestBody,
      responseBody: {
        error: error?.message || "Failed to forward external order",
      },
    };
  }
}

async function createExternalOrderFromCallback(
  clientTxnId,
  parsed,
  callbackResult,
) {
  const callbackAmount = Number(parsed.amount);
  const finalAmount = Number.isFinite(callbackAmount)
    ? Math.max(0, Math.round(callbackAmount))
    : 0;
  const fallbackName = getRandomIndianName().fullName;
  const payerName =
    String(parsed.payerName || fallbackName).trim() || fallbackName;
  const email = normalizeExternalOrderEmail(parsed.payerEmail, clientTxnId);
  const phone = buildRealisticIndianPhone(
    `${clientTxnId}-${parsed.payerMobile || parsed.payerEmail || payerName}-${finalAmount}`,
  );
  const addressId = await pickRandomAddressId();
  const isTestOrder = finalAmount < 200;
  const isFailedOrder =
    String(callbackResult?.orderStatus || "").toLowerCase() === "failed";

  let originalAmount = finalAmount;
  let discountAmount = 0;
  let orderItems = [];

  if (!isTestOrder && !isFailedOrder) {
    const products = await prisma.product.findMany({
      where: { inStock: { gt: 0 } },
      select: {
        id: true,
        title: true,
        slug: true,
        mainImage: true,
        price: true,
        sizeMetric: true,
        defaultSize: true,
      },
    });

    if (products.length) {
      const picked = pickProductsForInvoice(finalAmount, products, {
        maxDiscount: 500,
      });

      orderItems = (picked.products || []).map((product) => ({
        productId: product.id,
        title: product.title,
        slug: product.slug,
        mainImage: product.mainImage,
        price: product.price,
        quantity: product.qty || 1,
        selectedSize: product.defaultSize || null,
        sizeMetric: product.sizeMetric || null,
      }));

      const orderItemsTotal = Math.round(
        orderItems.reduce(
          (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
          0,
        ),
      );

      originalAmount = orderItemsTotal || finalAmount;
      discountAmount = Math.max(0, originalAmount - finalAmount);
    }
  }

  const createData = {
    id: clientTxnId,
    userId: null,
    addressId,
    status: callbackResult.orderStatus,
    amount: originalAmount,
    originalAmount,
    discountAmount,
    finalAmount,
    shippingAmount: 0,
    couponCode: isTestOrder ? "test-order" : null,
    email,
    phone,
    paymentMethod: "SABPAISA",
    source: "external",
    externalRefId: clientTxnId,
  };

  if (orderItems.length) {
    createData.products = { create: orderItems };
  }

  const order = await prisma.order.create({
    data: createData,
    include: {
      products: true,
      address: true,
    },
  });

  return {
    order,
    externalOrderNote: isTestOrder
      ? "external-test-order"
      : "external-generated-order",
  };
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
  let externalFlow = false;

  try {
    const { source, payload } = await extractCallbackPayload(request);
    const encResponseValue =
      payload.encResponse ||
      payload.encresponse ||
      payload.encData ||
      payload.encdata ||
      payload.response;

    // console.log("[SabPaisa][Callback] request source:", source);
    // console.log("[SabPaisa][Callback] incoming payload:", payload);
    // console.log(
    //   "[SabPaisa][Callback] raw encResponse:",
    //   encResponseValue || null,
    // );
    // console.log(
    //   "[SabPaisa][Callback] raw encResponse length:",
    //   typeof encResponseValue === "string" ? encResponseValue.length : null,
    // );

    if (!encResponseValue || typeof encResponseValue !== "string") {
      return NextResponse.json(
        { error: "Malformed request: encResponse missing" },
        { status: 400 },
      );
    }

    const parsed = decryptSabPaisaResponse(encResponseValue);
    const statusCode = normalizeStatusCode(parsed.statusCode);
    clientTxnId = String(parsed.clientTxnId || "");

    // console.log("[SabPaisa][Callback] decrypted payload:", parsed);
    // console.log("[SabPaisa][Callback] statusCode:", statusCode);
    // console.log("[SabPaisa][Callback] clientTxnId:", clientTxnId);

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
    let order = await prisma.order.findUnique({
      where: { id: clientTxnId },
      include: {
        products: true,
      },
    });
    let externalOrderNote = null;

    await createExternalSyncLog({
      orderId: clientTxnId,
      stage: "callback_received",
      status: "info",
      existsInSabPaisa: true,
      message: "SabPaisa callback decrypted",
      meta: {
        statusCode,
        paymentStatus: callbackResult.paymentStatus,
        orderStatus: callbackResult.orderStatus,
      },
    });

    if (!order) {
      externalFlow = true;

      const createdExternalOrder = await createExternalOrderFromCallback(
        clientTxnId,
        parsed,
        callbackResult,
      );

      order = createdExternalOrder.order;
      externalOrderNote = createdExternalOrder.externalOrderNote;

      await createExternalSyncLog({
        orderId: clientTxnId,
        stage: "local_order_creation",
        status: "success",
        existsInSabPaisa: true,
        localOrderFound: false,
        localOrderCreated: true,
        message: "Created local external order from callback",
        meta: {
          externalOrderNote,
          orderSource: order?.source || null,
        },
      });

      await prisma.paymentAttempt.create({
        data: {
          direction: "internal",
          endpoint: "sabpaisa-callback",
          statusCode: 201,
          request: payload,
          response: {
            parsed,
            statusCode,
            clientTxnId,
            orderId: order.id,
            source: order.source,
          },
          note: `${externalOrderNote}: order created from callback`,
        },
      });
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    if (
      existingPayment?.webhookVerified &&
      isTerminalPaymentStatus(existingPayment.status)
    ) {
      await createExternalSyncLog({
        orderId: clientTxnId,
        stage: "duplicate_callback",
        status: "skipped",
        existsInSabPaisa: true,
        localOrderFound: true,
        localOrderCreated: false,
        localRefreshSuccess: true,
        message: "Duplicate terminal callback ignored",
        meta: {
          paymentId: existingPayment.id,
          paymentStatus: existingPayment.status,
        },
      });

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

      if (isBrowserRedirect(request) && order.source !== "external") {
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
        rawResponse: {
          ...parsed,
          note:
            externalOrderNote ||
            (order.source === "external"
              ? "external-order-from-callback"
              : "callback processed"),
          orderSource: order.source || "internal",
          itemCount: order.products?.length || 0,
        },
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
        rawResponse: {
          ...parsed,
          note:
            externalOrderNote ||
            (order.source === "external"
              ? "external-order-from-callback"
              : "callback processed"),
          orderSource: order.source || "internal",
          itemCount: order.products?.length || 0,
        },
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
        note: [
          externalOrderNote ||
            (order.source === "external"
              ? "external-order-callback"
              : "callback processed"),
          callbackResult.reconciliationRequired
            ? "reconciliation required"
            : null,
        ]
          .filter(Boolean)
          .join(" - "),
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

    await createExternalSyncLog({
      orderId: clientTxnId,
      stage: "local_refresh",
      status: "success",
      existsInSabPaisa: true,
      localOrderFound: true,
      localOrderCreated: Boolean(externalOrderNote),
      localRefreshSuccess: true,
      message: "Order and payment updated from callback",
      meta: {
        orderStatus,
        paymentStatus,
        paymentId: payment.id,
      },
    });

    let vendorForward = null;

    if (order.source === "external") {
      vendorForward = await forwardExternalOrderToVendor({
        clientTxnId,
        order: {
          ...order,
          status: orderStatus,
          paymentMethod: "SABPAISA",
          paymentId: payment.id,
        },
        payment,
        payload,
        parsed,
        statusCode,
        callbackResult,
        externalOrderNote,
      });

      await prisma.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          direction: "outbound",
          endpoint: vendorForward?.endpoint || "external-order-webhook",
          statusCode: vendorForward?.status || null,
          request: vendorForward?.requestBody || { clientTxnId },
          response: {
            forwardedToVendor: vendorForward?.ok || false,
            ok: vendorForward?.ok || false,
            skipped: vendorForward?.skipped || false,
            status: vendorForward?.status || null,
            statusText: vendorForward?.statusText || null,
            body: vendorForward?.responseBody || null,
            reason: vendorForward?.reason || null,
          },
          note: vendorForward?.skipped
            ? "external-order-forward skipped"
            : vendorForward?.ok
              ? "external-order-forward success"
              : "external-order-forward failed",
        },
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          rawResponse: {
            ...(payment.rawResponse || {}),
            vendorForward: {
              forwardedToVendor: vendorForward?.ok || false,
              ok: vendorForward?.ok || false,
              skipped: vendorForward?.skipped || false,
              endpoint: vendorForward?.endpoint || null,
              status: vendorForward?.status || null,
              statusText: vendorForward?.statusText || null,
              reason: vendorForward?.reason || null,
            },
          },
        },
      });

      await createExternalSyncLog({
        orderId: clientTxnId,
        stage: "vendor_forward",
        status: vendorForward?.ok
          ? "success"
          : vendorForward?.skipped
            ? "skipped"
            : "failed",
        existsInSabPaisa: true,
        localOrderFound: true,
        localOrderCreated: Boolean(externalOrderNote),
        localRefreshSuccess: true,
        forwardedToVendor: vendorForward?.ok || false,
        vendorStatusCode: vendorForward?.status || null,
        message: vendorForward?.reason || vendorForward?.statusText || null,
        meta: {
          endpoint: vendorForward?.endpoint || null,
          responseBody: vendorForward?.responseBody || null,
        },
      });
    }

    console.log("[SabPaisa][Callback] order updated:", {
      orderId: order.id,
      paymentId: payment.id,
      paymentStatus,
      orderStatus,
      vendorForward,
    });

    if (isBrowserRedirect(request) && order.source !== "external") {
      redirect(
        redirectPathForStatus(clientTxnId, callbackResult.redirectStatus),
      );
    }

    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        source: order.source,
        external: order.source === "external",
        vendorForward,
      },
      { status: 200 },
    );
  } catch (error) {
    // In Next.js, redirect() throws a special error to stop execution.
    // Re-throw it so successful browser redirects are not treated as failures.
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("SabPaisa callback error", error);

    await createExternalSyncLog({
      orderId: clientTxnId,
      stage: "callback_error",
      status: "failed",
      existsInSabPaisa: null,
      localOrderFound: null,
      localOrderCreated: false,
      localRefreshSuccess: false,
      forwardedToVendor: false,
      message: error?.message || "Unable to process callback",
      meta: {
        externalFlow,
      },
    });

    if (isBrowserRedirect(request) && !externalFlow) {
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
