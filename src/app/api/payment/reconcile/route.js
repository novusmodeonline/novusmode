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

export async function GET() {
  try {
    const threshold = new Date(Date.now() - 10 * 60 * 1000);

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "pending",
        createdAt: {
          lt: threshold,
        },
      },
      include: {
        payment: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const results = [];

    for (const order of pendingOrders) {
      try {
        const refId =
          order.externalRefId || order.payment?.gatewayOrderId || order.id;
        if (!refId) {
          results.push({
            orderId: order.id,
            status: "skipped",
            reason: "missing refId",
          });
          continue;
        }

        const response = await fetch(
          `${PAYPOINT_BASE_URL}/upi/getAllTransactionStatusv2?refId=${encodeURIComponent(refId)}`,
          {
            method: "GET",
            headers: getPaypointHeaders(),
          },
        );

        const payload = await response.json().catch(() => null);
        const txnStatus = extractTxnStatus(payload);

        if (txnStatus === 3) {
          await prisma.payment.upsert({
            where: { orderId: order.id },
            update: {
              status: "success",
              gatewayOrderId: refId,
              responseCode: "000",
              responseMessage: "Reconciled via PayPoint",
              webhookVerified: true,
              processedAt: new Date(),
            },
            create: {
              orderId: order.id,
              method: "upi_qr",
              mode: "paypoint",
              status: "success",
              amount: order.amount,
              gatewayOrderId: refId,
              responseCode: "000",
              responseMessage: "Reconciled via PayPoint",
              webhookVerified: true,
              processedAt: new Date(),
            },
          });

          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "PAID",
              paymentMethod: "upi_qr",
            },
          });

          results.push({ orderId: order.id, status: "paid", refId });
        } else if (txnStatus === 4 || txnStatus === 5) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "FAILED",
              paymentMethod: "upi_qr",
            },
          });

          results.push({
            orderId: order.id,
            status: "failed",
            refId,
            txnStatus,
          });
        } else {
          results.push({
            orderId: order.id,
            status: "pending",
            refId,
            txnStatus,
          });
        }
      } catch (error) {
        console.error("[PayPointReconcile] failed for order", order.id, error);
        results.push({
          orderId: order.id,
          status: "error",
          reason: error?.message || "Unknown error",
        });
      }
    }

    return NextResponse.json(
      { ok: true, processed: results.length, results },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PayPointReconcile] unexpected error", error);
    return NextResponse.json(
      { ok: false, message: "Reconciliation failed" },
      { status: 500 },
    );
  }
}
