import {
  ProductTabs,
  Breadcrumb,
  PDPProductImages,
  ProductDetails,
  PDPClient,
} from "@/components";
import { getBaseURL } from "@/config/config";
import { notFound } from "next/navigation";
import React from "react";

async function fetchProduct(slug) {
  try {
    const baseURL = await getBaseURL();
    const res = await fetch(`${baseURL}/api/slugs/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const product = await res.json();
    return product;
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

async function fetchImages(productID) {
  try {
    const baseURL = await getBaseURL();
    const res = await fetch(`${baseURL}/api/images/${productID}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const imageData = await res.json();
    return imageData;
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

const SingleProductPage = async ({ params }) => {
  const { productSlug } = await params;
  const product = await fetchProduct(productSlug);
  const images = await fetchImages(product?.id);

  if (!product || product.error) {
    notFound();
  }

  return (
    <div className="bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)]">
      {/* Breadcrumb */}
      <div className="bg-[var(--color-inverted-bg)] mt-28">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-24 mb-4">
          <Breadcrumb />
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 md:px-24 py-10">
        <PDPClient product={product} images={images} />
      </div>
    </div>
  );
};

export default SingleProductPage;
