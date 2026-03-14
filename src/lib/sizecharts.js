// lib/sizeCharts.js
// Generic size charts + helpers for men/women/kids
// Categories supported: shirts, tshirts, jackets, denim (jeans), shorts, beachwear, shoes

// ---- Normalization helpers ----
const toCm = (inches) => Math.round(inches * 2.54);
const toIn = (cm) => Math.round((cm / 2.54) * 10) / 10;

export function parseSizes(csv) {
  return (csv || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

// Accept "male/men/man", "female/women/woman", "kids/children/boys/girls"
export function normalizeGender(s = "") {
  const v = s.toLowerCase();
  if (/^m(en|ale)?$/.test(v) || v === "man") return "men";
  if (/^w(omen|oman|female)?$/.test(v)) return "women";
  if (/^kid(s)?$/.test(v) || /^(child|children|boys?|girls?)$/.test(v))
    return "kids";
  return "men"; // sensible default if unknown
}

// Map category & subcategory names to a canonical type
export function normalizeType(categoryName = "", subCategoryName = "") {
  const src = `${categoryName} ${subCategoryName}`.toLowerCase();

  if (/\b(shirt|formal shirt|casual shirt)\b/.test(src)) return "shirt";
  if (/\b(t[- ]?shirt|tee|tees)\b/.test(src)) return "tshirt";
  if (/\b(jacket|hoodie|coat|outerwear)\b/.test(src)) return "jacket";
  if (/\b(denim|denims|jean|jeans)\b/.test(src)) return "denim";
  if (/\b(short|shorts)\b/.test(src)) return "shorts";
  if (/\b(beach|swim|swimwear|trunks|bikini)\b/.test(src)) return "beachwear";
  if (/\b(shoes|sneaker|trainer|loafer|boot|sandals|footwares?)\b/.test(src))
    return "shoes";

  // fallback: if subcategory holds only sizes like S/M/L, treat as tshirt-like
  return "tshirt";
}

// ---- Preset charts ----
// Apparel use alpha sizes (XS–XXL); shoes use US/UK/EU numeric mapping.
// Values are representative baselines; adjust if you have brand-specific charts.

// lib/sizeCharts.js (snippet)

export const APPAREL = {
  men: {
    top: [
      {
        size: "XS",
        chestIn: 34,
        waistIn: 28,
        chestCm: toCm(34),
        waistCm: toCm(28),
      },
      {
        size: "S",
        chestIn: 36,
        waistIn: 30,
        chestCm: toCm(36),
        waistCm: toCm(30),
      },
      {
        size: "M",
        chestIn: 38,
        waistIn: 34,
        chestCm: toCm(38),
        waistCm: toCm(34),
      },
      {
        size: "L",
        chestIn: 40,
        waistIn: 37,
        chestCm: toCm(40),
        waistCm: toCm(37),
      }, // tweaked
      {
        size: "XL",
        chestIn: 42,
        waistIn: 41,
        chestCm: toCm(42),
        waistCm: toCm(41),
      }, // tweaked
      {
        size: "XXL",
        chestIn: 44,
        waistIn: 43,
        chestCm: toCm(44),
        waistCm: toCm(43),
      }, // tweaked
    ],
    bottom: [
      {
        size: "28",
        waistIn: 28,
        hipIn: 34,
        waistCm: toCm(28),
        hipCm: toCm(34),
      },
      {
        size: "30",
        waistIn: 30,
        hipIn: 36,
        waistCm: toCm(30),
        hipCm: toCm(36),
      },
      {
        size: "32",
        waistIn: 32,
        hipIn: 38,
        waistCm: toCm(34),
        hipCm: toCm(40),
      },
      {
        size: "34",
        waistIn: 34,
        hipIn: 40,
        waistCm: toCm(37),
        hipCm: toCm(44),
      }, // tweaked
      {
        size: "36",
        waistIn: 36,
        hipIn: 42,
        waistCm: toCm(41),
        hipCm: toCm(48),
      }, // tweaked
      {
        size: "38",
        waistIn: 38,
        hipIn: 44,
        waistCm: toCm(43),
        hipCm: toCm(52),
      }, // tweaked
    ],
  },

  women: {
    top: [
      {
        size: "XS",
        bustIn: 31,
        waistIn: 24,
        bustCm: toCm(31),
        waistCm: toCm(24),
      },
      {
        size: "S",
        bustIn: 33,
        waistIn: 26,
        bustCm: toCm(33),
        waistCm: toCm(26),
      },
      {
        size: "M",
        bustIn: 36,
        waistIn: 29,
        bustCm: toCm(36),
        waistCm: toCm(29),
      },
      {
        size: "L",
        bustIn: 39,
        waistIn: 32,
        bustCm: toCm(39),
        waistCm: toCm(32),
      },
      {
        size: "XL",
        bustIn: 42,
        waistIn: 35,
        bustCm: toCm(42),
        waistCm: toCm(35),
      },
      {
        size: "XXL",
        bustIn: 45,
        waistIn: 38,
        bustCm: toCm(45),
        waistCm: toCm(38),
      },
    ],
    bottom: [
      {
        size: "24",
        waistIn: 24,
        hipIn: 32,
        waistCm: toCm(24),
        hipCm: toCm(32),
      },
      {
        size: "26",
        waistIn: 26,
        hipIn: 34,
        waistCm: toCm(26),
        hipCm: toCm(34),
      },
      {
        size: "28",
        waistIn: 28,
        hipIn: 36,
        waistCm: toCm(28),
        hipCm: toCm(36),
      },
      {
        size: "30",
        waistIn: 30,
        hipIn: 38,
        waistCm: toCm(30),
        hipCm: toCm(38),
      },
      {
        size: "32",
        waistIn: 32,
        hipIn: 40,
        waistCm: toCm(32),
        hipCm: toCm(40),
      },
      {
        size: "34",
        waistIn: 34,
        hipIn: 42,
        waistCm: toCm(34),
        hipCm: toCm(42),
      },
      {
        size: "36",
        waistIn: 36,
        hipIn: 44,
        waistCm: toCm(36),
        hipCm: toCm(44),
      },
    ],
  },

  kids: {
    top: [
      {
        size: "XS",
        chestIn: 18,
        lengthIn: 15.5,
        chestCm: toCm(18),
        lengthCm: toCm(15.5),
      },
      {
        size: "S",
        chestIn: 19.3,
        lengthIn: 16,
        chestCm: toCm(19.3),
        lengthCm: toCm(16),
      },
      {
        size: "M",
        chestIn: 20.8,
        lengthIn: 18,
        chestCm: toCm(20.8),
        lengthCm: toCm(18),
      },
      {
        size: "L",
        chestIn: 21.8,
        lengthIn: 19,
        chestCm: toCm(21.8),
        lengthCm: toCm(19),
      },
      {
        size: "XL",
        chestIn: 22.8,
        lengthIn: 20,
        chestCm: toCm(22.8),
        lengthCm: toCm(20),
      },
    ],
    bottom: [
      {
        size: "7.5",
        waistIn: 7.5,
        hipIn: 4.5,
        waistCm: toCm(7.5),
        hipCm: toCm(4.5),
      },
      { size: "8", waistIn: 8, hipIn: 5, waistCm: toCm(8), hipCm: toCm(5) },
      {
        size: "8.5",
        waistIn: 8.5,
        hipIn: 5.3,
        waistCm: toCm(8.5),
        hipCm: toCm(5.3),
      },
      { size: "9", waistIn: 9, hipIn: 5.5, waistCm: toCm(8), hipCm: toCm(5.3) },
      {
        size: "9.5",
        waistIn: 9.5,
        hipIn: 6,
        waistCm: toCm(9.5),
        hipCm: toCm(6),
      },
    ],
  },
};

const SHOES = {
  men: [
    // US, UK, EU baseline
    { size: "6", us: 7, uk: 6, eu: 41 },
    { size: "7", us: 8, uk: 7, eu: 42 },
    { size: "8", us: 9, uk: 8, eu: 43 },
    { size: "9", us: 10, uk: 9, eu: 44 },
    { size: "10", us: 11, uk: 10, eu: 45 },
  ],
  women: [
    { size: "5", us: 6, uk: 5, eu: 38 },
    { size: "6", us: 7, uk: 6, eu: 39 },
    { size: "7", us: 8, uk: 7, eu: 40 },
    { size: "8", us: 9, uk: 8, eu: 41 },
  ],
  kids: [
    { size: "10K", us: 10, uk: 9.5, eu: 27.5 },
    { size: "11K", us: 11, uk: 10.5, eu: 28.5 },
    { size: "12K", us: 12, uk: 11.5, eu: 30 },
    { size: "13K", us: 13, uk: 12.5, eu: 31 },
    { size: "1", us: 1, uk: 13.5, eu: 32.5 },
    { size: "2", us: 2, uk: 1.5, eu: 33.5 },
  ],
};

// ---- Chart chooser ----
function pickApparelGroup(type) {
  // tops vs bottoms
  if (["shirt", "tshirt", "jacket", "beachwear"].includes(type)) return "top";
  if (["denim", "shorts"].includes(type)) return "bottom";
  // default to top
  return "top";
}

function normalizeRowsApparel(rows) {
  return rows.map((r) => {
    const chestIn = r.chestIn ?? 0;
    const bustIn = r.bustIn ?? 0;
    const waistIn = r.waistIn ?? 0;
    const lengthIn = r.lengthIn ?? 0;
    const hipIn = r.hipIn ?? 0;
    return {
      size: r.size,
      chestIn: chestIn || null,
      chestCm: chestIn ? toCm(bustIn) : null,
      bustIn: bustIn || null,
      bustCm: bustIn ? toCm(bustIn) : null,
      waistIn: waistIn || null,
      waistCm: waistIn ? toCm(waistIn) : null,
      lengthIn: lengthIn || null,
      lengthCm: lengthIn ? toCm(lengthIn) : null,
      hipIn: hipIn || null,
      hipCm: hipIn ? toCm(hipIn) : null,
    };
  });
}

function normalizeRowsShoes(rows) {
  return rows.map((r) => ({
    size: r.size,
    us: r.us,
    uk: r.uk,
    eu: r.eu,
  }));
}

/**
 * Main entry: get a normalized chart for a product context
 * @param {Object} opts
 * @param {"men"|"women"|"kids"|string} opts.gender
 * @param {"shirt"|"tshirt"|"jacket"|"denim"|"shorts"|"beachwear"|"shoes"|string} opts.type
 * @param {"US"|"EU"|"UK"|string} opts.metric - display accent (we always output both where possible)
 * @param {string[]} [opts.available] - filter to these sizes if provided (e.g., from product.availableSizes)
 */
export function getSizeChart({
  gender = "men",
  type = "tshirt",
  metric = "UK",
  available = [],
} = {}) {
  const g = normalizeGender(gender);
  const t = normalizeType(type, ""); // allow plain type keys too

  if (t === "shoes") {
    const base = SHOES[g] || SHOES.men;
    const matchKey = metric === "EU" ? "eu" : metric === "UK" ? "uk" : "us";
    const filtered = available?.length
      ? base.filter((r) => available.includes(String(r[matchKey])))
      : base;

    const rows = filtered.map((r) => ({
      size: metric === "EU" ? r.eu : metric === "UK" ? r.uk : r.us, // primary label
      uk: r.uk,
      us: r.us,
      eu: r.eu,
    }));

    const headers =
      metric === "EU"
        ? ["Size (EU)", "EU", "UK", "US"]
        : metric === "UK"
        ? ["Size (UK)", "UK", "US", "EU"]
        : ["Size (US)", "US", "UK", "EU"];
    return {
      kind: "shoes",
      metric,
      headers: headers,
      rows: rows,
    };
  }

  const group = pickApparelGroup(t); // top or bottom
  const base = (APPAREL[g] || APPAREL.men)[group] || [];
  const filtered = available?.length
    ? base.filter((r) => available.includes(String(r.size).toUpperCase()))
    : base;

  // We’ll show both inches & cm, regardless of metric preference
  const rows = normalizeRowsApparel(filtered);

  // Choose which columns to emphasize based on metric
  const headersTop =
    metric === "EU"
      ? ["Size", "Chest (cm)", "Waist (cm)"]
      : getHeaderTop(gender);

  const headersBottom =
    metric === "EU"
      ? ["Size", "Waist (cm)", "Hip (cm)"]
      : ["Size", "Waist (in)", "Hip (in)"];

  const headers = group === "top" ? headersTop : headersBottom;

  return { kind: "apparel", metric, group, headers, rows };
}

function getHeaderTop(gender) {
  switch (gender) {
    case "women":
      return ["Size", "Bust (in)", "Waist (in)"];
    case "kids":
      return ["Size", "Chest (in)", "Length (in)"];
    default:
      return ["Size", "Chest (in)", "Waist (in)"];
  }
}

/**
 * Convenience for your product object: uses category/subCategory names
 * and optional product.gender (if you later add it).
 * Expects: product.category?.name, product.subCategory?.name, product.sizeMetric, product.availableSizes
 */
export function getSizeChartForProduct(product) {
  const categoryName = product?.categoryId || "";
  const subCategoryName = product?.subCategoryId || "";
  const type = normalizeType(categoryName, subCategoryName);

  // Optional: if you add product.gender later, pass it; else default men.
  const gender =
    product.categoryId != "accessories" ? product?.categoryId : "men";
  const metric = (product?.sizeMetric || "UK").toUpperCase();
  const available = parseSizes(product?.availableSizes);

  return getSizeChart({ gender, type, metric, available });
}
