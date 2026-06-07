"use client";

import { useEffect, useState } from "react";
import { format, differenceInDays, isValid } from "date-fns";
import { nl } from "date-fns/locale";

interface Invoice {
  InvoiceID: string;
  InvoiceNumber: number;
  AccountName: string;
  AmountDC: number;
  DueDate: string;
  InvoiceDate?: string;
  Description?: string;
  YourRef: string;
  Status?: number;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
}

/** Parsed Exact Online datumformaten: /Date(ms)/, ISO, of gewone string */
function parseExactDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  // /Date(1234567890000)/
  const msMatch = val.match(/\/Date\((-?\d+)\)\//);
  if (msMatch) {
    const d = new Date(parseInt(msMatch[1]));
    return isValid(d) ? d : null;
  }
  const d = new Date(val);
  return isValid(d) ? d : null;
}

export default function InvoiceTable({ userId, type }: { userId: string; type: "receivables" | "payables" }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/supabase/financial-data?t=${Date.now()}`)
      .then(async (r) => {
        const text = await r.text();
        if (!text) return;
        try {
          const data = JSON.parse(text);
          if (data.error) { setError(data.error); return; }
          setInvoices(type === "receivables" ? (data.receivables ?? []) : (data.payables ?? []));
        } catch { setError("Kon data niet verwerken"); }
      })
      .catch(() => setError("Verbindingsfout"))
      .finally(() => setLoading(false));
  }, [type]);

  const title = type === "receivables" ? "Openstaande vorderingen" : "Openstaande inkoopfacturen";

  const sorted = [...invoices]
    .filter((inv) => parseExactDate(inv.DueDate) !== null)
    .sort((a, b) => (parseExactDate(a.DueDate)?.getTime() ?? 0) - (parseExactDate(b.DueDate)?.getTime() ?? 0));

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {invoices.length > 0 && (
          <span className="text-xs text-gray-400">{invoices.length} facturen</span>
        )}
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="px-6 py-8 text-center text-sm text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Relatie</th>
                <th className="px-4 py-3 text-left">Omschrijving</th>
                <th className="px-4 py-3 text-left">Factuurnr.</th>
                <th className="px-4 py-3 text-right">Bedrag</th>
                <th className="px-4 py-3 text-left">Factuurdatum</th>
                <th className="px-4 py-3 text-left">Vervaldatum</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.slice(0, 10).map((inv) => {
                const due = parseExactDate(inv.DueDate);
                const daysOverdue = due ? differenceInDays(new Date(), due) : 0;
                const isOverdue = daysOverdue > 0;
                return (
                  <tr key={inv.InvoiceID || inv.InvoiceNumber} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.AccountName || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={inv.Description}>{inv.Description || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inv.InvoiceNumber || "—"}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatEuro(inv.AmountDC ?? 0)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {inv.InvoiceDate ? (() => { const d = parseExactDate(inv.InvoiceDate); return d ? format(d, "d MMM yyyy", { locale: nl }) : "—"; })() : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {due ? format(due, "d MMM yyyy", { locale: nl }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isOverdue ? "bg-red-100 text-red-700"
                        : inv.Status === 50 ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                      }`}>
                        {isOverdue ? `${daysOverdue}d te laat` : inv.Status === 50 ? "Gedeeltelijk" : "Op tijd"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Geen openstaande facturen gevonden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
