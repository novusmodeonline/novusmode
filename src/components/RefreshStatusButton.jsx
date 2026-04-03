"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { refreshOrderStatus } from "@/app/actions/checkOrderStatus";

const COOLDOWN_SECONDS = 30;

/**
 * Shows a "Refresh Status" button on pending payment orders.
 * Calls the SabPaisa Transaction Enquiry and refreshes the page on success.
 *
 * Props:
 *  - orderId   {string}  Order id / clientTxnId
 *  - onResult  {(result: { status, message, orderStatus }) => void}  optional callback
 */
export default function RefreshStatusButton({ orderId, onResult }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState(null); // { text, type: "success"|"error"|"info" }

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRefresh = useCallback(async () => {
    if (loading || cooldown > 0) return;

    setLoading(true);
    setMessage(null);

    try {
      const result = await refreshOrderStatus(orderId);

      onResult?.(result);

      if (result.status === "success") {
        setMessage({ text: result.message, type: "success" });
        // Allow the success message to show briefly before reloading
        setTimeout(() => router.refresh(), 1200);
      } else if (result.status === "failed") {
        setMessage({ text: result.message, type: "error" });
        setTimeout(() => router.refresh(), 1200);
      } else if (result.status === "pending") {
        setMessage({ text: result.message, type: "info" });
      } else {
        setMessage({ text: result.message, type: "error" });
      }
    } catch (err) {
      console.error("[RefreshStatusButton] error:", err);
      setMessage({
        text: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setCooldown(COOLDOWN_SECONDS);
    }
  }, [orderId, loading, cooldown, router, onResult]);

  const messageColors = {
    success: "text-green-700 bg-green-50 border-green-200",
    error: "text-red-700 bg-red-50 border-red-200",
    info: "text-amber-700 bg-amber-50 border-amber-200",
  };

  const isDisabled = loading || cooldown > 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={isDisabled}
        className={`
          inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
          transition-all border-black duration-200
          ${
            isDisabled
              ? "bg-amber-200 text-amber-500 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-sm hover:shadow"
          }
        `}
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        {loading
          ? "Checking..."
          : cooldown > 0
            ? `Retry in ${cooldown}s`
            : "Refresh Payment Status"}
      </button>

      {message && (
        <p
          className={`text-xs text-center px-4 py-2 rounded-lg border ${messageColors[message.type] || messageColors.info}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
