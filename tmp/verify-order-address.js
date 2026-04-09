const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.order.findMany({
  take: 5,
  select: { id: true, addressId: true, address: true },
}).then((rows) => {
  console.log(JSON.stringify({
    ok: true,
    count: rows.length,
    sample: rows.map((r) => ({
      id: r.id,
      addressId: r.addressId,
      addressPresent: !!r.address,
    })),
  }, null, 2));
}).catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
