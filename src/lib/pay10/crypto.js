// lib/pay10/crypto.js
import crypto from "crypto";

/**
 * Build sorted tilde string and append secret
 * returns the string to be hashed (not hashed result)
 */
export function buildHashString(params, secretKey = "") {
  const sorted = Object.entries(params)
    .filter(([k, v]) => v !== undefined && v !== null && String(v) !== "")
    .sort(([a], [b]) => {
      if (a.startsWith(b)) return -1;
      // If 'b' starts with 'a' (e.g. b="ABCDE", a="ABC"), 'b' comes first
      if (b.startsWith(a)) return 1;
      // Otherwise alphabetical fallback
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .map(([k, v]) => `${k}=${v}`)
    .join("~");
  return sorted + secretKey;
}

export function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex").toUpperCase();
}

export function encryptAES(plainText, encKey) {
  const keyBytes = Buffer.from(encKey, "utf8");
  const iv = keyBytes.slice(0, 16);
  const cipher = crypto.createCipheriv("aes-256-cbc", keyBytes, iv);
  cipher.setAutoPadding(true);
  const out =
    cipher.update(plainText, "utf8", "base64") + cipher.final("base64");
  return out;
}

export function decryptAES(encData, encKey) {
  const keyBytes = Buffer.from(encKey, "utf8");
  const iv = keyBytes.slice(0, 16);
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBytes, iv);
  decipher.setAutoPadding(true);
  const out =
    decipher.update(encData, "base64", "utf8") + decipher.final("utf8");
  return out;
}

export function parseTildePlaintext(plaintext) {
  const out = {};
  if (!plaintext) return out;
  plaintext.split("~").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx !== -1) {
      out[pair.substring(0, idx)] = pair.substring(idx + 1);
    }
  });
  return out;
}

export function safeCompare(a, b) {
  if (!a || !b) return false;
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
