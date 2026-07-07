import { NextResponse } from "next/server";

import { PAYPOINT_BASE_URL, getPaypointHeaders } from "@/config/paypoint";
import prisma from "@/lib/prisma";

function getDeviceMetadata() {
  return {
    Latitude: "28.5799",
    Longitude: "77.3299",
    Location: "Noida",
    IPAddress: "42.108.29.7",
    DeviceSerial: "ABCXYZ",
    DeviceOS: "Android 16",
    AppTechName: "com.novusmode.in",
  };
}

function getErrorMessage(payload, fallback) {
  const candidate =
    payload?.message || payload?.error || payload?.responseMessage;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }

  return fallback;
}

function extractOrderId(payload) {
  const data = payload?.data;

  if (Array.isArray(data)) {
    const firstEntry = data[0];
    if (firstEntry?.Value) return String(firstEntry.Value).trim();
    if (firstEntry?.value) return String(firstEntry.value).trim();
  }

  if (data?.Value) return String(data.Value).trim();
  if (data?.value) return String(data.value).trim();
  if (payload?.OrderId) return String(payload.OrderId).trim();
  if (payload?.orderId) return String(payload.orderId).trim();

  return null;
}

function extractQrCodeImage(payload) {
  const data = payload?.data;

  if (typeof data === "string") return data;

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item?.qrCodeImage === "string") return item.qrCodeImage;
      if (typeof item?.qrCode === "string") return item.qrCode;
      if (typeof item?.imageBase64 === "string") return item.imageBase64;
      if (typeof item?.base64 === "string") return item.base64;
      if (typeof item?.Value === "string") return item.Value;
    }
  }

  if (data && typeof data === "object") {
    const direct =
      data.qrCodeImage ||
      data.qrCode ||
      data.imageBase64 ||
      data.base64 ||
      data.value;

    if (typeof direct === "string") return direct;
  }

  return null;
}

function maskPaypointHeaders(headers) {
  return {
    ...headers,
    AuthKey: headers?.AuthKey ? "***MASKED***" : headers?.AuthKey,
    InterfaceKey: headers?.InterfaceKey
      ? "***MASKED***"
      : headers?.InterfaceKey,
  };
}

