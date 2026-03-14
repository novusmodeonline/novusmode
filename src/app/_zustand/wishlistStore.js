import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlist: [],
      wishQuantity: 0,

      addToWishlist: (wishListObj) => {
        const state = get();
        const productInWishlist = state.wishlist.find(
          (item) => wishListObj.id === item.id
        );

        if (!productInWishlist) {
          const updatedList = [...state.wishlist, wishListObj];
          set({ wishlist: updatedList, wishQuantity: updatedList.length });
        }
      },

      removeFromWishlist: (id) => {
        const state = get();
        const updatedList = state.wishlist.filter((item) => item.id !== id);
        set({ wishlist: updatedList, wishQuantity: updatedList.length });
      },

      setWishlist: (wishlist) => {
        set({ wishlist: [...wishlist], wishQuantity: wishlist.length });
      },
    }),
    {
      name: "wishlist-storage", // localStorage key
    }
  )
);
