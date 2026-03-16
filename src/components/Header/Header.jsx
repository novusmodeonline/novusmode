"use client";
import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { FiUser, FiMenu, FiX, FiSearch } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";

import { CartElement, SearchInput } from "@/components";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import { siteTheme } from "@/config/theme";
import "./header.css";

function Header({ categoryMenuSlot }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const menuRef = useRef(null);

  // Close mobile menu when clicking outside — same pattern as MobileNavMenu.jsx
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { wishQuantity } = useWishlistStore();

  // Close all overlays on route change — catches every link regardless of nesting
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  const profileRef = useRef(null);
  const isLoggedIn = session?.user;

  // Close profile menu when clicking outside (for mobile/clicked menu)
  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleLogout = () => {
    setTimeout(() => signOut({ callbackUrl: "/" }), 1000);
    setProfileOpen(false);
    toast.success("Logout successful!");
  };

  // Wishlist logic unchanged (preserved for your use)
  const getWishlistByUserId = async (id) => {
    const response = await fetch(`/api/wishlist/${id}`, {
      cache: "no-store",
    });
    const wishlist = await response.json();

    if (!wishlist || wishlist.length === 0) {
      return;
    }
    const wishList = wishlist.find((item) => id == item.userId);
    // addToWishlist(wishList);
  };

  const getUserByEmail = async () => {
    if (session?.user) {
      fetch(`/api/users/email/${session?.user?.email}`, {
        cache: "no-store",
      })
        .then((response) => response.json())
        .then((data) => {
          getWishlistByUserId(data?.id);
        });
    }
  };

  useEffect(() => {
    getUserByEmail();
  }, [session?.user?.email]);

  return (
    <header
      style={{
        backgroundColor: siteTheme.background,
        color: siteTheme.textColor,
      }}
      className="border-b border-gray-200 shadow-md sticky top-0 z-50"
    >
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center px-6 md:px-24 py-3 relative">
        {/* Logo + Brand */}
        <div className="flex items-center gap-2">
          <Link href="/">
            <Image
              src="/logo-header.png"
              alt="Logo"
              width={150}
              height={100}
              className="object-none"
            />
          </Link>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:block flex-1 mx-8">
          <SearchInput />
        </div>

        {/* Profile, Cart, Mobile Search, Hamburger */}
        <div className="flex items-center gap-4 relative z-20" ref={profileRef}>
          {/* Profile */}

          <div className="relative group">
            {/* Mobile: click to toggle */}
            <button
              className="md:hidden focus:outline-none"
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Profile"
            >
              <FiUser size={24} />
            </button>

            {/* Desktop icon (hover opens via CSS below) */}
            <span className="hidden md:inline cursor-pointer">
              <FiUser size={24} />
            </span>

            {/* Dropdown */}
            <div
              className={[
                "absolute top-full z-50 w-56 rounded-md border bg-white text-sm text-black shadow-lg transition",
                // Position: center on mobile, right-aligned on desktop
                "left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0",
                // Mobile visibility (state-driven)
                profileOpen ? "block md:block" : "hidden md:block",
                // Desktop visibility (hover-driven)
                "md:invisible md:opacity-0 md:pointer-events-none",
                "md:group-hover:visible md:group-hover:opacity-100 md:group-hover:pointer-events-auto",
                "md:transition-opacity md:duration-150",
              ].join(" ")}
            >
              {isLoggedIn ? (
                <div className="p-3 space-y-2 text-sm text-[var(--color-inverted-text)]">
                  <div className="font-semibold text-base">
                    👤 Hello, {session?.user?.name?.split(" ")[0] ?? "User"}
                  </div>

                  <Link
                    href="/profile"
                    className="block rounded px-3 py-2 transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    My Profile
                  </Link>

                  <Link
                    href="/orders"
                    className="block rounded px-3 py-2 transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    Orders
                  </Link>

                  <Link
                    href="/wishlist"
                    className="group/wishlist relative block rounded px-3 py-2 transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    <div className="flex items-center justify-between">
                      <span>Wishlist</span>
                      {wishQuantity > 0 && (
                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-bg)] text-xs font-semibold text-[var(--color-text)] group-hover/wishlist:bg-[var(--color-inverted-bg)] group-hover/wishlist:text-[var(--color-inverted-text)]">
                          {wishQuantity}
                        </span>
                      )}
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout?.();
                    }}
                    className="block w-full rounded px-3 py-2 text-left transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="p-3 space-y-2 text-sm text-[var(--color-inverted-text)]">
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(
                      pathname ?? "/",
                    )}`}
                    className="block rounded px-3 py-2 transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block rounded px-3 py-2 transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
          {/* Mobile Search Icon */}
          <button
            className="md:hidden focus:outline-none"
            onClick={() => {
              setMobileSearchOpen(true);
              setMenuOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Search"
          >
            <FiSearch size={24} />
          </button>

          {/* Cart */}
          <CartElement />

          {/* Hamburger */}
          <button
            className="md:hidden"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setMobileSearchOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Menu"
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex flex-col md:hidden">
          <div className="bg-white p-3 flex items-center gap-2 shadow-md">
            {/* Close Button */}
            <button
              className="mr-2"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close Search"
            >
              <FiX size={24} />
            </button>
            <div className="flex-1">
              <SearchInput
                mobile
                onAfterSearch={() => setMobileSearchOpen(false)}
              />
            </div>
          </div>
          {/* Click on backdrop to close */}
          <div className="flex-1" onClick={() => setMobileSearchOpen(false)} />
        </div>
      )}

      {/* Desktop Search Bar (already above) */}

      {/* Men/Women/Kids Menu - Desktop */}
      <nav className="hidden md:flex justify-center gap-10 py-2 bg-white text-black text-sm font-medium px-6 md:px-24">
        {categoryMenuSlot}
      </nav>

      {/* Mobile Menu — absolutely positioned so it overlays content without displacing it */}
      {menuOpen && (
        <>
          {/* Backdrop: darkens the page behind the menu; clicking it closes the menu */}
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            ref={menuRef}
            className="absolute top-full left-0 w-full z-50 md:hidden bg-white border-t shadow-lg text-sm text-black px-6"
          >
            <div className="py-2">
              {React.Children.map(categoryMenuSlot, (child) => {
                if (child && child.type === 'details') {
                  return React.cloneElement(child, {},
                    React.Children.map(child.props.children, (subChild) => {
                      if (subChild && subChild.type === 'div') {
                        return React.cloneElement(subChild, {},
                          React.Children.map(subChild.props.children, (link) => {
                            if (link && link.type === Link) {
                              return React.cloneElement(link, {
                                onClick: () => setMenuOpen(false),
                              });
                            }
                            return link;
                          })
                        );
                      }
                      return subChild;
                    })
                  );
                }
                return child;
              })}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}

export default Header;
