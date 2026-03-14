import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Get cart + authoritative totals for a user
 */
export async function getCartWithTotals(userId) {
  if (!userId) throw new Error("User not authenticated");

  const cart = await prisma.cart.findUnique({
    where: { userId },
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

  let total = 0;
  let allQuantity = 0;

  for (const item of cart.items) {
    total += Math.round(item.product.price * item.quantity);
    allQuantity += item.quantity;
  }

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
