export const validateEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone) => {
  if (!phone) return false;
  return /^[0-9]{10}$/.test(phone);
};

export const validateFullName = (name) => {
  if (!name) return false;
  return name.trim().length >= 2;
};

export function shippingCharges(state, subtotal) {
  // Free shipping for 500 or above
  if (subtotal >= 500) {
    return 0;
  }

  // Existing logic below (example)
  switch (state) {
    case "Delhi":
      return 75;
    default:
      return 100;
  }
}

export const detectPaymentMethod = {
  QR: "UPI",
  CC: "Credit Card",
};

export const sortedPayload = (payload) => {
  return payload.sort(([a], [b]) => {
    if (a.startsWith(b)) return -1;
    // If 'b' starts with 'a' (e.g. b="ABCDE", a="ABC"), 'b' comes first
    if (b.startsWith(a)) return 1;
    // Otherwise alphabetical fallback
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
};
