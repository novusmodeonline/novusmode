"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useProductStore } from "@/app/_zustand/store";

export default function CartHydrator({ children }) {
  const hydrateCartFromDb = useProductStore((state) => state.hydrateCartFromDb);
  const mergeAndHydrate = useProductStore((state) => state.mergeAndHydrate);
  const resetCart = useProductStore((state) => state.resetCart);
  const hasHydrated = useProductStore((state) => state.hasHydrated);
  const { status } = useSession();
  const prevStatus = useRef(status);

  // Initial hydration — works for both guest (cookie-backed) and user
  useEffect(() => {
    if (!hasHydrated) {
      hydrateCartFromDb();
    }
  }, [hasHydrated, hydrateCartFromDb]);

  // Auth transition handling
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;

    // Login: unauthenticated → authenticated → merge guest cart server-side
    if (prev !== "authenticated" && status === "authenticated") {
      mergeAndHydrate();
    }

    // Logout: authenticated → unauthenticated → clear local, don't copy
    if (prev === "authenticated" && status === "unauthenticated") {
      resetCart();
    }
  }, [status, mergeAndHydrate, resetCart]);

  return children;
}
