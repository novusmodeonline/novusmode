// scripts/backfillOrderAmounts.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  await prisma.order.updateMany({
    where: {
      OR: [{ originalAmount: null }, { finalAmount: null }],
    },
    data: {
      originalAmount: undefined, // will be set per row
    },
  });

  const orders = await prisma.order.findMany({
    where: { originalAmount: null },
  });

  for (const o of orders) {
    await prisma.order.update({
      where: { id: o.id },
      data: {
        originalAmount: o.amount,
        finalAmount: o.amount,
        discountAmount: 0,
      },
    });
  }
  await prisma.coupon.create({
    data: {
      code: "MAGICDISCOUNT",
      ruleType: "MAGIC_CLAMP_5000",
      isActive: true,
    },
  });
}

run().finally(() => prisma.$disconnect());
