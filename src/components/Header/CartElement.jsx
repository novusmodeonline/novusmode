"use client";
import Link from "next/link";
import React from "react";
import { FiShoppingCart } from "react-icons/fi";
import { useProductStore } from "@/app/_zustand/store";

const CartElement = () => {
  const { allQuantity } = useProductStore();
  return (
    <div className="relative">
      <Link href="/cart">
        <FiShoppingCart size={24} />
        <span className="block w-4 h-4 bg-white text-black font-semibold text-\[13px\] rounded-full flex justify-center items-center absolute top-[-10px] right-[-16px]">
          {allQuantity}
        </span>
      </Link>
    </div>
  );
};

export default CartElement;
