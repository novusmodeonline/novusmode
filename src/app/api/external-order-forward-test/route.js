import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "External order forward test endpoint is ready. Send a POST request to inspect forwarded callback payloads.",
  });
}

export async function POST(request) {
  try {
    const body = await request.json();

    // console.log("[ExternalOrderForwardTest] payload:", body);

    return NextResponse.json({
      ok: true,
      received: true,
      event: body?.event || null,
      orderId: body?.order?.id || body?.clientTxnId || null,
      source: body?.order?.source || body?.source || null,
      paymentStatus:
        body?.payment?.status || body?.callback?.paymentStatus || null,
    });
  } catch (error) {
    console.error("[ExternalOrderForwardTest] error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to parse forwarded payload",
      },
      { status: 400 },
    );
  }
}
