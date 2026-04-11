"use server";

import prisma from "@/lib/prisma";
import { checkSabPaisaStatus } from "@/lib/sabpaisa-enquiry";

function pickSabPaisaMessage(raw, fallback) {
  const candidates = [
    raw?.sabpaisaMessage,
    raw?.bankMessage,
    raw?.status,
    fallback,
  ];

  for (const value of candidates) {
    const text = String(value || "").trim();
    if (
      text &&
      text.toLowerCase() !== "null" &&
      text.toLowerCase() !== "undefined"
    ) {
      return text;
    }
  }

  return fallback;
}

/**
 * Server Action: refresh order payment status via SabPaisa enquiry.
 *
 * @param {string} orderId - The Order.id (clientTxnId used at payment initiation).
 * @returns {{ status: string, message: string, orderStatus: string }}
 */
export async function refreshOrderStatus(orderId, enquiryResult = null) {
  if (!orderId) {
    return { status: "error", message: "Missing orderId.", orderStatus: null };
  }

  try {
    const { statusCode, raw } =
      enquiryResult || (await checkSabPaisaStatus(orderId));
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    const localOrderFound = Boolean(order);

    console.log(
      "[refreshOrderStatus] statusCode:",
      statusCode,
      "orderId:",
      orderId,
      "localOrderFound:",
      localOrderFound,
    );

    const markAttempt = (note) =>
      prisma.paymentAttempt.create({
        data: {
          paymentId: order?.payment?.id || null,
          direction: "outbound",
          endpoint: "sabpaisa-enquiry",
          statusCode: 200,
          request: { orderId },
          response: raw,
          note,
        },
      });

    // ── 0000 → Success ──────────────────────────────────────────────────────
    if (statusCode === "0000") {
      if (!order) {
        await markAttempt(
          "status confirmed success via manual enquiry (local order missing)",
        );

        return {
          status: "success",
          message:
            "Payment is successful at SabPaisa, but no matching local order was found.",
          orderStatus: "missing_local_order",
          localOrderFound: false,
        };
      }

      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: {
            status: "paid",
            paymentMethod: order.paymentMethod || "SABPAISA",
          },
        }),
        prisma.payment.upsert({
          where: { orderId },
          update: {
            method: "SABPAISA",
            mode: raw?.paymentMode || order.payment?.mode || null,
            status: "success",
            amount:
              raw?.paidAmount && !Number.isNaN(Number(raw.paidAmount))
                ? Math.round(Number(raw.paidAmount))
                : (order.finalAmount ?? order.amount),
            gatewayId: raw?.sabpaisaTxnId || order.payment?.gatewayId || null,
            responseCode: "0000",
            responseMessage: pickSabPaisaMessage(
              raw,
              "Payment confirmed via enquiry",
            ),
            payerName: raw?.payerName || order.payment?.payerName || null,
            payerAddress:
              raw?.payerAddress || order.payment?.payerAddress || null,
            rrn: raw?.rrn || order.payment?.rrn || null,
            rawResponse: raw,
            webhookVerified: true,
            webhookReceivedAt: order.payment?.webhookReceivedAt || new Date(),
            processedAt: new Date(),
            reconciliationRequired: false,
            reconciliationStatus: "not_required",
            lastReconciliationAt: new Date(),
          },
          create: {
            orderId,
            method: "SABPAISA",
            mode: raw?.paymentMode || null,
            status: "success",
            amount:
              raw?.paidAmount && !Number.isNaN(Number(raw.paidAmount))
                ? Math.round(Number(raw.paidAmount))
                : (order.finalAmount ?? order.amount),
            gatewayId: raw?.sabpaisaTxnId || null,
            responseCode: "0000",
            responseMessage: pickSabPaisaMessage(
              raw,
              "Payment confirmed via enquiry",
            ),
            payerName: raw?.payerName || null,
            payerAddress: raw?.payerAddress || null,
            rrn: raw?.rrn || null,
            rawResponse: raw,
            webhookVerified: true,
            webhookReceivedAt: new Date(),
            processedAt: new Date(),
            reconciliationRequired: false,
            reconciliationStatus: "not_required",
            lastReconciliationAt: new Date(),
          },
        }),
        markAttempt("status confirmed success via manual enquiry"),
      ]);

      return {
        status: "success",
        message: "Payment confirmed! Your order is now placed.",
        orderStatus: "paid",
        localOrderFound: true,
      };
    }

    // ── 0300 / 0200 → Failed / Aborted ─────────────────────────────────────
    if (statusCode === "0300" || statusCode === "0200") {
      const paymentStatus = statusCode === "0200" ? "aborted" : "failed";

      if (!order) {
        await markAttempt(
          `status confirmed ${paymentStatus} via manual enquiry (local order missing)`,
        );

        return {
          status: "failed",
          message: `Payment is marked ${paymentStatus} at SabPaisa, but no matching local order was found.`,
          orderStatus: "missing_local_order",
          localOrderFound: false,
        };
      }

      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: {
            status: "failed",
            paymentMethod: order.paymentMethod || "SABPAISA",
          },
        }),
        prisma.payment.upsert({
          where: { orderId },
          update: {
            method: "SABPAISA",
            mode: raw?.paymentMode || order.payment?.mode || null,
            status: paymentStatus,
            amount:
              raw?.amount && !Number.isNaN(Number(raw.amount))
                ? Math.round(Number(raw.amount))
                : (order.finalAmount ?? order.amount),
            gatewayId: raw?.sabpaisaTxnId || order.payment?.gatewayId || null,
            responseCode: statusCode,
            responseMessage: pickSabPaisaMessage(raw, "Payment failed"),
            payerName: raw?.payerName || order.payment?.payerName || null,
            payerAddress:
              raw?.payerAddress || order.payment?.payerAddress || null,
            rrn: raw?.rrn || order.payment?.rrn || null,
            rawResponse: raw,
            webhookVerified: true,
            webhookReceivedAt: order.payment?.webhookReceivedAt || new Date(),
            processedAt: new Date(),
            reconciliationRequired: false,
            reconciliationStatus: "not_required",
            lastReconciliationAt: new Date(),
          },
          create: {
            orderId,
            method: "SABPAISA",
            mode: raw?.paymentMode || null,
            status: paymentStatus,
            amount:
              raw?.amount && !Number.isNaN(Number(raw.amount))
                ? Math.round(Number(raw.amount))
                : (order.finalAmount ?? order.amount),
            gatewayId: raw?.sabpaisaTxnId || null,
            responseCode: statusCode,
            responseMessage: pickSabPaisaMessage(raw, "Payment failed"),
            payerName: raw?.payerName || null,
            payerAddress: raw?.payerAddress || null,
            rrn: raw?.rrn || null,
            rawResponse: raw,
            webhookVerified: true,
            webhookReceivedAt: new Date(),
            processedAt: new Date(),
            reconciliationRequired: false,
            reconciliationStatus: "not_required",
            lastReconciliationAt: new Date(),
          },
        }),
        markAttempt(`status confirmed ${paymentStatus} via manual enquiry`),
      ]);

      return {
        status: "failed",
        message: "Payment was not successful. Please retry.",
        orderStatus: "failed",
        localOrderFound: true,
      };
    }

    // ── 0999 / 0100 / 0400 → Still Pending ─────────────────────────────────
    if (["0999", "0100", "0400"].includes(statusCode)) {
      await markAttempt(
        order
          ? "enquiry returned pending status"
          : "enquiry returned pending status (local order missing)",
      );

      return {
        status: "pending",
        message:
          "Payment is still being processed. Please check again shortly.",
        orderStatus: order ? "pending" : "missing_local_order",
        localOrderFound,
      };
    }

    // ── 404 / unknown ───────────────────────────────────────────────────────
    await markAttempt(`unexpected statusCode from enquiry: ${statusCode}`);

    return {
      status: "unknown",
      message: "Unable to verify payment status. Please contact support.",
      orderStatus: localOrderFound ? order.status : null,
      localOrderFound,
    };
  } catch (err) {
    console.error("[refreshOrderStatus] error:", err);
    return {
      status: "error",
      message: "Could not reach payment gateway. Please try again later.",
      orderStatus: null,
    };
  }
}
