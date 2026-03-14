// components/PDPClient.jsx
"use client";
import { useMemo, useState } from "react";
import { PDPProductImages, ProductDetails, ProductTabs } from "@/components";

const parseSizes = (csv) =>
  (csv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export default function PDPClient({ product, images }) {
  const sizes = useMemo(
    () => parseSizes(product.availableSizes),
    [product.availableSizes]
  );
  const initialSize =
    product.defaultSize && sizes.includes(product.defaultSize)
      ? product.defaultSize
      : sizes[0] || "";

  const [selectedSize, setSelectedSize] = useState(initialSize);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
      {console.log(product.mainImage)}
      <PDPProductImages mainImage={product.mainImage} images={images} />

      <ProductDetails
        product={product}
        selectedSize={selectedSize}
        onChangeSize={setSelectedSize}
      />

      <div className="md:col-span-2 py-16">
        <ProductTabs
          product={product}
          selectedSize={selectedSize}
        // if you ever want to change size from inside tabs too:
        // onChangeSize={setSelectedSize}
        />
      </div>
    </div>
  );
}
