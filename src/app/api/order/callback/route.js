import { NextResponse } from "next/server";

function callbackResponse(method) {
  return NextResponse.json(
    {
      ok: true,
      message: "/api/order/callback is working fine",
      callbackUrl: "/api/order/callback",
      method,
    },
    { status: 200 },
  );
}

export async function POST() {
  return callbackResponse("POST");
}
