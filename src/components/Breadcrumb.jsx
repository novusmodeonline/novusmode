"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHouse } from "react-icons/fa6";
import { siteTheme } from "@/config/theme";

const Breadcrumb = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const isShopPage = pathname === "/shop";
  const crumbs = [];

  // Home always first
  crumbs.push({
    name: "Home",
    href: "/",
    icon: <FaHouse className="text-base" />,
    clickable: true,
  });

  let shopPath = `/`;
  for (const s of segments) {
    shopPath += `${s}/`;
    crumbs.push({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      href: shopPath,
      clickable: true,
    });
  }

  return (
    <nav
      className="text-sm mb-4"
      style={{ color: siteTheme.invertedTextColor }}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center flex-wrap gap-1">
        {crumbs.map((crumb, idx) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {idx > 0 && <span className="text-gray-400">/</span>}
            {crumb.clickable ? (
              <Link
                href={crumb.href}
                className={`hover:underline transition ${
                  idx === crumbs.length - 1
                    ? "font-semibold"
                    : "hover:underline"
                } flex items-center gap-1`}
              >
                {crumb.icon && crumb.icon}
                {crumb.name}
              </Link>
            ) : (
              <span>
                {crumb.icon && crumb.icon}
                {crumb.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
