// app/api/pay10/check-status/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId)
      return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment)
      return NextResponse.json(
        { status: "not_found", message: "no payment yet" },
        { status: 200 }
      );

    return NextResponse.json({
      status: payment.status,
      orderId,
    });
  } catch (err) {
    console.error("check-status error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
