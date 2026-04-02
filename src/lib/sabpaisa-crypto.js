import crypto from "crypto";

function uniqueBuffers(buffers) {
  const seen = new Set();
  const out = [];

  for (const item of buffers) {
    if (!item || item.length === 0) continue;
    const key = item.toString("hex");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function parseSecretCandidates(value, label) {
  if (!value) {
    throw new Error(`${label} is not configured`);
  }

  const candidates = [Buffer.from(value, "utf8")];

  try {
    candidates.push(Buffer.from(value, "base64"));
  } catch {
    // Ignore invalid base64 attempt
  }

  if (/^[0-9A-Fa-f]+$/.test(value) && value.length % 2 === 0) {
    candidates.push(Buffer.from(value, "hex"));
  }

  return uniqueBuffers(candidates);
}

function buildAesKeyCandidates(secretCandidates) {
  const out = [];

  for (const candidate of secretCandidates) {
    if (
      candidate.length === 16 ||
      candidate.length === 24 ||
      candidate.length === 32
    ) {
      out.push(candidate);
    }

    if (candidate.length > 32) {
      out.push(candidate.subarray(0, 32));
    }
    if (candidate.length > 24) {
      out.push(candidate.subarray(0, 24));
    }
    if (candidate.length > 16) {
      out.push(candidate.subarray(0, 16));
    }
  }

  return uniqueBuffers(out).filter(
    (buf) => buf.length === 16 || buf.length === 24 || buf.length === 32,
  );
}

function buildIvCandidates(secretCandidates) {
  const out = [];

  for (const candidate of secretCandidates) {
    if (candidate.length === 16) {
      out.push(candidate);
      continue;
    }

    if (candidate.length > 16) {
      out.push(candidate.subarray(0, 16));
      out.push(candidate.subarray(candidate.length - 16));
    }
  }

  return uniqueBuffers(out).filter((buf) => buf.length === 16);
}

function getAesAlgorithmForKey(keyBuffer) {
  if (keyBuffer.length === 16) return "aes-128-cbc";
  if (keyBuffer.length === 24) return "aes-192-cbc";
  if (keyBuffer.length === 32) return "aes-256-cbc";
  return null;
}

function requireSabPaisaConfig() {
  const key = process.env.SABPAISA_AUTH_KEY;
  const iv = process.env.SABPAISA_AUTH_IV;

  if (!key || !iv) {
    throw new Error("SabPaisa crypto keys are not configured");
  }

  const keyCandidates = buildAesKeyCandidates(
    parseSecretCandidates(key, "SABPAISA_AUTH_KEY"),
  );
  const ivSecretCandidates = parseSecretCandidates(iv, "SABPAISA_AUTH_IV");
  const ivCandidates = buildIvCandidates(ivSecretCandidates);

  if (!keyCandidates.length) {
    throw new Error(
      "SABPAISA_AUTH_KEY must provide a valid AES key (16/24/32 bytes)",
    );
  }

  if (!ivCandidates.length) {
    throw new Error("SABPAISA_AUTH_IV must provide a valid 16-byte IV");
  }

  return { keyCandidates, ivCandidates, hmacKeyCandidates: ivSecretCandidates };
}

function normalizeResponsePayload(raw) {
  let out = String(raw || "");

  // Callback values are sometimes encoded more than once.
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(out);
      if (decoded === out) break;
      out = decoded;
    } catch {
      break;
    }
  }

  return out;
}

function normalizeBase64Input(value) {
  // SabPaisa payload may arrive URL-safe or with '+' converted to spaces.
  let out = value.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const remainder = out.length % 4;

  if (remainder) {
    out = out.padEnd(out.length + (4 - remainder), "=");
  }

  return out;
}

