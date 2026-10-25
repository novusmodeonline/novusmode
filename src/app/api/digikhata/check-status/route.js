// src/app/api/digikhata/check-status/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkDigiKhataStatus } from "@/lib/digikhata";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { status: "error", message: "orderId is required" },
        { status: 400 },
      );
    }

    // 1. Check local database record first
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json(
        { status: "error", message: "Order not found" },
        { status: 404 },
      );
    }

    const payment = order.payment;
    const paymentStatus = (payment?.status || "").toLowerCase();
    const orderStatus = (order.status || "").toLowerCase();

    if (
      paymentStatus === "success" ||
      paymentStatus === "paid" ||
      orderStatus === "paid"
    ) {
      return NextResponse.json({
        status: "success",
        orderId: order.id,
        amount: payment?.amount || order.finalAmount,
        rrn: payment?.rrn,
      });
    }

    // 2. Query DigiKhata status endpoint
    const digiCheck = await checkDigiKhataStatus(order.id);
    const digiData = digiCheck?.data;
    const itemData = digiData?.data;

    // TxnStatus: 1 & 2 = Pending, 3 = Success, 4 = Failed, 5 = Expired
    const txnStatus = itemData?.TxnStatus;
    const resultCode = String(digiData?.resultCode || "");
    const resultStatus = String(digiData?.resultStatus || "").toLowerCase();

    if (txnStatus === 3 || (resultCode === "000" && resultStatus === "success" && txnStatus === 3)) {
      // Mark as paid in DB
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "success",
            gatewayId: itemData?.TransactionId || payment.gatewayId,
            rrn: itemData?.CustomerRefNo || payment.rrn,
            payerAddress: itemData?.PayerAddress || payment.payerAddress,
            payerName: itemData?.PayerName || payment.payerName,
            rawResponse: digiData,
            processedAt: new Date(),
          },
        });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
        },
      });

      return NextResponse.json({
        status: "success",
        orderId: order.id,
        amount: itemData?.Amount || payment?.amount,
        rrn: itemData?.CustomerRefNo,
      });
    }

    if (txnStatus === 4) {
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "failed", rawResponse: digiData },
        });
      }
      return NextResponse.json({
        status: "failed",
        orderId: order.id,
        message: itemData?.ResponseMessage || "Payment failed",
      });
    }

    if (txnStatus === 5) {
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "expired", rawResponse: digiData },
        });
      }
      return NextResponse.json({
        status: "expired",
        orderId: order.id,
        message: "QR code expired",
      });
    }

    return NextResponse.json({
      status: "pending",
      orderId: order.id,
    });
  } catch (error) {
    console.error("/api/digikhata/check-status error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 },
    );
  }
}
