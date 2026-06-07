"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2, CheckCircle, RotateCcw } from "lucide-react";

interface Leverancier {
  ID: string;
  Name: string;
  Code: string;
}

const BTW_PERCENTAGES = [0, 9, 21] as const;
type BtwPercentage = (typeof BTW_PERCENTAGES)[number];

interface FormVelden {
  leverancier_id: string;
  leverancier_naam: string;
  factuurnummer: string;
  factuurdatum: string;
  vervaldatum: string;
  bedrag_excl_btw: string;
  btw_percentage: BtwPercentage;
  btw_bedrag: string;
  totaal_bedrag: string;
  omschrijving: string;
  dagboek: string;
}

const LEEG: FormVelden = {
  leverancier_id: "",
  leverancier_naam: "",
  factuurnummer: "",
  factuurdatum: "",
  vervaldatum: "",
  bedrag_excl_btw: "",
  btw_percentage: 21,
  btw_bedrag: "",
  totaal_bedrag: "",
  omschrijving: "",
  dagboek: "70",
};

interface Props {
  onGeboekt: () => void;
}

export default function HandmatigInvoerForm({ onGeboekt }: Props) {
  const [velden, setVelden] = useState<FormVelden>(LEEG);
  const [leveranciers, setLeveranciers] = useState<Leverancier[]>([]);
  const [leveranciersLaden, setLeveranciersLaden] = useState(true);
  const [bewerkbaar, setBewerkbaar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [geboekt, setGeboekt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatiefouten, setValidatiefouten] = useState<Partial<Record<keyof FormVelden, string>>>({});

  useEffect(() => {
    fetch("/api/inkoop/leveranciers")
      .then((r) => r.json())
      .then((data) => setLeveranciers(Array.isArray(data) ? data : []))
      .finally(() => setLeveranciersLaden(false));
  }, []);

  function setVeld<K extends keyof FormVelden>(key: K, value: FormVelden[K]) {
    setVelden((prev) => {
      const nieuw = { ...prev, [key]: value };

      // Automatische berekeningen
      const excl = parseFloat(nieuw.bedrag_excl_btw) || 0;
      const pct = nieuw.btw_percentage;

      if (key === "bedrag_excl_btw" || key === "btw_percentage") {
        const btw = Math.round(excl * pct) / 100;
        nieuw.btw_bedrag = excl ? btw.toFixed(2) : "";
        nieuw.totaal_bedrag = excl ? (excl + btw).toFixed(2) : "";
      }

      if (key === "btw_bedrag") {
        const btw = parseFloat(value as string) || 0;
        nieuw.totaal_bedrag = excl ? (excl + btw).toFixed(2) : "";
      }

      return nieuw;
    });
    setValidatiefouten((prev) => ({ ...prev, [key]: undefined }));
  }

  function valideer(): boolean {
    const fouten: Partial<Record<keyof FormVelden, string>> = {};
    if (!velden.leverancier_id) fouten.leverancier_id = "Selecteer een leverancier";
    if (!velden.factuurnummer.trim()) fouten.factuurnummer = "Vereist";
    if (!velden.factuurdatum) fouten.factuurdatum = "Vereist";
    if (!velden.bedrag_excl_btw || isNaN(parseFloat(velden.bedrag_excl_btw)))
      fouten.bedrag_excl_btw = "Vul een geldig bedrag in";
    setValidatiefouten(fouten);
    return Object.keys(fouten).length === 0;
  }

  async function handleBoeken() {
    if (!valideer()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/inkoop/facturen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leverancier_id: velden.leverancier_id,
          leveranciersnaam: velden.leverancier_naam,
          factuurnummer: velden.factuurnummer,
          factuurdatum: velden.factuurdatum,
          vervaldatum: velden.vervaldatum || null,
          bedrag_excl_btw: parseFloat(velden.bedrag_excl_btw),
          btw_bedrag: parseFloat(velden.btw_bedrag) || 0,
          totaal_bedrag: parseFloat(velden.totaal_bedrag) || 0,
          omschrijving: velden.omschrijving,
          dagboek: parseInt(velden.dagboek) || 70,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Boeken mislukt");
      }

      setGeboekt(true);
      onGeboekt();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setVelden(LEEG);
    setGeboekt(false);
    setError(null);
    setValidatiefouten({});
    setBewerkbaar(true);
  }

  if (geboekt) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="font-semibold text-gray-800">Factuur succesvol geboekt in Exact Online</p>
        <button onClick={handleReset} className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
          <RotateCcw className="w-4 h-4" /> Nieuwe factuur invoeren
        </button>
      </div>
    );
  }

  const inputClass = (fout?: string) =>
    `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
      fout
        ? "border-red-300 focus:ring-red-400 bg-red-50"
        : bewerkbaar
        ? "border-gray-300 focus:ring-blue-500 bg-white"
        : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
    }`;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

        {/* Leverancier */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Leverancier <span className="text-red-500">*</span>
          </label>
          {leveranciersLaden ? (
            <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <select
              disabled={!bewerkbaar}
              value={velden.leverancier_id}
              onChange={(e) => {
                const lev = leveranciers.find((l) => l.ID === e.target.value);
                setVeld("leverancier_id", e.target.value);
                setVeld("leverancier_naam", lev?.Name ?? "");
              }}
              className={inputClass(validatiefouten.leverancier_id)}
            >
              <option value="">— Selecteer leverancier —</option>
              {leveranciers.map((l) => (
                <option key={l.ID} value={l.ID}>
                  {l.Code ? `${l.Code} – ` : ""}{l.Name}
                </option>
              ))}
            </select>
          )}
          {validatiefouten.leverancier_id && (
            <p className="mt-1 text-xs text-red-500">{validatiefouten.leverancier_id}</p>
          )}
        </div>

        {/* Factuurnummer */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Factuurnummer <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            disabled={!bewerkbaar}
            value={velden.factuurnummer}
            onChange={(e) => setVeld("factuurnummer", e.target.value)}
            placeholder="bijv. INK-2024-001"
            className={inputClass(validatiefouten.factuurnummer)}
          />
          {validatiefouten.factuurnummer && (
            <p className="mt-1 text-xs text-red-500">{validatiefouten.factuurnummer}</p>
          )}
        </div>

        {/* Dagboek */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Dagboek</label>
          <input
            type="number"
            disabled={!bewerkbaar}
            value={velden.dagboek}
            onChange={(e) => setVeld("dagboek", e.target.value)}
            className={inputClass()}
          />
        </div>

        {/* Factuurdatum */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Factuurdatum <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            disabled={!bewerkbaar}
            value={velden.factuurdatum}
            onChange={(e) => setVeld("factuurdatum", e.target.value)}
            className={inputClass(validatiefouten.factuurdatum)}
          />
          {validatiefouten.factuurdatum && (
            <p className="mt-1 text-xs text-red-500">{validatiefouten.factuurdatum}</p>
          )}
        </div>

        {/* Vervaldatum */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vervaldatum</label>
          <input
            type="date"
            disabled={!bewerkbaar}
            value={velden.vervaldatum}
            onChange={(e) => setVeld("vervaldatum", e.target.value)}
            className={inputClass()}
          />
        </div>

        {/* Bedrag excl. btw */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Bedrag excl. btw <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={!bewerkbaar}
              value={velden.bedrag_excl_btw}
              onChange={(e) => setVeld("bedrag_excl_btw", e.target.value)}
              placeholder="0,00"
              className={`${inputClass(validatiefouten.bedrag_excl_btw)} pl-7`}
            />
          </div>
          {validatiefouten.bedrag_excl_btw && (
            <p className="mt-1 text-xs text-red-500">{validatiefouten.bedrag_excl_btw}</p>
          )}
        </div>

        {/* BTW percentage */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">BTW percentage</label>
          <select
            disabled={!bewerkbaar}
            value={velden.btw_percentage}
            onChange={(e) => setVeld("btw_percentage", parseInt(e.target.value) as BtwPercentage)}
            className={inputClass()}
          >
            {BTW_PERCENTAGES.map((p) => (
              <option key={p} value={p}>{p}%</option>
            ))}
          </select>
        </div>

        {/* BTW bedrag */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">BTW bedrag (auto)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
            <input
              type="number"
              step="0.01"
              disabled={!bewerkbaar}
              value={velden.btw_bedrag}
              onChange={(e) => setVeld("btw_bedrag", e.target.value)}
              placeholder="0,00"
              className={`${inputClass()} pl-7 bg-blue-50/50`}
            />
          </div>
        </div>

        {/* Totaal bedrag */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Totaal bedrag (auto)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
            <input
              type="number"
              step="0.01"
              readOnly
              value={velden.totaal_bedrag}
              placeholder="0,00"
              className="w-full pl-7 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
            />
          </div>
        </div>

        {/* Omschrijving */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Omschrijving</label>
          <textarea
            rows={2}
            disabled={!bewerkbaar}
            value={velden.omschrijving}
            onChange={(e) => setVeld("omschrijving", e.target.value)}
            placeholder="Optionele omschrijving van de factuur"
            className={`${inputClass()} resize-none`}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
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
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {bewerkbaar ? "Vergrendelen" : "Bewerken"}
        </button>
        <button
          onClick={handleReset}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
