/**
 * SabPaisa Transaction Enquiry Utility
 *
 * Encrypts the enquiry payload with AES-128-CBC and calls the
 * SabPaisa verifyPayment endpoint to fetch the current status of
 * a transaction by its clientTxnId.
 */

import { webcrypto } from "crypto";
import { decryptSabPaisaResponse } from "@/lib/sabpaisa-crypto";

function resolveEnquiryUrl() {
  const env = String(process.env.NEXT_PUBLIC_SABPAISA_ENV || "stag")
    .trim()
    .toLowerCase();

  if (env === "prod") {
    return "https://txnenquiry.sabpaisa.in/SPTxtnEnquiry/getTxnStatusByClientxnId";
  }

  // staging / uat / dev — all use the staging enquiry host
  return "https://stage-txnenquiry.sabpaisa.in/SPTxtnEnquiry/getTxnStatusByClientxnId";
}

function base64ToBytes(base64Value) {
  return new Uint8Array(Buffer.from(base64Value, "base64"));
}

function concatBytes(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function bytesToUpperHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function encryptSabPaisa(authKeyBase64, authIvBase64, rawString) {
  const aesKey = base64ToBytes(authKeyBase64);
  const hmacKey = base64ToBytes(authIvBase64);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));

  const aesCryptoKey = await webcrypto.subtle.importKey(
    "raw",
    aesKey,
    "AES-GCM",
    false,
    ["encrypt"],
  );

  const encrypted = await webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    aesCryptoKey,
    new TextEncoder().encode(rawString),
  );

  const ivPlusCipher = concatBytes(iv, new Uint8Array(encrypted));

  const hmacCryptoKey = await webcrypto.subtle.importKey(
    "raw",
    hmacKey,
    { name: "HMAC", hash: "SHA-384" },
    false,
    ["sign"],
  );

  const signature = await webcrypto.subtle.sign(
    "HMAC",
    hmacCryptoKey,
    ivPlusCipher,
  );

  const finalPayload = concatBytes(new Uint8Array(signature), ivPlusCipher);
  return bytesToUpperHex(finalPayload);
}

/**
 * Check SabPaisa payment status via the Transaction Enquiry API.
 *
 * @param {string} clientTxnId  - The order/transaction ID used at initiation.
 * @returns {Promise<{ statusCode: string, raw: object, encData: string }>}
 */
export async function checkSabPaisaStatus(clientTxnId) {
  if (!clientTxnId) {
    throw new Error("clientTxnId is required for SabPaisa enquiry");
  }

  const authKey = process.env.SABPAISA_AUTH_KEY;
  const authIv = process.env.SABPAISA_AUTH_IV;
  const clientCode =
    process.env.SABPAISA_CLIENT_CODE ||
    process.env.NEXT_PUBLIC_SABPAISA_CLIENT_CODE;

  if (!clientCode) {
    throw new Error("SABPAISA_CLIENT_CODE is not configured");
  }

  if (!authKey || !authIv) {
    throw new Error("SabPaisa auth key/iv are not configured");
  }

  // Docs sample: "clientCode=DJ020&clientTxnId=TESTING090725110510177"
  const rawString = `clientCode=${clientCode}&clientTxnId=${clientTxnId}`;

  // console.log("[SabPaisa][Enquiry] rawString (pre-encrypt):", rawString);

  const statusTransEncData = await encryptSabPaisa(authKey, authIv, rawString);

  // console.log(
  //   "[SabPaisa][Enquiry] statusTransEncData (HEX):",
  //   statusTransEncData,
  // );

  const enquiryUrl = resolveEnquiryUrl();
  // console.log("[SabPaisa][Enquiry] endpoint:", enquiryUrl);

  // Docs: Content-Type: application/json, body fields: clientCode + statusTransEncData
  const response = await fetch(enquiryUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ clientCode, statusTransEncData }),
    cache: "no-store",
  });
  // console.log("[SabPaisa][Enquiry] HTTP response status:", response);
  if (!response.ok) {
    throw new Error(
      `SabPaisa enquiry HTTP error: ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();
  // console.log("[SabPaisa][Enquiry] raw JSON response:", json);

  // Docs: response field is "statusResponseData"
  const encResponse =
    json?.statusResponseData ||
    json?.statusresponsedata ||
    json?.encResponse ||
    json?.encresponse ||
    json?.data;

  if (!encResponse || typeof encResponse !== "string") {
    throw new Error("SabPaisa enquiry returned no encrypted payload");
  }

  const parsed = decryptSabPaisaResponse(encResponse);

  // console.log("[SabPaisa][Enquiry] decrypted payload:", parsed);

  return {
    statusCode: String(
      parsed?.statusCode || parsed?.responseCode || parsed?.status || "",
    ),
    raw: parsed,
    encData: statusTransEncData,
  };
}
