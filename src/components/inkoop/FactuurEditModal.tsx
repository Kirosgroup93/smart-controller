"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

export interface GeboekteFactuur {
  ID: string;
  InvoiceNumber: string;
  InvoiceDate: string;
  DueDate: string;
  SupplierName: string;
  Description: string;
  AmountDCExclVAT: number;
  VATAmountDC: number;
  AmountDC: number;
  Status: number;
}

interface Props {
  factuur: GeboekteFactuur;
  onClose: () => void;
  onSaved: () => void;
}

function parseExactDate(val: string | null): string {
  if (!val) return "";
  const match = val.match(/\d+/);
  if (!match) return "";
  return new Date(parseInt(match[0])).toISOString().split("T")[0];
}

const STATUS_LABELS: Record<number, string> = {
  10: "Concept",
  20: "Openstaand",
  50: "Gedeeltelijk betaald",
  100: "Betaald",
};

export default function FactuurEditModal({ factuur, onClose, onSaved }: Props) {
  const [velden, setVelden] = useState({
    leveranciersnaam: factuur.SupplierName ?? "",
    factuurnummer: factuur.InvoiceNumber ?? "",
    factuurdatum: parseExactDate(factuur.InvoiceDate),
    vervaldatum: parseExactDate(factuur.DueDate),
    bedrag_excl_btw: factuur.AmountDCExclVAT ?? 0,
    btw_bedrag: factuur.VATAmountDC ?? 0,
    totaal_bedrag: factuur.AmountDC ?? 0,
    omschrijving: factuur.Description ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpslaan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inkoop/facturen/${factuur.ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(velden),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Opslaan mislukt");
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Factuur bewerken</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "leveranciersnaam", label: "Leveranciersnaam", type: "text" },
            { key: "factuurnummer", label: "Factuurnummer", type: "text" },
            { key: "factuurdatum", label: "Factuurdatum", type: "date" },
            { key: "vervaldatum", label: "Vervaldatum", type: "date" },
            { key: "bedrag_excl_btw", label: "Bedrag excl. btw", type: "number" },
            { key: "btw_bedrag", label: "Btw bedrag", type: "number" },
            { key: "totaal_bedrag", label: "Totaal bedrag", type: "number" },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input
                type={type}
                step={type === "number" ? "0.01" : undefined}
                value={String(velden[key as keyof typeof velden])}
                onChange={(e) =>
                  setVelden((prev) => ({
                    ...prev,
                    [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Omschrijving</label>
            <textarea
              rows={2}
              value={velden.omschrijving}
              onChange={(e) => setVelden((prev) => ({ ...prev, omschrijving: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="sm:col-span-2">
            <span className="text-xs font-medium text-gray-500">Status: </span>
            <span className="text-xs text-gray-700">{STATUS_LABELS[factuur.Status] ?? factuur.Status}</span>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
        )}

        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleOpslaan}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Opslaan
          </button>
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
