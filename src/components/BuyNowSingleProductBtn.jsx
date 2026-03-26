"use client";
import { useProductStore } from "@/app/_zustand/store";
import React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const BuyNowSingleProductBtn = ({
  product,
  quantityCount,
  selectedSize,
  inStock,
}) => {
  const router = useRouter();
  const { addToCart, calculateTotals } = useProductStore();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!inStock) return;

    setLoading(true);
    try {
      await addToCart({
        id: product?.id.toString(),
        title: product?.title,
        price: product?.price,
        image: product?.mainImage,
        mainImage: product?.mainImage,
        amount: quantityCount,
        inStock: product?.inStock,
        rating: product?.rating,
        selectedSize,
        slug: product?.slug,
      });
      calculateTotals();
      toast.success("Product added to the cart");
      router.push("/cart");
    } catch (error) {
      toast.error("Error adding product to the cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={!inStock || loading}
      className="btn w-[200px] text-lg font-semibold text-[var(--color-inverted-bg)] bg-[var(--color-bg)] border border-[var(--color-bg)] hover:bg-[var(--color-inverted-bg)] hover:text-[var(--color-inverted-text)] hover:border-[var(--color-inverted-text)] transition-all ease-in transform hover:scale-110 uppercase max-[500px]:w-full h-12 px-4 py-2"
    >
      Buy Now
    </button>
  );
};

export default BuyNowSingleProductBtn;
