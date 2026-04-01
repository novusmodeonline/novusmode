"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { LockKeyhole, ShieldCheck, BadgeCheck } from "lucide-react";
import SabPaisaButton from "@/components/SabPaisaButton";

const PLATFORM_FEE = 9;

export default function CheckoutForm() {
  const [preparedPayment, setPreparedPayment] = useState(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      amount: "",
      acceptedTerms: false,
    },
  });

  const amountValue = Number(watch("amount") || 0);
  const acceptedTerms = watch("acceptedTerms");
  const subtotal = Number.isFinite(amountValue) ? amountValue : 0;
  const platformFee = subtotal > 0 ? PLATFORM_FEE : 0;
  const totalAmount = subtotal + platformFee;

  const onSubmit = async (values) => {
    setIsPreparingPayment(true);
    setPreparedPayment(null);

    await new Promise((resolve) => setTimeout(resolve, 700));

    setPreparedPayment({
      payerName: values.fullName.trim(),
      payerEmail: values.email.trim(),
      payerMobile: values.mobile.trim(),
      amount: totalAmount.toFixed(2),
      clientTxnId: `txn_${Date.now()}`,
    });
    setIsPreparingPayment(false);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(238,242,255,0.95),_rgba(248,250,252,1)_35%,_rgba(255,255,255,1)_70%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-start">
        <section className="flex-1 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Secure Payment
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Checkout
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Enter your billing details to continue with SabPaisa. Your
              transaction is protected with SSL encryption and secure gateway
              processing.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-6 py-6 sm:px-8 sm:py-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Aman Sharma"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Enter at least 2 characters",
                    },
                  })}
                />
                {errors.fullName && (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
                  {...register("email", {
                    required: "Email address is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
                  {...register("mobile", {
                    required: "Mobile number is required",
                    pattern: {
                      value: /^\d{10}$/,
                      message: "Mobile number must be exactly 10 digits",
                    },
                  })}
                />
                {errors.mobile && (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.mobile.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Amount
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="499.00"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
                  {...register("amount", {
                    required: "Amount is required",
                    validate: (value) =>
                      Number(value) > 0 || "Enter an amount greater than zero",
                  })}
                />
                {errors.amount && (
                  <p className="mt-2 text-sm text-rose-600">
                    {errors.amount.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                  {...register("acceptedTerms", {
                    required: "You must accept the Terms & Conditions",
                  })}
                />
                <span>
                  I agree to the Terms & Conditions and authorize this secure
                  payment.
                </span>
              </label>
              {errors.acceptedTerms && (
                <p className="mt-2 text-sm text-rose-600">
                  {errors.acceptedTerms.message}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                <LockKeyhole className="h-4 w-4" />
                SSL Secured Checkout
              </div>

              <button
                type="submit"
                disabled={!isValid || !acceptedTerms || isPreparingPayment}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPreparingPayment ? "Preparing Payment..." : "Proceed to Pay"}
              </button>
            </div>

            {preparedPayment && (
              <div className="mt-8 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 p-5">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  <BadgeCheck className="h-4 w-4" />
                  Ready to Pay
                </div>
                <p className="mb-4 text-sm leading-6 text-slate-700">
                  Your details are validated. Continue to the SabPaisa gateway
                  to complete the payment.
                </p>
                <SabPaisaButton
                  payerName={preparedPayment.payerName}
                  payerEmail={preparedPayment.payerEmail}
                  payerMobile={preparedPayment.payerMobile}
                  amount={preparedPayment.amount}
                  clientTxnId={preparedPayment.clientTxnId}
                  orderId={preparedPayment.clientTxnId}
                />
              </div>
            )}
          </form>
        </section>

        <aside className="w-full lg:sticky lg:top-8 lg:max-w-sm">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="border-b border-white/10 px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Order Summary
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Payment Details</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Review the final amount before continuing to the payment
                gateway.
              </p>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Platform Fee</span>
                <span>Rs. {platformFee.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span>Rs. {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-300">
              Payments are encrypted and processed securely. Confirm your name,
              email, mobile number, and amount before continuing.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
