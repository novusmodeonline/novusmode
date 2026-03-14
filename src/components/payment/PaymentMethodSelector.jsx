"use client";

import React from "react";

export default function PaymentMethodSelector({ method, onChange, order }) {
  const METHOD_LABELS = {
    // card: "Credit/Debit Cards",
    // netbanking: "Netbanking",
    upi: "UPI",
    cod: "Cash on Delivery",
  };

  return (
    <div className="bg-white p-4 rounded-xl border space-y-3">
      <h3 className="font-semibold mb-2 text-[var(--color-inverted-text)]">
        Select Payment Method
      </h3>

      {order.map((m) => (
        <label key={m} className="flex items-center gap-3 cursor-pointer py-1">
          <input
            type="radio"
            name="paymentMethod"
            checked={method === m}
            onChange={() => onChange(m)}
          />
          <span>{METHOD_LABELS[m]}</span>
        </label>
      ))}
    </div>
  );
}
