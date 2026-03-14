"use client";

import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/lib/useDebounce";

const SearchInput = ({ mobile = false, onAfterSearch }) => {
  const router = useRouter();
  const pathname = usePathname();
  const input = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 400);

  // 🔍 Live debounced search
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/search?search=${encodeURIComponent(debouncedQuery)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Close dropdown on route change (keep query)
  useEffect(() => {
    setResults([]);
  }, [pathname]);

  // Click on suggestion
  const handleResultClick = (slug, inStock) => {
    if (!inStock) return;

    setResults([]);
    if (onAfterSearch) onAfterSearch();

    router.push(`/product/${slug}`);
  };

  // Submit → full search page
  const searchProducts = (e) => {
    e.preventDefault();
    const searchValue = query.trim();
    if (!searchValue) return;

    setResults([]);
    if (onAfterSearch) onAfterSearch();

    router.push(`/search?search=${searchValue}`);
  };

  return (
    <div
      className={
        mobile ? "relative" : "flex-1 mx-4 max-w-2xl hidden md:block relative"
      }
    >
      {/* Search Bar */}
      <form
        onSubmit={searchProducts}
        className={mobile ? "w-full flex items-center gap-2" : ""}
      >
        <input
          ref={input}
          type="text"
          placeholder="Search for products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={mobile}
          className={
            mobile
              ? "w-full border border-gray-300 bg-white text-black placeholder-gray-400 px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bg)] text-base"
              : "w-full border border-white/40 bg-white/10 text-white placeholder-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
          }
        />

        {mobile && (
          <button
            type="submit"
            className="ml-2 px-4 py-3 rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] font-semibold"
          >
            Search
          </button>
        )}
      </form>

      {/* 🔽 Search Results */}
      {results.length > 0 && (
        <div
          className={`z-50 bg-white shadow-xl overflow-y-auto border
      ${mobile
              ? "mt-2 max-h-[70vh] px-2"
              : "absolute left-0 right-0 top-full mt-2 rounded-xl max-h-96"
            }
    `}
          style={mobile ? { position: "static" } : {}}
        >
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => handleResultClick(item.slug, item.inStock)}
              className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition hover:bg-gray-50
                          ${mobile ? "rounded-lg" : ""}
                          ${!item.inStock ? "opacity-60 cursor-not-allowed" : ""}
                        `}
            >
              {/* 🖼️ Image */}
              <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                <img
                  src={
                    item?.mainImage
                      ? `/images${item.mainImage}`
                      : "/images/product_placeholder.jpg"
                  }
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 📦 Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-[var(--color-bg)] text-sm truncate">
                    {item.title}
                  </p>

                  {/* Stock indicator */}
                  <span
                    className={`flex items-center gap-1 text-xs font-medium
                      ${item.inStock ? "text-green-600" : "text-red-600"}
                    `}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full
                        ${item.inStock ? "bg-green-500" : "bg-red-500"}
                      `}
                    />
                    {!mobile && (item.inStock ? "In stock" : "Out of stock")}
                  </span>
                </div>

                <p className="text-sm text-[var(--color-bg)] mt-0.5">
                  ₹{item.price}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
