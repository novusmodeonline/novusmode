import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request, { params }) {
  params = await params;
  const { userId, productId } = params;
  try {
    const wishlistItem = await prisma.wishlist.findMany({
      where: {
        userId: userId,
        productId: productId,
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
