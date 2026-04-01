"use client";

import Image from "next/image";
import { FiTrash2, FiPlus, FiMinus } from "react-icons/fi";

const MiniCartItem = ({ product, onIncrease, onDecrease, onRemove }) => {
  const imageSrc = product.mainImage
    ? `/images${product.mainImage}`
    : "/images/product_placeholder.jpg";

  return (
    <li className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-18 h-18 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
        <Image
          src={imageSrc}
          alt={product.title}
          width={72}
          height={72}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        {/* Name */}
        <p className="text-sm font-semibold text-[var(--color-inverted-text)] leading-tight truncate">
          {product.title}
        </p>

        {/* Variant */}
        {product.selectedSize && (
          <p className="text-xs text-gray-500">Size: {product.selectedSize}</p>
        )}

        {/* Price */}
        <p className="text-sm font-bold text-[var(--color-inverted-text)]">
          ₹{product.price}
        </p>

        {/* Qty controls + remove */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onDecrease(product)}
              aria-label="Decrease quantity"
              className="w-7 h-7 flex items-center justify-center text-[var(--color-inverted-text)] hover:bg-gray-100 transition-colors"
            >
              <FiMinus size={12} />
            </button>
            <span className="w-8 text-center text-sm font-medium text-[var(--color-inverted-text)]">
              {product.amount}
            </span>
            <button
              onClick={() => onIncrease(product)}
              aria-label="Increase quantity"
              className="w-7 h-7 flex items-center justify-center text-[var(--color-inverted-text)] hover:bg-gray-100 transition-colors"
            >
              <FiPlus size={12} />
            </button>
          </div>

          <button
            onClick={() => onRemove(product)}
            aria-label="Remove item"
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      </div>
    </li>
  );
};

export default MiniCartItem;
