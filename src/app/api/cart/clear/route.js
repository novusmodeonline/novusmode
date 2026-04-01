import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  resolveCartOwner,
  findActiveCart,
  bumpVersion,
} from "@/lib/cartOwnership";

export async function POST() {
  try {
    const owner = await resolveCartOwner({ createIfMissing: false });

    if (!owner) {
      return NextResponse.json(
        {
          success: true,
          message: "No cart found",
          ownerType: "guest",
          cartVersion: 0,
          warnings: [],
        },
        { status: 200 },
      );
    }

    const cart = await findActiveCart(owner);

    if (!cart) {
      return NextResponse.json(
        {
          success: true,
          message: "No cart found",
          ownerType: owner.type,
          cartVersion: 0,
          warnings: [],
        },
        { status: 200 },
      );
    }

    // Delete all items from the cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    const updated = await bumpVersion(cart.id);

    return NextResponse.json({
      success: true,
      message: "Cart cleared successfully",
      ownerType: owner.type,
      cartVersion: updated.version,
      warnings: [],
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Something went wrong" },
      { status: 500 },
    );
  }
}
