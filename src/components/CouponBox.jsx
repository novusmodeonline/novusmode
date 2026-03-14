"use client";

import { useState } from "react";
import { useCouponStore } from "@/app/_zustand/useCouponStore";

export default function CouponBox() {
  const [code, setCode] = useState("");

  const {
    appliedCoupon,
    discountAmount,
    isApplying,
    error,
    applyCoupon,
    removeCoupon,
  } = useCouponStore();

  return (
    <div className="border rounded-lg p-4 bg-white">
      {!appliedCoupon ? (
        <>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter coupon code"
              className="border px-3 py-2 rounded w-full"
              disabled={isApplying}
            />
            <button
              onClick={() => applyCoupon(code)}
              disabled={isApplying || !code}
              className="px-4 py-2 bg-black text-white rounded"
            >
              Apply
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-700 font-semibold">
              Coupon {appliedCoupon} applied
            </p>
            <p className="text-sm text-gray-600">You saved ₹{discountAmount}</p>
          </div>
          <button
            onClick={removeCoupon}
            disabled={isApplying}
            className="text-sm text-red-600 underline"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