function buildCipherTextCandidates(encResponse) {
  const raw = String(encResponse || "").trim();
  const decoded = normalizeResponsePayload(raw).trim();
  const candidates = [raw, decoded];

  // If plus signs were decoded as spaces in query/form parsing, restore them.
  if (decoded.includes(" ")) {
    candidates.push(decoded.replace(/ /g, "+"));
  }

  // Some gateways wrap values with single/double quotes.
  for (const value of [...candidates]) {
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      candidates.push(value.slice(1, -1));
    }
  }

  for (const value of [...candidates]) {
    const trimmed = String(value || "").trim();
    if (!trimmed) continue;

    // If full query-string was passed accidentally, extract encrypted fields.
    if (
      trimmed.includes("=") &&
      (trimmed.includes("&") || trimmed.includes("enc"))
    ) {
      const params = new URLSearchParams(trimmed);
      const embedded =
        params.get("encResponse") ||
        params.get("encresponse") ||
        params.get("encData") ||
        params.get("encdata") ||
        params.get("response");

      if (embedded) {
        candidates.push(String(embedded).trim());
      }
    }

    // If JSON was passed, extract encrypted fields.
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        const embedded =
          parsed?.encResponse ||
          parsed?.encresponse ||
          parsed?.encData ||
          parsed?.encdata ||
          parsed?.response;

        if (typeof embedded === "string" && embedded.trim()) {
          candidates.push(embedded.trim());
        }
      } catch {
        // Ignore invalid JSON candidate
      }
    }
  }

  return [...new Set(candidates.filter(Boolean))];
}