async function fetchPaypointJson(label, url, options, payload) {
  const startedAt = Date.now();

  console.log(`[${label}] Request URL:`, url);
  console.log(`[${label}] HTTP Method:`, options.method);
  console.log(
    `[${label}] Outbound Headers:`,
    maskPaypointHeaders(options.headers),
  );
  console.log(`[${label}] JSON Payload:`, JSON.stringify(payload));

  try {
    const response = await fetch(url, options);
    const rawText = await response.text();
    let parsedJson = null;

    console.log(`[${label}] HTTP Status:`, response.status);
    console.log(
      `[${label}] Response Content-Type:`,
      response.headers.get("content-type"),
    );
    console.log(`[${label}] Raw Response Body:`, rawText);

    try {
      parsedJson = JSON.parse(rawText);
      console.log(`[${label}] Parsed JSON:`, parsedJson);
    } catch (error) {
      console.error(
        `[${label}] Failed to parse response as JSON. Raw body:`,
        rawText,
      );
    }

    console.log(`[${label}] Request Duration Ms:`, Date.now() - startedAt);

    return { response, parsedJson };
  } catch (error) {
    console.error(`[${label}] Fetch/Network Exception:`, error);
    console.log(`[${label}] Request Duration Ms:`, Date.now() - startedAt);
    throw error;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const amount = body?.amount;
    const name = body?.name;
    const mobileNo = body?.mobileNo;
    const receipt = body?.receipt;

    if (!amount || !name || !mobileNo || !receipt) {
      return NextResponse.json(
        {
          ok: false,
          error: "amount, name, mobileNo, and receipt are required",
        },
        { status: 400 },
      );
    }
    const metadata = getDeviceMetadata();
    const remarks = receipt;

    const stepOnePayload = {
      receipt,
      amount: String(amount),
      name,
      mobileNo,
      Remarks: remarks,
      Latitude: metadata.Latitude,
      Longitude: metadata.Longitude,
      Location: metadata.Location,
      IPAddress: metadata.IPAddress,
    };

    const stepOneUrl = `${PAYPOINT_BASE_URL}/upi/getOrderId`;
    const stepOneHeaders = getPaypointHeaders();
    console.log("[PayPointInitiate] stepOneHeaders:", stepOneHeaders);
    const stepOneOptions = {
      method: "POST",
      headers: stepOneHeaders,
      body: JSON.stringify(stepOnePayload),
    };
    const { response: stepOneResponse, parsedJson: stepOneJson } =
      await fetchPaypointJson(
        "PayPoint getOrderId",
        stepOneUrl,
        stepOneOptions,
        stepOnePayload,
      );

    console.log("[PayPointInitiate] stepOneJson:", stepOneResponse);
    if (!stepOneResponse.ok || stepOneJson?.resultCode !== "000") {
      return NextResponse.json(
        {
          ok: false,
          error: getErrorMessage(
            stepOneJson,
            "Failed to generate PayPoint order ID",
          ),
        },
        { status: stepOneResponse.ok ? 502 : stepOneResponse.status },
      );
    }
    console.log("[PayPointInitiate] stepOneJson:", stepOneJson);
    const orderId = extractOrderId(stepOneJson);
    console.log("[PayPointInitiate] orderId:", orderId);
    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          error: "PayPoint did not return a valid OrderId",
        },
        { status: 502 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: receipt },
      select: {
        id: true,
        amount: true,
        finalAmount: true,
        shippingAmount: true,
      },
    });

    if (!order) {
      console.error("[PayPointInitiate] order not found for receipt:", receipt);
      return NextResponse.json(
        {
          ok: false,
          error: "Order not found for PayPoint payment",
        },
        { status: 404 },
      );
    }

    const paymentAmount =
      order.finalAmount == null
        ? order.amount
        : order.finalAmount + (order.shippingAmount || 0);

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        method: "upi_qr",
        mode: "paypoint",
        status: "pending",
        amount: paymentAmount,
        gatewayOrderId: orderId,
        responseCode: stepOneJson.resultCode,
        responseMessage:
          stepOneJson.resultMessage || "PayPoint order ID generated",
        rawResponse: stepOneJson,
      },
      create: {
        orderId: order.id,
        method: "upi_qr",
        mode: "paypoint",
        status: "pending",
        amount: paymentAmount,
        gatewayOrderId: orderId,
        responseCode: stepOneJson.resultCode,
        responseMessage:
          stepOneJson.resultMessage || "PayPoint order ID generated",
        rawResponse: stepOneJson,
      },
    });

    console.log("[PayPointInitiate] payment initialized:", {
      paymentId: payment.id,
      orderId: payment.orderId,
      gatewayOrderId: payment.gatewayOrderId,
      status: payment.status,
    });

    const stepTwoPayload = {
      OrderId: orderId,
      Remarks: remarks,
      CollectExpiryAfter: 5,
      Amount: Number(amount),
      ...metadata,
    };

    const stepTwoUrl = `${PAYPOINT_BASE_URL}/upi/generatedynamicqr`;
    const stepTwoHeaders = getPaypointHeaders();
    const stepTwoOptions = {
      method: "POST",
      headers: stepTwoHeaders,
      body: JSON.stringify(stepTwoPayload),
    };
    const { response: stepTwoResponse, parsedJson: stepTwoJson } =
      await fetchPaypointJson(
        "PayPoint generatedynamicqr",
        stepTwoUrl,
        stepTwoOptions,
        stepTwoPayload,
      );

    if (!stepTwoResponse.ok || stepTwoJson?.resultCode !== "000") {
      return NextResponse.json(
        {
          ok: false,
          error: getErrorMessage(
            stepTwoJson,
            "Failed to generate PayPoint QR code",
          ),
        },
        { status: stepTwoResponse.ok ? 502 : stepTwoResponse.status },
      );
    }

    const qrCodeImage = extractQrCodeImage(stepTwoJson);
    if (!qrCodeImage) {
      return NextResponse.json(
        {
          ok: false,
          error: "PayPoint did not return a QR code image",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      orderId,
      qrCodeImage,
    });
  } catch (error) {
    console.error("[PayPointInitiate] error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to initialize PayPoint payment",
      },
      { status: 500 },
    );
  }
}
