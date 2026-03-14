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
  for (const category of categories) {
    await prisma.category.create({
      data: category,
    });
  }
  console.log("Demo Category inserted successfully!");

  for (const subcategory of subcategories) {
    await prisma.subCategory.create({
      data: subcategory,
    });
  }
  console.log("Demo Sub Category inserted successfully!");

  for (const product of productsData) {
    await prisma.product.create({
      data: product,
    });
  }
  console.log("Demo Products inserted successfully!");

  // for (const image of productsDataImages) {
  //   await prisma.productImage.create({
  //     data: image,
  //   });
  // }
  // console.log("Demo images inserted successfully!");
}

insertDemoData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
