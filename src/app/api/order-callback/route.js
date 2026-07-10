import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

const LOG_PREFIX = "[PayPointOrderCallback]";
const SUCCESS_STATUSES = new Set(["success", "successful"]);

function response(message, processed = false) {
  return NextResponse.json({ ok: true, processed, message }, { status: 200 });
}

function parseFormBody(rawBody) {
  const entries = Object.fromEntries(new URLSearchParams(rawBody));

  if (typeof entries.data === "string") {
    try {
      entries.data = JSON.parse(entries.data);
    } catch {
      // Some PayPoint integrations send flat form fields instead.
    }
  }

  return entries;
}

function parsePayload(rawBody, contentType) {
  const body = rawBody.trim();
  if (!body) return null;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return parseFormBody(body);
  }

  return JSON.parse(body);
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const data =
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
      ? payload.data
      : payload;
  const amount = Number(data.amount);

  return {
    resultCode:
      payload.resultCode == null ? null : String(payload.resultCode).trim(),
    resultStatus:
      payload.resultStatus == null
        ? null
        : String(payload.resultStatus).trim().toLowerCase(),
    resultMessage: payload.resultMessage
      ? String(payload.resultMessage).trim()
      : null,
    gatewayOrderId: data.refId == null ? null : String(data.refId).trim(),
    amount: Number.isFinite(amount) ? amount : null,
    gatewayId: data.msgId == null ? null : String(data.msgId).trim(),
    rrn: data.rrn == null ? null : String(data.rrn).trim(),
    payerName: data.payerName == null ? null : String(data.payerName).trim(),
    payerAddress:
      data.payerAddress == null ? null : String(data.payerAddress).trim(),
  };
}

function expectedOrderAmount(order) {
  return order.finalAmount == null
    ? order.amount
    : order.finalAmount + (order.shippingAmount || 0);
}

