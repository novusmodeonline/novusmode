"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { filterPrice } from "@/config/staticValue";

const Filters = ({ slug, search }) => {
  const [price, setPrice] = useState(filterPrice[filterPrice.length - 1]);
  const [rating, setRating] = useState("0");
  const [inStock, setInStock] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const [sort, setSort] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const handleFilterChange = useCallback(
    (filters) => {
      const query = new URLSearchParams();

      if (filters.price) query.set("price", filters.price);
      if (filters.rating) query.set("rating", filters.rating);
      if (filters.inStock) query.set("inStock", "true");
      if (filters.outOfStock) query.set("outOfStock", "true");
      if (filters.sort) query.set("sort", filters.sort);
      if (search) query.set("search", search);
      const url = `${pathname}/${slug?.params?.slug || ""}?${query.toString()}`;
      router.push(url);
    },
    [router, slug]
  );

  // Notify parent on filter change
  useEffect(() => {
    const params = {
      price,
      rating,
      inStock,
      outOfStock,
      sort,
      search,
    };
    handleFilterChange(params);
  }, [price, rating, inStock, outOfStock, sort, search]);

  return (
    <div>
      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block w-[200px] rounded-xl space-y-4 bg-[var(--color-bg)] text-[var(--color-text)] p-4">
        <div className="space-y-6">
          {/* Max Price */}
          <div>
            <label htmlFor="price" className="block font-semibold mb-1">
              Max Price
            </label>
            <div className="relative w-full">
              <select
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="appearance-none w-full px-3 py-2 rounded-md bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-700"
              >
                {filterPrice.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
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

          {/* Rating */}
          <div>
            <label htmlFor="rating" className="block font-semibold mb-1">
              Min Rating
            </label>
            <div className="relative w-full">
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="appearance-none w-full px-3 py-2 rounded-md bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-700"
              >
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <option key={val} value={val}>
                    {val} ★ & up
                  </option>
                ))}
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

          {/* Availability */}
          <div>
            <span className="block font-semibold mb-1">Availability</span>
            <div className="flex flex-col gap-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-[var(--color-text)]"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                />
                <span>In Stock</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-[var(--color-text)]"
                  checked={outOfStock}
                  onChange={(e) => setOutOfStock(e.target.checked)}
                />
                <span>Out of Stock</span>
              </label>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sort" className="block font-semibold mb-1">
              Sort By
            </label>
            <div className="relative w-full">
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none w-full px-3 py-2 rounded-md bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-700"
              >
                <option value="">Default</option>
                <option value="price:asc">Price: Low to High</option>
                <option value="price:desc">Price: High to Low</option>
                <option value="rating:desc">Rating: High to Low</option>
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
        </div>
      </div>

      {/* Mobile Filter Bar */}
      <div className="lg:hidden px-4 py-3 border-b overflow-x-auto whitespace-nowrap flex gap-x-3 bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)]">
        {/* Price Filter */}
        <div className="min-w-[140px]">
          <label className="text-xs block mb-1">Price</label>
          <select
            className="w-full bg-[var(--color-bg)] text-[var(--color-text)] px-2 py-1 rounded-md text-sm"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          >
            {filterPrice.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div className="min-w-[140px]">
          <label className="text-xs block mb-1">Rating</label>
          <select className="w-full bg-[var(--color-bg)] text-[var(--color-text)] px-2 py-1 rounded-md text-sm">
            {[0, 1, 2, 3, 4, 5].map((val) => (
              <option key={val} value={val}>
                {val} ★ & up
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div className="min-w-[140px]">
          <label className="text-xs block mb-1">Stock</label>
          <select className="w-full bg-[var(--color-bg)] text-[var(--color-text)] px-2 py-1 rounded-md text-sm">
            <option value="in">In Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Sort By Filter */}
        <div className="min-w-[140px]">
          <label className="text-xs block mb-1">Sort By</label>
          <select className="w-full bg-[var(--color-bg)] text-[var(--color-text)] px-2 py-1 rounded-md text-sm">
            <option value="">Default</option>
            <option value="price:asc">Price: Low to High</option>
            <option value="price:desc">Price: High to Low</option>
            <option value="rating:desc">Rating: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Filters;
