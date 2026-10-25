"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, AlertCircle, RefreshCw, QrCode as QrIcon, Smartphone } from "lucide-react";

export default function DigiKhataQRCode({
  orderId,
  amount,
  payerName,
  payerEmail,
  payerMobile,
  onSuccess,
}) {
  const router = useRouter();
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [status, setStatus] = useState("idle"); // idle | ready | success | expired | error
  const [statusMessage, setStatusMessage] = useState("");
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  const fetchQRCode = useCallback(async () => {
    if (!orderId) {
      toast.error("Order is not ready. Please try again.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setQrCodeImage(null);
    setTimeLeft(300);

    try {
      const res = await fetch("/api/digikhata/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          payerName,
          payerEmail,
          payerMobile,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to generate UPI QR Code");
      }

      setQrCodeImage(data.qrCodeImage);
      setStatus("ready");
      setPolling(true);
    } catch (err) {
      console.error("[DigiKhata] Generate QR Error:", err);
      setStatus("error");
      setStatusMessage(err.message || "Failed to generate QR code");
      toast.error(err.message || "Could not generate UPI QR Code");
    } finally {
      setLoading(false);
    }
  }, [orderId, amount, payerName, payerEmail, payerMobile]);

  // Auto-generate on initial render
  useEffect(() => {
    if (orderId && !qrCodeImage && status === "idle" && !loading) {
      fetchQRCode();
    }
  }, [orderId]);

  // Countdown timer
  useEffect(() => {
    if (!polling) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPolling(false);
          setStatus("expired");
          setStatusMessage("QR Code expired. Please generate a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [polling]);

  // Status Polling
  useEffect(() => {
    if (!polling || !orderId) return;

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/digikhata/check-status?orderId=${encodeURIComponent(orderId)}`);
        const data = await res.json();

        if (data.status === "success") {
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          setPolling(false);
          setStatus("success");
          toast.success("Payment Received Successfully!");

          if (onSuccess) {
            onSuccess(data);
          }

          setTimeout(() => {
            router.push(`/order-confirmation?orderId=${encodeURIComponent(orderId)}&clearCart=1`);
          }, 1500);
        } else if (data.status === "failed") {
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          setPolling(false);
          setStatus("error");
          setStatusMessage(data.message || "Payment failed. Please retry.");
        } else if (data.status === "expired") {
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          setPolling(false);
          setStatus("expired");
          setStatusMessage("Payment session expired. Please generate a new QR.");
        }
      } catch (err) {
        console.error("[DigiKhata] Status check poll error:", err);
      }
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [polling, orderId, router, onSuccess]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 max-w-md mx-auto text-center">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
          <QrIcon className="w-3.5 h-3.5" />
          DigiKhata Instant UPI QR
        </div>
        <h3 className="text-lg font-bold text-gray-900">Scan & Pay via UPI</h3>
        <p className="text-xs text-gray-500">
          Scan the QR code using any UPI app (Google Pay, PhonePe, Paytm, Cred, BHIM)
        </p>
      </div>

      {/* Amount Display */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-600">Total Payable:</span>
        <span className="text-xl font-bold text-emerald-600">₹{amount}</span>
      </div>

      {/* QR Code Container */}
      <div className="relative flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 min-h-[280px]">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[var(--color-bg)] rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 font-medium">Generating DigiKhata UPI QR...</p>
          </div>
        )}

        {!loading && status === "ready" && qrCodeImage && (
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              <img
                src={qrCodeImage}
                alt="DigiKhata UPI QR Code"
                className="w-56 h-56 object-contain"
              />
            </div>

            {/* Timer countdown */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
              <span>Expires in:</span>
              <span className="font-mono font-bold">{formatTimer(timeLeft)}</span>
            </div>
          </div>
        )}

        {!loading && status === "success" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-900">Payment Successful!</h4>
              <p className="text-xs text-gray-500">Redirecting to order confirmation...</p>
            </div>
          </div>
        )}

        {!loading && (status === "expired" || status === "error") && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-red-600 font-medium">{statusMessage}</p>
            <button
              type="button"
              onClick={fetchQRCode}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-bg)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate New QR
            </button>
          </div>
        )}

        {!loading && status === "idle" && !qrCodeImage && (
          <button
            type="button"
            onClick={fetchQRCode}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-bg)] text-white text-sm font-semibold rounded-xl hover:opacity-90 shadow transition"
          >
            <QrIcon className="w-4 h-4" />
            Generate UPI QR Code
          </button>
        )}
      </div>

      {/* Supported Apps Logos / Badges */}
      <div className="pt-2 border-t text-left">
        <p className="text-[11px] text-gray-400 text-center uppercase tracking-wider mb-2 font-medium">
          Accepted UPI Apps
        </p>
        <div className="flex flex-wrap justify-center items-center gap-2 text-xs text-gray-600">
          <span className="px-2.5 py-1 bg-gray-100 rounded-md font-medium">Google Pay</span>
          <span className="px-2.5 py-1 bg-gray-100 rounded-md font-medium">PhonePe</span>
          <span className="px-2.5 py-1 bg-gray-100 rounded-md font-medium">Paytm</span>
          <span className="px-2.5 py-1 bg-gray-100 rounded-md font-medium">BHIM</span>
          <span className="px-2.5 py-1 bg-gray-100 rounded-md font-medium">CRED</span>
        </div>
      </div>
    </div>
  );
}
