"use client";

import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaHeartCrack, FaHeart } from "react-icons/fa6";
import { removeFromWishlistFunc } from "@/scripts/wishlistHelper";
import Loader from "@/components/Loader"; // Use your loader, or replace as needed

const AddToWishlistBtn = ({ product }) => {
  const { data: session } = useSession();
  const { addToWishlist, removeFromWishlist, wishlist } = useWishlistStore();
  const [isProductInWishlist, setIsProductInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const addToWishlistFun = async () => {
    if (isWishlistLoading) return;
    setIsWishlistLoading(true);
    try {
      if (session?.user?.email) {
        const userResponse = await fetch(
          `/api/users/email/${session.user.email}`,
          { cache: "no-store" }
        );
        const user = await userResponse.json();
        const userId = user?.id;
        if (!userId) return toast.error("User not found. Please log in.");

        const wishlistResponse = await fetch(`/api/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product?.id, userId }),
        });
        if (!wishlistResponse.ok)
          return toast.error("Failed to add product to wishlist");

        const wishlistItem = await wishlistResponse.json();
        addToWishlist(wishlistItem);
        toast.success("Product added to the wishlist");
      } else {
        toast.error(
          "You need to be logged in to add a product to the wishlist"
        );
      }
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const removeFromWishlistFun = async () => {
    if (isWishlistLoading) return;
    setIsWishlistLoading(true);
    try {
      await removeFromWishlistFunc(product.id, removeFromWishlist, session);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const isInWishlist = async () => {
    if (session?.user?.email) {
      const userRes = await fetch(`/api/users/email/${session.user.email}`, {
        cache: "no-store",
      });
      const user = await userRes.json();
      const res = await fetch(`/api/wishlist/${user?.id}/${product?.id}`);
      const data = await res.json();
      setIsProductInWishlist(Boolean(data[0]?.id));
    }
  };

  useEffect(() => {
    isInWishlist();
    // eslint-disable-next-line
  }, [session?.user?.email, wishlist]);

  return (
    <div
      className={`flex items-center gap-x-2 cursor-pointer min-h-[32px]`}
      style={{ color: "var(--color-bg)" }}
      onClick={isProductInWishlist ? removeFromWishlistFun : addToWishlistFun}
      disabled={isWishlistLoading}
    >
      {isWishlistLoading ? (
        <span className="w-5 h-5 flex items-center">
          {/* Inline small spinner */}
          <Loader />
        </span>
      ) : isProductInWishlist ? (
        <>
          <FaHeartCrack className="text-xl" />
          <span className="text-lg">REMOVE FROM WISHLIST</span>
        </>
      ) : (
        <>
          <FaHeart className="text-xl" />
          <span className="text-lg">ADD TO WISHLIST</span>
        </>
      )}
    </div>
  );
};

export default AddToWishlistBtn;
