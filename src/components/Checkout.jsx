"use client";

import { OrderSummary, Loader, PaymentCOD } from "@/components";
import { useProductStore } from "@/app/_zustand/store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
  isValidCardNumber,
  isValidCreditCardCVVOrCVC,
  isValidCreditCardExpirationDate,
  isValidEmailAddressFormat,
  isValidNameOrLastname,
} from "@/scripts/utils";

const Checkout = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    company: "",
    adress: "",
    apartment: "",
    city: "",
    country: "",
    postalCode: "",
    orderNotice: "",
  });

  const { products, total, clearCart } = useProductStore();
  const router = useRouter();

  useEffect(() => {
    if (products.length === 0) {
      toast.error("You don't have items in your cart");
      router.push("/cart");
    }
  }, []);

  const makePurchase = async () => {
    setIsLoading(true);
    try {
      const f = checkoutForm;
      if (
        f.name &&
        f.lastname &&
        f.phone &&
        f.email &&
        f.company &&
        f.adress &&
        f.apartment &&
        f.city &&
        f.country &&
        f.postalCode
      ) {
        if (!isValidNameOrLastname(f.name)) return toast.error("Invalid name");
        if (!isValidNameOrLastname(f.lastname))
          return toast.error("Invalid lastname");
        if (!isValidEmailAddressFormat(f.email))
          return toast.error("Invalid email");

        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: f.name,
            lastname: f.lastname,
            phone: f.phone,
            email: f.email,
            company: f.company,
            address: f.adress,
            apartment: f.apartment,
            postalCode: f.postalCode,
            status: "processing",
            total,
            city: f.city,
            country: f.country,
            orderNotice: f.orderNotice,
            orderItems: products,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              const orderId = data.order.id;
              clearCart();
              toast.success("Order created successfully");
              router.push(`/order-confirmation?orderId=${orderId}`);
            } else {
              toast.error("Order not processed");
            }
          });
      } else {
        toast.error("Please fill all required fields");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addOrderProduct = async (orderId, productId, quantity) => {
    await fetch("/api/order-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerOrderId: orderId, productId, quantity }),
    });
  };

  const renderField = (field, label, index) => (
    <div className="relative" key={index}>
      <input
        id={field}
        type="text"
        value={checkoutForm[field]}
        onChange={(e) =>
          setCheckoutForm({ ...checkoutForm, [field]: e.target.value })
        }
        className="peer w-full border border-[color:var(--color-inverted-text)] px-3 pt-6 pb-2 rounded placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[color:var(--color-bg)]"
        placeholder={label}
      />
      <label
        htmlFor={field}
        className="absolute left-3 top-1.5 text-sm text-[color:var(--color-inverted-text)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-sm peer-focus:text-[color:var(--color-inverted-text)]"
      >
        {label}
      </label>
    </div>
  );

  return (
    <div className="bg-white">
      {isLoading && <Loader />}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[color:var(--color-inverted-text)]">
                Contact Information
              </h2>
              {"name lastname phone email"
                .split(" ")
                .map((field, index) =>
                  renderField(
                    field,
                    field.charAt(0).toUpperCase() + field.slice(1),
                    index,
                  ),
                )}
            </div>

            <hr className="border-[color:var(--color-inverted-text)]" />

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[color:var(--color-inverted-text)]">
                Shipping Address
              </h2>
              {"company adress apartment city country postalCode"
                .split(" ")
                .map((field, index) =>
                  renderField(
                    field,
                    field.charAt(0).toUpperCase() + field.slice(1),
                    index,
                  ),
                )}
              <div className="relative">
                <textarea
                  id="orderNotice"
                  value={checkoutForm.orderNotice}
                  onChange={(e) =>
                    setCheckoutForm({
                      ...checkoutForm,
                      orderNotice: e.target.value,
                    })
                  }
                  className="peer w-full min-h-[100px] border border-[color:var(--color-inverted-text)] px-3 pt-6 pb-2 rounded placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[color:var(--color-bg)]"
                  placeholder="Order Notice"
                ></textarea>
                <label
                  htmlFor="orderNotice"
                  className="absolute left-3 top-1.5 text-sm text-[color:var(--color-inverted-text)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-sm peer-focus:text-[color:var(--color-inverted-text)]"
                >
                  Order Notice
                </label>
              </div>
            </div>

            <hr className="border-[color:var(--color-inverted-text)]" />

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[color:var(--color-inverted-text)]">
                Payment Details
              </h2>
              <PaymentCOD />
            </div>

            <button
              type="button"
              onClick={makePurchase}
              className="w-full rounded-md border border-transparent bg-[color:var(--color-bg)] px-6 py-3 text-lg font-medium text-white hover:opacity-90"
            >
              Pay Now
            </button>
          </div>

          <div className="h-fit lg:sticky top-10  text-[var(--color-bg)]">
            <OrderSummary
              total={total}
              products={products}
              mode={"checkout"}
              makePurchase={makePurchase}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
