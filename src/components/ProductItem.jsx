import Image from "next/image";
import React from "react";
import Link from "next/link";
import ProductItemRating from "./ProductItemRating";

const ProductItem = ({ product, color }) => {
  return (
    <div className="flex flex-col items-center gap-y-2">
      <Link href={`/product/${product.slug}`}>
        <Image
          src={
            product.mainImage
              ? `/images/${product.mainImage}`
              : "/images/product_placeholder.jpg"
          }
          width="0"
          height="0"
          sizes="100vw"
          className="w-auto h-[300px]"
          alt={product?.title}
        />
      </Link>
      <Link
        href={`/product/${product.slug}`}
        className={
          color === "black"
            ? `text-xl text-black font-normal mt-2 uppercase min-h-14 text-center`
            : `text-xl text-white font-normal mt-2 uppercase min-h-14 text-center`
        }
      >
        {product.title}
      </Link>
      <p
        className={
          color === "black"
            ? "text-lg text-black font-semibold"
            : "text-lg text-white font-semibold"
        }
      >
        ₹{product.price}
      </p>

      <ProductItemRating productRating={product?.rating} />
      {/* <Link
        href={`/product/${product?.slug}`}
        className="btn text-lg font-semibold text-[var(--color-bg)] bg-transparent border border-[var(--color-bg)] transition-all ease-in transform hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] hover:border-transparent max-[500px]:w-full w-[200px] h-12 px-4 py-2"
      >
        <p>View product</p>
      </Link> */}
    </div>
  );
};

export default ProductItem;
