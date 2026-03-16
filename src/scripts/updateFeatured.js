const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
    const products = JSON.parse(
        fs.readFileSync(path.join(__dirname, "products.json"), "utf-8")
    );

    let updated = 0;
    for (const product of products) {
        // Only update the isFeatured field — nothing else touched
        await prisma.product.updateMany({
            where: { id: product.id },
            data: { isFeatured: product.isFeatured ?? false },
        });
        updated++;
    }

    console.log(`✅ Updated isFeatured on ${updated} products`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
