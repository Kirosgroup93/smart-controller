"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, X, Pencil } from "lucide-react";

interface Leverancier {
  ID: string;
  Name: string;
  Code: string;
  VATNumber?: string;
  IBAN?: string;
}

interface Props {
  leveranciers: Leverancier[];
  value: string; // ID
  onChange: (lev: Leverancier | null) => void;
  onEdit?: (lev: Leverancier) => void;
  disabled?: boolean;
}

export default function LeverancierSelect({ leveranciers, value, onChange, onEdit, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [zoek, setZoek] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const geselecteerd = leveranciers.find((l) => l.ID === value) ?? null;

  // Sluit dropdown bij klik buiten
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setZoek("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus zoekbalk als dropdown opent
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const gefilterd = leveranciers.filter((l) => {
    if (!zoek) return true;
    const q = zoek.toLowerCase();
    return (
      l.Name.toLowerCase().includes(q) ||
      (l.Code ?? "").toLowerCase().includes(q)
    );
  });

  function selecteer(lev: Leverancier) {
    onChange(lev);
    setOpen(false);
    setZoek("");
  }

  function wis(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setZoek("");
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger knop */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 text-left"
      >
        {geselecteerd ? (
          <span className="flex items-center gap-2 min-w-0">
            {geselecteerd.Code && (
              <span className="shrink-0 font-mono text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                {geselecteerd.Code}
              </span>
            )}
            <span className="truncate text-gray-800">{geselecteerd.Name}</span>
          </span>
        ) : (
          <span className="text-gray-400">— Selecteer leverancier —</span>
        )}
        <span className="flex items-center gap-1 shrink-0 ml-1">
          {geselecteerd && onEdit && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onEdit(geselecteerd); }}
              title="Bewerken"
              className="text-gray-300 hover:text-blue-500 p-0.5"
            >
              <Pencil className="w-3 h-3" />
            </span>
          )}
          {geselecteerd && (
            <span
              role="button"
              onClick={wis}
              className="text-gray-300 hover:text-red-400 p-0.5"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col"
          style={{ maxHeight: 280 }}>

          {/* Zoekbalk */}
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Zoek op naam of code…"
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              className="flex-1 text-xs outline-none text-gray-700 placeholder:text-gray-400"
            />
            {zoek && (
              <button onClick={() => setZoek("")} className="text-gray-300 hover:text-gray-500">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Lijst */}
          <div className="overflow-y-auto flex-1">
            {gefilterd.length === 0 ? (
              <div className="px-3 py-4 text-xs text-gray-400 text-center">Geen resultaten</div>
            ) : (
              gefilterd.map((l) => (
                <button
                  key={l.ID}
                  type="button"
                  onClick={() => selecteer(l)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 transition-colors ${
                    l.ID === value ? "bg-blue-50" : ""
                  }`}
                >
                  {l.Code && (
                    <span className="shrink-0 font-mono text-[10px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded w-16 text-center">
                      {l.Code}
                    </span>
                  )}
                  <span className={`text-xs truncate ${l.ID === value ? "font-semibold text-blue-700" : "text-gray-700"}`}>
                    {l.Name}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Footer: aantal */}
          <div className="px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-400">
            {gefilterd.length} van {leveranciers.length} leveranciers
          </div>
        </div>
      )}
    </div>
  );
}
