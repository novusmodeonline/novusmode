"use client";

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function UPIQRCodeFlow({
  qrUrl,
  generateQr,
  loading,
  polling,
  timer,
  qrSuccess,
  qrError,
}) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-white">
      <h3 className="font-semibold text-lg">Scan & Pay (UPI QR)</h3>

      <p className="text-sm text-gray-600">
        Scan this QR using any UPI app such as Google Pay, PhonePe, Paytm, or
        BHIM.
      </p>

      {/* QR CODE BOX */}
      <div className="w-full flex justify-center mt-4">
        <div className="relative flex justify-center items-center">
          <img
            src={qrUrl ? qrUrl : "/demoQRImage.png"}
            alt="QR Code"
            className={`w-70 h-70 border rounded-lg shadow transition 
              ${qrUrl ? "opacity-100" : "opacity-30"}
            `}
          />

          {/* Button ONLY before QR generation */}
          {!qrUrl && !loading && (
            <button
              onClick={generateQr}
              className="absolute bg-[var(--color-bg)] text-[var(--color-text)]
              top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              px-4 py-2 rounded-lg shadow-md border border-[var(--color-bg)]"
            >
              Generate QR
            </button>
          )}
        </div>
      </div>

      {/* Sub text after QR loads */}
      {qrUrl && !qrSuccess && !qrError && (
        <p className="text-sm text-center text-gray-700">
          QR is ready — complete the payment
        </p>
      )}

      {/* -----------------------------------------------------
          LOADER + TEXT BELOW QR  (NOT overlay)
      ------------------------------------------------------ */}
      {(loading || polling) && (
        <div className="flex flex-col justify-center items-center mt-4">
          {/* Loader circle */}
          <div
            className="border-4 border-gray-300 border-t-[var(--color-bg)]
                       rounded-full w-10 h-10 animate-spin"
          ></div>

          <p className="mt-3 text-sm text-gray-700">
            {loading
              ? "Generating QR..."
              : "Waiting for payment confirmation..."}
          </p>

          {/* Timer under text */}
          {polling && (
            <p className="text-xs text-gray-500 mt-1">
              Time left: {Math.floor(timer / 60)}:
              {(timer % 60).toString().padStart(2, "0")}
            </p>
          )}
        </div>
      )}

      {/* -----------------------------------------------------
        SUCCESS MESSAGE
      ------------------------------------------------------ */}
      {qrSuccess && (
        <div className="mt-4 flex items-center justify-center gap-2 text-green-600 font-semibold">
          <CheckCircle size={22} /> Payment Successful! Redirecting…
        </div>
      )}

      {/* -----------------------------------------------------
        ERROR MESSAGE
      ------------------------------------------------------ */}
      {qrError && (
        <div className="mt-4 flex items-center justify-center gap-2 text-red-600 font-semibold">
          <XCircle size={22} /> Payment Failed or Expired — Try Again
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        After completing the payment in your UPI app, return to this page.
      </p>
    </div>
  );
}
