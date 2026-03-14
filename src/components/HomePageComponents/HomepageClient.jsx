"use client";

import { useEffect, useState } from "react";
import { HomePage } from "@/components";

export default function HomepageClient() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  return (
    <main className="px-0 sm:px-6 lg:px-0">
      <HomePage />
    </main>
  );
}
