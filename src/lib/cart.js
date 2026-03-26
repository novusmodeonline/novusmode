import prisma from "@/lib/prisma";
import { computeCartTotals } from "@/lib/cartOwnership";

/**
 * Get cart + authoritative totals for a user (by userId).
 * Backward-compatible — used by coupon and order endpoints.
 */
export async function getCartWithTotals(userId) {
  if (!userId) throw new Error("User not authenticated");

  const cart = await prisma.cart.findFirst({
    where: { userId, status: "active" },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart) {
    return {
      items: [],
      total: 0,
      allQuantity: 0,
    };
  }

  const { total, allQuantity } = computeCartTotals(cart);

  return {
    ...cart,
    total,
    allQuantity,
  };
}

/**
 * Get ONLY cart total (used by coupon / payment)
 */
export async function getCartTotal(userId) {
  const cart = await getCartWithTotals(userId);
  return cart.total;
}
