import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/scripts/authOptions";

function sanitize(value) {
  return String(value || "").trim();
}

function normalizeAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "0.00";
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(2);
}

function isEnvFlagEnabled(value) {
  return ["1", "true", "yes", "on"].includes(
    String(value || "")
      .trim()
      .toLowerCase(),
  );
}

function maskPayload(payload = {}) {
  const out = { ...payload };

  if (out.payerEmail) {
    out.payerEmail = String(out.payerEmail).replace(/^(.).+(@.+)$/, "$1***$2");
  }

  if (out.payerMobile) {
    out.payerMobile = String(out.payerMobile).replace(
      /(.{3}).+(.{2})/,
      "$1****$2",
    );
  }

  return out;
}

export async function GET(request) {
  return NextResponse.json(
    {
      ok: false,
      error:
        "This endpoint is deprecated. Use POST /api/payment/init for the new gateway.",
    },
    { status: 410 },
  );
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const orderId = sanitize(body?.orderId);

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Missing orderId" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 },
      );
    }

    if (order.userId && order.userId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const clientTxnId = sanitize(body?.clientTxnId || order.id);
    const shippingEnabled = isEnvFlagEnabled(process.env.SHIPPING_ENABLED);
    const baseAmount = Number(order.finalAmount ?? order.amount ?? 0);
    const shippingAmount = Number(order.shippingAmount ?? 0);
    const payableAmount = shippingEnabled
      ? baseAmount + shippingAmount
      : baseAmount;
    const amount = normalizeAmount(payableAmount);

    const payload = {
      payerName: sanitize(body?.payerName || "Customer"),
      payerEmail: sanitize(body?.payerEmail || order.email),
      payerMobile: sanitize(body?.payerMobile || order.phone),
      clientTxnId,
      amount,
      shippingEnabled,
    };

    console.log("Payment initialization requested:", maskPayload(payload));

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        method: "GATEWAY_PENDING",
        mode: null,
        status: "pending_gateway",
        amount: Math.round(Number(payload.amount)),
        rawResponse: {
          phase: "init",
          payload: maskPayload(payload),
        },
        webhookVerified: false,
        webhookReceivedAt: null,
        processedAt: null,
        reconciliationRequired: false,
        reconciliationStatus: "not_required",
        reconciliationAttempts: 0,
        lastReconciliationAt: null,
      },
      create: {
        orderId: order.id,
        method: "GATEWAY_PENDING",
        mode: null,
        status: "pending_gateway",
        amount: Math.round(Number(payload.amount)),
        rawResponse: {
          phase: "init",
          payload: maskPayload(payload),
        },
        reconciliationRequired: false,
        reconciliationStatus: "not_required",
        reconciliationAttempts: 0,
        lastReconciliationAt: null,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "pending",
        paymentMethod: "GATEWAY_PENDING",
        paymentId: payment.id,
      },
    });

    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        direction: "outbound",
        endpoint: "/api/payment/init",
        statusCode: null,
        request: maskPayload({
          orderId: order.id,
          clientTxnId: payload.clientTxnId,
          amount: payload.amount,
          payerEmail: payload.payerEmail,
          payerMobile: payload.payerMobile,
        }),
        response: { queued: true },
        note: "payment-gateway-init",
      },
    });

    return NextResponse.json({
      ok: false,
      error:
        "Payment gateway has been retired. Please use the new gateway endpoint.",
      note: "This endpoint is deprecated. A new payment gateway integration is in progress.",
      orderId: order.id,
      clientTxnId: payload.clientTxnId,
      amount,
      shippingEnabled,
    });
  } catch (error) {
    console.error("/api/encryptdata POST error", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process payment initialization" },
      { status: 500 },
    );
  }
}