async function forwardWebhookToVendor({ rawBody, orderId, gatewayOrderId }) {
  const destinationUrl = process.env.EXTERNAL_ORDER_WEBHOOK_URL?.trim();
  if (!destinationUrl) return;

  const startedAt = Date.now();
  let status = "failed";
  let forwardedToVendor = false;
  let vendorStatusCode = null;
  let message = "Vendor webhook forwarding failed";
  let responseBody = null;
  let errorMessage = null;

  console.log(`${LOG_PREFIX} forwarding webhook`, {
    orderId,
    destinationUrl,
  });

  try {
    const vendorResponse = await fetch(destinationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody,
      signal: AbortSignal.timeout(10000),
    });

    vendorStatusCode = vendorResponse.status;
    responseBody = await vendorResponse.text();
    forwardedToVendor = vendorResponse.ok;
    status = vendorResponse.ok ? "success" : "failed";
    message = vendorResponse.ok
      ? "PayPoint webhook forwarded to vendor"
      : `Vendor returned HTTP ${vendorResponse.status}`;

    const logData = {
      orderId,
      destinationUrl,
      httpStatus: vendorResponse.status,
      durationMs: Date.now() - startedAt,
    };
    console.log("URL forwarded to vendor", logData);
    if (vendorResponse.ok) {
      console.log(`${LOG_PREFIX} webhook forwarded`, logData);
    } else {
      console.error(`${LOG_PREFIX} webhook forwarding failed`, logData);
    }
  } catch (error) {
    errorMessage = error?.message || "Unknown vendor forwarding error";
    message = errorMessage;

    console.error(`${LOG_PREFIX} webhook forwarding error`, {
      orderId,
      destinationUrl,
      durationMs: Date.now() - startedAt,
      error: errorMessage,
    });
  }

  try {
    await prisma.externalOrderSyncLog.create({
      data: {
        orderId,
        source: "paypoint",
        stage: "webhook_forward",
        status,
        forwardedToVendor,
        vendorStatusCode,
        message,
        meta: {
          destinationUrl,
          gatewayOrderId,
          durationMs: Date.now() - startedAt,
          responseBody: responseBody?.slice(0, 4000) || null,
          error: errorMessage,
        },
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} forwarding audit log failed`, {
      orderId,
      destinationUrl,
      error: error?.message,
    });
  }
}

export async function POST(request) {
  const receivedAt = new Date();
  let rawBody = "";

  try {
    rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";

    console.log(`${LOG_PREFIX} received`, {
      receivedAt: receivedAt.toISOString(),
      contentType,
      rawBody,
    });

    let payload;
    try {
      payload = parsePayload(rawBody, contentType);
    } catch (error) {
      console.warn(`${LOG_PREFIX} ignored malformed payload`, {
        error: error?.message,
        rawBody,
      });
      return response("Malformed webhook ignored");
    }

    const webhook = normalizePayload(payload);
    if (!webhook) {
      console.warn(`${LOG_PREFIX} ignored unsupported payload`, { payload });
      return response("Unsupported webhook ignored");
    }

    console.log(`${LOG_PREFIX} parsed`, { payload, webhook });

    const isSuccessful =
      webhook.resultCode === "000" &&
      SUCCESS_STATUSES.has(webhook.resultStatus);

    if (!isSuccessful) {
      console.warn(`${LOG_PREFIX} ignored non-success result`, {
        resultCode: webhook.resultCode,
        resultStatus: webhook.resultStatus,
        gatewayOrderId: webhook.gatewayOrderId,
      });
      return response("Non-success webhook ignored");
    }

    if (!webhook.gatewayOrderId || webhook.amount == null) {
      console.warn(`${LOG_PREFIX} ignored incomplete success payload`, {
        gatewayOrderId: webhook.gatewayOrderId,
        amount: webhook.amount,
      });
      return response("Incomplete webhook ignored");
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { gatewayOrderId: webhook.gatewayOrderId },
        include: { order: true },
      });

      if (!payment) {
        const externalOrderId = `PAYPOINT-EXT-${webhook.gatewayOrderId}`;

        const address = await tx.address.create({
          data: {
            name: "External Order",
            phone: "UNKNOWN",
            address1: "EXTERNAL ORDER - ADDRESS UNKNOWN",
            city: "UNKNOWN",
            state: "UNKNOWN",
            pincode: "000000",
            country: "UNKNOWN",
          },
        });

        const externalOrder = await tx.order.create({
          data: {
            id: externalOrderId,
            addressId: address.id,
            status: "PAID",
            amount: webhook.amount,
            email: "external@pending.local",
            phone: "UNKNOWN",
            paymentMethod: "upi_qr",
            source: "external",
            externalRefId: webhook.gatewayOrderId,
          },
        });

        const externalPayment = await tx.payment.create({
          data: {
            orderId: externalOrder.id,
            method: "upi_qr",
            mode: "paypoint",
            status: "success",
            amount: webhook.amount,
            gatewayOrderId: webhook.gatewayOrderId,
            gatewayId: webhook.gatewayId,
            rrn: webhook.rrn,
            payerName: webhook.payerName,
            payerAddress: webhook.payerAddress,
            responseCode: webhook.resultCode,
            responseMessage:
              webhook.resultMessage || "External PayPoint payment verified",
            rawResponse: payload,
            webhookVerified: true,
            webhookReceivedAt: receivedAt,
            processedAt: receivedAt,
          },
        });

        await tx.order.update({
          where: { id: externalOrder.id },
          data: { paymentId: externalPayment.id },
        });

        return {
          action: "external_processed",
          orderId: externalOrder.id,
        };
      }

      const expectedAmount = expectedOrderAmount(payment.order);
      if (webhook.amount !== expectedAmount) {
        return {
          action: "amount_mismatch",
          orderId: payment.orderId,
          expectedAmount,
          receivedAmount: webhook.amount,
        };
      }

      const alreadyProcessed =
        payment.status.toLowerCase() === "success" &&
        payment.order.status === "PAID";

      if (alreadyProcessed) {
        return { action: "duplicate", orderId: payment.orderId };
      }

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "success",
          gatewayId: webhook.gatewayId || payment.gatewayId,
          responseCode: webhook.resultCode,
          responseMessage: webhook.resultMessage || "Payment verified",
          payerAddress: webhook.payerAddress || payment.payerAddress,
          payerName: webhook.payerName || payment.payerName,
          rrn: webhook.rrn || payment.rrn,
          rawResponse: payload,
          webhookVerified: true,
          webhookReceivedAt: receivedAt,
          processedAt: receivedAt,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "PAID",
          paymentMethod: payment.method,
          paymentId: updatedPayment.id,
        },
      });

      return { action: "processed", orderId: payment.orderId };
    });

    if (result.action === "amount_mismatch") {
      console.error(`${LOG_PREFIX} ignored amount mismatch`, result);
      return response("Amount mismatch ignored");
    }

    if (result.action === "duplicate") {
      console.log(`${LOG_PREFIX} duplicate safely ignored`, result);
      return response("Webhook already processed");
    }

    console.log(`${LOG_PREFIX} processed`, result);
    await forwardWebhookToVendor({
      rawBody,
      orderId: result.orderId,
      gatewayOrderId: webhook.gatewayOrderId,
    });
    return response("Payment verified and order updated", true);
  } catch (error) {
    console.error(`${LOG_PREFIX} processing failed`, {
      error: error?.message,
      stack: error?.stack,
      rawBody,
    });

    return NextResponse.json(
      { ok: false, processed: false, message: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
