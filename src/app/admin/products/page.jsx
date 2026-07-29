import prisma from "@/lib/prisma";
import ProductAdminTable from "./ProductAdminTable";

async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      subCategory: true,
    },
  });

  return products.map((product) => ({
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold">Products</h2>
        <p className="text-sm text-gray-600">
          Read-only product catalogue view for admin review.
        </p>
      </div>

      <ProductAdminTable products={products} />
    </div>
  );
}
