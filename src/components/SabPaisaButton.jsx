"use client";

import { useMemo } from "react";

function sanitize(value) {
  return String(value || "").trim();
}

function formatSabPaisaTransDate(date = new Date()) {
  const pad = (num) => String(num).padStart(2, "0");

  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function normalizeAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "0.00";
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(2);
}

function resolveSabPaisaEndpoint(env) {
  const normalized = sanitize(env).toLowerCase();

  if (normalized === "uat") {
    return "https://secure.sabpaisa.in/SabPaisa/sabPaisaInit?v=1";
  }

  if (normalized === "prod") {
    return "https://securepay.sabpaisa.in/SabPaisa/sabPaisaInit?v=1";
  }

  return "https://stage-securepay.sabpaisa.in/SabPaisa/sabPaisaInit?v=1";
}

function base64ToBytes(base64Value) {
  const bin = atob(base64Value);
  const out = new Uint8Array(bin.length);

  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }

  return out;
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
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    aesKey,
    "AES-GCM",
    false,
    ["encrypt"],
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    cryptoKey,
    new TextEncoder().encode(rawString),
  );

  const ivPlusCipher = concatBytes(iv, new Uint8Array(encrypted));

  const hmacCryptoKey = await crypto.subtle.importKey(
    "raw",
    hmacKey,
    { name: "HMAC", hash: "SHA-384" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    hmacCryptoKey,
    ivPlusCipher,
  );
  const finalPayload = concatBytes(new Uint8Array(signature), ivPlusCipher);

  return bytesToUpperHex(finalPayload);
}

function submitHiddenForm({ endpoint, encData, clientCode }) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = endpoint;

  const add = (name, value) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };

  add("encData", encData);
  add("clientCode", clientCode);

  document.body.appendChild(form);
  form.submit();
}

function postDebugToServer(debugData) {
  const body = JSON.stringify(debugData);

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function"
  ) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/sabpaisa/debug", blob);
    return;
  }

  fetch("/api/sabpaisa/debug", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // best-effort debug logging only
  });
}

export default function SabPaisaButton({
  payerName,
  payerEmail,
  payerMobile,
  amount,
  clientTxnId,
  orderId,
}) {
  const generatedTxnId = useMemo(
    () => clientTxnId ?? `txn_${Date.now()}`,
    [clientTxnId],
  );

  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/order-callback`;
  const sabPaisaEnv = sanitize(process.env.NEXT_PUBLIC_SABPAISA_ENV || "stag");
  const mcc = sanitize(process.env.NEXT_PUBLIC_SABPAISA_MCC || "");
  const transDate = formatSabPaisaTransDate();
  const amountString = normalizeAmount(amount);

  const payload = {
    clientCode:
      sanitize(process.env.NEXT_PUBLIC_SABPAISA_CLIENT_CODE) ||
      sanitize(process.env.SABPAISA_CLIENT_CODE) ||
      "",
    transUserName:
      sanitize(process.env.NEXT_PUBLIC_SABPAISA_TRANS_USER_NAME) ||
      sanitize(process.env.SABPAISA_TRANS_USER_NAME) ||
      "",
    transUserPassword:
      sanitize(process.env.NEXT_PUBLIC_SABPAISA_TRANS_USER_PASSWORD) ||
      sanitize(process.env.SABPAISA_TRANS_USER_PASSWORD) ||
      "",
    authKey:
      sanitize(process.env.NEXT_PUBLIC_SABPAISA_AUTH_KEY) ||
      sanitize(process.env.SABPAISA_AUTH_KEY) ||
      "",
    authIV:
      sanitize(process.env.NEXT_PUBLIC_SABPAISA_AUTH_IV) ||
      sanitize(process.env.SABPAISA_AUTH_IV) ||
      "",

    payerName,
    payerEmail,
    payerMobile,
    amount: "1",
    clientTxnId: generatedTxnId,
    callbackUrl,
    channelId: "npm",
    transDate,
    mcc,
    env: sabPaisaEnv,
  };

  const hasRequiredConfig =
    payload.clientCode &&
    payload.transUserName &&
    payload.transUserPassword &&
    payload.authKey &&
    payload.authIV;

  const hasSecureCallbackInProd =
    payload.env !== "prod" ||
    (payload.callbackUrl.startsWith("https://") &&
      !payload.callbackUrl.includes("localhost"));

  const handlePay = async () => {
    if (!hasRequiredConfig) {
      // Keep this explicit because missing public env vars are a common setup issue in client-side integrations.
      alert(
        "SabPaisa configuration is missing. Please set NEXT_PUBLIC_SABPAISA_* variables.",
      );
      return;
    }

    if (!hasSecureCallbackInProd) {
      alert(
        "For prod environment, callbackUrl must be a public https domain (not localhost).",
      );
      return;
    }

    const rawPairs = [
      ["payerName", payload.payerName],
      ["payerEmail", payload.payerEmail],
      ["payerMobile", payload.payerMobile],
      ["clientTxnId", payload.clientTxnId],
      ["amount", payload.amount],
      ["clientCode", payload.clientCode],
      ["transUserName", payload.transUserName],
      ["transUserPassword", payload.transUserPassword],
      ["callbackUrl", payload.callbackUrl],
      ["channelId", payload.channelId],
      ["transDate", payload.transDate],
    ];

    if (payload.mcc) {
      rawPairs.push(["mcc", payload.mcc]);
    }

    const rawString = rawPairs
      .map(
        ([key, value]) => `${key}=${encodeURIComponent(String(value || ""))}`,
      )
      .join("&");

    const endpoint = resolveSabPaisaEndpoint(payload.env);
    console.group("[SabPaisa] Payment Request Debug");
    console.log("payload", payload);
    console.log("rawString", rawString);
    console.log("endpoint", endpoint);

    try {
      const encryptedEncData = await encryptSabPaisa(
        payload.authKey,
        payload.authIV,
        rawString,
      );

      console.log("encrypted encData", encryptedEncData);
      console.log("posted clientCode", payload.clientCode);
      console.log("form action", endpoint);

      postDebugToServer({
        source: "SabPaisaButton",
        payload,
        rawString,
        endpoint,
        encryptedEncData,
        postedClientCode: payload.clientCode,
        formAction: endpoint,
        timestamp: new Date().toISOString(),
      });

      submitHiddenForm({
        endpoint,
        encData: encryptedEncData,
        clientCode: payload.clientCode,
      });
    } catch (error) {
      console.error("SabPaisa submit failed", error);
      alert("Unable to start SabPaisa payment. Please try again.");
    } finally {
      console.groupEnd();
    }
  };

  return (
    <button
      type="button"
      onClick={handlePay}
      className="rounded-lg bg-[var(--color-bg)] px-4 py-2 text-sm font-semibold text-white"
    >
      Continue to SabPaisa
    </button>
  );
}
