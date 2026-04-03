"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  Mail,
  RefreshCcw,
  ShoppingBag,
} from "lucide-react";
import { useProductStore } from "@/app/_zustand/store";

function toLower(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function statusViewFromOrder(order) {
  const payment = order?.payment || {};
  const responseCode = String(payment?.responseCode || "").trim();
  const paymentStatus = toLower(payment?.status);

  if (responseCode === "0000" || paymentStatus === "success") return "success";
  if (
    responseCode === "0300" ||
    responseCode === "0200" ||
    paymentStatus === "failed" ||
    paymentStatus === "aborted"
  ) {
    return "failed";
  }
  if (
    responseCode === "0100" ||
    responseCode === "0999" ||
    paymentStatus === "pending" ||
    paymentStatus === "initiated" ||
    paymentStatus === "unknown" ||
    paymentStatus === "challan_generated" ||
    paymentStatus === "not_found"
  ) {
    return "pending";
  }

  return "pending";
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "0";
  return amount.toLocaleString("en-IN");
}

function StatusHeader({ view }) {
  switch (view) {
    case "success":
      return (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Thank you for your order!</h1>
              <p className="text-sm text-emerald-50">
                Your payment is confirmed and we are preparing your shipment.
              </p>
            </div>
          </div>
        </div>
      );
    case "failed":
      return (
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Payment Failed</h1>
              <p className="text-sm text-rose-50">
                We could not complete your transaction. Please try again.
              </p>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-zinc-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Clock3 className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">
                Payment Verification in Progress
              </h1>
              <p className="text-sm text-amber-50">
                Please do not pay again. We will update your status within 20
                minutes.
              </p>
            </div>
          </div>
        </div>
      );
  }
}

export default function OrderStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { clearCart } = useProductStore();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyDone, setCopyDone] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError("Order not found.");
        setOrder(null);
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Unable to load order details right now.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (searchParams.get("clearCart") === "1") {
      clearCart();
    }
  }, [searchParams, clearCart]);

  const view = useMemo(() => statusViewFromOrder(order), [order]);

  const payment = order?.payment || null;
  const raw = payment?.rawResponse || {};
  const transactionRef = raw?.sabpaisaTxnId || payment?.gatewayId || "-";
  const paymentMode =
    payment?.mode || raw?.paymentMode || order?.paymentMethod || "-";
  const totalAmount =
    payment?.amount ?? order?.finalAmount ?? order?.amount ?? 0;
  const failureMessage =
    raw?.bankMessage ||
    raw?.sabpaisaMessage ||
    payment?.responseMessage ||
    "Transaction declined by bank.";

  const handleCopy = async () => {
    if (!transactionRef || transactionRef === "-") return;
    try {
      await navigator.clipboard.writeText(String(transactionRef));
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 1500);
    } catch {
      setCopyDone(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 text-center text-gray-500">
        Loading order status...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-28 text-center text-gray-500">
        {error || "Order not found."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <StatusHeader view={view} />

        <div className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-gray-500">Order ID</p>
            <p className="font-semibold text-gray-900">{order.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Contact</p>
            <p className="font-semibold text-gray-900">{order.phone}</p>
            <p className="text-sm text-gray-500">{order.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Shipping Address</p>
            <p className="text-sm text-gray-700">
              {order?.address?.address1}, {order?.address?.city},{" "}
              {order?.address?.state} - {order?.address?.pincode}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ShoppingBag className="h-5 w-5" /> Payment Details
          </h2>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <span className="text-gray-500">Payment Mode:</span>{" "}
              <span className="font-semibold text-gray-900">{paymentMode}</span>
            </p>
            <p>
              <span className="text-gray-500">Total Amount:</span>{" "}
              <span className="font-semibold text-gray-900">
                Rs. {formatMoney(totalAmount)}
              </span>
            </p>
            <p className="sm:col-span-2">
              <span className="text-gray-500">Transaction Reference:</span>{" "}
              <span className="font-mono font-semibold text-gray-900">
                {transactionRef}
              </span>
              {transactionRef !== "-" && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copyDone ? "Copied" : "Copy"}
                </button>
              )}
            </p>
            {view === "failed" && (
              <p className="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-rose-700">
                {failureMessage}
              </p>
            )}
            {view === "pending" && (
              <p className="sm:col-span-2 rounded-lg bg-amber-50 p-3 text-amber-800">
                We haven't received a confirmation from your bank yet. Please do
                not pay again. We will update your status via Email/WhatsApp
                within 20 minutes.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {view === "success" && (
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--color-bg)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Continue Shopping
            </Link>
          )}

          {view === "failed" && (
            <>
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--color-bg)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Retry Payment
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium text-gray-700"
              >
                Contact Support
              </Link>
            </>
          )}

          {view === "pending" && (
            <>
              <button
                type="button"
                onClick={fetchOrder}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-bg)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                <RefreshCcw className="h-4 w-4" /> Refresh Status
              </button>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium text-gray-700"
              >
                <Mail className="h-4 w-4" /> View My Orders
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