function parseDecryptedPayload(decrypted) {
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

function looksLikePlainSabPaisaPayload(value) {
  if (!value || !value.includes("=") || !value.includes("&")) {
    return false;
  }

  const keys = new URLSearchParams(value);
  return (
    keys.has("statusCode") ||
    keys.has("status_code") ||
    keys.has("responseCode") ||
    keys.has("status") ||
    keys.has("clientTxnId") ||
    keys.has("client_txn_id") ||
    keys.has("clientTxnID") ||
    keys.has("clientTxnid")
  );
}

function buildEncryptedBufferCandidates(cipherTextCandidates) {
  const buffers = [];

  for (const cipherText of cipherTextCandidates) {
    const compactHex = cipherText.replace(/\s+/g, "");

    // 1. Try Hex (SabPaisa's most common format)
    if (/^[0-9A-Fa-f]+$/.test(compactHex) && compactHex.length % 2 === 0) {
      const hexBuffer = Buffer.from(compactHex, "hex");
      if (hexBuffer.length > 0) {
        buffers.push(hexBuffer);
      }
    }

    // 2. Try Base64 (Secondary backup)
    const normalizedBase64 = normalizeBase64Input(cipherText);
    if (/^[A-Za-z0-9+/]*={0,2}$/.test(normalizedBase64)) {
      try {
        const base64Buffer = Buffer.from(normalizedBase64, "base64");
        if (base64Buffer.length > 0) {
          buffers.push(base64Buffer);
        }
      } catch (e) {
        /* ignore */
      }
    }
  }

  return uniqueBuffers(buffers);
}

function looksLikeQueryStringPayload(value) {
  if (!value || !value.includes("=") || !value.includes("&")) {
    return false;
  }

  const params = new URLSearchParams(value);
  return [...params.keys()].length > 1;
}

function tryDecryptSabPaisaGcmPayload(
  encryptedBytes,
  keyCandidates,
  hmacKeyCandidates,
) {
  const SIGNATURE_BYTES = 48; // SHA-384 output length
  const GCM_IV_BYTES = 12;
  const GCM_TAG_BYTES = 16;

  if (encryptedBytes.length <= SIGNATURE_BYTES + GCM_IV_BYTES + GCM_TAG_BYTES) {
    return null;
  }

  const signature = encryptedBytes.subarray(0, SIGNATURE_BYTES);
  const ivAndCipher = encryptedBytes.subarray(SIGNATURE_BYTES);

  let signatureMatched = false;
  for (const hmacKey of hmacKeyCandidates) {
    try {
      const computed = crypto
        .createHmac("sha384", hmacKey)
        .update(ivAndCipher)
        .digest();

      if (computed.length === signature.length) {
        if (crypto.timingSafeEqual(computed, signature)) {
          signatureMatched = true;
          break;
        }
      }
    } catch {
      // Ignore key candidates that are invalid for HMAC
    }
  }

  if (!signatureMatched) {
    return null;
  }

  const iv = ivAndCipher.subarray(0, GCM_IV_BYTES);
  const cipherWithTag = ivAndCipher.subarray(GCM_IV_BYTES);

  if (cipherWithTag.length <= GCM_TAG_BYTES) {
    return null;
  }

  const authTag = cipherWithTag.subarray(cipherWithTag.length - GCM_TAG_BYTES);
  const ciphertext = cipherWithTag.subarray(
    0,
    cipherWithTag.length - GCM_TAG_BYTES,
  );

  for (const key of keyCandidates) {
    let algorithm = null;
    if (key.length === 16) algorithm = "aes-128-gcm";
    if (key.length === 24) algorithm = "aes-192-gcm";
    if (key.length === 32) algorithm = "aes-256-gcm";
    if (!algorithm) continue;

    try {
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      const candidate =
        decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");

      if (looksLikeQueryStringPayload(candidate)) {
        return candidate;
      }
    } catch {
      // Continue trying key candidates
    }
  }

  return null;
}

export function decryptSabPaisaResponse(encResponse) {
  if (!encResponse || typeof encResponse !== "string") {
    throw new Error("Missing encResponse");
  }

  const { keyCandidates, ivCandidates, hmacKeyCandidates } =
    requireSabPaisaConfig();
  const cipherTextCandidates = buildCipherTextCandidates(encResponse);

  for (const candidate of cipherTextCandidates) {
    if (looksLikePlainSabPaisaPayload(candidate)) {
      return parseDecryptedPayload(candidate);
    }
  }

  const encryptedBufferCandidates =
    buildEncryptedBufferCandidates(cipherTextCandidates);

  if (!encryptedBufferCandidates.length) {
    throw new Error(
      "Failed to decrypt SabPaisa response: callback encResponse is not a valid encrypted payload",
    );
  }

  let decrypted;
  let lastError = null;

  for (const encryptedBytes of encryptedBufferCandidates) {
    try {
      const gcmCandidate = tryDecryptSabPaisaGcmPayload(
        encryptedBytes,
        keyCandidates,
        hmacKeyCandidates,
      );
      if (gcmCandidate) {
        decrypted = gcmCandidate;
        break;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (decrypted) {
    return parseDecryptedPayload(decrypted);
  }

  for (const encryptedBytes of encryptedBufferCandidates) {
    if (encryptedBytes.length % 16 !== 0) {
      continue;
    }

    for (const key of keyCandidates) {
      const algorithm = getAesAlgorithmForKey(key);
      if (!algorithm) continue;

      for (const iv of ivCandidates) {
        for (const autoPadding of [true, false]) {
          try {
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            decipher.setAutoPadding(autoPadding);

            let candidate =
              decipher.update(encryptedBytes, undefined, "utf8") +
              decipher.final("utf8");

            if (!autoPadding) {
              // Some gateways return decrypted data with trailing NUL bytes.
              candidate = candidate.replace(/\0+$/g, "").trim();
            }

            if (candidate.includes("=") && candidate.includes("&")) {
              decrypted = candidate;
              lastError = null;
              break;
            }
          } catch (err) {
            lastError = err;
          }
        }

        if (decrypted) break;
      }

      if (decrypted) break;
    }

    if (decrypted) break;
  }

  if (!decrypted) {
    const candidateMeta = cipherTextCandidates
      .map((v) => v.length)
      .slice(0, 5)
      .join(",");
    throw new Error(
      `Failed to decrypt SabPaisa response${lastError ? `: ${lastError.message}` : ""} (candidates=${cipherTextCandidates.length}, candidateLengths=${candidateMeta}, encryptedBuffers=${encryptedBufferCandidates.length})`,
    );
  }

  return parseDecryptedPayload(decrypted);
}
