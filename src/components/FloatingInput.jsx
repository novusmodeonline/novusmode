"use client";

import React, { useRef } from "react";

export default function FloatingInput({
  name,
  label,
  type = "text",
  value = "",
  required = false,
  error,
  onChange,
  onBlur,
  validator,
}) {

  const dateInputRef = useRef(null);

  const handleInputChange = (e) => {
    let val = e.target.value;

    // Phone number → allow only digits
    if (name === "phone") {
      val = val.replace(/\D/g, "").slice(0, 10);
    }

    // dd/mm/yyyy formatting (user typing)
    if (name === "dob") {
      let numbers = val.replace(/\D/g, "").slice(0, 8);

      if (numbers.length > 4)
        val = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
      else if (numbers.length > 2)
        val = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
      else val = numbers;
    }

    onChange?.(name, val);
  };

  // When user selects a date from calendar
  const handleDateSelect = (e) => {
    const iso = e.target.value; // yyyy-mm-dd
    if (!iso) return;

    const [y, m, d] = iso.split("-");
    const formatted = `${d}/${m}/${y}`;
    onChange?.("dob", formatted);
  };

  return (
    <div>
        <div className="relative">

        {/** DATE PICKER OVERLAY FOR DOB */}
        {name === "dob" && (
            <>
            <input
                type="date"
                ref={dateInputRef}
                onChange={handleDateSelect}
                max={new Date().toISOString().split("T")[0]}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 z-10 cursor-pointer"
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                📅
            </div>
            </>
        )}

        {/** MAIN INPUT */}
        <input
            id={name}
            name={name}
            type={name !== "dob" ? type : "text"}
            required={required}
            value={value}
            onChange={handleInputChange}
            onBlur={onBlur}
            placeholder={label}
            inputMode={name === "phone" ? "numeric" : undefined}
            maxLength={name === "phone" ? 10 : undefined}
            className={`peer w-full border border-[color:var(--color-inverted-text)] px-3 pr-10 pt-6 pb-2 rounded 
                placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[color:var(--color-bg)]
                ${value ? "not-empty" : ""}`}
        />

        {/** FLOATING LABEL */}
        <label
            htmlFor={name}
            className="absolute left-3 transition-all text-[color:var(--color-inverted-text)]
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 
            peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
            peer-focus:top-2 peer-focus:text-sm peer-focus:translate-y-0
            not-empty:top-2 not-empty:text-sm not-empty:translate-y-0"
        >
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
