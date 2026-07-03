import { NextResponse } from "next/server";

export async function GET(request) {
  return NextResponse.json(
    {
      ok: false,
      error:
        "This endpoint is deprecated. Decryption is handled by the new gateway integration.",
    },
    { status: 410 },
  );
}

export async function POST(request) {
  return NextResponse.json(
    {
      ok: false,
      error:
        "This endpoint is deprecated. Decryption is handled by the new gateway integration.",
    },
    { status: 410 },
  );
}
