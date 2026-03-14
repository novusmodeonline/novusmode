import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions"; // update if your path differs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET: fetch full cart for current user (AUTHORITATIVE)
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart) {
    return Response.json({
      items: [],
      total: 0,
      allQuantity: 0,
    });
  }

  let total = 0;
  let allQuantity = 0;

  for (const item of cart.items) {
    total += Math.round(item.product.price * item.quantity);
    allQuantity += item.quantity;
  }

  return Response.json({
    ...cart,
    total,
    allQuantity,
  });
}

// POST: add/update quantity of a cart item
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  let { productId, quantity, selectedSize } = await req.json();
  selectedSize = selectedSize || "";
  if (!productId || typeof quantity !== "number" || quantity < 1)
    return new Response("Invalid", { status: 400 });

  let cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: session.user.id } });
  }
  await prisma.cartItem.upsert({
    where: {
      cartId_productId_selectedSize: {
        cartId: cart.id,
        productId,
        selectedSize,
      },
    },
    update: { quantity },
    create: { cartId: cart.id, productId, quantity, selectedSize },
  });
  return Response.json({
    message: "Item added of cart is successful",
    success: true,
  });
}

// DELETE: remove a product from cart
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  let { productId, selectedSize } = await req.json();
  if (!productId) return new Response("Invalid", { status: 400 });

  let cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  });
  if (!cart) return new Response("Cart not found", { status: 404 });

  await prisma.cartItem.delete({
    where: {
      cartId_productId_selectedSize: {
        cartId: cart.id,
        productId,
        selectedSize,
      },
    },
  });
  return Response.json({
    message: "Item deleted of cart is successful",
    success: true,
  });
}
