const MAGIC_FINAL_AMOUNT = 5000;
const MAGIC_UPPER_BOUND = 6000; // backend-only

export function applyCouponRule(ruleType, cartTotal) {
  switch (ruleType) {
    case "MAGIC_CLAMP_5000": {
      if (cartTotal <= MAGIC_FINAL_AMOUNT) {
        return { valid: false, reason: "NOT_APPLICABLE" };
      }

      if (cartTotal > MAGIC_UPPER_BOUND) {
        return { valid: false, reason: "EXCEEDS_LIMIT" };
      }

      return {
        valid: true,
        discountAmount: cartTotal - MAGIC_FINAL_AMOUNT,
        finalAmount: MAGIC_FINAL_AMOUNT,
      };
    }

    default:
      return { valid: false, reason: "UNKNOWN_RULE" };
  }
}
