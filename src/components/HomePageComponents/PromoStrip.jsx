"use client";
import { MdLocalShipping } from "react-icons/md";

const PromoStrip = () => (
  <div className="w-full bg-[var(--color-bg)] text-white py-2 px-4 flex items-center justify-center gap-3 text-base font-semibold shadow-md">
    <MdLocalShipping className="text-xl" />
    <span>Free Shipping on Orders of ₹500 or Above!</span>
  </div>
);

export default PromoStrip;
