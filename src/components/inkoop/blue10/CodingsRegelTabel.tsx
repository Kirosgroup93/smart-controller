"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface CodingsRegel {
  id: string;
  vanaf: string;
  tot_en_met: string;
  grootboekrekening: string;
  btw_code: string;
  netto: string;
  bruto: string;
  btw_bedrag: string;
  omschrijving: string;
  kostenplaats: string;
}

function nieuweRegel(): CodingsRegel {
  return {
    id: crypto.randomUUID(),
    vanaf: "", tot_en_met: "", grootboekrekening: "", btw_code: "21H",
    netto: "", bruto: "", btw_bedrag: "", omschrijving: "", kostenplaats: "",
  };
}

const BTW_CODES = ["0E", "9L", "21H", "VR", "G"];

const HEADERS = [
  "Vanaf", "Tot en met", "Grootboekrekening", "BTW code",
  "Netto", "Bruto", "BTW bedrag", "Omschrijving", "Kostenplaats", "",
];

export default function CodingsRegelTabel() {
  const [regels, setRegels] = useState<CodingsRegel[]>([nieuweRegel()]);

  function updateRegel(id: string, key: keyof CodingsRegel, val: string) {
    setRegels((prev) => prev.map((r) => r.id === id ? { ...r, [key]: val } : r));
  }

  function voegToe() {
    setRegels((prev) => [...prev, nieuweRegel()]);
  }

  function verwijder(id: string) {
    setRegels((prev) => prev.filter((r) => r.id !== id));
  }

  const cel = "px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 w-full bg-white";

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Coderingsregels</span>
        <button
          onClick={voegToe}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Rij toevoegen
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead className="bg-gray-50">
            <tr>
              {HEADERS.map((h) => (
                <th key={h} className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regels.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-1.5 py-1 w-20"><input className={cel} value={r.vanaf} onChange={(e) => updateRegel(r.id, "vanaf", e.target.value)} placeholder="01-01" /></td>
                <td className="px-1.5 py-1 w-20"><input className={cel} value={r.tot_en_met} onChange={(e) => updateRegel(r.id, "tot_en_met", e.target.value)} placeholder="31-12" /></td>
                <td className="px-1.5 py-1 w-32"><input className={cel} value={r.grootboekrekening} onChange={(e) => updateRegel(r.id, "grootboekrekening", e.target.value)} placeholder="bijv. 4000" /></td>
                <td className="px-1.5 py-1 w-24">
                  <select className={cel} value={r.btw_code} onChange={(e) => updateRegel(r.id, "btw_code", e.target.value)}>
                    {BTW_CODES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td className="px-1.5 py-1 w-24"><input type="number" step="0.01" className={cel} value={r.netto} onChange={(e) => updateRegel(r.id, "netto", e.target.value)} placeholder="0,00" /></td>
                <td className="px-1.5 py-1 w-24"><input type="number" step="0.01" className={cel} value={r.bruto} onChange={(e) => updateRegel(r.id, "bruto", e.target.value)} placeholder="0,00" /></td>
                <td className="px-1.5 py-1 w-24"><input type="number" step="0.01" className={cel} value={r.btw_bedrag} onChange={(e) => updateRegel(r.id, "btw_bedrag", e.target.value)} placeholder="0,00" /></td>
                <td className="px-1.5 py-1"><input className={cel} value={r.omschrijving} onChange={(e) => updateRegel(r.id, "omschrijving", e.target.value)} /></td>
                <td className="px-1.5 py-1 w-28"><input className={cel} value={r.kostenplaats} onChange={(e) => updateRegel(r.id, "kostenplaats", e.target.value)} /></td>
                <td className="px-1.5 py-1 w-8 text-center">
                  <button onClick={() => verwijder(r.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
