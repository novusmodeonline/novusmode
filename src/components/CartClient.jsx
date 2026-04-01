"use client";

import { QuantityInputCart, OrderSummary, CouponBox } from "@/components";
import Image from "next/image";
import React from "react";
import { useSession } from "next-auth/react";
import { FaCheck, FaXmark } from "react-icons/fa6";
import { useProductStore } from "@/app/_zustand/store";
import { useCouponStore } from "@/app/_zustand/useCouponStore";
import Link from "next/link";
import toast from "react-hot-toast";
import { ShoppingBag } from "lucide-react";

const CartClient = () => {
  const { products, removeFromCart, calculateTotals, total } =
    useProductStore();
  const { data: session } = useSession();

  const clearCoupon = useCouponStore((s) => s.clearCouponState);

  const handleRemoveItem = (id, selectedSize) => {
    removeFromCart(id, selectedSize);
    calculateTotals();
    clearCoupon(); // 🔑 IMPORTANT
    toast.success("Product removed from the cart");
  };

  return (
    <div className="bg-white text-[var(--color-bg)]">
      <div className="mx-auto max-w-7xl min-h-[55vh] px-6 pt-16 pb-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Shopping Cart
          </h1>
        </div>
        <form className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
          {/* Product list */}
          <section className="lg:col-span-7">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[55vh] py-10">
                {/* Card */}
                <div className="bg-white/90 border border-[#e2f0dc] rounded-3xl shadow-xl px-8 py-10 flex flex-col items-center max-w-md w-full relative">
                  {/* Decorative faint icon in background */}
                  <span className="absolute -top-12 -left-12 opacity-10 text-[8rem] select-none pointer-events-none">
                    <ShoppingBag className="w-32 h-32 text-[var(--color-bg)]" />
                  </span>
                  {/* Main cart icon */}
                  <div className="mb-5 bg-[var(--color-bg)] rounded-full p-5 shadow-md">
                    <ShoppingBag className="w-10 h-10 text-[var(--color-text)]" />
                  </div>
                  <h2 className="text-2xl font-extrabold mb-2 text-[var(--color-bg)] tracking-tight">
                    Your cart is empty
                  </h2>
                  <p className="mb-5 text-gray-700 text-center">
                    Looks like you haven’t added anything yet.
                    <br />
                    Start exploring and discover our best picks!
                  </p>
                  <Link
                    href="/shop"
                    className="inline-block bg-[var(--color-bg)] text-[var(--color-text)] font-semibold px-6 py-2.5 rounded-xl shadow hover:bg-[var(--color-inverted-bg)] hover:text-[var(--color-inverted-text)] border border-[var(--color-bg)] hover:border-[var(--color-inverted-text)] transition-all"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            ) : (
              <ul role="list" className="space-y-6">
                {products.map((product, index) => (
                  <li
                    key={index}
                    className="relative bg-white border border-gray-200 p-4 sm:p-6 rounded-xl shadow-sm"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={() =>
                        handleRemoveItem(product.id, product.selectedSize)
                      }
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-600 z-10"
                      aria-label="Remove"
                    >
                      <FaXmark className="h-6 w-6" />
                    </button>

                    {/* MOBILE LAYOUT */}
                    <div className="block sm:hidden">
                      {/* Product Image */}
                      <div className="flex flex-col items-center w-full mb-2">
                        <div
                          className="relative w-full"
                          style={{ aspectRatio: "1.6/1" }}
                        >
                          <div className="w-full" style={{ height: "60%" }}>
                            <Image
                              width={300}
                              height={200}
                              src={
                                product?.mainImage
                                  ? `/images${product.mainImage}`
                                  : "/images/product_placeholder.jpg"
                              }
                              alt="Product image"
                              className="object-cover w-full rounded-lg bg-[#f5f5f5]"
                              style={{ maxHeight: "220px", minHeight: "120px" }}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Name + Instock Row */}
                      <div className="flex justify-between items-center w-full mb-1">
                        <h3 className="text-lg font-semibold truncate">
                          <Link
                            href={`/product/${product.slug}`}
                            className="hover:underline hover:text-green-700 transition"
                          >
                            {product.title}
                          </Link>
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full ml-4">
                          <FaCheck className="h-4 w-4" /> In stock
                        </span>
                      </div>
                      {/* Price + Quantity Row */}
                      <div className="flex justify-between items-center w-full gap-2 mb-3">
                        <div>
                          <span className="font-bold text-lg text-black">
                            ₹{product.price}
                          </span>
                          {product.mrp && (
                            <span className="line-through text-gray-400 text-sm ml-2">
                              ₹{product.mrp}
                            </span>
                          )}
                          {product.discount && (
                            <span className="text-[#ef4444] text-sm font-semibold ml-2">
                              {product.discount}% OFF
                            </span>
                          )}
                        </div>
                        <div className="ml-2">
                          <QuantityInputCart product={product} />
                        </div>
                      </div>
                    </div>

                    {/* DESKTOP LAYOUT */}
                    <div className="hidden sm:flex sm:flex-row gap-6">
                      {/* Image Left */}
                      <div className="flex-shrink-0 w-48 flex items-center justify-center">
                        <div
                          className="w-full aspect-square bg-[#f5f5f5] rounded-lg overflow-hidden flex items-center justify-center"
                          style={{ minHeight: "120px", maxHeight: "220px" }}
                        >
                          <Image
                            width={192}
                            height={192}
                            src={
                              product?.mainImage
                                ? `/images${product.mainImage}`
                                : "/images/product_placeholder.jpg"
                            }
                            alt="Product image"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                      {/* Details vertical */}
                      <div className="flex-1 flex flex-col justify-start items-start gap-2">
                        <h3 className="text-lg font-semibold truncate">
                          <Link
                            href={`/product/${product.slug}`}
                            className="hover:underline hover:text-green-700 transition"
                          >
                            {product.title}
                          </Link>
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          <FaCheck className="h-4 w-4" /> In stock
                        </span>
                        {product?.selectedSize && (
                          <div className="flex items-center gap-2">
                            <span className="text-black">
                              Size : {product.selectedSize}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-black">
                            ₹{product.price}
                          </span>
                          {product.mrp && (
                            <span className="line-through text-gray-400 text-sm">
                              ₹{product.mrp}
                            </span>
                          )}
                          {product.discount && (
                            <span className="text-[#ef4444] text-sm font-semibold">
                              {product.discount}% OFF
                            </span>
                          )}
                        </div>
                        <div className="mt-2 w-full max-w-xs">
                          <QuantityInputCart product={product} />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {/* Coupon + Order Summary */}
          {products.length !== 0 && (
            <div className="lg:col-span-5 space-y-4">
              {session ? (
                <CouponBox />
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-[var(--color-bg)]">
                  Log in at checkout to apply coupons and place your order.
                </div>
              )}
              <OrderSummary total={total} products={products} />
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CartClient;
