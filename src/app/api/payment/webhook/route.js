import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

function normalizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data =
    payload?.data && typeof payload.data === "object" ? payload.data : null;

  return {
    resultCode: payload?.resultCode,
    resultStatus: payload?.resultStatus,
    resultMessage: payload?.resultMessage,
    refId: data?.refId || null,
    amount: data?.amount || null,
    rrn: data?.rrn || null,
    payerName: data?.payerName || null,
    payerAddress: data?.payerAddress || null,
    msgId: data?.msgId || null,
    ts: data?.ts || null,
  };
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const normalized = normalizePayload(payload);

    if (!normalized) {
      console.error("[PayPointWebhook] malformed payload", payload);
      return NextResponse.json(
        { ok: false, message: "Malformed payload" },
        { status: 400 },
      );
    }

    if (
      normalized.resultStatus !== "success" ||
      normalized.resultCode !== "000"
    ) {
      console.warn("[PayPointWebhook] ignored non-success payload", normalized);
      return NextResponse.json(
        { ok: false, message: "Payment not successful" },
        { status: 200 },
      );
    }

    if (!normalized.refId) {
      console.error("[PayPointWebhook] missing refId", normalized);
      return NextResponse.json(
        { ok: false, message: "Missing refId" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: normalized.refId },
    });

    if (!order) {
      console.error("[PayPointWebhook] order not found", normalized.refId);
      return NextResponse.json(
        { ok: false, message: "Order not found" },
        { status: 200 },
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    if (!payment) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: "upi_qr",
          mode: "paypoint",
          status: "success",
          amount: order.amount,
          gatewayId: normalized.msgId || null,
          gatewayOrderId: normalized.refId,
          responseCode: normalized.resultCode,
          responseMessage: normalized.resultMessage || "Payment verified",
          payerAddress: normalized.payerAddress,
          payerName: normalized.payerName,
          rrn: normalized.rrn,
          rawResponse: payload,
          webhookVerified: true,
          webhookReceivedAt: new Date(),
          processedAt: new Date(),
        },
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "success",
          gatewayId: normalized.msgId || payment.gatewayId,
          gatewayOrderId: normalized.refId,
          responseCode: normalized.resultCode,
          responseMessage: normalized.resultMessage || "Payment verified",
          payerAddress: normalized.payerAddress || payment.payerAddress,
          payerName: normalized.payerName || payment.payerName,
          rrn: normalized.rrn || payment.rrn,
          rawResponse: payload,
          webhookVerified: true,
          webhookReceivedAt: new Date(),
          processedAt: new Date(),
        },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentMethod: "upi_qr",
        paymentId: payment?.id || null,
      },
    });

    return NextResponse.json(
      { ok: true, message: "Payment verified and order updated" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PayPointWebhook] unexpected error", error);
    return NextResponse.json(
      { ok: false, message: "Webhook processing failed" },
      { status: 200 },
    );
  }
}
