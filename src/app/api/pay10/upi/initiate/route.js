// app/api/pay10/upi/initiate/route.js
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

import { detectPaymentMethod } from "@/helper/common";

function mask(obj = {}) {
  const o = { ...obj };
  if (o.ENCDATA) o.ENCDATA = "<redacted>";
  if (o.HASH) o.HASH = "<redacted>";
  if (o.CARD_NUMBER) o.CARD_NUMBER = "<redacted>";
  return o;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      orderId,
      amount, // integer paisa
      mopType = "UP",
      paymentType = "UP",
      custEmail,
      custPhone,
      payerAddress,
      upiIntent = 1, // "1" for intent/DQR
    } = body;

    if (!orderId || !amount || !custEmail || !custPhone) {
      return NextResponse.json(
        { error: "missing required fields" },
        { status: 400 }
      );
    }

    const PAY_ID = process.env.PAY10_PAY_ID;
    const SECRET = process.env.PAY10_SALT;
    const ENC_KEY = process.env.PAY10_ENCRYPTION_KEY;
    const POST_TO =
      process.env.PAY10_UPI_COLLECT_URL || process.env.PAY10_PAYMENT_URL;

    if (!PAY_ID || !SECRET || !ENC_KEY) {
      return NextResponse.json(
        { error: "server misconfigured" },
        { status: 500 }
      );
    }
    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: { amount, status: "initiated" },
      create: {
        orderId,
        method: "UPI",
        status: "initiated",
        amount,
      },
    });
    // upsert order & payment
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "pending",
        paymentId: payment.id,
      },
    });
    // Build params
    const params = {
      PAY_ID,
      ORDER_ID: orderId,
      AMOUNT: String(amount),
      CURRENCY_CODE: "356",
      TXNTYPE: "SALE",
      MOP_TYPE: String(mopType),
      PAYMENT_TYPE: String(paymentType),
      CUST_EMAIL: String(custEmail),
      CUST_PHONE: String(custPhone),
      UPI_INTENT: upiIntent,
    };
    if (payerAddress) params.PAYER_ADDRESS = String(payerAddress);
    if (upiIntent) params.UPI_INTENT = String(upiIntent);

    // hash
    const hashInput = buildHashString(params, SECRET);
    const HASH = sha256(hashInput);
    // plaintext and encrypt
    const plain = Object.entries({ ...params, HASH })
      .map(([k, v]) => `${k}=${v}`)
      .sort(([a], [b]) => {
        if (a.startsWith(b)) return -1;
        // If 'b' starts with 'a' (e.g. b="ABCDE", a="ABC"), 'b' comes first
        if (b.startsWith(a)) return 1;
        // Otherwise alphabetical fallback
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      })
      .join("~");
    const ENCDATA = encryptAES(plain, ENC_KEY);

    // log outbound attempt
    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        direction: "outbound",
        endpoint: POST_TO,
        statusCode: null,
        request: mask(params),
        response: null,
        note: "initiate",
      },
    });

    const response = await fetch(POST_TO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ PAY_ID, ENCDATA }),
    });

    const raw = await response.text();
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      json = { raw };
    }

    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        direction: "inbound",
        endpoint: POST_TO,
        statusCode: response.status,
        response: json,
        note: "upi-initiate-response",
      },
    });

    if (!json?.ENCDATA) {
      return NextResponse.json(
        { error: "Invalid Pay10 response", raw: json },
        { status: 502 }
      );
    }

    /* ---------------------------------- */
    /* DECRYPT RESPONSE */
    /* ---------------------------------- */
    const decrypted = decryptAES(json.ENCDATA, ENC_KEY);
    const parsed = parseTildePlaintext(decrypted);

    /* ---------------------------------- */
    /* VERIFY HASH */
    /* ---------------------------------- */
    const respHash = parsed.HASH;
    const recompute = buildHashString(
      Object.fromEntries(Object.entries(parsed).filter(([k]) => k !== "HASH")),
      SECRET
    );
    const expected = sha256(recompute);
    if (!safeCompare(expected, respHash)) {
      console.error("HASH MISMATCH ON INITIATE", parsed);
      return NextResponse.json(
        { error: "HASH_MISMATCH", raw: parsed },
        { status: 400 }
      );
    }

    /* ---------------------------------- */
    /* UPDATE PAYMENT WITH GATEWAY DATA */
    /* ---------------------------------- */
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayId: parsed.TXN_ID || null,
        pgRefNum: parsed.PG_REF_NUM || null,
        payerName: parsed.PAYER_NAME || null,
        payerAddress: parsed.PAYER_ADDRESS || null,
        qrString: parsed.QRSTRING || null,
        responseCode: parsed.RESPONSE_CODE || null,
        responseMessage:
          parsed.PG_TXN_MESSAGE || parsed.RESPONSE_MESSAGE || null,
        rawResponse: parsed,
      },
    });
    return NextResponse.json({
      success: true,
      orderId,
      paymentId: payment.id,
      qrString: parsed.QRSTRING || null,
      status: parsed.STATUS || "initiated",
      raw: parsed,
    });
  } catch (err) {
    console.error("initiate error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
