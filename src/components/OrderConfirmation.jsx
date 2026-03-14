"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Truck, CreditCard, ShoppingBag } from "lucide-react";
import Link from "next/link";

function shortOrderId(id) {
  return id ? id.slice(0, 8).toUpperCase() : "";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-14 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* ✅ HEADER */}
        <div className="bg-[var(--color-bg)] text-white p-10 text-center">
          <CheckCircle size={64} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-1">Thank you for your order</h1>
          <p className="opacity-90">
            Order ID: <b>#{shortOrderId(order.id)}</b>
          </p>
        </div>

        <div className="p-8 space-y-10">
          {/* ✅ STATUS STRIP */}
          <div className="flex flex-col sm:flex-row justify-between bg-gray-50 rounded-xl p-5 text-sm gap-3">
            <div>
              <b>Status:</b> {order.status}
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

          {/* ✅ ADDRESS & PAYMENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ✅ DELIVERY */}
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

            {/* ✅ PAYMENT */}
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

                {order.payment && (
                  <>
                    <p>
                      <b>Status:</b> {order.payment.status}
                    </p>
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

          {/* ✅ FOOTER CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t">
            <p className="text-sm text-gray-500">
              You’ll receive shipping updates on WhatsApp & Email.
            </p>

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
  );
}
