"use client";
import { useEffect, useRef, useState } from "react";
import { ProductItem, Loader } from "@/components";

const LIMIT = 10;

const Products = ({ slug, pageName, search }) => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(null);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true); // <--- NEW
  const loaderRef = useRef(null);

  const getQueryString = () => {
    const sp = slug?.searchParams || {};
    const category = slug?.params?.category;
    const subcategory = slug?.params?.subcategory;

    const filters = [];
    if (sp.price) filters.push(`filters[price][$lte]=${sp.price}`);
    if (sp.rating) filters.push(`filters[rating][$gte]=${sp.rating}`);

    let stockMode = "gt";
    if (sp.inStock === "true" && sp.outOfStock === "true") stockMode = "gte";
    else if (sp.inStock === "true") stockMode = "gt";
    else if (sp.outOfStock === "true") stockMode = "equals";
    filters.push(`filters[inStock][$${stockMode}]=0`);

    if (category) filters.push(`category=${category}`);
    if (subcategory) filters.push(`subcategory=${subcategory}`);
    if (sp.sort) filters.push(`sort=${sp.sort}`);

    return filters.join("&");
  };

  const fetchProducts = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const query = getQueryString();
      let api = `/api/products?${query}&page=${page}&limit=${LIMIT}`;
      if (pageName) {
        api += `&${pageName}=${search}`;
      }
      const res = await fetch(api);
      const json = await res.json();

      const data = json.products || [];
      const count = json.totalCount || 0;

      setProducts((prev) => (page === 1 ? data : [...prev, ...data]));
      setTotalCount(count);
      setHasMore((page - 1) * LIMIT + data.length < count);

      // Detect if this is first fetch finishing
      if (page === 1) setIsFirstLoad(false);
    } catch (err) {
      console.error("Product fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const filterKey = `${slug?.params?.slug}-${slug?.searchParams?.price}-${slug?.searchParams?.rating}-${slug?.searchParams?.inStock}-${slug?.searchParams?.outOfStock}-${slug?.searchParams?.sort}`;

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setShouldRefetch(true);
    setIsFirstLoad(true); // <--- Reset on filter change
  }, [filterKey]);

  useEffect(() => {
    if ((page === 1 && shouldRefetch) || page > 1) {
      fetchProducts();
      setShouldRefetch(false);
    }
    // eslint-disable-next-line
  }, [page, filterKey, shouldRefetch]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return (
    <>
      {totalCount !== null && (
        <div className="text-center text-sm text-gray-300 mb-3">
          Showing {products.length} of {totalCount} products
        </div>
      )}

      {/* Loader - show only during fetch */}
      {loading && isFirstLoad && (
        <div className="flex justify-center py-12 w-full col-span-full">
          <Loader text="Loading products..." />
        </div>
      )}

      {/* Products grid */}
      <div className="grid grid-cols-3 justify-items-center gap-x-2 gap-y-5 max-[1300px]:grid-cols-3 max-lg:grid-cols-2 max-[500px]:grid-cols-1">
        {products.length > 0 &&
          products.map((product) => (
            <ProductItem key={product.id} product={product} color="black" />
          ))}

        {/* No products message */}
        {!loading && !isFirstLoad && products.length === 0 && (
          <h3 className="text-3xl mt-5 text-center w-full col-span-full max-[1000px]:text-2xl max-[500px]:text-lg">
            No products found for specified query
          </h3>
        )}
      </div>

      {/* Lazy Loader at end (for lazy loading) */}
      {hasMore && !loading && (
        <div ref={loaderRef} className="text-center py-4 text-white">
          {/* Loader is shown above on first load, here for lazy loading */}
          {loading && <Loader />}
        </div>
      )}

      {/* End of catalog */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-4 text-gray-400">
          🎉 You’ve reached the end of the catalog.
        </div>
      )}
    </>
  );
};

export default Products;
