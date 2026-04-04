import { NextResponse } from "next/server";
import { webcrypto } from "crypto";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/scripts/authOptions";

function sanitize(value) {
  return String(value || "").trim();
}

function formatSabPaisaTransDate(date = new Date()) {
  const pad = (num) => String(num).padStart(2, "0");

  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function normalizeAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "0.00";
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(2);
}

function isEnvFlagEnabled(value) {
  return ["1", "true", "yes", "on"].includes(
    String(value || "")
      .trim()
      .toLowerCase(),
  );
}

function maskPayload(payload = {}) {
  const out = { ...payload };

  if (out.payerEmail) {
    out.payerEmail = String(out.payerEmail).replace(/^(.).+(@.+)$/, "$1***$2");
  }

  if (out.payerMobile) {
    out.payerMobile = String(out.payerMobile).replace(
      /(.{3}).+(.{2})/,
      "$1****$2",
    );
  }

  return out;
}

function resolveSabPaisaEndpoint(env) {
  const normalized = sanitize(env).toLowerCase();

  if (normalized === "uat") {
    return "https://secure.sabpaisa.in/SabPaisa/sabPaisaInit?v=1";
  }

  if (normalized === "prod") {
    return "https://securepay.sabpaisa.in/SabPaisa/sabPaisaInit?v=1";
  }

  return "https://stage-securepay.sabpaisa.in/SabPaisa/sabPaisaInit?v=1";
}

function base64ToBytes(base64Value) {
  return new Uint8Array(Buffer.from(base64Value, "base64"));
}

