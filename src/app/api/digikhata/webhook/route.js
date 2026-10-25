// src/app/api/digikhata/webhook/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const WHITELISTED_IPS = [
  "103.216.209.250",
  "103.67.182.131",
  "103.235.69.135",
];

function getClientIP(request) {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request) {
  try {
    const clientIP = getClientIP(request);
    console.log("[DigiKhata Webhook] Received from IP:", clientIP);

    const payload = await request.json();
    console.log("[DigiKhata Webhook] Payload:", JSON.stringify(payload));

    const { data, resultCode, resultStatus } = payload || {};
    const refId = data?.refId || data?.OrderId || data?.orderId;
    const rrn = data?.rrn || "";
    const id = data?.id || "";
    const payerAddress = data?.payerAddress || "";
    const payerName = data?.payerName || "";
    const paidAmount = data?.amount ? Math.round(Number(data.amount)) : null;

    if (!refId) {
      console.warn("[DigiKhata Webhook] Missing refId / OrderId");
      return NextResponse.json(
        { resultCode: "400", resultStatus: "failed", resultMessage: "Missing refId" },
        { status: 400 },
      );
    }

    // Find order by id or sanitized id
    let order = await prisma.order.findUnique({
      where: { id: refId },
      include: { payment: true },
    });

    if (!order) {
      // Try finding by prefix / without punctuation if refId was sanitized
      const orders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { payment: true },
      });
      order = orders.find(
        (o) => o.id.replace(/[^a-zA-Z0-9]/g, "") === refId.replace(/[^a-zA-Z0-9]/g, ""),
      );
    }

    if (!order) {
      console.warn("[DigiKhata Webhook] Order not found for refId:", refId);
      return NextResponse.json(
        { resultCode: "404", resultStatus: "failed", resultMessage: "Order not found" },
        { status: 404 },
      );
    }

    const isSuccess =
      resultCode === "000" ||
      String(resultStatus || "").toLowerCase() === "success";

    const paymentStatus = isSuccess ? "success" : "failed";
    const orderStatus = isSuccess ? "paid" : "failed";

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        method: "DIGIKHATA_UPI",
        status: paymentStatus,
        amount: paidAmount || order.finalAmount || order.amount,
        gatewayId: id || null,
        rrn: rrn || null,
        payerAddress: payerAddress || null,
        payerName: payerName || null,
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
        amount: paidAmount || order.finalAmount || order.amount,
        gatewayId: id || null,
        rrn: rrn || null,
        payerAddress: payerAddress || null,
        payerName: payerName || null,
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
        endpoint: "/api/digikhata/webhook",
        statusCode: 200,
        request: { clientIP, payload },
        response: { paymentStatus, orderStatus },
        note: `digikhata-webhook-${paymentStatus}`,
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

    console.log("[DigiKhata Webhook] Order updated:", {
      orderId: order.id,
      paymentStatus,
      orderStatus,
      rrn,
    });

    // Forward notification to CowPay callback URL if configured
    const cowpayUrl =
      process.env.DIGIKHATA_CALLBACK_URL ||
      "https://api.cowpay.co/callback/pay/cowpayinrdigikhatatwo";

    if (cowpayUrl && !cowpayUrl.includes("novusmode.com")) {
      fetch(cowpayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NovusMode-DigiKhata-Webhook/1.0",
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn("[DigiKhata Webhook] Forward to CowPay callback failed:", err.message);
      });
    }

    return NextResponse.json({
      resultCode: "000",
      resultStatus: "success",
      resultMessage: "Notification received and processed",
    });
  } catch (error) {
    console.error("[DigiKhata Webhook] Processing error:", error);
    return NextResponse.json(
      { resultCode: "500", resultStatus: "error", resultMessage: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  return NextResponse.json({
    ok: true,
    message: "DigiKhata webhook endpoint is active",
  });
}
