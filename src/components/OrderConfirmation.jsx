"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import RefreshStatusButton from "@/components/RefreshStatusButton";

function shortOrderId(id) {
  return id ? id.slice(0, 8).toUpperCase() : "";
}

function getStatusConfig(status) {
  const s = String(status || "").toLowerCase();

  if (s === "paid" || s === "success") {
    return {
      bg: "bg-green-600",
      Icon: CheckCircle,
      title: "Payment Successful",
      subtitle: "Thank you! Your order has been placed.",
      badge: "bg-green-100 text-green-700",
      label: "Paid",
    };
  }

  if (s === "failed" || s === "aborted") {
    return {
      bg: "bg-red-600",
      Icon: XCircle,
      title: "Payment Failed",
      subtitle: "Your order was not completed. Please try again.",
      badge: "bg-red-100 text-red-700",
      label: "Failed",
    };
  }

  if (s === "pending" || s === "initiated" || s === "unknown") {
    return {
      bg: "bg-amber-500",
      Icon: Clock,
      title: "Payment Pending",
      subtitle:
        "We're awaiting payment confirmation. We'll notify you shortly.",
      badge: "bg-amber-100 text-amber-700",
      label: "Pending",
    };
  }

  // default (e.g. COD / processing)
  return {
    bg: "bg-[var(--color-bg)]",
    Icon: CheckCircle,
    title: "Order Received",
    subtitle: "Thank you for your order!",
    badge: "bg-gray-100 text-gray-700",
    label: status || "Processing",
  };
}

export default function OrderConfirmation({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setOrder(data.order);
    } catch (err) {
      console.error("Order fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading)
    return (
      <div className="py-32 text-center text-lg">Fetching your order...</div>
    );

  if (!order)
    return <div className="py-32 text-center text-lg">Order not found.</div>;

  const cfg = getStatusConfig(order.status);
  const { Icon } = cfg;
  const paymentReference =
    order?.payment?.gatewayId || order?.payment?.rrn || order?.id;
  const paymentReferenceLabel = order?.payment?.gatewayId
    ? "Gateway Txn ID"
    : order?.payment?.rrn
      ? "RRN"
      : "Order Reference";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-14 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* HEADER — dynamic per status */}
        <div className={`${cfg.bg} text-white p-10 text-center`}>
          <Icon size={64} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-1">{cfg.title}</h1>
          <p className="opacity-90 mb-2">{cfg.subtitle}</p>
          <p className="opacity-80 text-sm">
            Order ID: <b>#{shortOrderId(order.id)}</b>
          </p>
          {(order.status === "pending" ||
            order.status === "initiated" ||
            order.status === "unknown") && (
            <div className="mt-6">
              <RefreshStatusButton
                orderId={order.id}
                onResult={(result) => {
                  if (
                    result.status === "success" ||
                    result.status === "failed"
                  ) {
                    fetchOrder();
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="p-8 space-y-10">
          {/* STATUS STRIP */}
          <div className="flex flex-col sm:flex-row justify-between bg-gray-50 rounded-xl p-5 text-sm gap-3 items-center">
            <div className="flex items-center gap-2">
              <b>Status:</b>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}
              >
                {cfg.label}
              </span>
            </div>
            <div>
              <b>Order Date:</b> {new Date(order.createdAt).toLocaleString()}
            </div>
            <div>
              <b>Contact:</b> {order.phone}
            </div>
            <div>
              <b>Email:</b> {order.email}
            </div>
          </div>

          {/* ✅ PRODUCTS */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag size={22} /> Items in your order
            </h2>

            <div className="space-y-4">
              {order.products.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-5 border rounded-2xl p-4 hover:shadow-md transition"
                >
                  <img
                    src={`/images${item.mainImage}`}
                    alt={item.title}
                    className="w-24 h-24 rounded-xl object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-gray-500">
                      Size: {item.selectedSize || "N/A"} {item.sizeMetric || ""}
                    </p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <div className="font-bold text-lg">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ADDRESS & PAYMENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DELIVERY */}
            <div className="border rounded-2xl p-6">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <Truck size={20} /> Delivery Address
              </h3>

              <p className="text-sm leading-relaxed">
                <b>{order.address.name}</b> <br />
                {order.address.address1},{" "}
                {order.address.address2 && `${order.address.address2},`} <br />
                {order.address.city}, {order.address.state} -{" "}
                {order.address.pincode} <br />
                {order.address.country}
              </p>

              {order.address.landmark && (
                <p className="text-xs text-gray-500 mt-1">
                  Landmark: {order.address.landmark}
                </p>
              )}
            </div>

            {/* PAYMENT */}
            <div className="border rounded-2xl p-6">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <CreditCard size={20} /> Payment
              </h3>

              <div className="space-y-1 text-sm">
                <p>
                  <b>Method:</b> {order.paymentMethod || "Pending"}
                </p>
                <p>
                  <b>Total:</b> ₹{order.amount}
                </p>
                <p>
                  <b>{paymentReferenceLabel}:</b> {paymentReference}
                </p>

                {order.payment && (
                  <>
                    <div className="flex items-center gap-2">
                      <b>Status:</b>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusConfig(order.payment.status).badge}`}
                      >
                        {order.payment.status}
                      </span>
                    </div>
                    {order.payment.mode && (
                      <p>
                        <b>Mode:</b> {order.payment.mode}
                      </p>
                    )}
                    {order.payment.rrn && (
                      <p>
                        <b>RRN:</b> {order.payment.rrn}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t">
            <p className="text-sm text-gray-500">
              {order.status === "paid" || order.status === "success"
                ? "You'll receive shipping updates on WhatsApp & Email."
                : order.status === "failed" || order.status === "aborted"
                  ? "Please retry checkout or contact support if the issue persists."
                  : "We'll notify you once your payment is confirmed."}
            </p>

            <div className="flex gap-3">
              {(order.status === "failed" || order.status === "aborted") && (
                <Link
                  href="/cart"
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Retry Payment
                </Link>
              )}
              <Link
                href="/shop"
                className="bg-[var(--color-bg)] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
