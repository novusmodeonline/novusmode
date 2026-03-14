// ===============================
// DATE UTILS
// ===============================

export function formatDateDDMMYYYY(dateString) {
  if (!dateString) return "";

  const clean = dateString.replace("T", " ").split(" ")[0];
  const [year, month, day] = clean.split("-");

  return `${day}/${month}/${year}`;
}

// ===============================
// FINANCIAL YEAR
// ===============================

export function getFinancialYearFromDate(dateString) {
  if (!dateString) return "";

  // Extract YYYY-MM-DD
  const [datePart] = dateString.split(" ");
  const [yearStr, monthStr] = datePart.split("-");

  const year = Number(yearStr);
  const month = Number(monthStr); // 1–12

  // Indian FY: April (4) to March (3)
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}

// ===============================
// SIMPLE HASH (DETERMINISTIC)
// ===============================

function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

// ===============================
// INVOICE NUMBER (NO COUNTER)
// ===============================

/**
 * Deterministic invoice number
 * Same orderId + date => same invoice no
 */
export function generateInvoiceNumber(orderId, date) {
  const fy = getFinancialYearFromDate(date);
  const hash = simpleHash(`${orderId}-${date}`).slice(0, 6);
  return `INV/${fy}/${hash}`;
}
