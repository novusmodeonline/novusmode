"use client";

import React from "react";

export default function SavedCards({
  savedCards,
  selectedToken,
  onSelect,
  onAddNew,
}) {
  if (!savedCards || savedCards.length === 0) return null;

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Saved Cards</h4>

      {savedCards.map((c) => (
        <label
          key={c.id}
          className="flex items-center justify-between bg-gray-50 p-2 rounded cursor-pointer"
        >
          <span className="text-sm">
            {c.brand} •••• {c.last4}
          </span>

          <input
            type="radio"
            name="savedCard"
            checked={selectedToken === c.id}
            onChange={() => onSelect(c.id)}
          />
        </label>
      ))}

      <button
        type="button"
        onClick={onAddNew}
        className="text-sm text-[var(--color-bg)] mt-1 underline"
      >
        + Add New Card
      </button>
    </div>
  );
}
