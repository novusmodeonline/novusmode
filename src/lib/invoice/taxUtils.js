export function calculateTaxInclusive(amount, gstRate) {
  const taxable = amount / (1 + gstRate / 100);
  const gst = amount - taxable;
  return {
    taxableValue: +taxable.toFixed(2),
    gstAmount: +gst.toFixed(2),
  };
}
