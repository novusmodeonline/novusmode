"use client";

import Image from "next/image";
import { FiTrash2, FiPlus, FiMinus } from "react-icons/fi";

const CartItem = ({ item, onIncrease, onDecrease, onRemove }) => {
  const { product, quantity, selectedSize, unitPriceSnapshot } = item;
  const unitPrice = unitPriceSnapshot ?? product.price;
  const imageSrc = product?.mainImage ? `/images${product.mainImage}` : null;

  return (
    <li className="flex gap-3  p-4">
      {/* Thumbnail */}
      <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.title}
            fill
            sizes="72px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
          {product.title}
        </p>
        {selectedSize && (
          <p className="text-xs text-gray-500 mt-0.5">Size: {selectedSize}</p>
        )}
        <p className="text-sm font-bold text-gray-900 mt-1">
          ₹{(unitPrice * quantity).toLocaleString("en-IN")}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onDecrease(item)}
            aria-label="Decrease quantity"
            className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FiMinus size={11} />
          </button>
          <span className="text-sm font-medium text-gray-800 w-4 text-center">
            {quantity}
          </span>
          <button
            onClick={() => onIncrease(item)}
            aria-label="Increase quantity"
            className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FiPlus size={11} />
          </button>
          <button
            onClick={() => onRemove(item)}
            aria-label="Remove item"
            className="ml-auto text-gray-400 hover:text-red-500 transition-colors p-1"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    </li>
  );
};

export default CartItem;
