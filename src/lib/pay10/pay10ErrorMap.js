// Pay10 code → User-friendly message + toast status
export function parsePay10Response(code) {
  const responses = {
    // --- SUCCESS ---
    "000": {
      message: "Payment completed successfully!",
      status: "success",
    },

    // --- IN PROGRESS / PENDING ---
    "026": {
      message: "Payment is being processed. Please wait...",
      status: "pending",
    },

    // --- GENERAL FAILURES ---
    "003": {
      message: "The payment timed out. Please try again.",
      status: "error",
    },
    "007": {
      message: "Your bank rejected the payment. Try another payment method.",
      status: "error",
    },
    "009": {
      message: "Security check failed. Please retry the payment.",
      status: "error",
    },
    "004": {
      message: "The payment was declined. Try again or use another method.",
      status: "error",
    },
    "010": { message: "You cancelled the payment.", status: "error" },
    "012": {
      message: "Payment blocked for security reasons.",
      status: "error",
    },
    "018": {
      message: "This order has already been processed.",
      status: "error",
    },
    "022": {
      message: "Bank failed to process your payment. Try again.",
      status: "error",
    },

    100: { message: "User account not found.", status: "error" },
    101: { message: "Incorrect password entered.", status: "error" },
    102: { message: "User account is inactive.", status: "error" },
    103: {
      message: "Payment validation failed. Retry again.",
      status: "error",
    },
    104: {
      message: "Your account is not approved for payments.",
      status: "error",
    },
    105: {
      message: "Merchant account issue. Please try again later.",
      status: "error",
    },
    108: {
      message: "Merchant details missing. Please contact support.",
      status: "error",
    },
    110: {
      message: "This currency is not supported for payment.",
      status: "error",
    },
    113: {
      message: "This payment method is not supported.",
      status: "error",
    },
    114: {
      message: "GST details missing for this transaction.",
      status: "error",
    },
    129: {
      message: "A similar request is already in progress.",
      status: "error",
    },
    130: {
      message: "This currency is not supported.",
      status: "error",
    },
    131: {
      message: "Invalid or unsupported card number.",
      status: "error",
    },
    132: {
      message: "Your account is temporarily locked.",
      status: "error",
    },
    134: {
      message: "Merchant setup pending. Try again later.",
      status: "error",
    },

    300: { message: "Invalid request sent.", status: "error" },
    302: { message: "No matching transaction found.", status: "error" },
    323: {
      message: "Security verification failed. Please retry.",
      status: "error",
    },
    366: {
      message: "The UPI ID you entered is invalid.",
      status: "error",
    },

    400: { message: "Access denied.", status: "error" },
    900: {
      message: "Something went wrong. Please try again.",
      status: "error",
    },
    902: {
      message: "Temporary issue. Please retry in a moment.",
      status: "error",
    },
    999: {
      message: "An unknown error occurred. Please try again.",
      status: "error",
    },

    // --- REQUIRED FIELD ERRORS ---
    401: {
      message: "Please enter your phone number.",
      status: "error",
    },
    402: { message: "Order ID is missing.", status: "error" },
    403: { message: "Email address is required.", status: "error" },
    404: {
      message: "Currency code missing. Please try again.",
      status: "error",
    },
    405: { message: "Please enter an amount.", status: "error" },
    406: { message: "Payment method is required.", status: "error" },
    407: { message: "Payment type is required.", status: "error" },
    408: {
      message: "UPI ID or payer address is required.",
      status: "error",
    },
    409: { message: "Card number is required.", status: "error" },
    410: { message: "Invalid payment type.", status: "error" },
    411: { message: "Invalid payment method.", status: "error" },
    412: { message: "Customer name is required.", status: "error" },
    413: {
      message: "Transaction type missing.",
      status: "error",
    },
    414: { message: "PayID is required.", status: "error" },
    416: { message: "Invalid PayID.", status: "error" },
    415: { message: "Encrypted data missing.", status: "error" },
    420: { message: "Hash key missing.", status: "error" },

    500: {
      message: "Card expiry date is required.",
      status: "error",
    },
    501: {
      message: "Card holder name is required.",
      status: "error",
    },
    502: { message: "Please enter CVV.", status: "error" },
    1013: {
      message: "Server configuration issue. Try again later.",
      status: "error",
    },
    787: {
      message: "User UPI details successfully fetched.",
      status: "success",
    },
  };

  return (
    responses[code] || {
      message: "Something went wrong. Please try again.",
      status: "error",
    }
  );
}
