"use client";

import React from "react";

export default function CardPaymentForm({
  cardData,
  onChange,
  disabled,
  saveCard,
  onToggleSave,
  errors,
}) {
  // Reusable input
  const Field = ({ label, name, max, placeholder }) => (
    <div className="mb-3">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        disabled={disabled}
        maxLength={max}
        placeholder={placeholder}
        value={cardData[name]}
        onChange={(e) => onChange(name, e.target.value)}
        className={`w-full border rounded px-3 py-2 mt-1 ${
          disabled ? "opacity-40 cursor-not-allowed" : ""
        }`}
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="bg-white border rounded-xl p-4 mt-3">
      <Field
        label="Cardholder Name"
        name="name"
        placeholder="John Doe"
        max={50}
      />

      <Field
        label="Card Number"
        name="number"
        placeholder="1234 5678 9012 3456"
        max={16}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Expiry (MM/YY)" name="expiry" placeholder="04/29" max={5} />
        <Field label="CVV" name="cvv" placeholder="123" max={4} />
      </div>

      {!disabled && (
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) => onToggleSave(e.target.checked)}
          />
          Save this card for future use
        </label>
      )}
    </div>
  );
}
