import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth";

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export async function GET(req) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response || NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 50), 200);
  const status = String(searchParams.get("status") || "").trim();
  const orderId = String(searchParams.get("orderId") || "").trim();
  const batchId = String(searchParams.get("batchId") || "").trim();

  const skip = (page - 1) * limit;
  const where = {
    ...(status ? { status } : {}),
    ...(orderId ? { orderId: { contains: orderId } } : {}),
    ...(batchId ? { batchId: { contains: batchId } } : {}),
  };

  const [logs, totalCount] = await Promise.all([
    prisma.externalOrderSyncLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.externalOrderSyncLog.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    logs,
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  });
}
