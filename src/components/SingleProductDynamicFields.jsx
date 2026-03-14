"use client";
import React, { useState } from "react";
import {
  QuantityInput,
  NotifyMe,
  AddToCartSingleProductBtn,
  BuyNowSingleProductBtn,
} from "@/components";

const SingleProductDynamicFields = ({ product, selectedSize }) => {
  const [quantityCount, setQuantityCount] = useState(1);
  return (
    <>
      <QuantityInput
        stock={product?.inStock}
        quantityCount={quantityCount}
        setQuantityCount={setQuantityCount}
      />
      {Boolean(product.inStock) ? (
        <div className="flex gap-x-5 max-[500px]:flex-col max-[500px]:items-center max-[500px]:gap-y-1">
          <AddToCartSingleProductBtn
            quantityCount={quantityCount}
            product={product}
            selectedSize={selectedSize || null}
            inStock={product?.inStock !== 0}
          />
          <BuyNowSingleProductBtn
            quantityCount={quantityCount}
            product={product}
            selectedSize={selectedSize || null}
            inStock={product?.inStock !== 0}
          />
        </div>
      ) : (
        <NotifyMe product={product} />
      )}
    </>
  );
};

export default SingleProductDynamicFields;
