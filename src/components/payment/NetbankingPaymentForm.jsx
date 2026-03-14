"use client";

import React from "react";

export default function NetbankingPaymentForm({
  bank,
  onChange,
  error,
  banks,
}) {
  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <label className="text-sm text-gray-700">Select Your Bank</label>

      <select
        className="w-full border rounded px-3 py-2"
        value={bank}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose a bank</option>
        {banks.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
