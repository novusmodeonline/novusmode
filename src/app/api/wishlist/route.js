import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request, { params }) {
  params = await params;
  try {
    const wishlists = await prisma.wishlist.findMany({
      where: {
        userId: params.id,
      },
    });
    return new Response(JSON.stringify(wishlists), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching wishlists:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

export async function POST(request) {
  try {
    const { productId, userId } = await request.json();
    if (!productId || !userId) {
      return new Response(JSON.stringify({ error: "Invalid data" }), {
        status: 400,
      });
    }

    const existing = await prisma.wishlist.findFirst({
      where: {
        AND: [{ userId }, { productId }],
      },
      include: {
        product: true,
      },
    });

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Product already in wishlist" }),
        { status: 200 }
      );
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: true,
      },
    });

    return new Response(JSON.stringify(wishlistItem), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating wishlist item:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

export async function DELETE(request) {
  const { wishlistId } = await request.json();
  try {
    const wishlistItem = await prisma.wishlist.delete({
      where: {
        id: wishlistId,
      },
    });
    if (!wishlistItem) {
      return new Response(
        JSON.stringify({ error: "Wishlist item not found" }),
        {
          status: 404,
        }
      );
    }

    return new Response(JSON.stringify(wishlistItem), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching wishlist item:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
