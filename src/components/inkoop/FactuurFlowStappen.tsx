import Link from "next/link";
import { Check } from "lucide-react";

const STAPPEN = [
  { nr: 1, label: "Importeren", href: "/inkoop/importeren" },
  { nr: 2, label: "Splitsen",   href: "/inkoop/splitsen" },
  { nr: 3, label: "Valideren",  href: "/inkoop/facturen-boeken" },
];

export default function FactuurFlowStappen({ actief }: { actief: 1 | 2 | 3 }) {
  return (
    <nav className="flex items-center gap-0 shrink-0 px-4 py-2 bg-white border-b border-gray-200">
      {STAPPEN.map((stap, i) => {
        const gedaan   = stap.nr < actief;
        const huidig   = stap.nr === actief;

        return (
          <div key={stap.nr} className="flex items-center">
            <Link
              href={stap.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                huidig
                  ? "bg-blue-600 text-white"
                  : gedaan
                  ? "text-blue-600 hover:bg-blue-50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                huidig
                  ? "bg-white text-blue-600"
                  : gedaan
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {gedaan ? <Check className="w-3 h-3" /> : stap.nr}
              </span>
              {stap.label}
            </Link>

            {i < STAPPEN.length - 1 && (
              <span className="mx-1 text-gray-300 text-xs select-none">›</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
