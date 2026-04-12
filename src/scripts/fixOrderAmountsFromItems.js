import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toInt(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function calcItemsTotal(products) {
  return Math.round(
    (products || []).reduce((sum, item) => {
      const price = Number(item?.price || 0);
      const qty = Number(item?.quantity || 0);
      return sum + (Number.isFinite(price) ? price : 0) * (Number.isFinite(qty) ? qty : 0);
    }, 0),
  );
}

function resolveFinalAmount(order) {
  const fromFinal = toInt(order?.finalAmount);
  if (fromFinal !== null) return fromFinal;

  const fromPayment = toInt(order?.payment?.amount);
  if (fromPayment !== null) return fromPayment;

  const fromAmount = toInt(order?.amount);
  if (fromAmount !== null) return fromAmount;

  return 0;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const orders = await prisma.order.findMany({
    include: {
      products: true,
      payment: {
        select: {
          amount: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  let scanned = 0;
  let eligible = 0;
  let changed = 0;
  let unchanged = 0;
  const candidates = [];

  for (const order of orders) {
    scanned += 1;

    if (!order.products?.length) {
      continue;
    }

    eligible += 1;

    const itemsTotal = calcItemsTotal(order.products);
    const finalAmount = resolveFinalAmount(order);

    const next = {
      amount: itemsTotal,
      originalAmount: itemsTotal,
      finalAmount,
      discountAmount: Math.max(0, itemsTotal - finalAmount),
    };

    const current = {
      amount: toInt(order.amount) ?? 0,
      originalAmount: toInt(order.originalAmount) ?? 0,
      finalAmount: toInt(order.finalAmount) ?? finalAmount,
      discountAmount: toInt(order.discountAmount) ?? 0,
    };

    const isSame =
      current.amount === next.amount &&
      current.originalAmount === next.originalAmount &&
      current.finalAmount === next.finalAmount &&
      current.discountAmount === next.discountAmount;

    if (isSame) {
      unchanged += 1;
      continue;
    }

    changed += 1;
    candidates.push({
      id: order.id,
      source: order.source,
      products: order.products.length,
      before: current,
      after: next,
    });
  }

  console.log("\n[fixOrderAmountsFromItems] Summary");
  console.log(`Scanned: ${scanned}`);
  console.log(`Eligible (has products): ${eligible}`);
  console.log(`Will change: ${changed}`);
  console.log(`Already correct: ${unchanged}`);

  if (candidates.length) {
    console.log("\nSample changes (first 20):");
    for (const row of candidates.slice(0, 20)) {
      console.log(
        `${row.id} | src=${row.source} | items=${row.products} | ` +
          `amount ${row.before.amount}->${row.after.amount}, ` +
          `original ${row.before.originalAmount}->${row.after.originalAmount}, ` +
          `final ${row.before.finalAmount}->${row.after.finalAmount}, ` +
          `discount ${row.before.discountAmount}->${row.after.discountAmount}`,
      );
    }
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to persist changes.");
    return;
  }

  for (const row of candidates) {
    await prisma.order.update({
      where: { id: row.id },
      data: row.after,
    });
  }

  console.log(`\nApplied updates to ${candidates.length} orders.`);
}

main()
  .catch((error) => {
    console.error("[fixOrderAmountsFromItems] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
