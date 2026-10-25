"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useProductStore } from "@/app/_zustand/store";
import PaymentMethodSelector from "./PaymentMethodSelector";
import CodPayment from "./CodPayment";
import DigiKhataQRCode from "./DigiKhataQRCode";

export default function Payment({
  onPay,
  orderData = {},
  orderTotal,
  orderId,
}) {
  const PAY_AMOUNT = orderTotal;
  const { contact, address } = orderData || {};
  const payerName = contact?.fullName || contact?.name || "";
  const payerEmail = contact?.email || "";
  const payerMobile = contact?.phone || "";
  const [method, setMethod] = useState("upi");
  const [codLoading, setCodLoading] = useState(false);
  const router = useRouter();
  const { clearCart } = useProductStore();

  const handlePay = async (e) => {
    e.preventDefault();

    if (!orderId) {
      toast.error("Order not ready yet. Please try again.");
      return;
    }

    if (method === "upi") {
      // UPI QR handles payment via QR scan & polling automatically
      return;
    }

    // COD: call backend, create payment record, redirect
    if (method === "cod") {
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
    }
  };

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {/* PAYMENT METHOD SELECTOR */}
      <PaymentMethodSelector
        method={method}
        order={["upi", "cod"]}
        onChange={(m) => {
          setMethod(m);
        }}
      />

      {/* DYNAMIC PAYMENT UI */}
      <div className="space-y-4">
        {/* UPI QR (DIGIKHATA) */}
        {method === "upi" && (
          <DigiKhataQRCode
            orderId={orderId}
            amount={PAY_AMOUNT}
            payerName={payerName}
            payerEmail={payerEmail}
            payerMobile={payerMobile}
            onSuccess={(data) => {
              onPay && onPay({ method: "upi", orderId, ...data });
            }}
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

          {method === "cod" && (
            <button
              onClick={handlePay}
              disabled={codLoading}
              className="bg-[var(--color-bg)] text-white px-5 py-3 rounded-lg disabled:opacity-60 font-semibold text-sm hover:opacity-90 transition"
            >
              {codLoading ? "Placing Order..." : "Place COD Order"}
            </button>
          )}

          {method === "upi" && (
            <div className="text-xs text-gray-500 italic">
              Scan the QR code above with any UPI app to complete payment
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-2">
          By continuing, you agree to our Terms & Conditions.
        </p>
      </div>
    </div>
  );
}
