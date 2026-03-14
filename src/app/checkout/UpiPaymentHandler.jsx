"use client";

import React, { useState, useEffect } from "react";
import { UpiPaymentForm } from "@/components";
import { isValid } from "date-fns";
import QrCode from "qrcode";
import { parsePay10Response } from "@/lib/pay10/pay10ErrorMap";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function UpiPaymentHandler({ order }) {
  const router = useRouter();
  const [upiId, setUpiId] = useState("");
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validUPI, setValidUPI] = useState(false);
  const [errors, setErrors] = useState({});
  const [data, setData] = useState({});
  const [vupi, setVUPI] = useState({
    error: "",
    payeeName: "",
  });

  const { orderId, amount, contact, address } = order;
  const { email, phone } = contact;

  const showCollectFallbackUI = () => {
    alert("Redirect failed");
  };

  // ----------------------------------------------------
  // ⭐ NEW STATES for QR FLOW
  // ----------------------------------------------------
  const [polling, setPolling] = useState(false);
  const [qrSuccess, setQrSuccess] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [timer, setTimer] = useState(300); // 5 mins timer

  // ---------------------------
  // 1. Validate UPI ID
  // ---------------------------
  async function validateUpi() {
    setVUPI({
      error: "",
      payeeName: "",
    });
    setLoading(true);

    const res = await fetch("/api/pay10/upi/validate", {
      method: "POST",
      body: JSON.stringify({
        payerAddress: upiId,
        orderId,
        custEmail: email,
        custPhone: phone,
        amount: 100,
      }),
    });

    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      return false;
    }
    const result = parsePay10Response(data.status);
    if (result.status == "error") {
      setVUPI((prev) => ({ ...prev, error: result.message }));
    } else {
      setVUPI((prev) => ({ ...prev, payeeName: data?.data?.PAYER_NAME }));
    }
    return true;
  }

  // ---------------------------
  // 2. Initiate Collect Flow
  // ---------------------------
  async function sendCollectFlow() {
    setLoading(true);

    const res = await fetch("/api/pay10/upi/collect", {
      method: "POST",
      body: JSON.stringify({
        upiId,
        amount,
        orderId,
        email,
        phone,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      alert("Request sent to your UPI app. Approve payment there.");
    } else {
      alert("Collect request failed.");
    }
  }

  // ---------------------------
  // 3. Intent Flow (mobile)
  // ---------------------------
  async function handleIntentClick(appName) {
    const res = await fetch("/api/pay10/upi/initiate", {
      method: "POST",
      body: JSON.stringify({
        amount,
        orderId,
        custEmail: email,
        custPhone: phone,
      }),
    });
    localStorage.setItem("pay10_orderId", orderId);
    const data = await res.json();
    if (data.success && data.qrString) {
      alert("Redirecting to UPI App");
      window.location.href = data.qrString;

      // ✅ Fallback if no app opens
      setTimeout(() => {
        if (document.visibilityState === "visible") {
          showCollectFallbackUI(); // QR / VPA fallback
        }
      }, 3000);
    } else {
      alert("Intent flow could not start");
    }
  }

  // ---------------------------
  // 4. Generate Dynamic QR
  // ---------------------------
  async function generateQr() {
    setLoading(true);
    setQrError(false);
    setQrSuccess(false);
    setTimer(300);

    const res = await fetch("/api/pay10/upi/dqr", {
      method: "POST",
      body: JSON.stringify({ amount, orderId, email, phone }),
    });

    const data = await res.json();
    const result = parsePay10Response(data.statusCode);
    if (data.statusCode != "000") {
      toast[result.status](result.message);
    }
    setLoading(false);

    if (data.qrString) {
      QrCode.toDataURL(data.qrString, { width: 300 })
        .then((url) => {
          setQrUrl(url);
          setPolling(true); // ⭐ start polling
        })
        .catch((err) => console.error(err));
    }
  }

  // ---------------------------
  // QR STATUS POLLING (your requested logic)
  // ---------------------------
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/pay10/check-status?orderId=${orderId}`);
      const data = await res.json();

      if (data.status === "success") {
        setQrSuccess(true);
        setPolling(false);
        clearInterval(interval);
        router.push(`/order-confirmation?orderId=${orderId}&clearCart=1`);
      }

      if (data.status === "failed" || data.status === "expired") {
        setQrError(true);
        setPolling(false);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling]);

  // ---------------------------
  // TIMER COUNTDOWN
  // ---------------------------
  useEffect(() => {
    if (!polling) return;

    const t = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          setPolling(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [polling]);

  // ---------------------------
  // Collect Button Handler
  // ---------------------------
  async function onCollectClick() {
    if (setValidUPI) sendCollectFlow();
  }

  async function validatePayer() {
    setLoading(true);
    const result = await validateUpi();
    setLoading(false);
    if (result) setValidUPI((prev) => !prev);
  }

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <>
      {loading && <p className="text-blue-600">Processing...</p>}

      <UpiPaymentForm
        upiId={upiId}
        onUpiIdChange={setUpiId}
        onIntentClick={handleIntentClick}
        validatePayer={validatePayer}
        qrUrl={qrUrl}
        generateQr={generateQr}
        loading={loading}
        data={vupi}
        // ⭐ Add new props for QR UI if you want
        polling={polling}
        timer={timer}
        qrSuccess={qrSuccess}
        qrError={qrError}
      />

      {/* Collect Payment Button */}
      <button
        disabled={!validUPI}
        onClick={onCollectClick}
        className="mt-4 w-full p-3 bg-black text-white rounded-lg upi-pay-btn"
      >
        Pay via Collect UPI
      </button>

      {/* ⭐ Success message */}
      {qrSuccess && (
        <p className="text-green-600 mt-3 font-semibold text-center">
          Payment successful! Redirecting…
        </p>
      )}

      {/* ⭐ Error message */}
      {qrError && (
        <p className="text-red-600 mt-3 font-semibold text-center">
          Payment failed or expired. Try again.
        </p>
      )}
    </>
  );
}
