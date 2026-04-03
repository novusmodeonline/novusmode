"use server";

import prisma from "@/lib/prisma";
import { checkSabPaisaStatus } from "@/lib/sabpaisa-enquiry";

/**
 * Server Action: refresh order payment status via SabPaisa enquiry.
 *
 * @param {string} orderId - The Order.id (clientTxnId used at payment initiation).
 * @returns {{ status: string, message: string, orderStatus: string }}
 */
export async function refreshOrderStatus(orderId) {
  if (!orderId) {
    return { status: "error", message: "Missing orderId.", orderStatus: null };
  }

  try {
    const { statusCode, raw } = await checkSabPaisaStatus(orderId);
    console.log(
      "[refreshOrderStatus] statusCode:",
      statusCode,
      "orderId:",
      orderId,
    );

    // ── 0000 → Success ──────────────────────────────────────────────────────
    if (statusCode === "0000") {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { status: "paid" },
        }),
        prisma.payment.updateMany({
          where: { orderId },
          data: {
            status: "success",
            responseCode: "0000",
            responseMessage:
              raw?.sabpaisaMessage ||
              raw?.status ||
              "Payment confirmed via enquiry",
            webhookVerified: true,
            processedAt: new Date(),
            reconciliationRequired: false,
            reconciliationStatus: "not_required",
          },
        }),
        prisma.paymentAttempt.create({
          data: {
            direction: "outbound",
            endpoint: "sabpaisa-enquiry",
            statusCode: 200,
            request: { orderId },
            response: raw,
            note: "status confirmed success via manual enquiry",
          },
        }),
      ]);

      return {
        status: "success",
        message: "Payment confirmed! Your order is now placed.",
        orderStatus: "paid",
      };
    }

    // ── 0300 / 0200 → Failed / Aborted ─────────────────────────────────────
    if (statusCode === "0300" || statusCode === "0200") {
      const paymentStatus = statusCode === "0200" ? "aborted" : "failed";

      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { status: "failed" },
        }),
        prisma.payment.updateMany({
          where: { orderId },
          data: {
            status: paymentStatus,
            responseCode: statusCode,
            responseMessage:
              raw?.sabpaisaMessage || raw?.status || "Payment failed",
            webhookVerified: true,
            processedAt: new Date(),
            reconciliationRequired: false,
            reconciliationStatus: "not_required",
          },
        }),
        prisma.paymentAttempt.create({
          data: {
            direction: "outbound",
            endpoint: "sabpaisa-enquiry",
            statusCode: 200,
            request: { orderId },
            response: raw,
            note: `status confirmed ${paymentStatus} via manual enquiry`,
          },
        }),
      ]);

      return {
        status: "failed",
        message: "Payment was not successful. Please retry.",
        orderStatus: "failed",
      };
    }

    // ── 0999 / 0100 / 0400 → Still Pending ─────────────────────────────────
    if (["0999", "0100", "0400"].includes(statusCode)) {
      await prisma.paymentAttempt.create({
        data: {
          direction: "outbound",
          endpoint: "sabpaisa-enquiry",
          statusCode: 200,
          request: { orderId },
          response: raw,
          note: "enquiry returned pending status",
        },
      });

      return {
        status: "pending",
        message:
          "Payment is still being processed. Please check again shortly.",
        orderStatus: "pending",
      };
    }

    // ── 404 / unknown ───────────────────────────────────────────────────────
    await prisma.paymentAttempt.create({
      data: {
        direction: "outbound",
        endpoint: "sabpaisa-enquiry",
        statusCode: 200,
        request: { orderId },
        response: raw,
        note: `unexpected statusCode from enquiry: ${statusCode}`,
      },
    });

    return {
      status: "unknown",
      message: "Unable to verify payment status. Please contact support.",
      orderStatus: null,
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
