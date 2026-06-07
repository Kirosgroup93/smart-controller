"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, Loader2 } from "lucide-react";
import type { InkoopDoc } from "./DocumentenLijst";
import LeverancierSelect from "@/components/ui/LeverancierSelect";
import NieuweLeverancierModal from "@/components/inkoop/NieuweLeverancierModal";

interface Leverancier { ID: string; Name: string; Code: string; VATNumber?: string; IBAN?: string; }

const BTW_PERCENTAGES = [0, 9, 21] as const;
type BtwPct = (typeof BTW_PERCENTAGES)[number];

const BETALING_CONDITIES = ["14 dagen netto", "30 dagen netto", "60 dagen netto", "Contant", "Vooruitbetaling"];
const VALUTA = ["EUR", "USD", "GBP"];
const PERIODES = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

interface Velden {
  leverancier_id: string;
  leverancier_naam: string;
  btw_nummer: string;
  iban: string;
  factuurnummer: string;
  boekingstemplate: string;
  omschrijving: string;
  factuurdatum: string;
  betalingsconditie: string;
  periode: string;
  jaar: string;
  valuta: string;
  type: "D" | "C";
  btw_bedrag: string;
  btw_percentage: BtwPct;
  bedrag_excl_btw: string;
  totaal_bedrag: string;
  opmerking: string;
}

function legeVelden(jaar: number): Velden {
  return {
    leverancier_id: "", leverancier_naam: "", btw_nummer: "", iban: "",
    factuurnummer: "", boekingstemplate: "", omschrijving: "",
    factuurdatum: "", betalingsconditie: "30 dagen netto",
    periode: String(new Date().getMonth() + 1).padStart(2, "0"),
    jaar: String(jaar), valuta: "EUR", type: "D",
    btw_bedrag: "", btw_percentage: 21, bedrag_excl_btw: "", totaal_bedrag: "",
    opmerking: "",
  };
}

function exactDateToISO(val: string | null): string {
  if (!val) return "";
  const m = val.match(/\d+/);
  if (!m) return "";
  return new Date(parseInt(m[0])).toISOString().split("T")[0];
}

interface Props {
  doc: InkoopDoc | null;
  onVerwerkt: () => void;
}

