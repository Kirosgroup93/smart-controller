"use client";

import { useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";

interface Invoice {
  InvoiceID: string;
  InvoiceNumber: number;
  AccountName: string;
  AmountDC: number;
  DueDate: string;
  YourRef: string;
  Status?: number;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default function InvoiceTable({
  userId,
  type,
}: {
  userId: string;
  type: "receivables" | "payables";
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/supabase/financial-data?t=${Date.now()}`)
      .then(async (r) => {
        const text = await r.text();
        if (!text) return;
        try {
          const data = JSON.parse(text);
          setInvoices(type === "receivables" ? (data.receivables ?? []) : (data.payables ?? []));
        } catch { /* ignore parse errors */ }
      })
      .finally(() => setLoading(false));
  }, [type]);

  const title = type === "receivables" ? "Openstaande vorderingen" : "Openstaande inkoopfacturen";
  const sorted = [...invoices].sort((a, b) => new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime());

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Relatie</th>
                <th className="px-4 py-3 text-left">Factuurnr.</th>
                <th className="px-4 py-3 text-right">Bedrag</th>
                <th className="px-4 py-3 text-left">Vervaldatum</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.slice(0, 10).map((inv) => {
                const daysOverdue = differenceInDays(new Date(), new Date(inv.DueDate));
                const isOverdue = daysOverdue > 0;
                return (
                  <tr key={inv.InvoiceID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {inv.AccountName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inv.InvoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatEuro(inv.AmountDC)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(inv.DueDate), "d MMM yyyy", { locale: nl })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          isOverdue
                            ? "bg-red-100 text-red-700"
                            : inv.Status === 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isOverdue
                          ? `${daysOverdue}d te laat`
                          : inv.Status === 50
                          ? "Gedeeltelijk"
                          : "Op tijd"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
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
