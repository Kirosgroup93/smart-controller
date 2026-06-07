"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import ExactConnectButton from "@/components/ui/ExactConnectButton";

interface DropdownChild {
  label: string;
  href: string;
  group?: boolean;
  step?: string;
}

interface NavItem {
  label: string;
  href: string;
  dropdown?: DropdownChild[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  {
    label: "Inkoop",
    href: "/inkoop",
    dropdown: [
      { label: "— Facturen Flow —", href: "", group: true },
      { label: "Importeren",        href: "/inkoop/importeren",       step: "1" },
      { label: "Splitsen",          href: "/inkoop/splitsen",         step: "2" },
      { label: "Valideren",         href: "/inkoop/facturen-boeken",  step: "3" },
      { label: "— Overig —",        href: "", group: true },
      { label: "Facturen",          href: "/inkoop/facturen" },
      { label: "Openstaande posten",href: "/inkoop/openstaande-posten" },
      { label: "Leveranciers",      href: "/inkoop/leveranciers" },
      { label: "Analyse",           href: "/inkoop/analyse" },
    ],
  },
  {
    label: "Verkoop",
    href: "/verkoop",
    dropdown: [
      { label: "Facturen",          href: "/verkoop/facturen" },
      { label: "Openstaande posten",href: "/verkoop/openstaande-posten" },
      { label: "Klanten",           href: "/verkoop/klanten" },
      { label: "Analyse",           href: "/verkoop/analyse" },
    ],
  },
];

interface NavbarProps {
  email: string;
  hasConnection: boolean;
  division?: number;
}

function DropdownItem({ child, active }: { child: DropdownChild; active: boolean }) {
  if (child.group) {
    return (
      <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 select-none">
        {child.label.replace(/—\s*/g, "").replace(/\s*—/g, "")}
      </div>
    );
  }
  return (
    <Link
      href={child.href}
      className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
        active
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {child.step && (
        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
          active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
        }`}>
          {child.step}
        </span>
      )}
      {child.label}
    </Link>
  );
}

function NavMenuItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive =
    pathname === item.href || (item.dropdown?.some((d) => pathname === d.href) ?? false);

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (item.dropdown) setOpen(true);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  }

  if (!item.dropdown) {
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

      {open && (
        <div className="absolute top-full left-0 mt-0 w-52 bg-white border border-gray-200 rounded-b shadow-lg z-50 py-1">
          {item.dropdown.map((child, i) => (
            <DropdownItem
              key={child.group ? `group-${i}` : child.href}
              child={child}
              active={pathname === child.href}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ email, hasConnection, division }: NavbarProps) {
  return (
    <header className="bg-gradient-to-b from-slate-100 to-blue-50 border-b border-blue-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-12">
        {/* Logo + nav */}
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

        {/* Rechts: Exact-knop + email */}
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
