import { NextResponse } from "next/server";

const RESPONSE_BODY = {
  ok: false,
  error:
    "External order status sync endpoint is deprecated and no longer supported.",
};

export async function GET() {
  return NextResponse.json(RESPONSE_BODY, { status: 410 });
}

export async function POST() {
  return NextResponse.json(RESPONSE_BODY, { status: 410 });
}
