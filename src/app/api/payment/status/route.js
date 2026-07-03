import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { PAYPOINT_BASE_URL, getPaypointHeaders } from "@/config/paypoint";

function extractTxnStatus(payload) {
  const data = payload?.data;

  if (Array.isArray(data)) {
    const firstItem = data[0];
    if (firstItem?.TxnStatus != null) return Number(firstItem.TxnStatus);
    if (firstItem?.txnStatus != null) return Number(firstItem.txnStatus);
  }

  if (data && typeof data === "object") {
    if (data.TxnStatus != null) return Number(data.TxnStatus);
    if (data.txnStatus != null) return Number(data.txnStatus);
  }

  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json(
      { ok: false, status: "error", message: "orderId is required" },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, status: "error", message: "Order not found" },
        { status: 404 },
      );
    }

    if (order.status === "PAID") {
      return NextResponse.json({
        ok: true,
        status: "success",
        txnStatus: 3,
        source: "database",
      });
    }

    const refId = order.payment?.gatewayOrderId || order.externalRefId;

    if (!refId) {
      return NextResponse.json(
        {
          ok: false,
          status: "error",
          message: "Gateway reference not found",
        },
        { status: 400 },
      );
    }

    const url = `${PAYPOINT_BASE_URL}/upi/getAllTransactionStatus?refId=${encodeURIComponent(refId)}`;
    const startedAt = Date.now();

    console.log(
      "[PayPointStatus] request:",
      JSON.stringify({ orderId, refId, url }),
    );

    const response = await fetch(url, {
      method: "GET",
      headers: getPaypointHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    const raw = await response.text();
    console.log("[PayPointStatus] HTTP status:", response.status);
    console.log("[PayPointStatus] raw response:", raw);

    let payload = null;

    try {
      payload = JSON.parse(raw);
    } catch (error) {
      console.error("[PayPointStatus] failed to parse JSON response:", error);
      console.log(
        "[PayPointStatus] request duration:",
        Date.now() - startedAt,
      );

      return NextResponse.json(
        {
          ok: false,
          status: "error",
          message: "Invalid response received from PayPoint",
          rawResponse: raw,
        },
        { status: 502 },
      );
    }

    const txnStatus = extractTxnStatus(payload);

    console.log("[PayPointStatus] resultCode:", payload?.resultCode);
    console.log("[PayPointStatus] TxnStatus:", txnStatus);
    console.log("[PayPointStatus] request duration:", Date.now() - startedAt);

    if (payload?.resultCode !== "000") {
      return NextResponse.json(
        {
          ok: false,
          status: "error",
          resultCode: payload?.resultCode,
          resultMessage: payload?.resultMessage,
          payload,
        },
        { status: 502 },
      );
    }

    if (txnStatus === 3) {
      const payment = await prisma.payment.upsert({
        where: { orderId },
        update: {
          status: "success",
          gatewayOrderId: refId,
          responseCode: "000",
          responseMessage: "Reconciled via PayPoint status polling",
          rawResponse: payload,
          webhookVerified: true,
          processedAt: new Date(),
        },
        create: {
          orderId,
          method: "upi_qr",
          mode: "paypoint",
          status: "success",
          amount: order.amount,
          gatewayOrderId: refId,
          responseCode: "000",
          responseMessage: "Reconciled via PayPoint status polling",
          rawResponse: payload,
          webhookVerified: true,
          processedAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentMethod: "upi_qr",
          paymentId: payment.id,
        },
      });

      return NextResponse.json({
        ok: true,
        status: "success",
        txnStatus,
        source: "gateway",
      });
    }

    if (txnStatus === 4 || txnStatus === 5) {
      await prisma.payment.upsert({
        where: { orderId },
        update: {
          status: "failed",
          gatewayOrderId: refId,
          responseCode: String(txnStatus),
          responseMessage: "PayPoint payment failed or expired",
          rawResponse: payload,
          processedAt: new Date(),
        },
        create: {
          orderId,
          method: "upi_qr",
          mode: "paypoint",
          status: "failed",
          amount: order.amount,
          gatewayOrderId: refId,
          responseCode: String(txnStatus),
          responseMessage: "PayPoint payment failed or expired",
          rawResponse: payload,
          processedAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "FAILED",
          paymentMethod: "upi_qr",
        },
      });

      return NextResponse.json({
        ok: true,
        status: "failed",
        txnStatus,
        source: "gateway",
      });
    }

    return NextResponse.json({
      ok: true,
      status: "pending",
      txnStatus,
      source: "gateway",
    });
  } catch (error) {
    console.error("[PayPointStatus] error:", error);
    return NextResponse.json(
      { ok: false, status: "error", message: "Payment status check failed" },
      { status: 500 },
    );
  }
}
