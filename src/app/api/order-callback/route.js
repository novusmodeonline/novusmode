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
    payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
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
    payerName:
      data.payerName == null ? null : String(data.payerName).trim(),
    payerAddress:
      data.payerAddress == null ? null : String(data.payerAddress).trim(),
  };
}

function expectedOrderAmount(order) {
  return order.finalAmount == null
    ? order.amount
    : order.finalAmount + (order.shippingAmount || 0);
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

      if (!payment) return { action: "payment_not_found" };

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

    if (result.action === "payment_not_found") {
      console.warn(`${LOG_PREFIX} ignored unknown gateway reference`, {
        gatewayOrderId: webhook.gatewayOrderId,
      });
      return response("Unknown payment ignored");
    }

    if (result.action === "amount_mismatch") {
      console.error(`${LOG_PREFIX} ignored amount mismatch`, result);
      return response("Amount mismatch ignored");
    }

    if (result.action === "duplicate") {
      console.log(`${LOG_PREFIX} duplicate safely ignored`, result);
      return response("Webhook already processed");
    }

    console.log(`${LOG_PREFIX} processed`, result);
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
