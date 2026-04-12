import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "node:fs/promises";
import path from "node:path";
import { buildRealisticIndianPhone } from "@/lib/invoice/getMockAddress";
import { getRandomIndianName } from "@/lib/invoice/getInvoiceName";
import { pickProductsForInvoice } from "@/lib/invoice/productPicker";
import { checkSabPaisaStatus } from "@/lib/sabpaisa-enquiry";
import { refreshOrderStatus } from "@/app/actions/checkOrderStatus";

const BATCH_RESULTS_DIR = path.join(
  process.cwd(),
  "tmp",
  "external-order-status-sync",
);

function resolveExternalOrderWebhookUrl() {
  return (
    [
      process.env.EXTERNAL_ORDER_WEBHOOK_URL,
      process.env.EXTERNAL_ORDER_FORWARD_URL,
      process.env.THIRD_PARTY_VENDOR_WEBHOOK_URL,
    ].find((value) => String(value || "").trim()) || ""
  );
}

async function createSyncLog({
  batchId,
  orderId,
  source = "external-order-status-sync",
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
  try {
    // Ensure meta is JSON-serializable by converting to plain object
    const safeMeta = meta
      ? JSON.parse(JSON.stringify(meta))
      : null;

    console.log("[createSyncLog] Creating log entry", {
      batchId,
      orderId,
      stage,
      status,
    });

    const result = await prisma.externalOrderSyncLog.create({
      data: {
        batchId,
        orderId,
        source,
        stage,
        status,
        existsInSabPaisa,
        localOrderFound,
        localOrderCreated,
        localRefreshSuccess,
        forwardedToVendor,
        vendorStatusCode,
        message,
        meta: safeMeta,
      },
    });

    console.log("[createSyncLog] ✅ Log created successfully", {
      orderId,
      stage,
      id: result.id,
    });
  } catch (logError) {
    console.error("[createSyncLog] ❌ Failed to write sync log", {
      orderId,
      stage,
      status,
      errorMessage: logError?.message,
      errorCode: logError?.code,
      errorName: logError?.name,
      prismaCode: logError?.meta?.code,
      fullError: String(logError),
    });
  }
}

async function persistBatchResultToFile({
  batchId,
  requestBody,
  orderIds,
  summary,
  results,
}) {
  const fileName = `${batchId}.json`;
  const absolutePath = path.join(BATCH_RESULTS_DIR, fileName);

  await fs.mkdir(BATCH_RESULTS_DIR, { recursive: true });

  const payload = {
    batchId,
    generatedAt: new Date().toISOString(),
    request: {
      orderIds,
      rawBody: requestBody,
    },
    summary,
    results,
  };

  await fs.writeFile(absolutePath, JSON.stringify(payload, null, 2), "utf8");

  return {
    fileName,
    relativePath: path.posix.join(
      "tmp",
      "external-order-status-sync",
      fileName,
    ),
  };
}

function isAuthorized(request) {
  const configuredSecret = String(
    process.env.EXTERNAL_ORDER_SYNC_SECRET || "",
  ).trim();

  if (!configuredSecret) {
    return true;
  }

  const authHeader = String(request.headers.get("authorization") || "");
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const apiKey = String(request.headers.get("x-api-key") || "").trim();

  return bearerToken === configuredSecret || apiKey === configuredSecret;
}

function extractOrderIds(body) {
  const rawList = Array.isArray(body)
    ? body
    : body?.orderIds ||
      body?.orderNumbers ||
      body?.clientTxnIds ||
      body?.orders ||
      [];

  if (!Array.isArray(rawList)) {
    return [];
  }

  return [
    ...new Set(
      rawList
        .map((item) => {
          if (typeof item === "string" || typeof item === "number") {
            return String(item).trim();
          }

          if (item && typeof item === "object") {
            return String(
              item.orderId ||
                item.orderNumber ||
                item.clientTxnId ||
                item.id ||
                "",
            ).trim();
          }

          return "";
        })
        .filter(Boolean),
    ),
  ];
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

  let originalAmount = finalAmount;
  let discountAmount = 0;
  let orderItems = [];

  if (!isTestOrder) {
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

      originalAmount = Math.round(Number(picked.total || finalAmount));
      discountAmount = Math.max(0, originalAmount - finalAmount);
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
      payment: true,
    },
  });

  return {
    order,
    externalOrderNote: isTestOrder
      ? "external-test-order"
      : "external-generated-order",
  };
}

