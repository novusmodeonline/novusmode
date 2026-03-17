import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { categories, subcategories } from "./categoryData.js";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePathProduct = path.join(__dirname, "products.json");
// const filePathimages = path.join(__dirname, "productImages.json");
const productsData = JSON.parse(await readFile(filePathProduct, "utf8"));
// const productsDataImages = JSON.parse(await readFile(filePathimages, "utf8"));
console.log(categories);
async function insertDemoData() {
  console.log("Seeding categories...");
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }
  console.log("Categories synced successfully!");

  console.log("Seeding subcategories...");
  for (const subcategory of subcategories) {
    await prisma.subCategory.upsert({
      where: { id: subcategory.id },
      update: subcategory,
      create: subcategory,
    });
  }
  console.log("Subcategories synced successfully!");

  console.log(`Checking products from ${filePathProduct}...`);
  let count = 0;
  for (const product of productsData) {
    try {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          id: product.id,
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
      if (count % 20 === 0) console.log(`Processed ${count} products...`);
    } catch (error) {
      console.error(`Failed to sync product: ${product.slug}. Error: ${error.message}`);
    }
  }
  console.log(`Successfully synced ${count} products to the database!`);
}

insertDemoData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
