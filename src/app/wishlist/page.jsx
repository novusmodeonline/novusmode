"use client";
import { Breadcrumb } from "@/components";
import React, { useEffect } from "react";
import { useWishlistStore } from "../_zustand/wishlistStore";
import { useSession } from "next-auth/react";
import WishlistItem from "@/components/WishlistItem";

const WishlistPage = () => {
  const { data: session } = useSession();
  const { wishlist, setWishlist } = useWishlistStore();

  const getWishlistByUserId = async (id) => {
    const response = await fetch(`api/wishlist/${id}`, {
      cache: "no-store",
    });
    const wishlist = await response.json();

    setWishlist(wishlist || []);
  };

  const getUserByEmail = async () => {
    if (session?.user?.email) {
      const res = await fetch(`api/users/email/${session?.user?.email}`, {
        cache: "no-store",
      });
      const data = await res.json();
      getWishlistByUserId(data?.id);
    }
  };

  useEffect(() => {
    getUserByEmail();
  }, [session?.user?.email]);

  return (
    <div className="bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)] min-h-screen px-6 md:px-24 py-12">
      {wishlist && wishlist.length === 0 ? (
        <h3 className="text-center text-3xl md:text-4xl py-10 max-sm:text-2xl max-[400px]:text-xl">
          No items found in the wishlist
        </h3>
      ) : (
        <div className="max-w-screen-2xl mx-auto bg-white p-6 rounded-xl space-y-6">
          <div className="mb-4">
            <Breadcrumb />
          </div>

          <h1 className="text-center text-[var(--color-bg)] text-4xl md:text-5xl font-bold mb-8">
            WISHLIST
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist?.map((item, index) => (
              <WishlistItem
                key={index}
                id={item?.product?.id}
                title={item?.product?.title}
                price={item?.product?.price}
                image={item?.product?.mainImage}
                slug={item?.product?.slug}
                stockAvailabillity={item?.product?.inStock}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
