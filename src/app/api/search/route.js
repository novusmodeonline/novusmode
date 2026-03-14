import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("search") || "";

  // Fetch products based on the search query
  const products = await prisma.product.findMany({
    where: {
      OR: [
        {
          description: {
            contains: query,
          },
        },
        {
          title: {
            contains: query,
          },
        },
      ],
    },
  });
  return Response.json(products);
}
