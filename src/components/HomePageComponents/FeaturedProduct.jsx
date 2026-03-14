"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useKeenSlider } from "keen-slider/react";

// Pass featuredProducts as props or fetch inside component
export default function FeaturedProducts({ products = [] }) {
  const [featured, setFeatured] = useState({});

  async function fetchFeaturedAPI() {
    try {
      const res = await fetch(`/api/products?isFeatured=true`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      const result = await res.json();
      const products = result.products;
      setFeatured(products);
      return products;
    } catch (e) {
      return null;
    }
  }

  useEffect(() => {
    fetchFeaturedAPI();
  }, []);

  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    slides: { perView: 4, spacing: 20 },
    breakpoints: {
      "(max-width: 1024px)": {
        slides: { perView: 2, spacing: 12 },
      },
      "(max-width: 768px)": {
        slides: { perView: 1, spacing: 8 },
      },
    },
  });

  // --- Autoplay effect ---
  useEffect(() => {
    let timer;
    const autoSlide = () => {
      timer = setInterval(() => {
        instanceRef.current?.next();
      }, 2200);
    };
    autoSlide();
    return () => clearInterval(timer);
  }, [instanceRef]);

  // Optionally, filter here if you pass all products
  if (!featured.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-7 text-[var(--color-bg)]">
        Featured Picks
      </h2>
      <div className="relative">
        {/* Carousel */}
        <div ref={sliderRef} className="keen-slider pb-4">
          {featured.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="keen-slider__slide"
              tabIndex={0}
            >
              <div className="group bg-white border border-gray-300 rounded-2xl shadow hover:shadow-xl transition-all flex flex-col cursor-pointer h-full">
                <div
                  className="relative w-full flex-shrink-0"
                  style={{ aspectRatio: "4/3", minHeight: "60%" }}
                >
                  <img
                    src={`/images/${product.mainImage}`}
                    alt={product.title}
                    className="rounded-t-2xl w-full h-full object-cover group-hover:scale-105 transition-transform"
                    style={{ minHeight: "180px", maxHeight: "260px" }}
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 bg-yellow-400 text-xs px-2 py-1 rounded font-bold shadow-sm z-10">
                    Featured
                  </span>
                </div>
                <div className="flex-1 p-4 flex flex-col items-start justify-between">
                  <h3 className="text-lg font-semibold mb-2 text-[var(--color-bg)] line-clamp-2">
                    {product.title}
                  </h3>
                  <span className="text-xl font-bold text-[var(--color-bg)]">
                    ₹{product.price}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {instanceRef.current && (
          <>
            {/* Improved Left Arrow */}
            <button
              className="absolute top-1/2 -translate-y-1/2 left-2 z-20 bg-[var(--color-bg)] text-white shadow-xl rounded-full p-2 md:p-3 hover:scale-110 border-4 border-white hover:bg-[var(--color-bg)] transition-all"
              onClick={() => instanceRef.current?.prev()}
              aria-label="Previous"
              type="button"
              style={{ boxShadow: "0 8px 24px 0 rgba(60, 80, 60, 0.14)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path
                  d="M15 19l-7-7 7-7"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {/* Improved Right Arrow */}
            <button
              className="absolute top-1/2 -translate-y-1/2 right-2 z-20 bg-[var(--color-bg)] text-white shadow-xl rounded-full p-2 md:p-3 hover:scale-110 border-4 border-white hover:bg-[var(--color-bg)] transition-all"
              onClick={() => instanceRef.current?.next()}
              aria-label="Next"
              type="button"
              style={{ boxShadow: "0 8px 24px 0 rgba(60, 80, 60, 0.14)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path
                  d="M9 5l7 7-7 7"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
