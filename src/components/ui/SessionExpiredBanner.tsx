"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function SessionExpiredBanner() {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    fetch("/api/supabase/financial-data")
      .then(async (r) => {
        if (r.status === 401) {
          const d = await r.json().catch(() => ({}));
          if (d.error === "EXACT_SESSION_EXPIRED") setExpired(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!expired) return null;

  return (
    <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">Exact Online sessie verlopen</p>
        <p className="text-xs text-amber-600 mt-0.5">
          De verbinding met Exact Online moet worden vernieuwd om data op te halen.
        </p>
      </div>
      <a
        href="/api/exact-online/token"
        className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Opnieuw koppelen
      </a>
    </div>
  );
}
