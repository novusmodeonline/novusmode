"use client";
import React from "react";
import { useSortStore } from "@/app/_zustand/sortStore";

const SortBy = () => {
  // getting values from Zustand sort store
  const { sortBy, changeSortBy } = useSortStore();

  return (
    <div className="flex items-center gap-x-4 max-lg:flex-col max-lg:items-start max-lg:gap-y-2">
      <h3 className="text-xl whitespace-nowrap">Sort by:</h3>

      <div className="relative w-[200px] max-lg:w-full">
        <select
          defaultValue={sortBy}
          onChange={(e) => changeSortBy(e.target.value)}
          className="appearance-none w-full px-3 py-2 rounded-md bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-700"
          name="sort"
        >
          <option value="defaultSort">Default</option>
          <option value="titleAsc">Sort A-Z</option>
          <option value="titleDesc">Sort Z-A</option>
          <option value="lowPrice">Lowest Price</option>
          <option value="highPrice">Highest Price</option>
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            className="w-4 h-4 text-black"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SortBy;
