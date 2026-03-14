// app/api/pay10/upi/validate/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  buildHashString,
  sha256,
  encryptAES,
  decryptAES,
  parseTildePlaintext,
  safeCompare,
} from "@/lib/pay10/crypto";

function mask(obj = {}) {
  const o = { ...obj };
  if (o.ENCDATA) o.ENCDATA = "<redacted>";
  if (o.HASH) o.HASH = "<redacted>";
  return o;
}

export async function POST(req) {
  const priority = {
    AMOUNT: 1,
    CURRENCY_CODE: 2,
    CUST_EMAIL: 3,
    CUST_PHONE: 4,
    MOP_TYPE: 5,
    ORDER_ID: 6,
    PAYER_ADDRESS: 7,
    PAYMENT_TYPE: 8,
    PAY_ID: 9,
    TXNTYPE: 10,
    HASH: 11,
  };
  try {
    const body = await req.json();
    const { orderId, payerAddress, amount, custEmail, custPhone } = body;
    if (!orderId || !payerAddress || !amount || !custEmail || !custPhone) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const PAY_ID = process.env.PAY10_PAY_ID;
    const SECRET = process.env.PAY10_SALT;
    const ENC_KEY = process.env.PAY10_ENCRYPTION_KEY;
    const URL = process.env.PAY10_VPA_VALIDATE_URL;

    if (!PAY_ID || !SECRET || !ENC_KEY || !URL) {
      return NextResponse.json(
        { error: "server misconfigured" },
        { status: 500 }
      );
    }

    const params = {
      PAY_ID,
      ORDER_ID: orderId,
      AMOUNT: String(amount),
      CURRENCY_CODE: "356",
      TXNTYPE: "SALE",
      MOP_TYPE: "UP",
      PAYMENT_TYPE: "UP",
      CUST_EMAIL: custEmail,
      CUST_PHONE: custPhone,
      PAYER_ADDRESS: payerAddress,
    };

    const hashInput = buildHashString(params, SECRET, priority);
    const HASH = sha256(hashInput);
    const plain = Object.entries({ ...params, HASH })
      .map(([k, v]) => `${k}=${v}`)
      .join("~");
    const ENCDATA = encryptAES(plain, ENC_KEY);

    // log outbound
    await prisma.paymentAttempt.create({
      data: {
        direction: "outbound",
        endpoint: URL,
        statusCode: null,
        request: mask(params),
        response: null,
        note: "vpa-validate",
      },
    });

    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ PAY_ID, ENCDATA }),
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      json = null;
    }

    // log inbound
    await prisma.paymentAttempt.create({
      data: {
        direction: "inbound",
        endpoint: URL,
        statusCode: res.status,
        request: mask(params),
        response: json || { raw: text },
        note: "vpa-validate-response",
      },
    });

    if (!json || !json.ENCDATA) {
      return NextResponse.json(
        { error: "invalid upstream response" },
        { status: 502 }
      );
    }

    const decrypted = decryptAES(json.ENCDATA, ENC_KEY);
    const parsed = parseTildePlaintext(decrypted);
    const respHash = parsed.HASH;
    if (!respHash)
      return NextResponse.json(
        { error: "no hash in response" },
        { status: 502 }
      );
    const recompute = buildHashString(
      Object.fromEntries(Object.entries(parsed).filter(([k]) => k !== "HASH")),
      SECRET
    );
    return NextResponse.json({
      ok: true,
      data: parsed,
      status: parsed.RESPONSE_CODE,
    });
  } catch (err) {
    console.error("vpa validate error", err);
    return NextResponse.json({ ok: false, data: err });
  }
}
