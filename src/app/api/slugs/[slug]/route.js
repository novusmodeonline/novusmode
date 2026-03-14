import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request, { params }) {
  params = await params;
  const { slug } = params;
  const product = await prisma.product.findFirst({
    where: {
      slug: slug,
    },
    include: {
      category: true,
    },
  });
  return Response.json(product);
}
