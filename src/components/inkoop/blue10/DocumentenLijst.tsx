"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw, FileText } from "lucide-react";

export interface InkoopDoc {
  ID: string;
  InvoiceNumber: string;
  InvoiceDate: string;
  DueDate: string;
  SupplierName: string;
  Description: string;
  AmountDC: number;
  AmountDCExclVAT: number;
  VATAmountDC: number;
  Status: number;
  YourRef: string;
}

function formatEuro(v: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(v ?? 0);
}

function parseDate(v: string | null) {
  if (!v) return "";
  const m = v.match(/\d+/);
  if (!m) return "";
  return new Date(parseInt(m[0])).toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const STATUS_KLEUR: Record<number, string> = {
  10: "bg-gray-200 text-gray-600",
  20: "bg-orange-100 text-orange-700",
  50: "bg-yellow-100 text-yellow-700",
  100: "bg-green-100 text-green-700",
};

interface Props {
  geselecteerd: string | null;
  onSelect: (doc: InkoopDoc) => void;
}

export default function DocumentenLijst({ geselecteerd, onSelect }: Props) {
  const [docs, setDocs] = useState<InkoopDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoek, setZoek] = useState("");

  async function laad() {
    setLoading(true);
    try {
      const res = await fetch("/api/inkoop/facturen");
      if (res.ok) setDocs(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { laad(); }, []);

  const gefilterd = docs.filter((d) => {
    if (!zoek) return true;
    const q = zoek.toLowerCase();
    return d.SupplierName?.toLowerCase().includes(q) || d.InvoiceNumber?.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-200 bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documenten</span>
          <button onClick={laad} className="text-gray-400 hover:text-blue-600 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoeken…"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Geselecteerd: {geselecteerd ? 1 : 0}/{gefilterd.length}
        </p>
      </div>

      {/* Lijst */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="px-3 py-3 border-b border-gray-100 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))
        ) : gefilterd.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">Geen facturen</div>
        ) : (
          gefilterd.map((doc) => {
            const actief = doc.ID === geselecteerd;
            return (
              <button
                key={doc.ID}
                onClick={() => onSelect(doc)}
                className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors ${
                  actief
                    ? "bg-blue-600 text-white"
                    : "hover:bg-blue-50 text-gray-800"
                }`}
              >
                <div className="flex items-start gap-2">
                  <FileText className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${actief ? "text-blue-200" : "text-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${actief ? "text-white" : "text-gray-800"}`}>
                      {doc.SupplierName || "—"}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs ${actief ? "text-blue-100" : "text-gray-500"}`}>
                        {doc.InvoiceNumber || "—"} · {parseDate(doc.InvoiceDate)}
                      </span>
                      <span className={`text-xs font-semibold ${actief ? "text-white" : "text-gray-700"}`}>
                        {formatEuro(doc.AmountDC)}
                      </span>
                    </div>
                    <span className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      actief ? "bg-white/20 text-white" : (STATUS_KLEUR[doc.Status] ?? "bg-gray-100 text-gray-500")
                    }`}>
                      {doc.Status === 10 ? "Concept" : doc.Status === 20 ? "Openstaand" : doc.Status === 50 ? "Gedeeltelijk" : doc.Status === 100 ? "Betaald" : doc.Status}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
