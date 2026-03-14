"use client";

import { useState, useRef, useEffect } from "react";

export default function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Search...",
  error,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  // Filter options (string match)
  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={wrapperRef}>
      {/* Trigger / Selected value */}
      <div
        onClick={() => setOpen(!open)}
        className={`border border-[color:var(--color-inverted-text)] rounded px-3 py-2 
          flex justify-between items-center cursor-pointer mt-1
          ${error ? "border-red-500" : ""}
        `}
      >
        <span className={`${value ? "" : "text-gray-500"}`}>
          {value || label}
        </span>

        <svg
          width="20"
          height="20"
          className="text-gray-600"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50">
          {/* Search input */}
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border-b outline-none"
          />

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <div
                  key={opt}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    value === opt ? "bg-blue-100" : ""
                  }`}
                  onClick={() => {
                    onChange(opt); // RETURN STRING
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500">No results found</div>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
