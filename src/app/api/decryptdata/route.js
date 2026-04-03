import { NextResponse } from "next/server";
import { decryptSabPaisaResponse } from "@/lib/sabpaisa-crypto";

function sanitize(value) {
  return String(value || "").trim();
}

function extractEncResponseFromUrl(rawUrl) {
  const value = sanitize(rawUrl);
  if (!value) return "";

  try {
    const parsedUrl = new URL(value);
    return (
      sanitize(parsedUrl.searchParams.get("encResponse")) ||
      sanitize(parsedUrl.searchParams.get("encresponse")) ||
      sanitize(parsedUrl.searchParams.get("encData")) ||
      sanitize(parsedUrl.searchParams.get("encdata")) ||
      ""
    );
  } catch {
    return "";
  }
}

function resolveEncResponse(input = {}) {
  const direct =
    sanitize(input.encResponse) ||
    sanitize(input.encresponse) ||
    sanitize(input.encData) ||
    sanitize(input.encdata);

  if (direct) return direct;

  const fromCallbackUrl =
    extractEncResponseFromUrl(input.callbackUrl) ||
    extractEncResponseFromUrl(input.url);

  return fromCallbackUrl;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());

    const encResponse = resolveEncResponse(params);

    if (!encResponse) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing encrypted payload. Send encResponse/encData or callbackUrl/url containing encResponse.",
        },
        { status: 400 },
      );
    }

    const parsed = decryptSabPaisaResponse(encResponse);

    return NextResponse.json({
      ok: true,
      clientCode: sanitize(params.clientCode || params.clientcode),
      parsed,
    });
  } catch (error) {
    console.error("/api/decryptdata GET error", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to decrypt payload" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const encResponse = resolveEncResponse(body || {});

    if (!encResponse) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing encrypted payload. Send encResponse/encData or callbackUrl/url containing encResponse.",
        },
        { status: 400 },
      );
    }

    const parsed = decryptSabPaisaResponse(encResponse);

    return NextResponse.json({
      ok: true,
      clientCode: sanitize((body || {}).clientCode || (body || {}).clientcode),
      parsed,
    });
  } catch (error) {
    console.error("/api/decryptdata POST error", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to decrypt payload" },
      { status: 500 },
    );
  }
}
