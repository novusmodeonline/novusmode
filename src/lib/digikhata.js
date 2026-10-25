// src/lib/digikhata.js

const DEFAULT_BASE_URL = "https://connect.digikhata.in/dgkupi/";
const DEFAULT_MERCHANT_ID = "134977";
const DEFAULT_IDENTIFICATION_CODE = "OIN962GLOBAL";
const DEFAULT_AUTH_KEY = "xRiSFmahmhveqDd5P05Z62tuxABhYd";
const DEFAULT_INTERFACE_KEY = "XNfrAqMRK9kcDsv#kvHOefPJmZEoKw";
const DEFAULT_CALLBACK_URL =
  "https://api.cowpay.co/callback/pay/cowpayinrdigikhatatwo";

export function getDigiKhataConfig() {
  const baseUrl = (
    process.env.DIGIKHATA_BASE_URL ||
    process.env.UPI_API_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");

  return {
    baseUrl,
    merchantId: process.env.DIGIKHATA_MERCHANT_ID || DEFAULT_MERCHANT_ID,
    identificationCode:
      process.env.DIGIKHATA_IDENTIFICATION_CODE || DEFAULT_IDENTIFICATION_CODE,
    authKey: process.env.DIGIKHATA_AUTH_KEY || DEFAULT_AUTH_KEY,
    interfaceKey: process.env.DIGIKHATA_INTERFACE_KEY || DEFAULT_INTERFACE_KEY,
    callbackUrl:
      process.env.DIGIKHATA_CALLBACK_URL ||
      process.env.UPI_CALLBACK_URL ||
      DEFAULT_CALLBACK_URL,
  };
}

export function getDigiKhataHeaders() {
  const config = getDigiKhataConfig();
  return {
    "Content-Type": "application/json",
    MerchantID: config.merchantId,
    IdentificationCode: config.identificationCode,
    MerchantIdentificationCode: config.identificationCode,
    AuthKey: config.authKey,
    InterfaceKey: config.interfaceKey,
    CallBackURL: config.callbackUrl,
  };
}

/**
 * Clean order ID to contain only alphanumeric characters as per DigiKhata requirement
 */
export function sanitizeDigiKhataOrderId(orderId) {
  return String(orderId || "").replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Generate a Dynamic QR Code from DigiKhata UPI PG
 */
export async function generateDynamicQR({
  orderId,
  amount,
  remarks = "Payment",
  expiryMinutes = 5,
  ipAddress = "103.216.209.250",
}) {
  const config = getDigiKhataConfig();
  const headers = getDigiKhataHeaders();
  const cleanOrderId = sanitizeDigiKhataOrderId(orderId);

  const endpoint = `${config.baseUrl}/upi/generatedynamicqr`;

  const payload = {
    OrderId: cleanOrderId,
    Remarks: String(remarks).slice(0, 50),
    CollectExpiryAfter: String(expiryMinutes),
    Amount: String(Math.round(Number(amount))),
    CallBackURL: config.callbackUrl,
    CallBackUrl: config.callbackUrl,
    callbackUrl: config.callbackUrl,
    Latitude: "19.181970",
    Longitude: "72.872060",
    Location: "400097",
    IPAddress: ipAddress || "103.216.209.250",
    DeviceSerial: "Chrome",
    DeviceOS: "Windows",
    AppTechName: "com.digikhata.in",
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
      endpoint,
      payload,
    };
  } catch (error) {
    return {
      status: 500,
      ok: false,
      error: error.message,
      endpoint,
      payload,
    };
  }
}

/**
 * Check transaction status from DigiKhata
 * Uses getAllTransactionStatusv2 for polling
 */
export async function checkDigiKhataStatus(orderId) {
  const config = getDigiKhataConfig();
  const headers = getDigiKhataHeaders();
  const cleanOrderId = sanitizeDigiKhataOrderId(orderId);

  const endpoint = `${config.baseUrl}/upi/getAllTransactionStatusv2?refId=${cleanOrderId}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
      endpoint,
    };
  } catch (error) {
    return {
      status: 500,
      ok: false,
      error: error.message,
      endpoint,
    };
  }
}
