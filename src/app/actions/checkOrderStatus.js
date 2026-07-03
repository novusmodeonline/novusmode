"use server";

import prisma from "@/lib/prisma";

function toLower(value) {
  return String(value || "").trim().toLowerCase();
}

function pickPaymentMessage(payment, fallback) {
  const candidates = [payment?.responseMessage, payment?.message, fallback];

  for (const value of candidates) {
    const text = String(value || "").trim();
    if (text && text.toLowerCase() !== "null" && text.toLowerCase() !== "undefined") {
      return text;
    }
  }

  return fallback;
}

export async function refreshOrderStatus(orderId) {
  if (!orderId) {
    return { status: "error", message: "Missing orderId.", orderStatus: null };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order) {
    return { status: "error", message: "Order not found.", orderStatus: null };
  }

  const payment = order.payment;
  if (!payment) {
    return {
      status: "pending",
      message: "Payment has not started yet.",
      orderStatus: "pending",
    };
  }

  const responseCode = String(payment.responseCode || "").trim();
  const status = toLower(payment.status);

  if (responseCode === "0000" || status === "success" || status === "paid") {
    return {
      status: "success",
      message: pickPaymentMessage(payment, "Payment is complete."),
      orderStatus: "paid",
    };
  }

  if (
    responseCode === "0300" ||
    responseCode === "0200" ||
    status === "failed" ||
    status === "aborted"
  ) {
    return {
      status: "failed",
      message: pickPaymentMessage(payment, "Payment failed. Please try again."),
      orderStatus: "failed",
    };
  }

  return {
    status: "pending",
    message: pickPaymentMessage(payment, "Payment is pending. Please check again later."),
    orderStatus: "pending",
  };
}
