"use client";

import React, { useState } from "react";
import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import Loader from "@/components/Loader"; // <-- Import your Loader

const AddToCartSingleProductBtn = ({
  product,
  quantityCount,
  selectedSize,
  inStock,
}) => {
  const { addToCart, calculateTotals } = useProductStore();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
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
