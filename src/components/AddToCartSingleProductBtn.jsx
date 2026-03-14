"use client";

import React, { useState } from "react";
import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import Loader from "@/components/Loader"; // <-- Import your Loader
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const AddToCartSingleProductBtn = ({
  product,
  quantityCount,
  selectedSize,
  inStock,
}) => {
  const { addToCart, calculateTotals } = useProductStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const callbackUrl = (() => {
    const qs = searchParams?.toString();
    return qs ? `${pathname}?${qs}` : pathname || "/";
  })();

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const res = await addToCart({
        id: product?.id.toString(),
        title: product?.title,
        price: product?.price,
        image: product?.mainImage,
        amount: quantityCount,
        inStock: product?.inStock,
        rating: product?.rating,
        selectedSize,
        slug: product?.slug,
      });
      if (res.status == 401) {
        toast.error("Please log in to proceed");
        // 2) after 1s, redirect to login with a callback back to current page
        setTimeout(() => {
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }, 1000);
        return;
      }
      if (!res.ok) {
        throw new Error();
      }
      calculateTotals();
      toast.success("Product added to the cart");
    } catch (error) {
      toast.error("Error adding product to the cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className={`btn text-lg font-semibold text-[var(--color-bg)] bg-transparent border border-[var(--color-bg)] transition-all ease-in transform hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] hover:border-transparent max-[500px]:w-full w-[200px] h-12 px-4 py-2 ${
        loading ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
      } flex items-center justify-center gap-2`} // <-- Add flex, items-center, gap for better layout
    >
      {loading ? (
        <>
          <span className="w-5 h-5 mr-2">
            <Loader text="" />{" "}
            {/* text="" so it only shows spinner, not "Loading..." */}
          </span>
          Adding...
        </>
      ) : (
        "Add to cart"
      )}
    </button>
  );
};

export default AddToCartSingleProductBtn;
