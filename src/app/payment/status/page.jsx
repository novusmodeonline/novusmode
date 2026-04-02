"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PaymentStatusInner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "error";
  const orderId = searchParams.get("id") || "";

  const isFailed = status === "failed";
  const isError = status === "error";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          {isFailed || isError ? (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"
                />
              </svg>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isFailed ? "Payment Failed" : "Payment Error"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isFailed
              ? "Your payment could not be completed. No amount has been charged."
              : "Something went wrong while processing your payment. Please try again."}
          </p>

          {orderId && (
            <p className="mt-2 text-xs text-gray-400">
              Order reference: <span className="font-mono">{orderId}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {orderId && (
            <Link
              href={`/checkout`}
              className="w-full inline-flex justify-center items-center px-5 py-2.5 bg-[var(--color-bg)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
            >
              Try Again
            </Link>
          )}
          <Link
            href="/"
            className="w-full inline-flex justify-center items-center px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Return to Home
          </Link>
          <Link
            href="/profile"
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            View my orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      }
    >
      <PaymentStatusInner />
    </Suspense>
  );
}
