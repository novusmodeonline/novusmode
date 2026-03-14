"use client";
import { useMemo, useState } from "react";
import { parseSizes } from "@/lib/sizecharts";
import {
  StockAvailabillity,
  SingleProductRating,
  SingleProductDynamicFields,
  AddToWishlistBtn,
  AddToCartSingleProductBtn,
  BuyNowSingleProductBtn,
  SizeComparison,
} from "@/components";

const ProductDetails = ({ product, selectedSize, onChangeSize }) => {
  // sizes from your schema (CSV)
  const sizes = useMemo(
    () => parseSizes(product.availableSizes),
    [product.availableSizes]
  );

  const [quantity, setQuantity] = useState(1);
  const maxQty = product.inStock > 10 ? 10 : Math.max(0, product.inStock);

  const incrementQty = () => {
    if (quantity < maxQty) setQuantity(quantity + 1);
  };
  const decrementQty = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  // if product has sizes, require a selection; if it has no sizes configured, allow purchase as-is
  const requiresSize = sizes.length > 0;
  const canBuy = product.inStock > 0 && (!requiresSize || !!selectedSize);

  const [showChart, setShowChart] = useState(false);

  return (
    <div className="flex flex-col gap-5 max-[500px]:items-center">
      {/* Optional rating */}
      {/* <SingleProductRating rating={product.rating} /> */}

      <h1 className="text-3xl font-semibold">{product.title}</h1>

      <p className="text-2xl font-semibold text-[var(--color-bg)]">
        ₹{product.price}
      </p>

      <StockAvailabillity stock={product.inStock} />

      {/* Key Features (your schema has Json?; if it is an array, this works) */}
      {product.keyFeatures && product.keyFeatures.length > 0 && (
        <div className="bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)] p-4 rounded-lg shadow-md">
          <h2 className="font-semibold text-lg mb-2">Key Features:</h2>
          <ul className="list-disc list-inside space-y-1">
            {product.keyFeatures.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== Size picker (new) ===== */}
      {sizes.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">
              {product.sizeMetric ? `Size (${product.sizeMetric})` : "Size"}
            </span>
            {selectedSize ? (
              <span className="text-xs text-gray-500">
                Selected: {selectedSize}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setShowChart(true)}
              className="text-xs underline underline-offset-2 hover:opacity-80"
            >
              Size chart
            </button>
            <SizeComparison
              open={showChart}
              onClose={() => setShowChart(false)}
              product={product}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const selected = s === selectedSize;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChangeSize?.(s)}
                  className={`px-3 py-2 rounded border text-sm transition
                    ${
                      selected
                        ? "text-[var(--color-inverted-bg)] bg-[var(--color-bg)] border-black"
                        : "bg-white hover:border-black"
                    }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Your dynamic fields (kept intact) */}
      <SingleProductDynamicFields
        product={product}
        selectedSize={selectedSize || null}
      />

      {/* Actions */}
      {/* <div className="flex gap-3 w-full max-w-sm">
        <AddToCartSingleProductBtn
          product={product}
          quantity={quantity}
          selectedSize={selectedSize || null} // carry size to server/cart
          disabled={!canBuy}
        />
        <BuyNowSingleProductBtn
          product={product}
          quantity={quantity}
          selectedSize={selectedSize || null}
          disabled={!canBuy}
        />
      </div> */}

      {/* Wishlist unchanged */}
      <AddToWishlistBtn product={product} />

      {/* === Modal === */}
      <SizeComparison
        open={showChart}
        onClose={() => setShowChart(false)}
        product={product}
      />
    </div>
  );
};

export default ProductDetails;
