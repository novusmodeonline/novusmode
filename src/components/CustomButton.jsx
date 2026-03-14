import React from "react";

const CustomButton = ({
  paddingX,
  paddingY,
  text,
  buttonType,
  customWidth,
  textSize,
  disabled = false,
}) => {
  return (
    <button
      type={`${buttonType}`}
      className={`btn text-lg font-semibold 
  ${
    disabled
      ? "text-gray-400 border-gray-300 cursor-not-allowed bg-gray-100"
      : "text-[var(--color-bg)] border border-[var(--color-bg)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] hover:border-transparent"
  }
  transition-all ease-in transform max-[500px]:w-full w-[100%] h-12 px-4 py-2`}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default CustomButton;
