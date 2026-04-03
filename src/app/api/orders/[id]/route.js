import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  console.log("working?");
  const { id } = await params;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        products: true,
        address: true,
        payment: true,
      },
    });

    if (!order) return NextResponse.json({ success: false }, { status: 404 });

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
