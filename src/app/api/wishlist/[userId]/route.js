import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    params = await params;
    const { userId } = params;
    const wishlists = await prisma.wishlist.findMany({
      where: {
        userId,
      },
      include: {
        product: true, // 👈 include the full product data
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
