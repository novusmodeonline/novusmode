"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Men", href: "/men" },
  { label: "Women", href: "/women" },
  { label: "Kids", href: "/kids" },
];

export default function MobileNavMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    console.log("here?")
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const firstFocusable = menuRef.current?.querySelector("a,button");
    firstFocusable?.focus();
  }, [menuOpen]);

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <button
        className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <nav
          ref={menuRef}
          id="mobile-menu"
          className="fixed inset-0 z-[100] bg-black bg-opacity-40 flex md:hidden"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white w-4/5 max-w-xs h-full shadow-lg p-6 flex flex-col gap-4"
               style={{ minWidth: 220 }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg font-semibold text-gray-800 hover:text-blue-600 focus:outline-none focus:text-blue-600"
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {/* Click on backdrop to close */}
          <div className="flex-1" onClick={() => setMenuOpen(false)} />
        </nav>
      )}
    </div>
  );
}
