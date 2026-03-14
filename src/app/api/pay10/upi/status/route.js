// app/api/pay10/upi/status/route.js
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

export async function POST(req) {
  try {
    const { orderId, txnId } = await req.json();

    if (!orderId && !txnId)
      return NextResponse.json(
        { error: "orderId_or_txnId_required" },
        { status: 400 }
      );

    const PAY_ID = process.env.PAY10_PAY_ID;
    const SECRET = process.env.PAY10_SALT;
    const ENC_KEY = process.env.PAY10_ENCRYPTION_KEY;
    const URL = process.env.PAY10_STATUS_URL;

    if (!PAY_ID || !SECRET || !ENC_KEY || !URL)
      return NextResponse.json(
        { error: "server_misconfigured" },
        { status: 500 }
      );

    const params = { PAY_ID };
    if (orderId) params.ORDER_ID = orderId;
    if (txnId) params.TXN_ID = txnId;

    // hash
    const hashInput = buildHashString(params, SECRET);
    const HASH = sha256(hashInput);

    const plain = Object.entries({ ...params, HASH })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("~");

    const ENCDATA = encryptAES(plain);

    // send request
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ PAY_ID, ENCDATA }),
    });

    const txt = await res.text();
    let json = null;

    try {
      json = JSON.parse(txt);
    } catch (e) {
      json = null;
    }

    if (!json || !json.ENCDATA) {
      return NextResponse.json(
        { error: "invalid_upstream", raw: txt },
        { status: 502 }
      );
    }

    const decrypted = decryptAES(json.ENCDATA);
    const parsed = parseTildePlaintext(decrypted);

    const respHash = parsed.HASH;
    if (!respHash)
      return NextResponse.json(
        { error: "NO_HASH_IN_RESPONSE" },
        { status: 400 }
      );

    // recompute hash
    const hashStr = buildHashString(
      Object.fromEntries(Object.entries(parsed).filter(([k]) => k !== "HASH")),
      SECRET
    );
    const expected = sha256(hashStr);

    if (!safeCompare(expected, respHash))
      return NextResponse.json({ error: "HASH_MISMATCH" }, { status: 400 });

    // update payment
    if (parsed.ORDER_ID) {
      const payment = await prisma.payment.findUnique({
        where: { orderId: parsed.ORDER_ID },
      });

      if (payment) {
        const newStatus =
          parsed.RESPONSE_CODE === "000" &&
          (parsed.STATUS === "Captured" || parsed.STATUS === "Success")
            ? "success"
            : parsed.RESPONSE_CODE === "000" && parsed.STATUS === "Sent to Bank"
            ? "pending"
            : "failed";

        await prisma.payment.update({
          where: { orderId: parsed.ORDER_ID },
          data: {
            status: newStatus,
            gatewayId: parsed.TXN_ID || payment.gatewayId,
            responseCode: parsed.RESPONSE_CODE,
            responseMessage: parsed.PG_TXN_MESSAGE || parsed.RESPONSE_MESSAGE,
            rawResponse: parsed,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, data: parsed });
  } catch (err) {
    console.error("status error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
