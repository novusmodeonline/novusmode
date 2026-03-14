"use client";
import React from "react";

export default function FullScreenLoader({ text = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--color-loader-bg)] flex flex-col items-center justify-center">
      <img
        src="/loader.gif"
        alt="Loading..."
        className="w-20 h-20 mb-6 animate-bounce"
        draggable={false}
      />
      <span className="text-xl font-bold text-[var(--color-bg)] drop-shadow-lg">
        {text}
      </span>
    </div>
  );
}
