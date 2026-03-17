"use client";
import Link from "next/link";
import { Footprints } from "lucide-react";
import ManIcon from "@mui/icons-material/Man";
import WomanIcon from "@mui/icons-material/Woman";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import HikingIcon from "@mui/icons-material/Hiking";
import DiamondIcon from '@mui/icons-material/Diamond';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const categories = [
  {
    name: "Men",
    href: "/men",
    icon: (
      <ManIcon
        sx={{ fontSize: 80 }}
        className="w-16 h-16 text-[var(--color-bg)]"
      />
    ),
  },
  {
    name: "Women",
    href: "/women",
    icon: (
      <WomanIcon sx={{ fontSize: 80 }} className="w-16 h-16 text-pink-600" />
    ),
  },
  {
    name: "Kids",
    href: "/kids",
    icon: (
      <ChildCareIcon
        sx={{ fontSize: 80 }}
        className="w-16 h-16 text-yellow-600"
      />
    ),
  },
  {
    name: "Footwears",
    href: "/footwear",
    icon: <Footprints className="w-16 h-16 text-green-700" />,
  },
];

// {
//   name: "Sale",
//   href: "/sale",
//   icon: <BadgePercent className="w-16 h-16 text-red-600" />,
// },
export default function CategoryShowcase() {
  return (
    <div className="w-full max-w-7xl mx-auto px-2 py-12 rounded-xl bg-white/80">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3 text-[var(--color-bg)] tracking-wider">
        Shop by Category
      </h2>
      <p className="text-center text-lg md:text-xl text-gray-700 mb-10">
        Find the perfect styles for everyone and every occasion
      </p>

      <div className="flex flex-wrap justify-center gap-8 items-stretch">
        {categories.map((cat) => (
          <Link key={cat.name} href={cat.href}>
            <div className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl p-8 w-52 h-64 flex flex-col items-center justify-center hover:-translate-y-1 transition-all border-2 border-gray-200 hover:border-[var(--color-bg)] cursor-pointer relative">
              <div className="relative mb-5 flex items-center justify-center w-24 h-24">
                <span className="inline-block group-hover:scale-110 transition-transform duration-300">
                  {cat.icon}
                </span>
                {cat.name === "Sale" && (
                  <span className="absolute -top-3 -right-4 bg-red-500 text-white px-3 py-1 text-sm rounded-lg animate-pulse">
                    HOT
                  </span>
                )}
              </div>
              <span className="text-xl font-bold text-[var(--color-bg)] mb-1">
                {cat.name}
              </span>
              <button className="mt-2 bg-[var(--color-bg)] text-white text-base rounded-2xl px-6 py-2 font-semibold min-w-[160px] whitespace-nowrap">
                Shop {cat.name}
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
