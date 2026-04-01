"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiShoppingCart } from "react-icons/fi";
import MiniCart from "@/components/MiniCart";

const CartIcon = ({
  cartCount,
  cartData,
  onCountChange,
  onCartDataChange,
  fetchCart,
  openFromAddCart,
  setOpenFromAddCart,
}) => {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const autoCloseTimeoutRef = useRef(null);

  // ── Detect desktop/mobile on mount and window resize ──
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (autoCloseTimeoutRef.current)
        clearTimeout(autoCloseTimeoutRef.current);
    };
  }, []);

  // ── Auto-open + auto-close when item is added to cart ──
  useEffect(() => {
    if (!openFromAddCart || !isDesktop) return;

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);

    setIsOpen(true);
    setOpenFromAddCart(false); // Reset flag

    // Auto-close after 2 seconds if no user interaction
    autoCloseTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  }, [openFromAddCart, isDesktop, setOpenFromAddCart]);

  // ── Hover: open MiniCart (desktop only) ──
  const handleMouseEnter = useCallback(() => {
    if (!isDesktop) return;

    // Clear any pending auto-close or hover close
    if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    setIsOpen(true);
  }, [isDesktop]);

  // ── Hover: close MiniCart after delay (desktop only) ──
  const handleMouseLeave = useCallback(() => {
    if (!isDesktop) return;

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  }, [isDesktop]);

  // ── Click: navigate to /cart (both desktop and mobile) ──
  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      router.push("/cart");
    },
    [router],
  );

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      <button
        onClick={handleClick}
        aria-label="View cart"
        className="relative focus:outline-none hover:outline-none active:outline-none"
      >
        <FiShoppingCart size={24} />
        {cartCount > 0 && (
          <span className="absolute top-[-10px] right-[-16px] block w-4 h-4 bg-white text-black font-semibold text-[11px] rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      {/* MiniCart: only render on desktop */}
      {isDesktop && (
        <MiniCart
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          cartData={cartData}
          onCountChange={onCountChange}
          onCartDataChange={onCartDataChange}
          fetchCart={fetchCart}
        />
      )}
    </div>
  );
};

export default CartIcon;
