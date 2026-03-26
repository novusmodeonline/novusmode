import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  resolveCartOwner,
  findActiveCart,
  getOrCreateCartByOwner,
  bumpVersion,
  computeCartTotals,
  setGuestCookie,
} from "@/lib/cartOwnership";

// ---------------------------------------------------------------------------
// GET: fetch full cart for current owner (user OR guest)
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const owner = await resolveCartOwner({ createIfMissing: false });

    // No identity at all → return empty cart (not 401)
    if (!owner) {
      return NextResponse.json({
        items: [],
        total: 0,
        allQuantity: 0,
        ownerType: "guest",
        cartVersion: 0,
      });
    }

    const cart = await findActiveCart(owner);

    if (!cart) {
      return NextResponse.json({
        items: [],
        total: 0,
        allQuantity: 0,
        ownerType: owner.type,
        cartVersion: 0,
      });
    }

    const { total, allQuantity } = computeCartTotals(cart);

    return NextResponse.json({
      ...cart,
      total,
      allQuantity,
      ownerType: owner.type,
      cartVersion: cart.version,
    });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to fetch cart" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST: add/update quantity of a cart item (user OR guest)
// ---------------------------------------------------------------------------
export async function POST(req) {
  try {
    let { productId, quantity, selectedSize, expectedVersion } =
      await req.json();
    selectedSize = selectedSize || "";

    if (!productId || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "productId and quantity required" },
        { status: 400 },
      );
    }

    const owner = await resolveCartOwner({ createIfMissing: true });
    let cart = await getOrCreateCartByOwner(owner);

    // Optimistic version check (optional from client)
    if (
      typeof expectedVersion === "number" &&
      expectedVersion !== cart.version
    ) {
      return NextResponse.json(
        {
          code: "VERSION_CONFLICT",
          message: "Cart was modified concurrently",
          currentVersion: cart.version,
        },
        { status: 409 },
      );
    }

    // Validate product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, stockOnHand: true, inStock: true },
    });

    if (!product) {
      return NextResponse.json(
        { code: "PRODUCT_NOT_FOUND", message: "Product does not exist" },
        { status: 404 },
      );
    }

    // Upsert item
    await prisma.cartItem.upsert({
      where: {
        cartId_productId_selectedSize: {
          cartId: cart.id,
          productId,
          selectedSize,
        },
      },
      update: { quantity, unitPriceSnapshot: product.price },
      create: {
        cartId: cart.id,
        productId,
        quantity,
        selectedSize,
        unitPriceSnapshot: product.price,
      },
    });

    // Bump cart version
    const updated = await bumpVersion(cart.id);

    const res = NextResponse.json({
      success: true,
      ownerType: owner.type,
      cartVersion: updated.version,
      warnings: [],
    });

    // Set guest cookie if new token was generated
    if (owner.type === "guest" && owner.isNewToken) {
      setGuestCookie(res, owner.rawToken);
    }

    return res;
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to update cart" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE: remove a product from cart (user OR guest)
// ---------------------------------------------------------------------------
export async function DELETE(req) {
  try {
    let { productId, selectedSize } = await req.json();
    selectedSize = selectedSize ?? "";

    if (!productId) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "productId required" },
        { status: 400 },
      );
    }

    const owner = await resolveCartOwner({ createIfMissing: false });
    if (!owner) {
      return NextResponse.json(
        { code: "NO_CART", message: "No cart found" },
        { status: 404 },
      );
    }

    const cart = await findActiveCart(owner);
    if (!cart) {
      return NextResponse.json(
        { code: "NO_CART", message: "Cart not found" },
        { status: 404 },
      );
    }

    await prisma.cartItem.delete({
      where: {
        cartId_productId_selectedSize: {
          cartId: cart.id,
          productId,
          selectedSize,
        },
      },
    });

    const updated = await bumpVersion(cart.id);

    return NextResponse.json({
      success: true,
      ownerType: owner.type,
      cartVersion: updated.version,
      warnings: [],
    });
  } catch (error) {
    console.error("DELETE /api/cart error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to delete cart item" },
      { status: 500 },
    );
  }
}
