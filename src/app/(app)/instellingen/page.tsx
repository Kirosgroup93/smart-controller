import { Settings } from "lucide-react";
import Link from "next/link";

const SECTIES = [
  { label: "Exact Online koppeling", href: "/instellingen/exact", beschrijving: "OAuth verbinding beheren en vernieuwen" },
  { label: "Gebruikers",             href: "/instellingen/gebruikers", beschrijving: "Gebruikers en rechten beheren" },
  { label: "Bedrijfsgegevens",       href: "/instellingen/bedrijf", beschrijving: "Naam, adres en BTW-nummer" },
];

export default function InstellingenPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-800">Instellingen</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {SECTIES.map((s) => (
            <Link key={s.href} href={s.href} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
              <div>
                <p className="text-sm font-medium text-gray-800">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.beschrijving}</p>
              </div>
              <span className="text-gray-300 group-hover:text-gray-500 text-lg">›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
