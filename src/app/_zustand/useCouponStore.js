import { create } from "zustand";

export const useCouponStore = create((set) => ({
  appliedCoupon: null, // "MAGICDISCOUNT"
  originalAmount: null,
  discountAmount: 0,
  finalAmount: null,
  isApplying: false,
  error: null,

  applyCoupon: async (couponCode) => {
    try {
      set({ isApplying: true, error: null });

      const res = await fetch("/api/coupon/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ couponCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        set({
          appliedCoupon: null,
          discountAmount: 0,
          error: data.message || "Coupon cannot be applied",
          isApplying: false,
        });
        return;
      }

      set({
        appliedCoupon: data.couponCode,
        originalAmount: data.originalAmount,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
        isApplying: false,
        error: null,
      });
    } catch (err) {
      set({
        error: "Something went wrong",
        isApplying: false,
      });
    }
  },

  removeCoupon: async () => {
    try {
      set({ isApplying: true, error: null });

      const res = await fetch("/api/coupon/remove", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      set({
        appliedCoupon: null,
        originalAmount: data.originalAmount,
        discountAmount: 0,
        finalAmount: data.finalAmount,
        isApplying: false,
        error: null,
      });
    } catch (err) {
      set({
        error: "Something went wrong",
        isApplying: false,
      });
    }
  },

  clearCouponState: () =>
    set({
      appliedCoupon: null,
      originalAmount: null,
      discountAmount: 0,
      finalAmount: null,
      error: null,
    }),
}));