function mapSabPaisaStatus(statusCode, raw) {
  const code = String(statusCode || "").trim();
  const message = [raw?.sabpaisaMessage, raw?.bankMessage, raw?.status]
    .map((value) => String(value || "").trim())
    .find((value) => value && value.toLowerCase() !== "null");

  if (code === "0000") {
    return {
      paymentStatus: "success",
      orderStatus: "paid",
      redirectStatus: "success",
      message: message || "Payment successful",
    };
  }

  if (code === "0300") {
    return {
      paymentStatus: "failed",
      orderStatus: "failed",
      redirectStatus: "failed",
      message: message || "Payment failed",
    };
  }

  if (code === "0200") {
    return {
      paymentStatus: "aborted",
      orderStatus: "failed",
      redirectStatus: "failed",
      message: message || "Payment aborted",
    };
  }

  if (["0999", "0100", "0400"].includes(code)) {
    return {
      paymentStatus: "pending",
      orderStatus: "pending",
      redirectStatus: "pending",
      message: message || "Payment pending",
    };
  }

  return {
    paymentStatus: "unknown",
    orderStatus: "unknown",
    redirectStatus: "pending",
    message: message || "Unknown payment status",
  };
}

function normalizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount) : null;
}

function buildVendorWebhookPayload({
  orderId,
  order,
  payment,
  parsed,
  statusCode,
  callbackResult,
  rawRequest,
  externalOrderNote,
}) {
  return {
    event: "sabpaisa.callback",
    note:
      externalOrderNote ||
      (order?.source === "external"
        ? "external-order-forward"
        : "callback-forward"),
    clientTxnId: orderId,
    order: {
      id: order?.id || orderId || null,
      source: order?.source || null,
      status: order?.status || callbackResult?.orderStatus || null,
      amount: order?.amount ?? null,
      finalAmount: order?.finalAmount ?? null,
      discountAmount: order?.discountAmount ?? null,
      email: order?.email || parsed?.payerEmail || null,
      phone: order?.phone || parsed?.payerMobile || null,
      addressId: order?.addressId || null,
    },
    payment: {
      id: payment?.id || null,
      status: payment?.status || callbackResult?.paymentStatus || null,
      amount:
        payment?.amount ??
        normalizeAmount(parsed?.paidAmount || parsed?.amount) ??
        null,
      responseCode: payment?.responseCode || statusCode || null,
      responseMessage:
        payment?.responseMessage ||
        callbackResult?.message ||
        parsed?.status ||
        null,
      mode: payment?.mode || parsed?.paymentMode || null,
      gatewayId: payment?.gatewayId || parsed?.sabpaisaTxnId || null,
      rrn: payment?.rrn || parsed?.rrn || null,
    },
    callback: {
      statusCode,
      paymentStatus: callbackResult?.paymentStatus || null,
      orderStatus: callbackResult?.orderStatus || null,
      redirectStatus: callbackResult?.redirectStatus || null,
      payload: parsed,
      rawRequest,
    },
  };
}

function isSabPaisaOrderMissingError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("no encrypted payload") ||
    message.includes("http error: 400") ||
    message.includes("http error: 404") ||
    message.includes("order not found") ||
    message.includes("does not exist in sabpaisa")
  );
}

function buildMissingSabPaisaPayload({ orderId, rawRequest, reason }) {
  return {
    event: "sabpaisa.callback",
    note: "sabpaisa-order-not-found",
    clientTxnId: orderId,
    order: {
      id: orderId,
      source: null,
      status: "not_found_in_sabpaisa",
      amount: null,
      finalAmount: null,
      discountAmount: null,
      email: null,
      phone: null,
      addressId: null,
    },
    payment: {
      id: null,
      status: "not_found",
      amount: null,
      responseCode: "404",
      responseMessage: reason || "Order does not exist in SabPaisa",
      mode: null,
      gatewayId: null,
      rrn: null,
    },
    callback: {
      statusCode: "404",
      paymentStatus: "not_found",
      orderStatus: "not_found_in_sabpaisa",
      redirectStatus: "failed",
      payload: null,
      rawRequest,
      reason: reason || "order_not_found_in_sabpaisa",
    },
  };
}

