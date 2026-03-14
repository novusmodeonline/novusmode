import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      { name: "Classic T-Shirt", price: 499, imageUrl: "/shirt1.jpg" },
      { name: "Denim Jeans", price: 999, imageUrl: "/jeans1.jpg" },
      { name: "Winter Jacket", price: 1999, imageUrl: "/jacket1.jpg" },
    ],
  });
  console.log("Seeded products");
}

main().finally(() => prisma.$disconnect());
