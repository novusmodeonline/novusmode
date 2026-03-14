import toast from "react-hot-toast";

export const removeFromWishlistFunc = async (
  productId,
  removeFromWishlistFunc,
  session
) => {
  if (session?.user?.email) {
    // sending fetch request to get user id because we will need to delete wish item
    const userResponse = await fetch(
      `/api/users/email/${session?.user?.email}`,
      {
        cache: "no-store",
      }
    ).then((response) => response.json());
    if (!userResponse?.id) {
      toast.error("User not found. Please log in.");
      return;
    }
    const wishList = userResponse.Wishlist.find(
      (item) => productId == item.productId
    );

    // sending fetch request to delete product from wishlist
    const deleteResponse = await fetch(`/api/wishlist`, {
      method: "DELETE",
      body: JSON.stringify({ wishlistId: wishList?.id }),
    }).then((response) => response.json());
    if (deleteResponse.error) {
      toast.error("Failed to remove product from wishlist");
      return;
    }
    removeFromWishlistFunc(deleteResponse?.id);
    toast.success("Product removed from the wishlist");
  }
};

import { useWishlistStore } from "@/app/_zustand/wishlistStore";

export const syncWishlistAfterLogin = async (userId) => {
  try {
    const res = await fetch(`/api/wishlist/${userId}`, {
      cache: "no-store",
    });
    const wishlistData = await res.json();

    if (!wishlistData || wishlistData.length === 0) return;

    const wishList = wishlistData.find((item) => item.userId === userId);

    if (wishList && wishList.products) {
      const products = wishList.products;
      useWishlistStore.getState().setWishlist(products); // Zustand + localStorage
    }
  } catch (error) {
    console.error("Error syncing wishlist after login:", error);
  }
};
