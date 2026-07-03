"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";
import { useProductStore } from "@/app/_zustand/store";
import {
  PaymentMethodSelector,
  SavedCards,
  CardPaymentForm,
  NetbankingPaymentForm,
  CodPayment,
} from "@/components";

const PAY_AMOUNT = 999;

const BANKS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Yes Bank",
  "IDFC First Bank",
  "Punjab National Bank",
];

export default function Payment({
  savedCards = [],
  onPay,
  orderData,
  orderTotal,
  orderId,
}) {
  const PAY_AMOUNT = orderTotal;
  const { contact, address } = orderData;
  const payerName = contact?.fullName || contact?.name || "";
  const payerEmail = contact?.email || "";
  const payerMobile = contact?.phone || "";
  const { address1, address2, city, state, pincode } = address;
  const [method, setMethod] = useState("cod");
  const [codLoading, setCodLoading] = useState(false);
  const [upiLoading, setUpiLoading] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [paypointOrderId, setPaypointOrderId] = useState("");
  const [upiError, setUpiError] = useState("");
  const [polling, setPolling] = useState(false);
  const [qrSuccess, setQrSuccess] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [timer, setTimer] = useState(300);
  const router = useRouter();
  const { clearCart } = useProductStore();

  const [selectedSavedToken, setSelectedSavedToken] = useState(null);
  const [showNewCard, setShowNewCard] = useState(savedCards.length === 0);

  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const [saveCard, setSaveCard] = useState(false);
  const [bank, setBank] = useState("");
  const [errors, setErrors] = useState({});

  // ---------- INPUT HANDLERS ----------
  const handleCardChange = (field, value) => {
    setCardData((p) => ({ ...p, [field]: value }));
  };

  // ---------- VALIDATION ----------
  const validateCard = () => {
    let errs = {};

    const digits = (cardData.number || "").replace(/\s+/g, "");

    // Only validate if user is entering a new card
    if (showNewCard) {
      if (digits.length !== 16) errs.number = "Enter 16-digit card number";
      if (!/^\d{2}\/\d{2}$/.test(cardData.expiry || ""))
        errs.expiry = "Use MM/YY";
      if (!/^\d{3}$/.test(cardData.cvv || ""))
        errs.cvv = "3-digit CVV required";
      if (!cardData.name || cardData.name.trim().length < 2)
        errs.name = "Name required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateBank = () => {
    let errs = {};
    if (!bank) errs.bank = "Select a bank";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---------- PAY BUTTON ENABLE/DISABLE ----------
  const isPayDisabled = () => {
    if (method === "card") {
      if (!showNewCard && selectedSavedToken) return false;

      const digits = (cardData.number || "").replace(/\s+/g, "");

      return !(
        digits.length === 16 &&
        /^\d{2}\/\d{2}$/.test(cardData.expiry || "") &&
        /^\d{3}$/.test(cardData.cvv || "") &&
        cardData.name.trim().length >= 2
      );
    }

    if (method === "netbanking") return !bank;

    if (method === "upi_qr") return polling || (qrCodeImage && !qrError);

    return false;
  };

  const handleUpiQrPayment = async () => {
    try {
      setUpiLoading(true);
      setUpiError("");
      setQrCodeImage("");
      setQrError(false);
      setQrSuccess(false);
      setTimer(300);

      const receipt = orderId || `paypoint-${Date.now()}`;
      const payload = {
        amount: Number(PAY_AMOUNT),
        name: payerName,
        mobileNo: payerMobile,
        receipt,
      };

      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to generate UPI QR code");
      }

      const nextOrderId = data.orderId || receipt;
      setPaypointOrderId(nextOrderId);
      setQrCodeImage(data.qrCodeImage || "");
      setPolling(true);
      onPay &&
        onPay({
          method: "upi_qr",
          orderId: nextOrderId,
          qrCodeImage: data.qrCodeImage,
        });
      toast.success("UPI QR code generated successfully");
    } catch (err) {
      console.error("UPI QR ERROR:", err);
      setQrCodeImage("");
      setPaypointOrderId("");
      setPolling(false);
      setQrError(true);
      setUpiError(err.message || "Unable to generate UPI QR code");
      toast.error(err.message || "Unable to generate UPI QR code");
    } finally {
      setUpiLoading(false);
    }
  };

  useEffect(() => {
    if (!polling || !orderId || !paypointOrderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payment/status?orderId=${encodeURIComponent(orderId)}&refId=${encodeURIComponent(paypointOrderId)}`,
          { cache: "no-store" },
        );
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
      } catch (err) {
        console.error("UPI QR STATUS ERROR:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, orderId, paypointOrderId, router]);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setPolling(false);
          setQrError(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [polling]);

  const getButtonLabel = () => {
    switch (method) {
      case "card":
        return `Pay ₹${PAY_AMOUNT}`;
      case "netbanking":
        return "Proceed to Bank";
      case "cod":
        return "Place COD Order";
      case "upi_qr":
        if (polling) return "Waiting for Payment";
        if (qrSuccess) return "Payment Successful";
        if (qrCodeImage && !qrError) return "QR Generated";
        return "Generate QR Code";
      default:
        return "Pay Now";
    }
  };

  // ---------- PAY HANDLER ----------
  const handlePay = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!orderId) {
      toast.error("Order not ready yet. Please try again.");
      return;
    }

    if (method === "card") {
      if (!(selectedSavedToken && !showNewCard)) {
        if (!validateCard()) return;
      }
    }
    if (method === "netbanking" && !validateBank()) return;

    // ---------- COD: call backend, create payment record, redirect ----------
    if (method === "cod") {
      if (!orderId) {
        toast.error("Order not ready yet. Please try again.");
        return;
      }
      setCodLoading(true);
      try {
        const res = await fetch("/api/cod/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to place COD order");
        }
        // Success: clear cart and redirect

        onPay && onPay({ method: "cod", orderId });
        window.location.href = `/order-confirmation?orderId=${orderId}&clearCart=1`;
      } catch (err) {
        console.error("COD ORDER ERROR:", err);
        toast.error(
          err.message || "Failed to place COD order. Please try again.",
        );
      } finally {
        setCodLoading(false);
      }
      return;
    }

    if (method === "upi_qr") {
      await handleUpiQrPayment();
      return;
    }

    const payload = { method, amount: PAY_AMOUNT };

    if (method === "card") {
      if (selectedSavedToken && !showNewCard) {
        payload.savedCardToken = selectedSavedToken;
      } else {
        payload.card = {
          number: (cardData.number || "").replace(/\s+/g, ""),
          expiry: cardData.expiry,
          cvv: cardData.cvv,
          name: cardData.name,
          saveCard,
        };
      }
    }

    if (method === "netbanking") payload.netbanking = { bank };

    onPay && onPay(payload);
  };

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {/* PAYMENT METHOD SELECTOR */}
      <PaymentMethodSelector
        method={method}
        order={["cod", "upi_qr"]}
        onChange={(m) => {
          setMethod(m);
          setQrCodeImage("");
          setPaypointOrderId("");
          setUpiError("");
          setPolling(false);
          setQrSuccess(false);
          setQrError(false);
          setTimer(300);
        }}
      />

      <div className="bg-white border rounded-xl p-4 text-sm text-gray-700">
        A new online payment gateway is being integrated. Cash on delivery is
        available for now while the legacy payment flow is retired.
      </div>

      {/* DYNAMIC FORMS */}
      <div className="space-y-4">
        {/* CARD */}
        {method === "card" && (
          <>
            <SavedCards
              savedCards={savedCards}
              selectedToken={selectedSavedToken}
              onSelect={(t) => {
                setSelectedSavedToken(t);
                setShowNewCard(false);
              }}
              onAddNew={() => {
                setSelectedSavedToken(null);
                setShowNewCard(true);
              }}
            />

            <div className="mt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={showNewCard}
                  onChange={() => {
                    setSelectedSavedToken(null);
                    setShowNewCard(true);
                  }}
                />
                <span>Pay with new card</span>
              </label>
            </div>

            <CardPaymentForm
              cardData={cardData}
              onChange={handleCardChange}
              disabled={!showNewCard}
              saveCard={saveCard}
              onToggleSave={setSaveCard}
              errors={errors}
            />
          </>
        )}

        {/* NETBANKING */}
        {method === "netbanking" && (
          <NetbankingPaymentForm
            bank={bank}
            banks={BANKS}
            error={errors.bank}
            onChange={(v) => setBank(v)}
          />
        )}

        {/* COD */}
        {method === "cod" && <CodPayment />}

        {/* UPI QR */}
        {method === "upi_qr" && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Scan & Pay (UPI QR)
            </h3>

            <p className="text-sm text-gray-600">
              Scan this QR using any UPI app such as Google Pay, PhonePe, Paytm,
              or BHIM.
            </p>

            <div className="mt-4 flex w-full justify-center">
              <div className="relative flex min-h-72 min-w-72 items-center justify-center">
                {qrCodeImage ? (
                  <img
                    src={
                      qrCodeImage.startsWith("data:")
                        ? qrCodeImage
                        : `data:image/png;base64,${qrCodeImage}`
                    }
                    alt="Scan to Pay"
                    className="h-72 w-72 rounded-lg border object-contain shadow transition opacity-100"
                  />
                ) : (
                  <div className="h-72 w-72 rounded-lg border bg-gray-100 shadow opacity-30" />
                )}

                {!qrCodeImage && !upiLoading && (
                  <button
                    type="button"
                    onClick={handleUpiQrPayment}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--color-bg)] bg-[var(--color-bg)] px-4 py-2 text-white shadow-md"
                  >
                    Generate QR
                  </button>
                )}
              </div>
            </div>

            {qrCodeImage && !qrSuccess && !qrError && (
              <p className="text-center text-sm text-gray-700">
                QR is ready - complete the payment
              </p>
            )}

            {(upiLoading || polling) && (
              <div className="mt-4 flex flex-col items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--color-bg)]" />

                <p className="mt-3 text-sm text-gray-700">
                  {upiLoading
                    ? "Generating QR..."
                    : "Waiting for payment confirmation..."}
                </p>

                {polling && (
                  <p className="mt-1 text-xs text-gray-500">
                    Time left: {Math.floor(timer / 60)}:
                    {(timer % 60).toString().padStart(2, "0")}
                  </p>
                )}
              </div>
            )}

            {qrSuccess && (
              <div className="mt-4 flex items-center justify-center gap-2 font-semibold text-green-600">
                <CheckCircle size={22} /> Payment Successful! Redirecting...
              </div>
            )}

            {qrError && (
              <div className="mt-4 flex items-center justify-center gap-2 font-semibold text-red-600">
                <XCircle size={22} /> Payment Failed or Expired - Try Again
              </div>
            )}

            {upiError && <div className="text-sm text-red-600">{upiError}</div>}

            {paypointOrderId && (
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-700">Order ID</div>
                <div className="break-all">{paypointOrderId}</div>
              </div>
            )}

            <p className="text-center text-xs text-gray-500">
              After completing the payment in your UPI app, return to this page.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Order Total</div>
            <div className="text-xl font-semibold">₹{PAY_AMOUNT}</div>
          </div>

          <button
            onClick={handlePay}
            disabled={isPayDisabled() || codLoading || upiLoading}
            className="bg-[var(--color-bg)] text-white px-5 py-3 rounded-lg disabled:opacity-60"
          >
            {codLoading
              ? "Placing Order..."
              : upiLoading
                ? "Generating QR..."
                : getButtonLabel()}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          By continuing, you agree to our Terms & Conditions.
        </p>
      </div>
    </div>
  );
}
