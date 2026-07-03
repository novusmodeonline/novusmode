// Server-side PayPoint configuration helper
// Reads secrets from process.env (do NOT expose these to the client)

const PAYPOINT_BASE_URL =
  process.env.PAYPOINT_BASE_URL || "https://walletupi.paypointz.com";
const PAYPOINT_MERCHANT_CODE = process.env.PAYPOINT_MERCHANT_CODE;

export function getPaypointHeaders() {
  return {
    "Content-Type": "application/json",
    MerchantID: process.env.PAYPOINT_MERCHANT_ID,
    AuthKey: process.env.PAYPOINT_AUTH_KEY,
    InterfaceKey: process.env.PAYPOINT_INTERFACE_KEY,
  };
}

export { PAYPOINT_BASE_URL, PAYPOINT_MERCHANT_CODE };

export default {
  PAYPOINT_BASE_URL,
  PAYPOINT_MERCHANT_CODE,
  getPaypointHeaders,
};
