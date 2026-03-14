// app/api/admin/orders/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function getISTStartOfDay(dateStr) {
  return new Date(`${dateStr}T00:00:00+05:30`);
}

function getISTEndOfDay(dateStr) {
  return new Date(`${dateStr}T23:59:59.999+05:30`);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const limit = 100;
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: getISTStartOfDay(from) }),
            ...(to && { lte: getISTEndOfDay(to) }),
          },
        }
      : {}),
  };

  const [orders, countResult, sumResult] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: true,
        payment: true,
        address: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),

    prisma.order.count({ where }),

    prisma.order.aggregate({
      where,
      _sum: {
        amount: true,
      },
    }),
  ]);

  return NextResponse.json({
    orders,
    totalCount: countResult,
    totalAmount: sumResult._sum.amount / 100 || 0,
    page,
    totalPages: Math.ceil(countResult / limit),
  });
}
