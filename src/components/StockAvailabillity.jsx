import React from "react";
import { FaCheck, FaTriangleExclamation, FaXmark } from "react-icons/fa6";

const StockAvailability = ({ stock }) => {
  // Determine availability message based on stock
  let availabilityText;
  let statusColor;
  let icon;
  if (stock > 10) {
    availabilityText = `In Stock`;
    statusColor = "text-green-500"; // In stock - green
    icon = <FaCheck className="text-2xl" />;
  } else if (stock > 0 && stock <= 10) {
    availabilityText = "Limited stock available";
    statusColor = "text-yellow-500"; // Limited stock - yellow
    icon = <FaTriangleExclamation className="text-2xl" />;
  } else {
    availabilityText = "Out of stock";
    statusColor = "text-red-500"; // Out of stock - red
    icon = <FaXmark className="text-2xl" />;
  }

  return (
    <div className="flex items-center gap-x-4 max-[500px]:gap-x-0 w-full max-[500px]:flex-col max-[500px]:items-center">
      <span className={`flex items-center gap-x-2 text-lg ${statusColor}`}>
        {icon}
        {availabilityText}
      </span>
    </div>
  );
};

export default StockAvailability;
