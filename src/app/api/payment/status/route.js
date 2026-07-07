import { NextResponse } from "next/server";

import { PAYPOINT_BASE_URL, getPaypointHeaders } from "@/config/paypoint";
import prisma from "@/lib/prisma";

const RECONCILIATION_DELAY_MS = 30_000;

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

function statusResponse(status, source) {
  return NextResponse.json({ ok: true, status, source });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId")?.trim();

  if (!orderId) {
    return NextResponse.json(
      { ok: false, status: "error", message: "orderId is required" },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, status: "error", message: "Order not found" },
        { status: 404 },
      );
    }

    const orderStatus = order.status.toUpperCase();

    if (orderStatus === "PAID") {
      console.log("[PayPointStatus] paid order resolved from database:", {
        orderId,
      });
      return statusResponse("success", "database");
    }

    if (orderStatus === "FAILED") {
      console.log("[PayPointStatus] failed order resolved from database:", {
        orderId,
      });
      return statusResponse("failed", "database");
    }

    const ageMs = Date.now() - order.createdAt.getTime();
    if (ageMs < RECONCILIATION_DELAY_MS) {
      console.log("[PayPointStatus] pending inside database-only window:", {
        orderId,
        ageMs,
      });
      return statusResponse("pending", "database");
    }

    const refId = order.payment?.gatewayOrderId;
    if (!refId) {
      console.warn("[PayPointStatus] gateway reference unavailable:", {
        orderId,
        ageMs,
      });
      return statusResponse("pending", "database");
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

    let payload;
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
        },
        { status: 502 },
      );
    }

    const txnStatus = extractTxnStatus(payload);

    console.log("[PayPointStatus] resultCode:", payload?.resultCode);
    console.log("[PayPointStatus] TxnStatus:", txnStatus);
    console.log(
      "[PayPointStatus] request duration:",
      Date.now() - startedAt,
    );

    if (!response.ok || payload?.resultCode !== "000") {
      return NextResponse.json(
        {
          ok: false,
          status: "error",
          message: "PayPoint status request was unsuccessful",
        },
        { status: 502 },
      );
    }

    if (txnStatus !== 3 && txnStatus !== 4 && txnStatus !== 5) {
      return statusResponse("pending", "gateway");
    }

    const reconciled = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { payment: true },
      });

      if (!currentOrder) return { status: "pending", source: "database" };
      if (currentOrder.status.toUpperCase() === "PAID") {
        return { status: "success", source: "database" };
      }
      if (currentOrder.status.toUpperCase() === "FAILED") {
        return { status: "failed", source: "database" };
      }
      if (!currentOrder.payment) {
        return { status: "pending", source: "database" };
      }

      const now = new Date();

      if (txnStatus === 3) {
        const payment = await tx.payment.update({
          where: { id: currentOrder.payment.id },
          data: {
            status: "success",
            responseCode: "000",
            responseMessage:
              payload?.resultMessage || "Payment verified by PayPoint status",
            rawResponse: payload,
            processedAt: now,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paymentMethod: payment.method,
            paymentId: payment.id,
          },
        });

        return { status: "success", source: "gateway" };
      }

      await tx.payment.update({
        where: { id: currentOrder.payment.id },
        data: {
          status: "failed",
          responseCode: String(txnStatus),
          responseMessage:
            payload?.resultMessage || "PayPoint payment failed or expired",
          rawResponse: payload,
          processedAt: now,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "FAILED",
          paymentMethod: currentOrder.payment.method,
          paymentId: currentOrder.payment.id,
        },
      });

      return { status: "failed", source: "gateway" };
    });

    console.log("[PayPointStatus] reconciliation result:", {
      orderId,
      refId,
      txnStatus,
      ...reconciled,
    });

    return statusResponse(reconciled.status, reconciled.source);
  } catch (error) {
    console.error("[PayPointStatus] error:", error);
    return NextResponse.json(
      { ok: false, status: "error", message: "Payment status check failed" },
      { status: 500 },
    );
  }
}
