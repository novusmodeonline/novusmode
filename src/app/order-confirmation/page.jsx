"use client";
import React, { useEffect } from "react";
import { OrderConfirmation } from "@/components";
import { useSearchParams } from "next/navigation";
import { useProductStore } from "@/app/_zustand/store";

const OrderConfirmationPage = () => {
  const { clearCart } = useProductStore();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  // Removed redundant cart clearing logic. Cart is cleared only after successful order creation.

  return <OrderConfirmation orderId={orderId} />;
};

export default OrderConfirmationPage;
