import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const rawBody = await request.text();
    let body = null;

    if (rawBody && rawBody.trim()) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = { rawBody };
      }
    }

    // console.log("[SabPaisa][Terminal Debug] payload:", body?.payload || null);
    // console.log("[SabPaisa][Terminal Debug] endpoint:", body?.endpoint || null);
    // console.log(
    //   "[SabPaisa][Terminal Debug] encryptedEncData:",
    //   body?.encryptedEncData || null,
    // );
    // console.log(
    //   "[SabPaisa][Terminal Debug] postedClientCode:",
    //   body?.postedClientCode || null,
    // );
    // console.log(
    //   "[SabPaisa][Terminal Debug] formAction:",
    //   body?.formAction || null,
    // );
    // console.log(
    //   "[SabPaisa][Terminal Debug] timestamp:",
    //   body?.timestamp || null,
    // );

    // if (!body) {
    //   console.log("[SabPaisa][Terminal Debug] note: received empty debug body");
    // }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[SabPaisa][Terminal Debug] failed", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
