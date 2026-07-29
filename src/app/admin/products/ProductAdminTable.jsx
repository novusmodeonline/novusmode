"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

function imageSrc(mainImage) {
  return mainImage ? `/images${mainImage}` : "/images/product_placeholder.jpg";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN");
}

export default function ProductAdminTable({ products }) {
  const [search, setSearch] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.title?.toLowerCase().includes(query) ||
        product.manufacturer?.toLowerCase().includes(query) ||
        product.slug?.toLowerCase().includes(query);

      const matchesFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" && product.isFeatured) ||
        (featuredFilter === "not_featured" && !product.isFeatured);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in_stock" && Number(product.inStock || 0) > 0) ||
        (stockFilter === "out_of_stock" && Number(product.inStock || 0) <= 0);

      return matchesSearch && matchesFeatured && matchesStock;
    });
  }, [products, search, featuredFilter, stockFilter]);

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3 lg:flex-1">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-medium text-gray-600 block">
                Search
              </label>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Title, manufacturer, slug"
                className="border rounded px-3 py-2 text-sm w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 block">
                Featured
              </label>
              <select
                value={featuredFilter}
                onChange={(event) => setFeaturedFilter(event.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
              >
                <option value="all">All</option>
                <option value="featured">Featured</option>
                <option value="not_featured">Not Featured</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 block">
                Stock
              </label>
              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
              >
                <option value="all">All</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled
            title="Coming Soon"
            className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
          >
            Add Product - Coming Soon
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Showing {visibleProducts.length} of {products.length} products
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">SubCategory</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Featured</th>
              <th className="px-3 py-2">Created At</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product) => (
              <tr key={product.id} className="border-t align-middle">
                <td className="px-3 py-2">
                  <div className="relative h-14 w-14 overflow-hidden rounded border bg-gray-50">
                    <Image
                      src={imageSrc(product.mainImage)}
                      alt={product.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                </td>
                <td className="px-3 py-2 min-w-[260px]">
                  <div className="font-medium text-gray-900">
                    {product.title}
                  </div>
                  <div className="text-xs text-gray-500">{product.slug}</div>
                  <div className="text-xs text-gray-500">
                    {product.manufacturer}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {product.category?.name || product.categoryId}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {product.subCategory?.name || product.subCategoryId}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  Rs. {Number(product.price || 0).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {product.inStock}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.isFeatured
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {product.isFeatured ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatDate(product.createdAt)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled
                      title="Coming Soon"
                      className="rounded border px-3 py-1 text-xs text-gray-400 cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Coming Soon"
                      className="rounded border px-3 py-1 text-xs text-gray-400 cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">Coming Soon</div>
                </td>
              </tr>
            ))}
            {!visibleProducts.length && (
              <tr>
                <td className="px-3 py-8 text-center text-gray-500" colSpan={9}>
                  No products match the current search and filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
