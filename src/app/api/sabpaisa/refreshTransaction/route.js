import { NextResponse } from "next/server";
import { refreshOrderStatus } from "@/app/actions/checkOrderStatus";

async function extractOrderId(request) {
  const url = new URL(request.url);
  const orderId =
    url.searchParams.get("orderId") || url.searchParams.get("clientTxnId");

  if (orderId) {
    return orderId;
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      return String(body?.orderId || body?.clientTxnId || "").trim() || null;
    } catch {
      const text = await request.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          return (
            String(parsed?.orderId || parsed?.clientTxnId || "").trim() || null
          );
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

export async function GET(request) {
  const orderId = await extractOrderId(request);

  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: "Missing orderId or clientTxnId query param." },
      { status: 400 },
    );
  }

  const result = await refreshOrderStatus(orderId);
  return NextResponse.json({ ok: true, orderId, result });
}

export async function POST(request) {
  const orderId = await extractOrderId(request);

  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: "Missing orderId or clientTxnId in request body." },
      { status: 400 },
    );
  }

  const result = await refreshOrderStatus(orderId);
  return NextResponse.json({ ok: true, orderId, result });
}
