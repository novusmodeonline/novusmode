"use client";

import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";

const QuantityInput = ({ stock, quantityCount, setQuantityCount }) => {
  const [maxQuantity, setMaxQuantity] = useState(10);
  const inStock = stock !== 0;
  useEffect(() => {
    // Update the max quantity based on available stock or 10
    setMaxQuantity(inStock ? Math.min(stock, 10) : 0);
  }, [stock, inStock]);

  const handleQuantityChange = (actionName) => {
    if (actionName === "plus" && quantityCount < maxQuantity) {
      setQuantityCount(quantityCount + 1);
    } else if (actionName === "minus" && quantityCount > 1) {
      setQuantityCount(quantityCount - 1);
    }
  };

  return (
    <div className="flex items-center gap-x-4 max-[500px]:gap-x-0 max-[500px]:flex-col max-[500px]:items-center">
      <div className="flex items-center gap-1 border border-gray-300 rounded">
        {/* Minus Button */}
        <button
          type="button"
          className={`flex justify-center items-center p-2 text-gray-600 bg-white rounded-l-lg transition-all ${
            quantityCount === 1 || !inStock
              ? "bg-gray-300 opacity-50 cursor-not-allowed"
              : "hover:bg-gray-200"
          }`}
          onClick={() => handleQuantityChange("minus")}
          disabled={quantityCount === 1 || !inStock} // Disable if at minimum or out of stock
        >
          <FaMinus className="text-xl" />
        </button>

        {/* Quantity Input */}
        <input
          type="number"
          id="Quantity"
          value={quantityCount}
          className="h-10 w-20 text-center border-0 bg-white font-semibold text-lg text-gray-700"
          disabled
        />

        {/* Plus Button */}
        <button
          type="button"
          className={`flex justify-center items-center p-2 text-gray-600 bg-white rounded-r-lg transition-all ${
            quantityCount >= maxQuantity || !inStock
              ? "bg-gray-300 opacity-50 cursor-not-allowed"
              : "hover:bg-gray-200"
          }`}
          onClick={() => handleQuantityChange("plus")}
          disabled={quantityCount >= maxQuantity || !inStock} // Disable if max quantity is reached or out of stock
        >
          <FaPlus className="text-xl" />
        </button>
      </div>
    </div>
  );
};

export default QuantityInput;
