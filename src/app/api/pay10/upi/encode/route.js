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
const PAY_ID = process.env.PAY10_PAY_ID;
const SECRET = process.env.PAY10_SALT;
const ENC_KEY = process.env.PAY10_ENCRYPTION_KEY;
const POST_TO =
  process.env.PAY10_UPI_COLLECT_URL || process.env.PAY10_PAYMENT_URL;

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
    // const payment = await prisma.payment.upsert({
    //   where: { orderId },
    //   update: { amount, status: "initiated" },
    //   create: {
    //     orderId,
    //     method: "UPI",
    //     status: "initiated",
    //     amount,
    //   },
    // });
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
    const plain = buildHashString({ ...params, HASH });
    const ENCDATA = encryptAES(plain, ENC_KEY);

    return NextResponse.json({
      PAY_ID,
      ENCDATA,
    });
  } catch (err) {
    console.error("initiate error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
