"use client";
import React, { useEffect, Suspense } from "react";
import { OrderConfirmation } from "@/components";
import { useSearchParams } from "next/navigation";
import { useProductStore } from "@/app/_zustand/store";

const OrderConfirmationInner = () => {
  const { clearCart } = useProductStore();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (searchParams.get("clearCart") === "1") {
      clearCart();
    }
  }, [searchParams, clearCart]);

  return <OrderConfirmation orderId={orderId} />;
};

const OrderConfirmationPage = () => {
  return (
    <Suspense fallback={<div className="py-32 text-center text-lg">Loading order details...</div>}>
      <OrderConfirmationInner />
    </Suspense>
  );
};

export default OrderConfirmationPage;
