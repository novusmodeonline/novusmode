// app/api/pay10/upi/collect/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildHashString, sha256, encryptAES } from "@/lib/pay10/crypto";

function mask(obj = {}) {
  const o = { ...obj };
  if (o.PAYER_ADDRESS)
    o.PAYER_ADDRESS = ("" + o.PAYER_ADDRESS).replace(/^(.).+(@.+)$/, "$1***$2");
  if (o.CUST_PHONE)
    o.CUST_PHONE = ("" + o.CUST_PHONE).replace(/(.{3}).+(.{3})/, "$1****$2");
  return o;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId, amount, payerAddress, custEmail, custPhone } = body;
    if (!orderId || !amount || !custEmail || !custPhone) {
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

    // ensure order/payment
    await prisma.order.upsert({
      where: { id: orderId },
      update: { amount },
      create: {
        id: orderId,
        amount,
        status: "pending",
        contact: { email: custEmail, phone: custPhone },
        address: {},
      },
    });
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
      MOP_TYPE: "UP",
      PAYMENT_TYPE: "UP",
      CUST_EMAIL: custEmail,
      CUST_PHONE: custPhone,
      PAYER_ADDRESS: payerAddress,
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
        note: "collect-req",
      },
    });

    return NextResponse.json({ PAY_ID, ENCDATA, POST_TO: URL });
  } catch (err) {
    console.error("collect error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
