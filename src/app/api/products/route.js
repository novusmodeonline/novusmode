import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const price = searchParams.get("filters[price][$lte]");
  const rating = searchParams.get("filters[rating][$gte]");
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const sort = searchParams.get("sort"); // e.g. sort=price:asc
  const search = searchParams.get("search");
  const featured = searchParams.get("isFeatured");
  const stockMode = ["equals", "lt", "lte", "gt", "gte"].find((mode) => {
    return searchParams.has(`filters[inStock][$${mode}]`);
  });
  const stockValue = stockMode
    ? Number(searchParams.get(`filters[inStock][$${stockMode}]`))
    : undefined;
  const where = {
    ...(price && { price: { lte: Number(price) } }),
    ...(rating && { rating: { gte: Number(rating) } }),
    ...(stockMode &&
      stockValue !== undefined && {
        inStock: { [stockMode]: stockValue },
      }),
    ...(featured && { isFeatured: true }),
    ...(category && !subcategory && { categoryId: `${category}` }),
    ...(category && subcategory && { subCategoryId: `${subcategory}` }),
    ...(search && {
      OR: [
        {
          description: {
            contains: search,
          },
        },
        {
          title: {
            contains: search,
          },
        },
      ],
    }),
  };
  const orderBy = sort
    ? {
        [sort.split(":")[0]]: sort.split(":")[1] === "desc" ? "desc" : "asc",
      }
    : { createdAt: "desc" }; // ✅ This now works correctly

  const products = await prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where,
    orderBy,
  });
  const totalCount = await prisma.product.count({ where });

  return Response.json({
    products,
    totalCount,
  });
}