function concatBytes(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function bytesToUpperHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function encryptSabPaisa(authKeyBase64, authIvBase64, rawString) {
  const aesKey = base64ToBytes(authKeyBase64);
  const hmacKey = base64ToBytes(authIvBase64);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));

  const aesCryptoKey = await webcrypto.subtle.importKey(
    "raw",
    aesKey,
    "AES-GCM",
    false,
    ["encrypt"],
  );

  const encrypted = await webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    aesCryptoKey,
    new TextEncoder().encode(rawString),
  );

  const ivPlusCipher = concatBytes(iv, new Uint8Array(encrypted));

  const hmacCryptoKey = await webcrypto.subtle.importKey(
    "raw",
    hmacKey,
    { name: "HMAC", hash: "SHA-384" },
    false,
    ["sign"],
  );

  const signature = await webcrypto.subtle.sign(
    "HMAC",
    hmacCryptoKey,
    ivPlusCipher,
  );

  const finalPayload = concatBytes(new Uint8Array(signature), ivPlusCipher);
  return bytesToUpperHex(finalPayload);
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Fallback hardcoded values for direct Postman hit without query params.
    const payerName = sanitize(searchParams.get("payerName") || "Test User");
    const payerEmail = sanitize(
      searchParams.get("payerEmail") || "test.user@example.com",
    );
    const payerMobile = sanitize(
      searchParams.get("payerMobile") || "9999999999",
    );
    const clientTxnId = sanitize(
      searchParams.get("clientTxnId") || `TXN${Date.now()}`,
    );

    const amount = normalizeAmount(searchParams.get("amount") || "1499");
    const env = sanitize(
      searchParams.get("env") || process.env.NEXT_PUBLIC_SABPAISA_ENV || "stag",
    );

    const callbackUrl =
      sanitize(searchParams.get("callbackUrl")) ||
      `${sanitize(process.env.NEXT_PUBLIC_BASE_URL)}/api/order-callback`;

    const mcc = sanitize(
      searchParams.get("mcc") || process.env.NEXT_PUBLIC_SABPAISA_MCC || "",
    );

    const payload = {
      clientCode:
        sanitize(process.env.NEXT_PUBLIC_SABPAISA_CLIENT_CODE) ||
        sanitize(process.env.SABPAISA_CLIENT_CODE),
      transUserName:
        sanitize(process.env.NEXT_PUBLIC_SABPAISA_TRANS_USER_NAME) ||
        sanitize(process.env.SABPAISA_TRANS_USER_NAME),
      transUserPassword:
        sanitize(process.env.NEXT_PUBLIC_SABPAISA_TRANS_USER_PASSWORD) ||
        sanitize(process.env.SABPAISA_TRANS_USER_PASSWORD),
      authKey:
        sanitize(process.env.NEXT_PUBLIC_SABPAISA_AUTH_KEY) ||
        sanitize(process.env.SABPAISA_AUTH_KEY),
      authIV:
        sanitize(process.env.NEXT_PUBLIC_SABPAISA_AUTH_IV) ||
        sanitize(process.env.SABPAISA_AUTH_IV),
      payerName,
      payerEmail,
      payerMobile,
      clientTxnId,
      amount: "2",
      callbackUrl,
      channelId: "npm",
      transDate: formatSabPaisaTransDate(),
      url: "https://secure.sabpaisa.in/SabPaisa/sabPaisaInit?v=1",
      mcc,
    };

    if (
      !payload.clientCode ||
      !payload.transUserName ||
      !payload.transUserPassword ||
      !payload.authKey ||
      !payload.authIV
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing SabPaisa credentials. Ensure SABPAISA_* or NEXT_PUBLIC_SABPAISA_* are set.",
        },
        { status: 400 },
      );
    }

    const rawPairs = [
      ["payerName", payload.payerName],
      ["payerEmail", payload.payerEmail],
      ["payerMobile", payload.payerMobile],
      ["clientTxnId", payload.clientTxnId],
      ["amount", payload.amount],
      ["clientCode", payload.clientCode],
      ["transUserName", payload.transUserName],
      ["transUserPassword", payload.transUserPassword],
      ["callbackUrl", payload.callbackUrl],
      ["channelId", payload.channelId],
      ["transDate", payload.transDate],
    ];

    if (payload.mcc) {
      rawPairs.push(["mcc", payload.mcc]);
    }

    const rawString = rawPairs
      .map(
        ([key, value]) => `${key}=${encodeURIComponent(String(value || ""))}`,
      )
      .join("&");
    console.log("Raw String for Encryption:", rawString);
    const encryptedPayload = await encryptSabPaisa(
      payload.authKey,
      payload.authIV,
      rawString,
    );

    const endpoint = resolveSabPaisaEndpoint(payload.env);

    return NextResponse.json({
      ok: true,
      endpoint,
      method: "POST",
      postBody: {
        encData: encryptedPayload,
        clientCode: payload.clientCode,
      },
      payload,
      rawString,
      encryptedPayload,
      usage:
        "Use endpoint + postBody in Postman as x-www-form-urlencoded or form-data for SabPaisa initiate call.",
    });
  } catch (error) {
    console.error("/api/encryptdata error", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create encrypted payload" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const orderId = sanitize(body?.orderId);

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Missing orderId" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 },
      );
    }

    if (order.userId && order.userId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const clientTxnId = sanitize(body?.clientTxnId || order.id);
    const shippingEnabled = isEnvFlagEnabled(
      process.env.SABPAISA_SHIPPING_ENABLED,
    );
    const baseAmount = Number(order.finalAmount ?? order.amount ?? 0);
    const shippingAmount = Number(order.shippingAmount ?? 0);
    const payableAmount = shippingEnabled
      ? baseAmount + shippingAmount
      : baseAmount;
    const amount = normalizeAmount(payableAmount);
    const env = sanitize(process.env.NEXT_PUBLIC_SABPAISA_ENV || "stag");
    const baseUrl = sanitize(
      process.env.SABPAISA_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "",
    ).replace(/\/+$/, "");
    const callbackUrl =
      baseUrl && baseUrl.startsWith("http")
        ? `${baseUrl}/api/order-callback`
        : `${sanitize(process.env.NEXT_PUBLIC_BASE_URL).replace(/\/+$/, "")}/api/order-callback`;
    const mcc = sanitize(process.env.NEXT_PUBLIC_SABPAISA_MCC || "");

    const payload = {
      clientCode:
        sanitize(process.env.SABPAISA_CLIENT_CODE) ||
        sanitize(process.env.NEXT_PUBLIC_SABPAISA_CLIENT_CODE),
      transUserName:
        sanitize(process.env.SABPAISA_TRANS_USER_NAME) ||
        sanitize(process.env.NEXT_PUBLIC_SABPAISA_TRANS_USER_NAME),
      transUserPassword:
        sanitize(process.env.SABPAISA_TRANS_USER_PASSWORD) ||
        sanitize(process.env.NEXT_PUBLIC_SABPAISA_TRANS_USER_PASSWORD),
      authKey:
        sanitize(process.env.SABPAISA_AUTH_KEY) ||
        sanitize(process.env.NEXT_PUBLIC_SABPAISA_AUTH_KEY),
      authIV:
        sanitize(process.env.SABPAISA_AUTH_IV) ||
        sanitize(process.env.NEXT_PUBLIC_SABPAISA_AUTH_IV),
      payerName: sanitize(body?.payerName || "Customer"),
      payerEmail: sanitize(body?.payerEmail || order.email),
      payerMobile: sanitize(body?.payerMobile || order.phone),
      clientTxnId,
      amount,
      callbackUrl,
      channelId: "npm",
      transDate: formatSabPaisaTransDate(),
      mcc,
      env,
      shippingEnabled,
    };

    if (
      !payload.clientCode ||
      !payload.transUserName ||
      !payload.transUserPassword ||
      !payload.authKey ||
      !payload.authIV
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing SabPaisa credentials. Ensure SABPAISA_* variables are set.",
        },
        { status: 400 },
      );
    }

    const rawPairs = [
      ["payerName", payload.payerName],
      ["payerEmail", payload.payerEmail],
      ["payerMobile", payload.payerMobile],
      ["clientTxnId", payload.clientTxnId],
      ["amount", payload.amount],
      ["clientCode", payload.clientCode],
      ["transUserName", payload.transUserName],
      ["transUserPassword", payload.transUserPassword],
      ["callbackUrl", payload.callbackUrl],
      ["channelId", payload.channelId],
      ["transDate", payload.transDate],
    ];

    if (payload.mcc) {
      rawPairs.push(["mcc", payload.mcc]);
    }

    const rawString = rawPairs
      .map(
        ([key, value]) => `${key}=${encodeURIComponent(String(value || ""))}`,
      )
      .join("&");

    const encryptedPayload = await encryptSabPaisa(
      payload.authKey,
      payload.authIV,
      rawString,
    );

    const endpoint = resolveSabPaisaEndpoint(payload.env);

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        method: "SABPAISA",
        mode: null,
        status: "initiated",
        amount: Math.round(Number(payload.amount)),
        rawResponse: {
          phase: "init",
          endpoint,
          payload: maskPayload(payload),
        },
        webhookVerified: false,
        webhookReceivedAt: null,
        processedAt: null,
        reconciliationRequired: false,
        reconciliationStatus: "not_required",
        reconciliationAttempts: 0,
        lastReconciliationAt: null,
      },
      create: {
        orderId: order.id,
        method: "SABPAISA",
        mode: null,
        status: "initiated",
        amount: Math.round(Number(payload.amount)),
        rawResponse: {
          phase: "init",
          endpoint,
          payload: maskPayload(payload),
        },
        reconciliationRequired: false,
        reconciliationStatus: "not_required",
        reconciliationAttempts: 0,
        lastReconciliationAt: null,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "pending",
        paymentMethod: "SABPAISA",
        paymentId: payment.id,
      },
    });

    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        direction: "outbound",
        endpoint,
        statusCode: null,
        request: maskPayload({
          orderId: order.id,
          clientTxnId: payload.clientTxnId,
          amount: payload.amount,
          payerEmail: payload.payerEmail,
          payerMobile: payload.payerMobile,
          callbackUrl: payload.callbackUrl,
        }),
        response: { queued: true },
        note: "sabpaisa-initiate",
      },
    });

    return NextResponse.json({
      ok: true,
      endpoint,
      method: "POST",
      postBody: {
        encData: encryptedPayload,
        clientCode: payload.clientCode,
      },
      orderId: order.id,
      clientTxnId: payload.clientTxnId,
      shippingEnabled,
      amount,
    });
  } catch (error) {
    console.error("/api/encryptdata POST error", error);
    return NextResponse.json(
      { ok: false, error: "Failed to initialize SabPaisa payment" },
      { status: 500 },
    );
  }
}
