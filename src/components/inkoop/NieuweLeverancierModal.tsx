"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAangemaakt: (lev: { ID: string; Name: string; Code: string; VATNumber?: string }) => void;
}

export default function NieuweLeverancierModal({ open, onClose, onAangemaakt }: Props) {
  const [naam, setNaam] = useState("");
  const [code, setCode] = useState("");
  const [btwNummer, setBtwNummer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const naamRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setNaam(""); setCode(""); setBtwNummer(""); setError(null);
      setTimeout(() => naamRef.current?.focus(), 50);
    }
  }, [open]);

  // Sluit op Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!naam.trim()) { setError("Naam is verplicht"); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/inkoop/leveranciers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naam, code, btwNummer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fout bij aanmaken");
      onAangemaakt({
        ID: data.ID ?? data.id ?? "",
        Name: naam,
        Code: code,
        VATNumber: btwNummer || undefined,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-800">Nieuwe leverancier</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={lbl}>Naam <span className="text-red-500">*</span></label>
            <input ref={naamRef} className={inp} value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Bedrijfsnaam" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Code</label>
              <input className={inp} value={code} onChange={(e) => setCode(e.target.value)} placeholder="LEV001" />
            </div>
            <div>
              <label className={lbl}>BTW-nummer</label>
              <input className={inp} value={btwNummer} onChange={(e) => setBtwNummer(e.target.value)} placeholder="NL000000000B01" />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Annuleren
            </button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
