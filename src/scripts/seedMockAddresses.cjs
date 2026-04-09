const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = {
    userId: null,
    dryRun: false,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg.startsWith("--userId=")) {
      args.userId = arg.split("=").slice(1).join("=").trim() || null;
    }
  }

  return args;
}

function loadMockAddresses() {
  const filePath = path.join(
    process.cwd(),
    "src",
    "lib",
    "invoice",
    "getMockAddress.js",
  );

  const source = fs.readFileSync(filePath, "utf8");
  const match = source.match(
    /export const MOCK_ADDRESSES\s*=\s*(\[[\s\S]*?\n\]);/,
  );

  if (!match) {
    throw new Error(
      "Unable to find `MOCK_ADDRESSES` in src/lib/invoice/getMockAddress.js",
    );
  }

  return new Function(`return ${match[1]};`)();
}

function simpleSeedHash(input) {
  let hash = 2166136261;

  for (const char of String(input || "mock-address")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function buildRealisticIndianPhone(index, pincode, city = "", line1 = "") {
  const prefixes = ["9", "8", "7", "6"];
  let state = simpleSeedHash(`${line1}-${city}-${pincode}-${index}`);
  const prefix = prefixes[state % prefixes.length];

  let tail = "";
  for (let i = 0; i < 9; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    tail += String(state % 10);
  }

  if (/^(\d)\1{8}$/.test(tail)) {
    tail = `73${tail.slice(2)}`;
  }

  return prefix + tail;
}

function buildAddressRecord(address, index, userId, id) {
  return {
    id: String(id),
    userId,
    name: address.line1,
    phone: buildRealisticIndianPhone(
      index,
      address.pincode,
      address.city,
      address.line1,
    ),
    address1: address.line1,
    address2: null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: "India",
    landmark: "",
    label: "",
    isDefault: false,
  };
}

async function getNextAddressId() {
  const existingAddresses = await prisma.address.findMany({
    select: { id: true },
  });

  const numericIds = existingAddresses
    .map((entry) => Number(entry.id))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (!numericIds.length) {
    return 1;
  }

  return Math.max(...numericIds) + 1;
}

async function ensureUserExists(userId) {
  if (!userId) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error(`User not found for userId=${userId}`);
  }

  console.log(`Seeding mock addresses for user: ${user.email} (${user.id})`);
}

async function main() {
  const { userId, dryRun } = parseArgs(process.argv.slice(2));
  await ensureUserExists(userId);

  const mockAddresses = loadMockAddresses();

  if (!Array.isArray(mockAddresses) || mockAddresses.length === 0) {
    throw new Error("No mock addresses found to seed.");
  }

  let inserted = 0;
  let skipped = 0;
  let nextAddressId = await getNextAddressId();

  for (const [index, address] of mockAddresses.entries()) {
    const data = buildAddressRecord(
      address,
      index,
      userId || null,
      nextAddressId,
    );

    const existing = await prisma.address.findFirst({
      where: {
        userId: data.userId,
        address1: data.address1,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      inserted += 1;
      console.log(
        `[dry-run] Would insert #${data.id}: ${data.address1}, ${data.city}`,
      );
      nextAddressId += 1;
      continue;
    }

    await prisma.address.create({ data });
    inserted += 1;
    nextAddressId += 1;
  }

  console.log(
    `${dryRun ? "Validated" : "Inserted"} ${inserted} mock addresses; skipped ${skipped} existing entries.`,
  );
}

main()
  .catch((error) => {
    console.error("seedMockAddresses failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