export default function InvoerFormulier({ doc, onVerwerkt }: Props) {
  const jaar = new Date().getFullYear();
  const [velden, setVelden] = useState<Velden>(legeVelden(jaar));
  const [leveranciers, setLeveranciers] = useState<Leverancier[]>([]);
  const [loadingLev, setLoadingLev] = useState(true);
  const [levError, setLevError] = useState<string | null>(null);
  const [nieuweLevOpen, setNieuweLevOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "concept_ok" | "verwerkt_ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/inkoop/leveranciers")
      .then(async (r) => {
        const text = await r.text();
        if (!text) return { data: [], error: "Lege respons van server" };
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) return { data: parsed, error: null };
          // API gaf een fout terug (bijv. { error: "..." })
          return { data: [], error: parsed?.error ?? JSON.stringify(parsed) };
        } catch {
          return { data: [], error: `JSON parse fout: ${text.slice(0, 100)}` };
        }
      })
      .then(({ data, error }) => {
        setLeveranciers(data);
        if (error) setLevError(error);
      })
      .catch((e) => {
        setLeveranciers([]);
        setLevError(e?.message ?? "Netwerk fout");
      })
      .finally(() => setLoadingLev(false));
  }, []);

  // Vul formulier bij selectie van een document
  useEffect(() => {
    if (!doc) { setVelden(legeVelden(jaar)); return; }
    const excl = doc.AmountDCExclVAT ?? 0;
    const btw = doc.VATAmountDC ?? 0;
    setVelden((prev) => ({
      ...legeVelden(jaar),
      leverancier_id: "",
      leverancier_naam: doc.SupplierName ?? "",
      factuurnummer: doc.InvoiceNumber ?? "",
      omschrijving: doc.Description ?? "",
      factuurdatum: exactDateToISO(doc.InvoiceDate),
      bedrag_excl_btw: excl ? excl.toFixed(2) : "",
      btw_bedrag: btw ? btw.toFixed(2) : "",
      totaal_bedrag: doc.AmountDC ? doc.AmountDC.toFixed(2) : "",
      periode: prev.periode,
      jaar: prev.jaar,
    }));
    setStatus("idle");
  }, [doc, jaar]);

  function set<K extends keyof Velden>(k: K, v: Velden[K]) {
    setVelden((prev) => {
      const n = { ...prev, [k]: v };
      if (k === "bedrag_excl_btw" || k === "btw_percentage") {
        const excl = parseFloat(n.bedrag_excl_btw) || 0;
        const btw = Math.round(excl * n.btw_percentage) / 100;
        n.btw_bedrag = excl ? btw.toFixed(2) : "";
        n.totaal_bedrag = excl ? (excl + btw).toFixed(2) : "";
      }
      if (k === "btw_bedrag") {
        const excl = parseFloat(n.bedrag_excl_btw) || 0;
        const btw = parseFloat(v as string) || 0;
        n.totaal_bedrag = excl ? (excl + btw).toFixed(2) : "";
      }
      return n;
    });
    setStatus("idle");
  }

  async function verstuur(concept: boolean) {
    concept ? setSaving(true) : setProcessing(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/inkoop/facturen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leverancier_id: velden.leverancier_id,
          leveranciersnaam: velden.leverancier_naam,
          factuurnummer: velden.factuurnummer,
          factuurdatum: velden.factuurdatum || null,
          omschrijving: velden.omschrijving,
          bedrag_excl_btw: parseFloat(velden.bedrag_excl_btw) || 0,
          btw_bedrag: parseFloat(velden.btw_bedrag) || 0,
          totaal_bedrag: parseFloat(velden.totaal_bedrag) || 0,
          dagboek: 70,
          concept,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fout");
      setStatus(concept ? "concept_ok" : "verwerkt_ok");
      if (!concept) onVerwerkt();
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setSaving(false);
      setProcessing(false);
    }
  }

  const inp = "w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white";
  const lbl = "block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5";

  return (
    <>
    <NieuweLeverancierModal
      open={nieuweLevOpen}
      onClose={() => setNieuweLevOpen(false)}
      onAangemaakt={(lev) => {
        // Voeg toe aan lokale lijst en selecteer direct
        setLeveranciers((prev) => [...prev, lev].sort((a, b) => a.Name.localeCompare(b.Name)));
        setVelden((prev) => ({
          ...prev,
          leverancier_id: lev.ID,
          leverancier_naam: lev.Name,
          btw_nummer: lev.VATNumber ?? prev.btw_nummer,
        }));
        setStatus("idle");
      }}
    />
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-200 bg-slate-50 shrink-0">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Invoer</span>
        {doc && <span className="ml-2 text-xs text-gray-400">{doc.InvoiceNumber || doc.ID.slice(0, 8)}</span>}
      </div>

      {/* Formulier scroll area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* Leverancier */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className={lbl} style={{ marginBottom: 0 }}>Leverancier</label>
            <button
              type="button"
              onClick={() => setNieuweLevOpen(true)}
              title="Nieuwe leverancier aanmaken"
              className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
            >
              <span className="text-sm leading-none">+</span> Nieuw
            </button>
          </div>
          {loadingLev ? (
            <div className="h-7 bg-gray-100 rounded animate-pulse" />
          ) : levError ? (
            <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
              ⚠ Fout bij laden leveranciers: {levError}
            </div>
          ) : (
            <LeverancierSelect
              leveranciers={leveranciers}
              value={velden.leverancier_id}
              onChange={(lev) => {
                if (lev) {
                  setVelden((prev) => ({
                    ...prev,
                    leverancier_id: lev.ID,
                    leverancier_naam: lev.Name,
                    btw_nummer: lev.VATNumber ?? prev.btw_nummer,
                    iban: lev.IBAN ?? prev.iban,
                  }));
                } else {
                  setVelden((prev) => ({
                    ...prev,
                    leverancier_id: "",
                    leverancier_naam: "",
                  }));
                }
                setStatus("idle");
              }}
            />
          )}
        </div>

        {/* BTW nr + IBAN */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>BTW-nummer</label>
            <input className={inp} value={velden.btw_nummer} onChange={(e) => set("btw_nummer", e.target.value)} placeholder="NL000000000B01" />
          </div>
          <div>
            <label className={lbl}>IBAN</label>
            <input className={inp} value={velden.iban} onChange={(e) => set("iban", e.target.value)} placeholder="NL00 BANK 0000 0000 00" />
          </div>
        </div>

        {/* Factuurnummer + boekingstemplate */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Factuurnummer</label>
            <input className={inp} value={velden.factuurnummer} onChange={(e) => set("factuurnummer", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Boekingstemplate</label>
            <input className={inp} value={velden.boekingstemplate} onChange={(e) => set("boekingstemplate", e.target.value)} placeholder="Standaard" />
          </div>
        </div>

        {/* Omschrijving */}
        <div>
          <label className={lbl}>Omschrijving</label>
          <input className={inp} value={velden.omschrijving} onChange={(e) => set("omschrijving", e.target.value)} />
        </div>

        {/* Datum + betalingsconditie */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Factuurdatum</label>
            <input type="date" className={inp} value={velden.factuurdatum} onChange={(e) => set("factuurdatum", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Betalingsconditie</label>
            <select className={inp} value={velden.betalingsconditie} onChange={(e) => set("betalingsconditie", e.target.value)}>
              {BETALING_CONDITIES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {/* Periode + jaar + valuta + type */}
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className={lbl}>Periode</label>
            <select className={inp} value={velden.periode} onChange={(e) => set("periode", e.target.value)}>
              {PERIODES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Jaar</label>
            <input className={inp} value={velden.jaar} onChange={(e) => set("jaar", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Valuta</label>
            <select className={inp} value={velden.valuta} onChange={(e) => set("valuta", e.target.value)}>
              {VALUTA.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Type</label>
            <div className="flex border border-gray-300 rounded overflow-hidden h-7">
              {(["D", "C"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => set("type", t)}
                  className={`flex-1 text-xs font-semibold transition-colors ${
                    velden.type === t ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t === "D" ? "Debet" : "Credit"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BTW */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={lbl}>Bedrag excl. BTW</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
              <input type="number" step="0.01" className={`${inp} pl-5`} value={velden.bedrag_excl_btw} onChange={(e) => set("bedrag_excl_btw", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl}>BTW %</label>
            <select className={inp} value={velden.btw_percentage} onChange={(e) => set("btw_percentage", parseInt(e.target.value) as BtwPct)}>
              {BTW_PERCENTAGES.map((p) => <option key={p} value={p}>{p}%</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>BTW bedrag</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
              <input type="number" step="0.01" className={`${inp} pl-5 bg-blue-50/60`} value={velden.btw_bedrag} onChange={(e) => set("btw_bedrag", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Totaal */}
        <div>
          <label className={lbl}>Totaalbedrag</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
            <input readOnly className={`${inp} pl-5 bg-gray-50 font-semibold cursor-not-allowed`} value={velden.totaal_bedrag} />
          </div>
        </div>

        {/* Opmerking */}
        <div>
          <label className={lbl}>Opmerking</label>
          <textarea rows={2} className={`${inp} resize-none`} value={velden.opmerking} onChange={(e) => set("opmerking", e.target.value)} />
        </div>

        {/* Status */}
        {status === "concept_ok" && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4" /> Concept opgeslagen
          </div>
        )}
        {status === "verwerkt_ok" && (
          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4" /> Factuur verwerkt in Exact Online
          </div>
        )}
        {status === "error" && (
          <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</div>
        )}
      </div>

      {/* Knoppen */}
      <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-gray-200 bg-slate-50">
        <button
          onClick={() => verstuur(true)}
          disabled={saving || processing}
          className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Concept opslaan
        </button>
        <button
          onClick={() => verstuur(false)}
          disabled={saving || processing}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50"
        >
          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          Verwerken
        </button>
      </div>
    </div>
    </>
  );
}
