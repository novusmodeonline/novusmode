// app/api/pay10/callback/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sha256, safeCompare, buildHashString } from "@/lib/pay10/crypto";

// Mask helper
function mask(obj = {}) {
  const o = { ...obj };

  if (o.PAYER_ADDRESS)
    o.PAYER_ADDRESS = ("" + o.PAYER_ADDRESS).replace(/^(.).+(@.+)$/, "$1***$2");

  if (o.CUST_PHONE)
    o.CUST_PHONE = ("" + o.CUST_PHONE).replace(/(.{3}).+(.{3})/, "$1****$2");

  if (o.HASH) o.HASH = "<redacted>";

  return o;
}

const detectPaymentMethod = {
  QR: "UPI",
  UP: "UPI",
  CC: "Credit Card",
};

async function forwardToPartner(payload, prismaPaymentId) {
  const url = process.env.FORWARD_CALLBACK_URL;
  const secret = process.env.FORWARD_CALLBACK_SECRET;

  if (!url || !secret) {
    console.warn("⚠️ Forwarding disabled: env missing");
    return;
  }

  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forward-secret": secret,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      // ✅ Log every forward attempt
      await prisma.paymentAttempt.create({
        data: {
          paymentId: prismaPaymentId,
          direction: "outbound",
          endpoint: "partner-callback",
          request: mask(payload),
          response: text,
          statusCode: res.status,
          note: res.ok ? "forwarded successfully" : "partner rejected",
        },
      });

      if (res.ok) return;
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err.message;
    }
  }

  // ✅ Permanent failure log
  await prisma.paymentAttempt.create({
    data: {
      paymentId: prismaPaymentId,
      direction: "outbound",
      endpoint: "partner-callback",
      request: mask(payload),
      response: { error: lastError },
      statusCode: 500,
      note: "forwarding failed after retries",
    },
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    // console.log("📩 RAW CALLBACK RECEIVED:", body);

    const SECRET = process.env.PAY10_SALT;

    if (!SECRET)
      return NextResponse.json(
        { error: "server_misconfigured" },
        { status: 500 }
      );

    // Must include HASH from callback
    const respHash = body.HASH;
    if (!respHash)
      return NextResponse.json({ error: "NO_HASH" }, { status: 400 });

    // Prepare hashInput: sort keys alphabetically except HASH
    const hashParams = { ...body };
    delete hashParams.HASH;

    const sorted = buildHashString(hashParams);

    const hashInputWithSecret = sorted + SECRET;
    const recomputedHash = sha256(hashInputWithSecret);

    // console.log("🔐 PAY10 HASH:", respHash);
    // console.log("🔄 RECOMPUTED:", recomputedHash);

    if (!safeCompare(recomputedHash, respHash)) {
      console.error("❌ HASH MISMATCH", {
        received: respHash,
        expected: recomputedHash,
      });
      return NextResponse.json({ error: "HASH_MISMATCH" }, { status: 400 });
    }

    const orderId = body.ORDER_ID;
    if (!orderId)
      return NextResponse.json({ error: "NO_ORDER_ID" }, { status: 400 });

    let order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      order = await prisma.order.create({
        data: {
          id: orderId,
          userId: process.env.EXTERNAL_USER_ID,
          addressId: process.env.EXTERNAL_ADDRESS_ID,
          amount: Number(body.AMOUNT || 0),
          email: body.CUST_EMAIL || "external@unknown.com",
          phone: body.CUST_PHONE || "0000000000",
          status: "pending",
          source: "external",
          externalRefId: body.ORDER_ID, // or partner order id if different
          paymentMethod: detectPaymentMethod[body.PAYMENT_TYPE] || "MISC",
        },
      });
    }

    // load or create payment entry
    let payment = await prisma.payment.findUnique({ where: { orderId } });
    console.log(
      "detect = ",
      body.PAYMENT_TYPE,
      detectPaymentMethod[body.PAYMENT_TYPE]
    );
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          orderId,
          method: detectPaymentMethod[body.PAYMENT_TYPE] || "MISC",
          status: "pending",
          amount: Number(body.AMOUNT || 0),
          gatewayId: body.TXN_ID || null,
          rawResponse: mask(body),
          webhookVerified: false,
          pgRefNum: body.PG_REF_NUM,
          rrn: body.RRN,
        },
      });
    }

    // Idempotency check
    if (payment.webhookVerified) {
      await prisma.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          direction: "inbound",
          endpoint: "callback",
          request: mask(body),
          response: mask(body),
          statusCode: 200,
          note: "duplicate callback ignored",
        },
      });
      return NextResponse.json({ ok: true });
    }

    // Determine final status
    const finalStatus =
      body.RESPONSE_CODE === "000" &&
      (body.STATUS === "Captured" || body.STATUS === "Success")
        ? "success"
        : body.RESPONSE_CODE === "000" && body.STATUS === "Sent to Bank"
        ? "pending"
        : "failed";
    const updated = await prisma.payment.update({
      where: { orderId },
      data: {
        status: finalStatus,
        gatewayId: body.TXN_ID || null,
        responseCode: body.RESPONSE_CODE,
        responseMessage: body.PG_TXN_MESSAGE || body.RESPONSE_MESSAGE || null,
        payerAddress: body.CARD_MASK || null,
        rawResponse: mask(body),
        webhookVerified: true,
        webhookReceivedAt: new Date(),
      },
    });

    // ✅ Forward verified callback to partner
    forwardToPartner(body, updated.id);

    // Log attempt
    await prisma.paymentAttempt.create({
      data: {
        paymentId: updated.id,
        direction: "inbound",
        endpoint: "callback",
        request: mask(body),
        response: mask(body),
        statusCode: 200,
        note: "callback processed",
      },
    });

    // update main order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: finalStatus === "success" ? "paid" : finalStatus,
        paymentId: updated.id,
        paymentMethod: detectPaymentMethod[body.PAYMENT_TYPE] || "MISC",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ CALLBACK ERROR", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
