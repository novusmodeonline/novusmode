"use client";

import React, { useId, useState, useRef } from "react";

// Helper to join class names
const cx = (...c) => c.filter(Boolean).join(" ");

const ProductTabs = ({ product = {}, selectedSize /*, onChangeSize */ }) => {
  const tabs = [
    { id: "desc", label: "Description" },
    { id: "specs", label: "Additional Info" },
    { id: "features", label: "Key Features" },
  ];

  const [active, setActive] = useState(0);
  const tablistRef = useRef(null);
  const uid = useId();

  // Keyboard navigation: ArrowLeft / ArrowRight, Home / End
  const onKeyDown = (e) => {
    const last = tabs.length - 1;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive((i) => (i === last ? 0 : i + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((i) => (i === 0 ? last : i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(last);
    }
  };
  // Data fallbacks
  const {
    description = "No description available.",
    manufacturer = "—",
    categoryId = "—",
    defaultSize,
    sizeMetric,
    keyFeatures = [],
    category, // grab the whole object
  } = product || {};

  const categoryName = category?.name || categoryId || "—";

  const hasFeatures = Array.isArray(keyFeatures) && keyFeatures.length > 0;

  return (
    <section className="text-[var(--color-inverted-text)]">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Product details tabs"
        ref={tablistRef}
        onKeyDown={onKeyDown}
        className="relative inline-flex gap-6 border-b border-gray-200"
      >
        {tabs.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            id={`${uid}-${t.id}-tab`}
            aria-selected={active === i}
            aria-controls={`${uid}-${t.id}-panel`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            className={cx(
              "pb-3 text-lg max-[500px]:text-base outline-none transition-colors",
              active === i
                ? "text-[var(--color-bg)] font-semibold"
                : "text-gray-600 hover:text-[var(--color-bg)]"
            )}
          >
            {t.label}
          </button>
        ))}

        {/* Active underline */}
        <div
          className="absolute bottom-0 h-[2px] bg-[var(--color-bg)] transition-all duration-300"
          style={{
            // simple calc: each tab width is its button offset
            width: tablistRef.current?.children?.[active]?.offsetWidth ?? 0,
            transform: `translateX(${
              tablistRef.current?.children?.[active]?.offsetLeft ?? 0
            }px)`,
          }}
        />
      </div>

      {/* Panels */}
      <div className="pt-6">
        {/* Description */}
        {active === 0 && (
          <div
            role="tabpanel"
            id={`${uid}-desc-panel`}
            aria-labelledby={`${uid}-desc-tab`}
          >
            <p className="text-base leading-7">{description}</p>
          </div>
        )}

        {/* Additional Info / Specs */}
        {active === 1 && (
          <div
            role="tabpanel"
            id={`${uid}-specs-panel`}
            aria-labelledby={`${uid}-specs-tab`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SpecRow label="Manufacturer" value={manufacturer} />
              <SpecRow label="Category" value={categoryName} />

              {(selectedSize || defaultSize) && (
                <SpecRow
                  label="Size"
                  value={`${selectedSize || defaultSize}${
                    sizeMetric ? ` ${sizeMetric}` : ""
                  }`}
                />
              )}
              {/* Add more rows as your schema grows */}
            </div>
          </div>
        )}

        {/* Key Features */}
        {active === 2 && (
          <div
            role="tabpanel"
            id={`${uid}-features-panel`}
            aria-labelledby={`${uid}-features-tab`}
          >
            {hasFeatures ? (
              <ul className="space-y-2">
                {keyFeatures.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-7">
                    <span className="mt-2 size-1.5 rounded-full bg-[var(--color-bg)]" />
                    <span className="text-base">{String(f)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No key features provided.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductTabs;

/* ---------- small presentational component ---------- */

const SpecRow = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 p-4">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-base">{value || "—"}</p>
  </div>
);
