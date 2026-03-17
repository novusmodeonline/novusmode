import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePathProduct = path.join(__dirname, "products.json");

async function syncProducts() {
  console.log("Reading products from products.json...");
  const productsData = JSON.parse(await readFile(filePathProduct, "utf8"));
  
  console.log(`Found ${productsData.length} products. Starting upsert...`);

  let count = 0;
  for (const product of productsData) {
    try {
      // Upsert using slug as a unique identifier to handle potential ID changes while keeping data consistent
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          id: product.id, // Update ID if it changed
          title: product.title,
          description: product.description,
          price: product.price,
          rating: product.rating,
          manufacturer: product.manufacturer,
          categoryId: product.categoryId,
          subCategoryId: product.subCategoryId,
          mainImage: product.mainImage,
          inStock: product.inStock,
          availableSizes: product.availableSizes,
          defaultSize: product.defaultSize,
          selectedSize: product.selectedSize,
          sizeMetric: product.sizeMetric,
          keyFeatures: product.keyFeatures,
          isFeatured: product.isFeatured || false,
        },
        create: {
          id: product.id,
          title: product.title,
          slug: product.slug,
          description: product.description,
          price: product.price,
          rating: product.rating,
          manufacturer: product.manufacturer,
          categoryId: product.categoryId,
          subCategoryId: product.subCategoryId,
          mainImage: product.mainImage,
          inStock: product.inStock,
          availableSizes: product.availableSizes,
          defaultSize: product.defaultSize,
          selectedSize: product.selectedSize,
          sizeMetric: product.sizeMetric,
          keyFeatures: product.keyFeatures,
          isFeatured: product.isFeatured || false,
        },
      });
      count++;
      if (count % 50 === 0) console.log(`Processed ${count} products...`);
    } catch (error) {
      console.error(`Failed to sync product: ${product.slug}`, error.message);
    }
  }

  console.log(`Successfully synced ${count} products to the database.`);
}

syncProducts()
  .catch((error) => {
    console.error("Critical error during sync:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
