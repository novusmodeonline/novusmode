import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function sanitize(value) {
  return String(value ?? "").trim();
}

function resolveIpAddress(body, request) {
  const fromBody = sanitize(
    body?.ipAddress || body?.IPAddress || body?.ip || body?.value,
  );

  if (fromBody) {
    return fromBody.split(",")[0].trim();
  }

  const forwardedFor = sanitize(request.headers.get("x-forwarded-for"));
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return sanitize(request.headers.get("x-real-ip"));
}

export async function POST(request) {
  try {
    const body = await request.json();
    // console.log("/api/orders/metadata received body:", body);
    const orderId = sanitize(body?.orderId || body?.id);
    const IPAddress = resolveIpAddress(body || {}, request);

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Missing orderId" },
        { status: 400 },
      );
    }

    if (!IPAddress) {
      return NextResponse.json(
        { ok: false, error: "Missing ipAddress" },
        { status: 400 },
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 },
      );
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { IPAddress },
      select: {
        id: true,
        IPAddress: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      IPAddress: order.IPAddress,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error("/api/orders/metadata POST error", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to update order metadata",
      },
      { status: 500 },
    );
  }
}
