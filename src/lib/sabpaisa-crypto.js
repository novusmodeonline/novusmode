import crypto from "crypto";

function requireSabPaisaConfig() {
  const key = process.env.SABPAISA_AUTH_KEY;
  const iv = process.env.SABPAISA_AUTH_IV;

  if (!key || !iv) {
    throw new Error("SabPaisa crypto keys are not configured");
  }

  if (
    Buffer.byteLength(key, "utf8") !== 16 ||
    Buffer.byteLength(iv, "utf8") !== 16
  ) {
    throw new Error(
      "SABPAISA_AUTH_KEY and SABPAISA_AUTH_IV must be 16 bytes each",
    );
  }

  return {
    key: Buffer.from(key, "utf8"),
    iv: Buffer.from(iv, "utf8"),
  };
}

function normalizeResponsePayload(raw) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function decryptSabPaisaResponse(encResponse) {
  if (!encResponse || typeof encResponse !== "string") {
    throw new Error("Missing encResponse");
  }

  const { key, iv } = requireSabPaisaConfig();
  const cipherText = normalizeResponsePayload(encResponse).trim();

  let decrypted;
  try {
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
    decrypted =
      decipher.update(cipherText, "base64", "utf8") + decipher.final("utf8");
  } catch {
    throw new Error("Failed to decrypt SabPaisa response");
  }

  const parsed = new URLSearchParams(decrypted);
  const out = {};

  for (const [keyName, value] of parsed.entries()) {
    out[keyName] = value;
  }

  if (!out.statusCode) {
    out.statusCode = out.status_code || out.responseCode || out.status;
  }

  if (!out.clientTxnId) {
    out.clientTxnId = out.client_txn_id || out.clientTxnID || out.clientTxnid;
  }

  return out;
}
