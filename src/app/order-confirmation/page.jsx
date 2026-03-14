"use client";
import React, { useEffect } from "react";
import { OrderConfirmation } from "@/components";
import { useSearchParams } from "next/navigation";
import { useProductStore } from "@/app/_zustand/store";

const OrderConfirmationPage = () => {
  const { clearCart } = useProductStore();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    console.log("searchParams.clearCart : ", searchParams.get("clearCart"));
    if (searchParams.get("clearCart") === "1") {
      clearCart();
    }
  }, []);

  return <OrderConfirmation orderId={orderId} />;
};

export default OrderConfirmationPage;
