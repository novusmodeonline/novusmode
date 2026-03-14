import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function sitemap() {
  // Pull routes from your DB: products, categories, blog, etc.
  const staticRoutes = [
    "",
    "/login",
    "/register",
    "/cart",
    "/newsletter",
    "/checkout",
    "/order-confirmation",
    "/products",
    "/profile",
    "/search",
    "/shop",
    "/wihslist",
  ].map((p) => ({
    url: `https://www.novusmode.com/${p}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  // Example: dynamic products
  const products = await prisma.product.findMany();
  const productRoutes = products.map((p) => ({
    url: `https://www.novusmode.com/api/slugs/${p.slug}`,
    changeFrequency: "daily",
    priority: 0.9,
  }));
  return [...staticRoutes, ...productRoutes];
}
