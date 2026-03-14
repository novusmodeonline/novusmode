"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader,
  OrderSummary,
  ContactDetails,
  CheckoutAddress,
  Payment,
} from "@/components";
import "../styles/checkout.css";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useProductStore } from "@/app/_zustand/store";
import { shippingCharges } from "@/helper/common";
import { useCouponStore } from "@/app/_zustand/useCouponStore"; // ✅ NEW

export default function CheckoutAccordion() {
  const [open, setOpen] = useState("contact");
  const { products, total, isHydrating, hasHydrated } = useProductStore();
  const { data: session } = useSession();
  const router = useRouter();

  const [orderId, setOrderId] = useState(null);
  const [state, setState] = useState("");
  const [addressId, setAddressId] = useState(null);

  // ✅ Coupon UI state (preview only)
  const { appliedCoupon, finalAmount: couponFinalAmount } = useCouponStore();

  /**
   * ✅ CREATE ORDER (NO AMOUNTS SENT FROM UI)
   */
  const createOrUpdateOrderObj = async (contactData, addressData) => {
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId,
          contact: {
            name: contactData.fullName,
            email: contactData.email,
            phone: contactData.phone,
          },

          address: {
            address1: addressData.address1,
            address2: addressData.address2,
            city: addressData.city,
            state: addressData.state,
            country: addressData.country,
            pincode: addressData.pincode,
            isDefault: addressData.isDefault,
            label: "HOME",
          },

          // 🔑 Coupon intent only (backend will revalidate)
          couponCode: appliedCoupon || null,

          products: products.map((item) => ({
            productId: item.id,
            title: item.title,
            slug: item.slug,
            mainImage: item.mainImage,
            price: item.price,
            quantity: item.amount,
            selectedSize: item.selectedSize,
          })),
        }),
      });

      setState(addressData.state);

      const data = await res.json();
      if (!orderId) {
        setOrderId(data.orderId);
      }
      if (!res.ok) throw new Error(data.error);

      return true;
    } catch (err) {
      console.error("ORDER ERROR:", err);
      toast.error("Failed to proceed to payment");
      return false;
    }
  };

  /**
   * ✅ Cart safety check after hydration
   */
  useEffect(() => {
    if (!hasHydrated || isHydrating) return;

    if (!products || products.length === 0) {
      toast.error("You don't have items in your cart");
      router.replace("/cart");
    }
  }, [hasHydrated, isHydrating, products, router]);

  const [completed, setCompleted] = useState({
    contact: false,
    address: false,
    payment: false,
  });

  const [savedData, setSavedData] = useState({
    contact: null,
    address: null,
    payment: null,
  });

  const toggle = (section) => {
    if (section === "address" && !completed.contact) return;
    if (section === "payment" && !completed.address) return;
    setOpen((prev) => (prev === section ? "" : section));
  };

  const handleContactNext = (data) => {
    setCompleted((prev) => ({ ...prev, contact: true }));
    setSavedData((prev) => ({ ...prev, contact: data }));
    setOpen("address");
  };

  const handleAddressNext = async (data) => {
    setCompleted((prev) => ({ ...prev, address: true }));
    setSavedData((prev) => ({ ...prev, address: data }));

    const orderObjCreated = await createOrUpdateOrderObj(
      savedData.contact,
      data,
    );
    if (orderObjCreated) setOpen("payment");
  };

  const handlePaymentDone = useCallback((data) => {
    setCompleted((prev) => ({ ...prev, payment: true }));
    setSavedData((prev) => ({ ...prev, payment: data }));
  }, []);

  /**
   * ✅ Payable amount calculation (UI-consistent, backend will recheck)
   */
  const effectiveSubtotal = appliedCoupon ? couponFinalAmount : total;

  const shippingAmount =
    effectiveSubtotal >= 500 ? 0 : shippingCharges(state, effectiveSubtotal);

  const payableAmount = effectiveSubtotal + shippingAmount;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-6">
              {/* CONTACT */}
              <AccordionItem
                title="Contact Details"
                isOpen={open === "contact"}
                completed={completed.contact}
                summary={savedData.contact}
                onClick={() => toggle("contact")}
              >
                <ContactDetails onNext={handleContactNext} />
              </AccordionItem>

              {/* ADDRESS */}
              <AccordionItem
                title="Shipping Address"
                isOpen={open === "address"}
                completed={completed.address}
                summary={savedData.address}
                onClick={() => toggle("address")}
              >
                <CheckoutAddress
                  savedAddresses={[]}
                  editAddress={savedData.address}
                  onSaveAndNext={handleAddressNext}
                />
              </AccordionItem>

              {/* PAYMENT */}
              <AccordionItem
                title="Payment"
                isOpen={open === "payment"}
                completed={completed.payment}
                summary={savedData.payment}
                onClick={() => toggle("payment")}
              >
                <Payment
                  onPay={handlePaymentDone}
                  orderData={{ ...savedData, orderId }}
                  orderTotal={payableAmount} // ✅ FIXED
                  orderId={orderId}
                />
              </AccordionItem>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="h-fit lg:sticky top-10 text-[var(--color-bg)]">
            <OrderSummary
              total={total}
              products={products}
              mode={"checkout"}
              makePurchase={() => {}}
              state={state}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AccordionItem (UNCHANGED)
 */
function AccordionItem({
  title,
  isOpen,
  completed,
  summary,
  onClick,
  children,
}) {
  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
      <button
        onClick={onClick}
        className="w-full text-left p-4 bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)]"
        aria-expanded={isOpen}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-bg)] m-0">
                {title}
              </h3>
              <div className="flex items-center gap-3 ml-4">
                {completed && (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-[var(--color-inverted-bg)] text-[var(--primary-color)]">
                    ✓
                  </span>
                )}
                <span className="text-gray-400 text-xl select-none">
                  {isOpen ? "−" : "＋"}
                </span>
              </div>
            </div>

            {completed && summary && (
              <div className="mt-3 text-sm text-gray-600 leading-tight">
                {Object.entries(summary)
                  .slice(0, 5)
                  .map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="font-medium capitalize text-gray-700">
                        {k.replace(/([A-Z])/g, " $1")}:
                      </span>{" "}
                      <span className="text-gray-600">{String(v)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </button>

      {isOpen && <div className="p-4 pt-0 bg-white">{children}</div>}
    </div>
  );
}
