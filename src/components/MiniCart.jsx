"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import CartItem from "@/components/CartItem";

const MiniCart = ({ isOpen, onClose, cartData, onCountChange, fetchCart }) => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const cartRef = useRef(null);

  // ── Sync passed cartData to local state ──────────────────────────────────
  useEffect(() => {
    if (cartData?.items) {
      setItems(cartData.items);
    }
  }, [cartData]);

  // ── Cart mutations (optimistic update + refetch) ────────────────────────
  const handleIncrease = useCallback(
    async (item) => {
      const prev = items;
      const newQty = item.quantity + 1;
      const optimistic = items.map((i) =>
        i.id === item.id ? { ...i, quantity: newQty } : i,
      );
      setItems(optimistic);
      onCountChange?.(optimistic.reduce((s, i) => s + i.quantity, 0));

      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            quantity: newQty,
            selectedSize: item.selectedSize || "",
          }),
        });
        if (!res.ok) throw new Error();
        // Refetch to sync
        await fetchCart?.();
      } catch {
        setItems(prev);
        onCountChange?.(prev.reduce((s, i) => s + i.quantity, 0));
      }
    },
    [items, onCountChange, fetchCart],
  );

  const handleDecrease = useCallback(
    async (item) => {
      const prev = items;
      if (item.quantity <= 1) {
        const optimistic = items.filter((i) => i.id !== item.id);
        setItems(optimistic);
        onCountChange?.(optimistic.reduce((s, i) => s + i.quantity, 0));
        try {
          const res = await fetch("/api/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: item.productId,
              selectedSize: item.selectedSize || "",
            }),
          });
          if (!res.ok) throw new Error();
          // Refetch to sync
          await fetchCart?.();
        } catch {
          setItems(prev);
          onCountChange?.(prev.reduce((s, i) => s + i.quantity, 0));
        }
        return;
      }
      const newQty = item.quantity - 1;
      const optimistic = items.map((i) =>
        i.id === item.id ? { ...i, quantity: newQty } : i,
      );
      setItems(optimistic);
      onCountChange?.(optimistic.reduce((s, i) => s + i.quantity, 0));
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            quantity: newQty,
            selectedSize: item.selectedSize || "",
          }),
        });
        if (!res.ok) throw new Error();
        // Refetch to sync
        await fetchCart?.();
      } catch {
        setItems(prev);
        onCountChange?.(prev.reduce((s, i) => s + i.quantity, 0));
      }
    },
    [items, onCountChange, fetchCart],
  );

  const handleRemove = useCallback(
    async (item) => {
      const prev = items;
      const optimistic = items.filter((i) => i.id !== item.id);
      setItems(optimistic);
      onCountChange?.(optimistic.reduce((s, i) => s + i.quantity, 0));
      try {
        const res = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            selectedSize: item.selectedSize || "",
          }),
        });
        if (!res.ok) throw new Error();
        // Refetch to sync
        await fetchCart?.();
      } catch {
        setItems(prev);
        onCountChange?.(prev.reduce((s, i) => s + i.quantity, 0));
      }
    },
    [items, onCountChange, fetchCart],
  );

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  const subtotal = items.reduce(
    (sum, item) =>
      sum + (item.unitPriceSnapshot ?? item.product.price) * item.quantity,
    0,
  );

  return (
    <div
      ref={cartRef}
      className={[
        "absolute top-full right-0 mt-2 w-96 bg-white rounded-lg border border-gray-200 shadow-xl z-50",
        "transition-all duration-200 ease-out origin-top-right",
        isOpen
          ? "opacity-100 scale-100 pointer-events-auto visible"
          : "opacity-0 scale-95 pointer-events-none invisible",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[var(--color-bg)] rounded-t-lg">
        <h3 className="text-sm font-bold text-[var(--color-text)] tracking-tight">
          Your Cart
          {items.length > 0 && (
            <span className="ml-2 text-xs font-normal opacity-75">
              ({items.length})
            </span>
          )}
        </h3>
        <button
          onClick={onClose}
          aria-label="Close cart"
          className="p-1 text-[var(--color-text)] hover:bg-white/10 rounded transition-colors"
        >
          <FiX size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-gray-100 rounded-full p-3">
                <ShoppingBag className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-800">
              Your cart is empty
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Add something to get started!
            </p>
            <Link
              href="/shop"
              onClick={onClose}
              className="mt-4 inline-block px-4 py-2 rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <CartItem
                key={`${item.productId}::${item.selectedSize}`}
                item={item}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onRemove={handleRemove}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer — only shown when cart has items */}
      {items.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-4 bg-white rounded-b-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Subtotal</span>
            <span className="text-sm font-bold text-gray-900">
              ₹{subtotal.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleCheckout}
              className="w-full py-2 rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              Checkout
            </button>
            <Link
              href="/cart"
              onClick={onClose}
              className="w-full py-2 rounded-lg border border-[var(--color-bg)] text-[var(--color-inverted-text)] font-semibold text-xs text-center hover:bg-gray-50 transition-colors"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniCart;
