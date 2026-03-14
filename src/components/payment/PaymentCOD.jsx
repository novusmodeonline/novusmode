// components/PaymentCOD.jsx

"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function PaymentCOD() {
  const [selected, setSelected] = useState(true);

  return (
    <div className="w-full items-center py-8">
      <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-6 space-y-6">
        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-800">
          Select Payment Method
        </h2>

        {/* Cash on Delivery Option */}
        <div
          className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer transition ${
            selected ? "border-[var(--color-bg)] bg-green-50" : "border-gray-200"
          }`}
          onClick={() => setSelected(true)}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                selected ? "bg-[var(--color-bg)]text-[var(--color-text)] bg-transparent border border-[var(--color-bg)]" : "border-gray-400"
              }`}
            >
              {selected && <CheckCircle size={16} className="text-[var(--color-bg)]]" />}
            </div>
            <span className="text-gray-700 font-medium">
              Cash on Delivery (COD)
            </span>
          </div>
        </div>

        {/* Confirm Button */}
        {/* <button className="w-full py-3 rounded-xl text-lg font-medium text-[var(--color-bg)] bg-transparent border border-[var(--color-bg)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] transition">
          Confirm Payment
        </button> */}
      </div>
    </div>
  );
}
