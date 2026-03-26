/**
 * Cleanup utility for stale / merged guest carts.
 *
 * Intended to be run periodically (cron, manual, or future scheduler).
 *
 * Usage:
 *   node src/scripts/cleanupStaleCarts.js
 *
 * Policy:
 *   - Guest carts with lastActivityAt > 30 days → mark "abandoned"
 *   - Carts with status "merged" older than 7 days → delete (with items)
 *   - Carts with status "abandoned" older than 60 days → delete (with items)
 *   - Active carts are NEVER deleted.
 *
 * TODO: Hook into cron infrastructure when available.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const STALE_DAYS = 30;
const MERGED_RETENTION_DAYS = 7;
const ABANDONED_RETENTION_DAYS = 60;

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log("🧹 Cart cleanup starting...\n");

  // 1. Mark stale guest carts as abandoned
  const staleResult = await prisma.cart.updateMany({
    where: {
      status: "active",
      userId: null,
      guestTokenHash: { not: null },
      lastActivityAt: { lt: daysAgo(STALE_DAYS) },
    },
    data: { status: "abandoned" },
  });
  console.log(`  Marked ${staleResult.count} stale guest carts as abandoned`);

  // 2. Delete merged carts older than retention period
  const mergedCarts = await prisma.cart.findMany({
    where: {
      status: "merged",
      updatedAt: { lt: daysAgo(MERGED_RETENTION_DAYS) },
    },
    select: { id: true },
  });
  if (mergedCarts.length > 0) {
    const mergedIds = mergedCarts.map((c) => c.id);
    // Items cascade-deleted via onDelete: Cascade
    const delResult = await prisma.cart.deleteMany({
      where: { id: { in: mergedIds } },
    });
    console.log(
      `  Deleted ${delResult.count} merged carts (items cascade-deleted)`,
    );
  } else {
    console.log("  No merged carts to delete");
  }

  // 3. Delete abandoned carts older than retention period
  const abandonedCarts = await prisma.cart.findMany({
    where: {
      status: "abandoned",
      updatedAt: { lt: daysAgo(ABANDONED_RETENTION_DAYS) },
    },
    select: { id: true },
  });
  if (abandonedCarts.length > 0) {
    const abandonedIds = abandonedCarts.map((c) => c.id);
    const delResult = await prisma.cart.deleteMany({
      where: { id: { in: abandonedIds } },
    });
    console.log(
      `  Deleted ${delResult.count} abandoned carts (items cascade-deleted)`,
    );
  } else {
    console.log("  No abandoned carts to delete");
  }

  // 4. Clean up old merge ledger entries (> 90 days)
  const ledgerResult = await prisma.mergeLedger.deleteMany({
    where: {
      createdAt: { lt: daysAgo(90) },
    },
  });
  console.log(`  Deleted ${ledgerResult.count} old merge ledger entries`);

  console.log("\n✅ Cart cleanup complete.");
}

main()
  .catch((e) => {
    console.error("Cart cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
