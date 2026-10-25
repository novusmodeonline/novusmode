// src/app/api/digikhata/generate-qr/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateDynamicQR,
  sanitizeDigiKhataOrderId,
} from "@/lib/digikhata";
import QRCode from "qrcode";

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, amount } = body;

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Order ID is required" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 },
      );
    }

    const payableAmount = Math.round(
      Number(amount || order.finalAmount || order.amount || 0),
    );

    // Upsert payment record in database
    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        method: "DIGIKHATA_UPI",
        status: "initiated",
        amount: payableAmount,
      },
      create: {
        orderId: order.id,
        method: "DIGIKHATA_UPI",
        status: "initiated",
        amount: payableAmount,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "pending",
        paymentMethod: "DIGIKHATA_UPI",
        paymentId: payment.id,
      },
    });

    // Call DigiKhata Dynamic QR API
    const result = await generateDynamicQR({
      orderId: order.id,
      amount: payableAmount,
      remarks: `Order ${order.id}`,
      expiryMinutes: 5,
    });

    let qrCodeImage = null;
    let isLiveGateway = false;

    const digiData = result?.data;
    const resultCode = String(digiData?.resultCode || "");
    const resultStatus = String(digiData?.resultStatus || "").toLowerCase();

    // Check if DigiKhata returned successful QR
    const rawQr = digiData?.data?.qrCodeImage || digiData?.data?.qrString;
    if ((resultCode === "000" || resultStatus === "success") && rawQr) {
      isLiveGateway = true;
      if (rawQr.startsWith("data:") || rawQr.startsWith("http")) {
        qrCodeImage = rawQr;
      } else if (rawQr.startsWith("upi://")) {
        qrCodeImage = await QRCode.toDataURL(rawQr, { width: 300, margin: 2 });
      } else {
        // Base64 raw image
        qrCodeImage = `data:image/png;base64,${rawQr}`;
      }
    } else {
      // Fallback: If gateway returns error/unauthorized (e.g. running on non-whitelisted dev IP)
      // generate valid UPI QR code for Prostyle Solutions so workflow is never blocked
      console.warn(
        "[DigiKhata] Gateway response not success, using standard UPI fallback:",
        digiData,
      );
      const cleanId = sanitizeDigiKhataOrderId(order.id);
      const upiUri = `upi://pay?pa=merchant.29umesqg@paypoint&pn=Prostyle%20Solutions&am=${payableAmount}.00&tr=${cleanId}&tn=Order%20${cleanId}&cu=INR`;
      qrCodeImage = await QRCode.toDataURL(upiUri, { width: 300, margin: 2 });
    }

    // Save generated QR in Payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        qrString: qrCodeImage,
        rawResponse: digiData || null,
      },
    });

    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        direction: "outbound",
        endpoint: result.endpoint,
        statusCode: result.status,
        request: result.payload,
        response: digiData || null,
        note: isLiveGateway ? "digikhata-dqr-live" : "digikhata-dqr-fallback",
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      amount: payableAmount,
      qrCodeImage,
      isLiveGateway,
      expirySeconds: 300,
    });
  } catch (error) {
    console.error("/api/digikhata/generate-qr error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to generate UPI QR code" },
      { status: 500 },
    );
  }
}
