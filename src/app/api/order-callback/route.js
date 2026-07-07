import { NextResponse } from "next/server";

export async function POST(request) {
  const rawBody = await request.text();

  console.log("================================");
  console.log("PAYPOINT WEBHOOK RECEIVED");
  console.log(new Date().toISOString());
  console.log(rawBody);
  console.log("================================");

  return NextResponse.json({
    ok: true,
    message: "Webhook received",
  });
}
