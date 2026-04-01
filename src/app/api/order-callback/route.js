import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { decryptSabPaisaResponse } from "@/lib/sabpaisa-crypto";

function isBrowserRedirect(request) {
  const secFetchMode = request.headers.get("sec-fetch-mode") || "";
  const accept = request.headers.get("accept") || "";
  const userAgent = request.headers.get("user-agent") || "";

  return (
    secFetchMode.toLowerCase() === "navigate" ||
    accept.includes("text/html") ||
    userAgent.includes("Mozilla")
  );
}

function mapOrderStatus(statusCode) {
  return statusCode === "0000"
    ? { paymentStatus: "success", orderStatus: "paid" }
    : { paymentStatus: "failed", orderStatus: "failed" };
}

export async function POST(request) {
  let clientTxnId = "";

  try {
    const formData = await request.formData();
    const encResponseValue = formData.get("encResponse");

    if (!encResponseValue || typeof encResponseValue !== "string") {
      return NextResponse.json(
        { error: "Malformed request: encResponse missing" },
        { status: 400 },
      );
    }

    const parsed = decryptSabPaisaResponse(encResponseValue);
    const statusCode = String(parsed.statusCode || "");
    clientTxnId = String(parsed.clientTxnId || "");

    if (!statusCode || !clientTxnId) {
      return NextResponse.json(
        {
          error: "Malformed decrypted payload: missing statusCode/clientTxnId",
        },
        { status: 400 },
      );
    }

    const { paymentStatus, orderStatus } = mapOrderStatus(statusCode);
    const order = await prisma.order.findUnique({
      where: { id: clientTxnId },
    });

    if (order) {
      const amount =
        parsed.amount && !Number.isNaN(Number(parsed.amount))
          ? Math.round(Number(parsed.amount))
          : (order.finalAmount ?? order.amount);

      const payment = await prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          method: "SABPAISA",
          status: paymentStatus,
          amount,
          gatewayId: parsed.sabpaisaTxnId || null,
          responseCode: statusCode,
          responseMessage: parsed.message || null,
          rawResponse: parsed,
          webhookVerified: true,
          webhookReceivedAt: new Date(),
          processedAt: new Date(),
        },
        create: {
          orderId: order.id,
          method: "SABPAISA",
          status: paymentStatus,
          amount,
          gatewayId: parsed.sabpaisaTxnId || null,
          responseCode: statusCode,
          responseMessage: parsed.message || null,
          rawResponse: parsed,
          webhookVerified: true,
          webhookReceivedAt: new Date(),
          processedAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: orderStatus,
          paymentMethod: "SABPAISA",
          paymentId: payment.id,
        },
      });
    }

    if (isBrowserRedirect(request)) {
      redirect(`/payment/status?id=${encodeURIComponent(clientTxnId)}`);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("SabPaisa callback error", error);

    if (isBrowserRedirect(request)) {
      const safeId = encodeURIComponent(clientTxnId || "unknown");
      redirect(`/payment/status?id=${safeId}&status=error`);
    }

    return NextResponse.json(
      { error: "Unable to process SabPaisa callback" },
      { status: 500 },
    );
  }
}
