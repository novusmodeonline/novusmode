// app/api/pay10/upi/dqr/route.js
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
  if (o.CUST_PHONE)
    o.CUST_PHONE = ("" + o.CUST_PHONE).replace(/(.{3}).+(.{3})/, "$1****$2");
  return o;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId, amount, email, phone } = body;
    if (!orderId || !amount || !email || !phone) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const PAY_ID = process.env.PAY10_PAY_ID;
    const SECRET = process.env.PAY10_SALT;
    const ENC_KEY = process.env.PAY10_ENCRYPTION_KEY;
    const URL = process.env.PAY10_UPI_COLLECT_URL;
    if (!PAY_ID || !SECRET || !ENC_KEY || !URL) {
      return NextResponse.json(
        { error: "server misconfigured" },
        { status: 500 }
      );
    }
    // upsert order & payment
    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: { amount, status: "initiated" },
      create: { orderId, method: "UPI", status: "initiated", amount },
    });

    const params = {
      PAY_ID,
      ORDER_ID: orderId,
      AMOUNT: String(amount),
      CURRENCY_CODE: "356",
      TXNTYPE: "SALE",
      MOP_TYPE: "QR",
      PAYMENT_TYPE: "QR",
      CUST_EMAIL: email,
      CUST_PHONE: phone,
      UPI_INTENT: "1",
    };

    const hashInput = buildHashString(params, SECRET);
    const HASH = sha256(hashInput);
    const plain = buildHashString({ ...params, HASH });
    const ENCDATA = encryptAES(plain, ENC_KEY);

    // log outbound attempt
    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        direction: "outbound",
        endpoint: URL,
        statusCode: null,
        request: mask(params),
        response: null,
        note: "dqr-req",
      },
    });

    // call Pay10
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ PAY_ID, ENCDATA }),
    });

    const txt = await res.text();
    let json;
    try {
      json = JSON.parse(txt);
    } catch (e) {
      json = null;
    }

    // log inbound
    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        direction: "inbound",
        endpoint: URL,
        statusCode: res.status,
        request: mask(params),
        response: json || { raw: txt },
        note: "dqr-response",
      },
    });

    if (!json || !json.ENCDATA) {
      return NextResponse.json(
        { error: "no ENCDATA in upstream response", raw: json || txt },
        { status: 502 }
      );
    }
    const decrypted = decryptAES(json.ENCDATA, ENC_KEY);
    const parsed = parseTildePlaintext(decrypted);
    const respHash = parsed.HASH;
    if (!respHash)
      return NextResponse.json({ error: "no hash in response", status: 502 });

    const recompute = buildHashString(
      Object.fromEntries(Object.entries(parsed).filter(([k]) => k !== "HASH")),
      SECRET
    );

    const expected = sha256(recompute);
    if (!safeCompare(expected, respHash))
      return NextResponse.json({ error: "HASH_MISMATCH" }, { status: 400 });

    // update payment with qrString if present
    await prisma.payment.update({
      where: { orderId },
      data: {
        qrString: parsed.QRSTRING || null,
        gatewayId: parsed.TXN_ID || null,
        rawResponse: parsed,
      },
    });

    return NextResponse.json({
      ok: true,
      statusCode: parsed.RESPONSE_CODE,
      qrString: parsed.QRSTRING || null,
      qrImage: parsed.QRIMAGE || null,
      raw: parsed,
    });
  } catch (err) {
    console.error("dqr error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