async function forwardToExternalVendor(endpoint, requestBody, orderSource) {
  if (!endpoint) {
    return {
      ok: false,
      forwardedToVendor: false,
      skipped: true,
      reason: "missing_external_order_webhook_url",
      endpoint: null,
      status: null,
      statusText: null,
      responseBody: null,
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Novusmode-Event": "sabpaisa-callback",
        "X-Novusmode-Order-Source": orderSource || "external",
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
      forwardedToVendor: response.ok,
      skipped: false,
      reason: null,
      endpoint,
      status: response.status,
      statusText: response.statusText,
      responseBody,
    };
  } catch (error) {
    return {
      ok: false,
      forwardedToVendor: false,
      skipped: false,
      reason: error?.message || "Failed to send webhook",
      endpoint,
      status: 0,
      statusText: "FETCH_ERROR",
      responseBody: null,
    };
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/external-order-status-sync",
    method: "POST",
    usage: {
      body: {
        orderIds: ["ORD-123", "ORD-456"],
      },
      aliases: ["orderNumbers", "clientTxnIds", "orders"],
    },
    webhookTarget: resolveExternalOrderWebhookUrl() || null,
  });
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const orderIds = extractOrderIds(body);
    const batchId = `bulk-sync-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    if (!orderIds.length) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Send a non-empty array in orderIds, orderNumbers, clientTxnIds, or orders.",
        },
        { status: 400 },
      );
    }

    const webhookEndpoint = resolveExternalOrderWebhookUrl();
    const results = [];
    const missingInSabPaisaOrderIds = [];

    // Batch started (removed: only final log per order)

    for (const orderId of orderIds) {
      try {

        const enquiry = await checkSabPaisaStatus(orderId);
        const callbackResult = mapSabPaisaStatus(
          enquiry.statusCode,
          enquiry.raw,
        );

        let order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            payment: true,
            products: true,
            address: true,
          },
        });
        let externalOrderNote = null;
        let createdOrder = false;

        if (!order) {
          const createdExternalOrder = await createExternalOrderFromCallback(
            orderId,
            enquiry.raw,
            callbackResult,
          );

          order = createdExternalOrder.order;
          externalOrderNote = createdExternalOrder.externalOrderNote;
          createdOrder = true;
        }

        const localResult = await refreshOrderStatus(orderId, enquiry);

        order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            payment: true,
            products: true,
            address: true,
          },
        });

        const vendorPayload = buildVendorWebhookPayload({
          orderId,
          order,
          payment: order?.payment || null,
          parsed: enquiry.raw,
          statusCode: enquiry.statusCode,
          callbackResult,
          rawRequest: body,
          externalOrderNote,
        });
        const forwarded = await forwardToExternalVendor(
          webhookEndpoint,
          vendorPayload,
          order?.source,
        );

        if (order?.payment?.id) {
          await prisma.paymentAttempt.create({
            data: {
              paymentId: order.payment.id,
              direction: "outbound",
              endpoint: forwarded?.endpoint || "external-order-webhook",
              statusCode: forwarded?.status || null,
              request: vendorPayload,
              response: {
                forwardedToVendor: forwarded?.forwardedToVendor || false,
                ok: forwarded?.ok || false,
                skipped: forwarded?.skipped || false,
                status: forwarded?.status || null,
                statusText: forwarded?.statusText || null,
                body: forwarded?.responseBody || null,
                reason: forwarded?.reason || null,
              },
              note: forwarded?.skipped
                ? "external-order-forward skipped"
                : forwarded?.forwardedToVendor
                  ? "external-order-forward success"
                  : "external-order-forward failed",
            },
          });

          await prisma.payment.update({
            where: { id: order.payment.id },
            data: {
              rawResponse: {
                ...(order.payment.rawResponse || {}),
                vendorForward: {
                  forwardedToVendor: forwarded?.forwardedToVendor || false,
                  ok: forwarded?.ok || false,
                  skipped: forwarded?.skipped || false,
                  endpoint: forwarded?.endpoint || null,
                  status: forwarded?.status || null,
                  statusText: forwarded?.statusText || null,
                  reason: forwarded?.reason || null,
                },
              },
            },
          });
        }

        // Create single final log entry for this order
        await createSyncLog({
          batchId,
          orderId,
          stage: "final",
          status: "success",
          existsInSabPaisa: true,
          localOrderFound: !createdOrder,
          localOrderCreated: createdOrder,
          localRefreshSuccess: Boolean(localResult?.ok),
          forwardedToVendor: forwarded?.forwardedToVendor || false,
          vendorStatusCode: forwarded?.status || null,
          message: `Order ${callbackResult.orderStatus} | Payment ${callbackResult.paymentStatus} | Forwarded: ${forwarded?.forwardedToVendor}`,
        });

        results.push({
          orderId,
          ok: true,
          createdOrder,
          forwardedToVendor: forwarded?.forwardedToVendor || false,
          paymentStatus: callbackResult.paymentStatus,
          orderStatus: callbackResult.orderStatus,
          message: callbackResult.message,
          localResult,
          sabpaisa: {
            statusCode: enquiry.statusCode,
            status: enquiry.raw?.status || null,
            paymentMode: enquiry.raw?.paymentMode || null,
            sabpaisaTxnId: enquiry.raw?.sabpaisaTxnId || null,
            rrn: enquiry.raw?.rrn || null,
            amount: enquiry.raw?.paidAmount || enquiry.raw?.amount || null,
            bankName: enquiry.raw?.bankName || null,
            bankMessage: enquiry.raw?.bankMessage || null,
            transDate: enquiry.raw?.transDate || null,
            raw: enquiry.raw,
          },
          forwarded,
          vendorPayload,
        });
      } catch (error) {
        const errorMessage =
          error?.message || "Failed to fetch transaction status";
        const missingInSabPaisa = isSabPaisaOrderMissingError(error);

        if (missingInSabPaisa) {
          missingInSabPaisaOrderIds.push(orderId);

          const vendorPayload = buildMissingSabPaisaPayload({
            orderId,
            rawRequest: body,
            reason: errorMessage,
          });
          const forwarded = await forwardToExternalVendor(
            webhookEndpoint,
            vendorPayload,
            "external",
          );

          // Create single final log entry for missing order
          await createSyncLog({
            batchId,
            orderId,
            stage: "final",
            status: "failed",
            existsInSabPaisa: false,
            localOrderFound: false,
            localOrderCreated: false,
            localRefreshSuccess: false,
            forwardedToVendor: forwarded?.forwardedToVendor || false,
            vendorStatusCode: forwarded?.status || null,
            message: `Order not found in SabPaisa | Forwarded: ${forwarded?.forwardedToVendor}`,
          });

          results.push({
            orderId,
            ok: false,
            createdOrder: false,
            existsInSabPaisa: false,
            forwardedToVendor: forwarded?.forwardedToVendor || false,
            paymentStatus: "not_found",
            orderStatus: "not_found_in_sabpaisa",
            message: "Order does not exist in SabPaisa.",
            forwarded,
            vendorPayload,
          });

          continue;
        }

        // Create single final log entry for processing error
        await createSyncLog({
          batchId,
          orderId,
          stage: "final",
          status: "failed",
          existsInSabPaisa: null,
          localOrderFound: null,
          localOrderCreated: false,
          localRefreshSuccess: false,
          forwardedToVendor: false,
          message: `Error: ${errorMessage}`,
        });

        results.push({
          orderId,
          ok: false,
          createdOrder: false,
          existsInSabPaisa: null,
          forwardedToVendor: false,
          paymentStatus: "error",
          orderStatus: "error",
          message: errorMessage,
          forwarded: {
            ok: false,
            forwardedToVendor: false,
            skipped: true,
            reason: "status_fetch_failed",
            endpoint: webhookEndpoint || null,
          },
        });
      }
    }

    const processedCount = results.length;
    const forwardedCount = results.filter(
      (item) => item.forwardedToVendor || item.forwarded?.forwardedToVendor,
    ).length;
    const missingInSabPaisaCount = missingInSabPaisaOrderIds.length;

    const summary = {
      receivedCount: orderIds.length,
      processedCount,
      forwardedCount,
      missingInSabPaisaCount,
      missingInSabPaisaOrderIds,
      message: `${forwardedCount} of ${orderIds.length} orders sent to vendor. ${missingInSabPaisaCount} orders do not exist in SabPaisa.`,
    };

    const persistedResult = await persistBatchResultToFile({
      batchId,
      requestBody: body,
      orderIds,
      summary,
      results,
    });

    // Batch completed (removed: only final log per order)

    // console.log(
    //   `[external-order-status-sync] Processed ${processedCount} orders, forwarded ${forwardedCount} to vendor, missingInSabPaisa ${missingInSabPaisaCount}.`,
    // );
    return NextResponse.json({
      ok: true,
      batchId,
      ...summary,
      resultFile: persistedResult.relativePath,
    });
  } catch (error) {
    console.error("[external-order-status-sync] error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to sync external order statuses",
      },
      { status: 500 },
    );
  }
}
