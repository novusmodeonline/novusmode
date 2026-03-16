import { getCategoriesCached, getSubCategoriesCached } from "@/helper/Catalog";
export const revalidate = 0;
import Link from "next/link";

// small helper
const slugify = (s) =>
  (s ?? "").toString().trim().toLowerCase().replace(/\s+/g, "-");

const CategoryMenu = async () => {
  const [categories, subCategories] = await Promise.all([
    getCategoriesCached(),
    getSubCategoriesCached(),
  ]);

  // Group subs by categoryId once
  const subsByCat = subCategories.reduce((acc, sub) => {
    (acc[sub.categoryId] ||= []).push(sub);
    return acc;
  }, {});

  return (
    <>
      {categories.map((section) => {
        const sectionSlug = slugify(section.slug || section.name);
        const subs = subsByCat[section.id] || [];
        return (
          <div className="group relative cursor-pointer" key={section.id}>
            {/* Desktop: hover for subcategories */}
            <div className="hidden md:block">
              <Link href={`/${sectionSlug}`}>
                <span className="hover:text-primary transition-colors duration-200">
                  {section.name}
                </span>
              </Link>
              {subs.length > 0 && (
                <div
                  className="absolute left-0 top-full mt-0 hidden group-hover:block bg-white border shadow-md rounded-md w-56 z-50"
                  role="menu"
                >
                  {subs.map((sub) => {
                    const subSlug = slugify(sub.slug || sub.name);
                    return (
                      <Link
                        key={sub.id}
                        href={`/${sectionSlug}/${subSlug}`}
                        className="block px-4 py-2 hover:bg-gray-100"
                        role="menuitem"
                      >
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Mobile: plain link if no subs, expandable details if subs exist */}
            {subs.length === 0 ? (
              <Link
                href={`/${sectionSlug}`}
                className="md:hidden flex items-center gap-2 font-medium mb-2 py-2"
              >
                {/* Invisible spacer matches width of › arrow in expandable items */}
                <span className="w-4 shrink-0" aria-hidden="true" />
                {section.name}
              </Link>
            ) : (
              <details className="md:hidden mb-2 [&>summary]:list-none [&>summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center gap-2 font-medium cursor-pointer py-2">
                  <span className="w-4 shrink-0 text-center select-none">›</span>
                  {section.name}
                </summary>
                <div className="pl-6 mt-1">
                  {subs.map((sub) => {
                    const subSlug = slugify(sub.slug || sub.name);
                    return (
                      <Link
                        key={sub.id}
                        href={`/${sectionSlug}/${subSlug}`}
                        className="block py-1"
                      >
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              </details>
            )}
          </div>
        );
      })}
    </>
  );
};

export default CategoryMenu;
