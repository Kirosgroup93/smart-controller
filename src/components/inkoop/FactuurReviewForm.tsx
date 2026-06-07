"use client";

import { useState } from "react";
import { Pencil, X, BookOpen, Loader2, CheckCircle } from "lucide-react";
import type { ExtractedFactuur } from "./UploadZone";

interface Props {
  data: ExtractedFactuur;
  onReset: () => void;
}

type FactuurVelden = ExtractedFactuur;

const VELDEN: { key: keyof FactuurVelden; label: string; type: "text" | "date" | "number" }[] = [
  { key: "leveranciersnaam", label: "Leveranciersnaam", type: "text" },
  { key: "factuurnummer", label: "Factuurnummer", type: "text" },
  { key: "factuurdatum", label: "Factuurdatum", type: "date" },
  { key: "vervaldatum", label: "Vervaldatum", type: "date" },
  { key: "bedrag_excl_btw", label: "Bedrag excl. btw", type: "number" },
  { key: "btw_bedrag", label: "Btw bedrag", type: "number" },
  { key: "totaal_bedrag", label: "Totaal bedrag", type: "number" },
  { key: "omschrijving", label: "Omschrijving", type: "text" },
];

function formatWaarde(val: string | number | null, type: string): string {
  if (val === null || val === undefined) return "—";
  if (type === "number") return `€ ${Number(val).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}`;
  return String(val);
}

export default function FactuurReviewForm({ data, onReset }: Props) {
  const [velden, setVelden] = useState<FactuurVelden>(data);
  const [bewerkbaar, setBewerkbaar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geboekt, setGeboekt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateVeld(key: keyof FactuurVelden, value: string) {
    setVelden((prev) => {
      const veld = VELDEN.find((v) => v.key === key);
      return {
        ...prev,
        [key]: veld?.type === "number" ? (value === "" ? null : parseFloat(value)) : value || null,
      };
    });
  }

  async function handleBoeken() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inkoop/facturen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(velden),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Boeken mislukt");
      }
      setGeboekt(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  }

  if (geboekt) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="font-semibold text-gray-800">Factuur succesvol geboekt in Exact Online</p>
        <button
          onClick={onReset}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Nieuwe factuur uploaden
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {VELDEN.map(({ key, label, type }) => (
          <div key={key} className={key === "omschrijving" ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            {bewerkbaar ? (
              <input
                type={type === "number" ? "number" : type}
                step={type === "number" ? "0.01" : undefined}
                value={
                  velden[key] === null || velden[key] === undefined
                    ? ""
                    : String(velden[key])
                }
                onChange={(e) => updateVeld(key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            ) : (
              <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 text-gray-800 min-h-[38px]">
                {formatWaarde(velden[key], type)}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleBoeken}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
          Boeken in Exact Online
        </button>
        <button
          onClick={() => setBewerkbaar((v) => !v)}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
          {bewerkbaar ? "Weergave" : "Bewerken"}
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Annuleren
        </button>
      </div>
    </div>
  );
}
