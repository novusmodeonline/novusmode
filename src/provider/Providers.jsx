"use client";
import { Toaster } from "react-hot-toast";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { syncWishlistAfterLogin } from "@/scripts/wishlistHelper";

const Providers = ({ children }) => {
  const { data: session } = useSession();

  useEffect(() => {
    const initWishlist = async () => {
      if (session?.user?.email) {
        const res = await fetch(`/api/users/email/${session.user.email}`, {
          cache: "no-store",
        });
        const data = await res.json();
        await syncWishlistAfterLogin(data?.id);
      }
    };
    initWishlist();
  }, [session?.user?.email]);

  return (
    <>
      <Toaster
        toastOptions={{
          className: "",
          style: {
            fontSize: "17px",
          },
        }}
      />
      {children}
    </>
  );
};

export default Providers;
