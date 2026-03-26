import { create } from "zustand";

/**
 * Map a server cart item to the local product shape used by UI components.
 */
const mapServerItem = (item) => ({
  id: item.product.id,
  title: item.product.title,
  price: item.product.price,
  mrp: item.product.mrp,
  discount: item.product.discount,
  inStock: item.product.inStock,
  image: item.product.mainImage,
  mainImage: item.product.mainImage,
  amount: item.quantity,
  rating: item.product.rating,
  slug: item.product.slug,
  selectedSize: item?.selectedSize || "",
});

export const useProductStore = create()((set, get) => ({
  products: [],
  allQuantity: 0,
  total: 0,
  isHydrating: false,
  hasHydrated: false,

  // ─── Add to cart (server-backed for both guest + user) ────────────
  addToCart: async (newProduct) => {
    // Optimistic local update
    set((state) => {
      const exists = state.products.find(
        (item) =>
          String(item.id) === String(newProduct.id) &&
          (item.selectedSize || "") === (newProduct.selectedSize || ""),
      );
      let updatedProducts;
      if (!exists) {
        updatedProducts = [...state.products, newProduct];
      } else {
        updatedProducts = state.products.map((product) =>
          String(product.id) === String(newProduct.id) &&
          (product.selectedSize || "") === (newProduct.selectedSize || "")
            ? { ...product, amount: product.amount + newProduct.amount }
            : product,
        );
      }
      return { products: updatedProducts };
    });
    get().calculateTotals();

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: newProduct.id,
          quantity: newProduct.amount,
          selectedSize: newProduct.selectedSize,
        }),
      });

      if (!res.ok) {
        throw new Error("Cart sync failed");
      }

      const data = await res.json();
      return {
        ok: true,
        status: res.status,
        statusText: res.statusText,
        ownerType: data.ownerType,
        cartVersion: data.cartVersion,
      };
    } catch (error) {
      console.error("addToCart API error:", error);
      // Revert optimistic update on failure
      set((state) => ({
        products: state.products.filter(
          (p) =>
            !(
              String(p.id) === String(newProduct.id) &&
              (p.selectedSize || "") === (newProduct.selectedSize || "") &&
              p.amount === newProduct.amount
            ),
        ),
      }));
      get().calculateTotals();
      throw error;
    }
  },

  // ─── Remove from cart ─────────────────────────────────────────────
  removeFromCart: async (id, selectedSize) => {
    set((state) => ({
      products: state.products.filter(
        (p) =>
          !(
            p.id == id && (p.selectedSize || "").toUpperCase() === selectedSize
          ),
      ),
    }));
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId: id, selectedSize }),
    });
    get().calculateTotals();
  },

  // ─── Clear all cart ───────────────────────────────────────────────
  clearCart: async () => {
    set({
      products: [],
      allQuantity: 0,
      total: 0,
      hasHydrated: true,
    });
    await fetch("/api/cart/clear", {
      method: "POST",
      credentials: "include",
    });
  },

  // ─── Update cart item quantity ────────────────────────────────────
  updateCartAmount: async (id, amount) => {
    set((state) => ({
      products: state.products.map((product) =>
        String(product.id) === String(id) ? { ...product, amount } : product,
      ),
    }));

    const product = get().products.find(
      (item) => String(item.id) === String(id),
    );

    if (product) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            productId: id,
            quantity: amount,
            selectedSize: product.selectedSize,
          }),
        });
      } catch (error) {
        console.error("updateCartAmount API error:", error);
      }
    }
    get().calculateTotals();
  },

  // ─── Calculate totals ─────────────────────────────────────────────
  calculateTotals: () => {
    set((state) => {
      let amount = 0;
      let total = 0;
      state.products.forEach((item) => {
        amount += item.amount;
        total += item.amount * item.price;
      });
      return {
        allQuantity: amount,
        total: total,
      };
    });
  },

  // ─── Hydrate from server (works for guest + user) ─────────────────
  hydrateCartFromDb: async () => {
    try {
      set({ isHydrating: true });
      const res = await fetch("/api/cart", { credentials: "include" });
      if (!res.ok) {
        set({ isHydrating: false, hasHydrated: true });
        return;
      }
      const cart = await res.json();
      const updatedProducts = (cart.items || []).map(mapServerItem);
      set({
        products: updatedProducts,
        isHydrating: false,
        hasHydrated: true,
      });
      get().calculateTotals();
    } catch (err) {
      console.error("Cart hydration failed:", err);
      set({ isHydrating: false, hasHydrated: true });
    }
  },

  // ─── Merge guest → user cart on login, then re-hydrate ────────────
  mergeAndHydrate: async () => {
    try {
      set({ isHydrating: true });

      // Call server-side merge (idempotent, transactional)
      await fetch("/api/cart/merge", {
        method: "POST",
        credentials: "include",
      });

      // Re-hydrate from the (now merged) user cart
      const res = await fetch("/api/cart", { credentials: "include" });
      if (!res.ok) {
        set({ isHydrating: false, hasHydrated: true });
        return;
      }
      const cart = await res.json();
      const updatedProducts = (cart.items || []).map(mapServerItem);
      set({
        products: updatedProducts,
        isHydrating: false,
        hasHydrated: true,
      });
      get().calculateTotals();
    } catch (err) {
      console.error("Merge + hydrate failed:", err);
      set({ isHydrating: false, hasHydrated: true });
    }
  },

  // ─── Reset local cart on logout (no server call, no copy) ─────────
  resetCart: () => {
    set({
      products: [],
      allQuantity: 0,
      total: 0,
      hasHydrated: false,
    });
  },
}));
