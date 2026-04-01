"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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
  const { fullName, email, phone } = contact;
  const { address1, address2, city, state, pincode } = address;
  const [method, setMethod] = useState("cod");
  const [codLoading, setCodLoading] = useState(false);
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

    return false;
  };

  const getButtonLabel = () => {
    switch (method) {
      case "card":
        return `Pay ₹${PAY_AMOUNT}`;
      case "netbanking":
        return "Proceed to Bank";
      case "cod":
        return "Place COD Order";
      default:
        return "Pay Now";
    }
  };

  // ---------- PAY HANDLER ----------
  const handlePay = async (e) => {
    e.preventDefault();
    setErrors({});

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
        order={["cod"]}
        onChange={(m) => setMethod(m)}
      />

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
            disabled={isPayDisabled() || codLoading}
            className="bg-[var(--color-bg)] text-white px-5 py-3 rounded-lg disabled:opacity-60"
          >
            {codLoading ? "Placing Order..." : getButtonLabel()}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          By continuing, you agree to our Terms & Conditions.
        </p>
      </div>
    </div>
  );
}
