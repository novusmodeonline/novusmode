import { GST_BY_SUBCATEGORY } from "./gstMap";

export function getGstRateFromSubcategory(subcategorySlug) {
  if (!subcategorySlug) return 5; // safe default for garments

  const key = Object.keys(GST_BY_SUBCATEGORY).find((prefix) =>
    subcategorySlug.startsWith(prefix)
  );

  return GST_BY_SUBCATEGORY[key] ?? 5;
}
