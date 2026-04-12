// app/api/admin/orders/route.js
import prisma from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

function getISTStartOfDay(dateStr) {
  return new Date(`${dateStr}T00:00:00+05:30`);
}

function getISTEndOfDay(dateStr) {
  return new Date(`${dateStr}T23:59:59.999+05:30`);
}

export async function GET(req) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);

  const todayIST = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const page = Number(searchParams.get("page") || 1);
  const orderId = searchParams.get("orderId")?.trim() || "";
  const status = searchParams.get("status") ?? "paid";
  const from = searchParams.get("from") ?? todayIST;
  const to = searchParams.get("to") ?? todayIST;

  const limit = 100;
  const skip = (page - 1) * limit;
  const hasOrderIdFilter = Boolean(orderId);

  const where = {
    ...(hasOrderIdFilter
      ? {
          id: {
            contains: orderId,
          },
        }
      : {}),
    ...(!hasOrderIdFilter && status !== "all" && status ? { status } : {}),
    ...(!hasOrderIdFilter && (from || to)
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
        finalAmount: true,
        amount: true,
      },
    }),
  ]);

  return NextResponse.json({
    orders,
    totalCount: countResult,
    totalAmount: sumResult._sum.finalAmount ?? sumResult._sum.amount ?? 0,
    orderId,
    page,
    totalPages: Math.ceil(countResult / limit),
  });
}
