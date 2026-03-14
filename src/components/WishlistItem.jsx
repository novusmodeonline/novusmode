"use client";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaHeartCrack } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { removeFromWishlistFunc } from "@/scripts/wishlistHelper";

const WishlistItem = ({
  id,
  title,
  price,
  image,
  slug,
  stockAvailabillity,
}) => {
  const { data: session } = useSession();
  const { removeFromWishlist } = useWishlistStore();
  const router = useRouter();
  const [userId, setUserId] = useState();

  const openProduct = () => router.push(`/product/${slug}`);

  const getUserByEmail = async () => {
    if (session?.user?.email) {
      const res = await fetch(`/api/users/email/${session.user.email}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setUserId(data?.id);
    }
  };

  const deleteItemFromWishlist = async () => {
    removeFromWishlistFunc(id, removeFromWishlist, session);
  };

  useEffect(() => {
    getUserByEmail();
  }, [session?.user?.email]);

  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all bg-white">
      {/* Cross (remove) button */}
      <button
        onClick={deleteItemFromWishlist}
        className="
      absolute top-3 right-3 z-10 
      w-7 h-7 flex items-center justify-center 
      rounded-full 
      bg-[var(--color-bg)] text-[var(--color-text)]
      hover:bg-[var(--color-inverted-bg)] hover:text-[var(--color-inverted-text)]
      shadow-md
      transition-all
      focus:outline-none
    "
        aria-label="Remove from wishlist"
      >
        <FaTimes size={14} />
      </button>

      <div className="cursor-pointer" onClick={openProduct}>
        <Image
          src={`/images/${image}`}
          alt={title}
          width={300}
          height={300}
          className="w-full h-48 object-contain bg-white p-4"
        />
      </div>

      <div className="p-4 text-center">
        <h3
          onClick={openProduct}
          className="font-semibold text-[var(--color-inverted-text)] text-base mb-2 cursor-pointer"
        >
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-2">₹{price}</p>
        <p
          className={`text-sm font-medium mb-4 ${
            stockAvailabillity ? "text-green-600" : "text-red-500"
          }`}
        >
          {stockAvailabillity ? "In Stock" : "Out of Stock"}
        </p>
      </div>
    </div>
  );
};

export default WishlistItem;
