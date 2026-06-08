"use client";

import { useEffect, useState } from "react";
import { X, FileText, Loader2, AlertCircle } from "lucide-react";

interface Props {
  factuurnummer: string | number;
  invoiceId: string; // HID (GUID) van de boeking in Exact Online
  onClose: () => void;
}

export default function FactuurPdfModal({ factuurnummer, invoiceId, onClose }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPdfUrl(null);

    // Stap 1: probeer PDF via Exact Online (HID → docs/Documents → attachment)
    const exactUrl = `/api/inkoop/factuur-pdf?hid=${encodeURIComponent(invoiceId)}`;

    fetch(exactUrl, { method: "HEAD" })
      .then((r) => {
        if (r.ok) {
          // Exact heeft een bijlage → toon direct
          setPdfUrl(exactUrl);
          setLoading(false);
        } else {
          // Geen bijlage in Exact → val terug op Supabase Storage links
          return fetch(`/api/inkoop/pdf-links?factuurnummer=${encodeURIComponent(String(factuurnummer))}`)
            .then((r2) => r2.json())
            .then((data: { pdf_path: string }[]) => {
              if (Array.isArray(data) && data.length > 0) {
                setPdfUrl(`/api/inkoop/importeren/pdf?path=${encodeURIComponent(data[0].pdf_path)}`);
              } else {
                setError("Geen PDF gevonden bij deze factuur in Exact Online.");
              }
            });
        }
      })
      .catch(() => setError("Fout bij ophalen PDF."))
      .finally(() => setLoading(false));
  }, [invoiceId, factuurnummer]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl" style={{ height: "88vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">Factuur #{factuurnummer}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">PDF ophalen uit Exact Online…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <AlertCircle className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-500">{error}</p>
              <p className="text-xs text-gray-400 text-center max-w-xs">
                Zorg dat de PDF als bijlage aan de boeking is gekoppeld in Exact Online,
                of verwerk de factuur via het Valideren-scherm.
              </p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-b-2xl"
              title={`Factuur ${factuurnummer}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
