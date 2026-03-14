"use client";

import React, { useState, useEffect } from "react";

export default function UPIIntentFlow({
  upiId,
  onUpiIdChange,
  onIntentClick,
  validatePayer,
  data = {},
  loading,
}) {
  const [isMobile, setIsMobile] = useState(false);
  // Detect device type
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const mobile =
        /android|iphone|ipad|ipod|opera mini|iemobile|wpdesktop|mobile/.test(
          ua
        );
      setIsMobile(mobile);
    }
  }, []);

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-white">
      <h3 className="font-semibold text-lg">Pay via UPI</h3>

      {/* ❌ Desktop Not Supported Notice */}
      {!isMobile && (
        <div className="p-3 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm">
          UPI App payments (Google Pay / PhonePe / Paytm) can only open on
          mobile devices.
          <br />
          Please use the QR Scan option or enter your UPI ID manually.
        </div>
      )}

      {/* UPI APP LIST (Mobile Only) */}
      {isMobile && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Pay using UPI App</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Google Pay", url: "upi://pay?pa=" },
              { name: "PhonePe", url: "upi://pay?pa=" },
              { name: "Paytm", url: "upi://pay?pa=" },
              { name: "BHIM UPI", url: "upi://pay?pa=" },
            ].map((app) => (
              <button
                key={app.name}
                className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 text-sm"
                onClick={() => onIntentClick(app.name)}
              >
                {app.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ENTER UPI ID MANUALLY */}
      <div className="mt-4">
        {/* Label + Input + Button in same row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <label className="text-sm font-medium sm:whitespace-nowrap">
            Enter UPI ID
          </label>

          <input
            type="text"
            value={upiId}
            placeholder="example@upi"
            onChange={(e) => onUpiIdChange(e.target.value)}
            className="border p-2 rounded-lg w-full sm:flex-1"
          />

          <button
            type="button"
            onClick={validatePayer}
            className="px-4 py-2 bg-black text-white rounded-lg w-full sm:w-auto"
          >
            {loading ? "Validating..." : "Validate"}
          </button>
        </div>

        {data?.payeeName && (
          <p className="text-green-600 mt-2">Payer Name : {data.payeeName}</p>
        )}
        {/* Error below */}
        {data.error && (
          <p className="text-red-500 text-sm mt-2">{data.error}</p>
        )}
      </div>
    </div>
  );
}
