// lib/pay10/db.js
import prisma from "@/lib/prisma";
import { maskSensitive, maskUpi } from "@/lib/pay10/crypto";

/**
 * Create payment for an order (idempotent).
 * If a payment for orderId already exists, returns it.
 */
export async function getOrCreatePayment({ orderId, amount, method = "UPI", payerAddress }) {
  let payment = await prisma.payment.findUnique({ where: { orderId } });
  if (payment) return payment;
  payment = await prisma.payment.create({
    data: {
      orderId,
      method,
      amount,
      payerAddress: payerAddress ? maskUpi(payerAddress) : null,
    },
  });
  return payment;
}

export async function logPaymentAttempt({ paymentId, direction, endpoint, statusCode, request, response, note }) {
  const maskedRequest = request ? maskSensitive(request) : null;
  const maskedResponse = response ? maskSensitive(response) : null;
  return prisma.paymentAttempt.create({
    data: {
      paymentId,
      direction,
      endpoint,
      statusCode,
      request: maskedRequest,
      response: maskedResponse,
      note,
    },
  });
}

export async function updatePaymentFromCallback({ orderId, map }) {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) return null;
  const status = (map.RESPONSE_CODE === "000" && (map.STATUS === "Captured" || map.STATUS === "Success")) ? "success" :
                 (map.RESPONSE_CODE === "000" && map.STATUS === "Sent to Bank") ? "pending" : "failed";
  const updates = {
    status,
    gatewayId: map.TXN_ID || null,
    responseCode: map.RESPONSE_CODE || null,
    responseMessage: map.PG_TXN_MESSAGE || map.RESPONSE_MESSAGE || null,
    payerAddress: map.PAYER_ADDRESS ? maskUpi(map.PAYER_ADDRESS) : payment.payerAddress,
    pgRefNum: map.PG_REF_NUM || null,
    rrn: map.RRN || null,
    rawResponse: map ? maskSensitive(map) : null,
    webhookVerified: true,
    webhookReceivedAt: new Date(),
    processedAt: new Date(),
  };
  return prisma.payment.update({ where: { orderId }, data: updates });
}
