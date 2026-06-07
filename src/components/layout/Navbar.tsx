"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ExactConnectButton from "@/components/ui/ExactConnectButton";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inkoop", href: "/inkoop" },
  { label: "Verkoop", href: "/verkoop" },
];

interface NavbarProps {
  email: string;
  hasConnection: boolean;
  division?: number;
}

export default function Navbar({ email, hasConnection, division }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo + nav */}
        <div className="flex items-center gap-8">
          <span className="text-base font-bold text-gray-900 shrink-0">Smart Controller</span>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-50 text-brand-700 border border-brand-200"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rechts: Exact-knop + email */}
        <div className="flex items-center gap-4">
          {hasConnection ? (
            <span className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Exact Online verbonden {division ? `(${division})` : ""}
            </span>
          ) : (
            <ExactConnectButton />
          )}
          <span className="text-sm text-gray-500">{email}</span>
        </div>
      </div>
    </header>
  );
}
