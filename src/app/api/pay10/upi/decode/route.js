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
    const { PAY_ID, ENCDATA } = await req.json();
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
    console.log("Decrypted - ", json);
    const decrypted = decryptAES(json.ENCDATA, ENC_KEY);
    const parsed = parseTildePlaintext(decrypted);
    const orderId = parsed.ORDER_ID;
    /* ---------------------------------- */
    /* VERIFY HASH */
    /* ---------------------------------- */
    const respHash = parsed.HASH;
    const recompute = buildHashString(
      Object.fromEntries(Object.entries(parsed).filter(([k]) => k !== "HASH")),
      SECRET
    );
    console.log("Recomputed : ", recompute);
    const expected = sha256(recompute);
    if (!safeCompare(expected, respHash)) {
      console.error("HASH MISMATCH ON INITIATE", parsed);
      return NextResponse.json(
        { error: "HASH_MISMATCH", raw: parsed },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      orderId,
      qrString: parsed.QRSTRING || null,
      status: parsed.STATUS || "initiated",
      raw: parsed,
    });
  } catch (err) {
    console.error("initiate error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
