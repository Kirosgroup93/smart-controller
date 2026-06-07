"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import ExactConnectButton from "@/components/ui/ExactConnectButton";

interface SubItem {
  label: string;
  href: string;
}

interface Category {
  label: string;
  items: SubItem[];
}

interface NavItem {
  label: string;
  href: string;
  categories?: Category[];
  simple?: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  {
    label: "Inkoop",
    href: "/inkoop",
    categories: [
      {
        label: "Flow",
        items: [
          { label: "Importeren", href: "/inkoop/importeren" },
          { label: "Splitsen",   href: "/inkoop/splitsen" },
          { label: "Valideren",  href: "/inkoop/facturen-boeken" },
          { label: "Goedkeuren", href: "/inkoop/goedkeuren" },
        ],
      },
      {
        label: "Facturen",
        items: [
          { label: "Facturen",           href: "/inkoop/facturen" },
          { label: "Openstaande posten", href: "/inkoop/openstaande-posten" },
          { label: "Leveranciers",       href: "/inkoop/leveranciers" },
          { label: "Analyse",            href: "/inkoop/analyse" },
        ],
      },
    ],
  },
  {
    label: "Verkoop",
    href: "/verkoop",
    categories: [
      {
        label: "Facturen",
        items: [
          { label: "Facturen",           href: "/verkoop/facturen" },
          { label: "Openstaande posten", href: "/verkoop/openstaande-posten" },
          { label: "Klanten",            href: "/verkoop/klanten" },
          { label: "Analyse",            href: "/verkoop/analyse" },
        ],
      },
    ],
  },
];

interface NavbarProps {
  email: string;
  hasConnection: boolean;
  division?: number;
}

function MegaMenu({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState(categories[0].label);

  const current = categories.find((c) => c.label === activeCategory) ?? categories[0];

  return (
    <div className="absolute top-full left-0 mt-0 z-50 flex shadow-xl border border-gray-700 rounded-b bg-gray-800 text-white min-w-[320px]">
      {/* Linker kolom: categorieën */}
      <div className="w-32 shrink-0 border-r border-gray-700 py-3">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onMouseEnter={() => setActiveCategory(cat.label)}
            onClick={() => setActiveCategory(cat.label)}
            className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat.label
                ? "text-white bg-gray-700"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Rechter kolom: sub-items */}
      <div className="py-3 px-2 min-w-[160px]">
        <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500 select-none">
          {current.label}
        </div>
        {current.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`block px-3 py-1.5 text-sm rounded transition-colors ${
              pathname === item.href
                ? "text-white font-medium"
                : "text-gray-300 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NavMenuItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allHrefs = item.categories?.flatMap((c) => c.items.map((i) => i.href)) ?? [];
  const isActive = pathname === item.href || allHrefs.includes(pathname);

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (item.categories) setOpen(true);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }

  function close() {
    setOpen(false);
  }

  if (!item.categories) {
    return (
      <Link
        href={item.href}
        className={`px-4 py-2 text-sm font-medium transition-colors rounded-sm ${
          isActive
            ? "text-blue-700 bg-white/60 border-b-2 border-blue-600"
            : "text-slate-700 hover:text-blue-700 hover:bg-white/40"
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-sm ${
          isActive
            ? "text-blue-700 bg-white/60 border-b-2 border-blue-600"
            : "text-slate-700 hover:text-blue-700 hover:bg-white/40"
        }`}
      >
        {item.label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && <MegaMenu categories={item.categories} onClose={close} />}
    </div>
  );
}

export default function Navbar({ email, hasConnection, division }: NavbarProps) {
  return (
    <header className="bg-gradient-to-b from-slate-100 to-blue-50 border-b border-blue-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-12">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold text-slate-800 shrink-0 tracking-tight">
            Smart Controller
          </span>
          <nav className="flex items-center">
            {NAV_ITEMS.map((item) => (
              <NavMenuItem key={item.href} item={item} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {hasConnection ? (
            <span className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Exact Online verbonden {division ? `(${division})` : ""}
            </span>
          ) : (
            <ExactConnectButton />
          )}
          <span className="text-xs text-slate-500">{email}</span>
        </div>
      </div>
    </header>
  );
}
