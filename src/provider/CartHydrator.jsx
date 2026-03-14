"use client";

import { useEffect } from "react";
import { useProductStore } from "@/app/_zustand/store";

export default function CartHydrator({ children }) {
  const hydrateCartFromDb = useProductStore((state) => state.hydrateCartFromDb);
  const hasHydrated = useProductStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) {
      hydrateCartFromDb();
    }
  }, [hasHydrated, hydrateCartFromDb]);

  return children;
}
