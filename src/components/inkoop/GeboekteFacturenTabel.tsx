"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { Search, Pencil, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import FactuurEditModal, { type GeboekteFactuur } from "./FactuurEditModal";

const STATUS_LABELS: Record<number, { label: string; className: string }> = {
  10: { label: "Concept", className: "bg-gray-100 text-gray-600" },
  20: { label: "Openstaand", className: "bg-orange-100 text-orange-700" },
  50: { label: "Gedeeltelijk", className: "bg-yellow-100 text-yellow-700" },
  100: { label: "Betaald", className: "bg-green-100 text-green-700" },
};

function formatEuro(val: number | null | undefined) {
  if (val === null || val === undefined) return "—";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(val);
}

function formatDate(val: string | null | undefined) {
  if (!val) return "—";
  const match = val.match(/\d+/);
  if (!match) return "—";
  try {
    return format(new Date(parseInt(match[0])), "d MMM yyyy", { locale: nl });
  } catch {
    return "—";
  }
}

export interface GeboekteFacturenTabelHandle {
  ververs: () => void;
}

const GeboekteFacturenTabel = forwardRef<GeboekteFacturenTabelHandle>((_, ref) => {
  const [facturen, setFacturen] = useState<GeboekteFactuur[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoekterm, setZoekterm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editFactuur, setEditFactuur] = useState<GeboekteFactuur | null>(null);

  const laadFacturen = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/inkoop/facturen?${params}`);
      if (res.ok) setFacturen(Array.isArray(await res.json()) ? await res.clone().json() : []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { laadFacturen(); }, [laadFacturen]);

  useImperativeHandle(ref, () => ({ ververs: laadFacturen }));

  const gefilterd = facturen.filter((f) => {
    if (!zoekterm) return true;
    const q = zoekterm.toLowerCase();
    return (
      f.SupplierName?.toLowerCase().includes(q) ||
      f.InvoiceNumber?.toLowerCase().includes(q) ||
      f.Description?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoeken op leverancier, factuurnummer…"
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">Alle statussen</option>
          <option value="10">Concept</option>
          <option value="20">Openstaand</option>
          <option value="50">Gedeeltelijk betaald</option>
          <option value="100">Betaald</option>
        </select>
        <button
          onClick={laadFacturen}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Verversen
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Leverancier</th>
              <th className="px-4 py-3 text-left">Factuurnr.</th>
              <th className="px-4 py-3 text-left">Datum</th>
              <th className="px-4 py-3 text-right">Excl. btw</th>
              <th className="px-4 py-3 text-right">Btw</th>
              <th className="px-4 py-3 text-right">Totaal</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : gefilterd.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                  Geen facturen gevonden
                </td>
              </tr>
            ) : (
              gefilterd.map((f) => {
                const status = STATUS_LABELS[f.Status] ?? { label: String(f.Status), className: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={f.ID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{f.SupplierName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{f.InvoiceNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(f.InvoiceDate)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{formatEuro(f.AmountDCExclVAT)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatEuro(f.VATAmountDC)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatEuro(f.AmountDC)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditFactuur(f)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {gefilterd.length > 0 && !loading && (
        <p className="mt-2 text-xs text-gray-400">{gefilterd.length} factuur/facturen</p>
      )}

      {editFactuur && (
        <FactuurEditModal
          factuur={editFactuur}
          onClose={() => setEditFactuur(null)}
          onSaved={laadFacturen}
        />
      )}
    </div>
  );
});

GeboekteFacturenTabel.displayName = "GeboekteFacturenTabel";
export default GeboekteFacturenTabel;
