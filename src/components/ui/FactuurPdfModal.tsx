"use client";

import { useEffect, useState } from "react";
import { X, FileText, Loader2, AlertCircle } from "lucide-react";

interface Props {
  factuurnummer: string | number;
  onClose: () => void;
}

export default function FactuurPdfModal({ factuurnummer, onClose }: Props) {
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [activePdf, setActivePdf] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/inkoop/pdf-links?factuurnummer=${encodeURIComponent(String(factuurnummer))}`)
      .then((r) => r.json())
      .then((data: { pdf_path: string }[]) => {
        if (!Array.isArray(data) || data.length === 0) {
          setError("Geen PDF gekoppeld aan dit factuurnummer.");
          return;
        }
        const urls = data.map((d) => `/api/inkoop/importeren/pdf?path=${encodeURIComponent(d.pdf_path)}`);
        setPdfUrls(urls);
        setActivePdf(urls[0]);
      })
      .catch(() => setError("Kon PDF-links niet ophalen."))
      .finally(() => setLoading(false));
  }, [factuurnummer]);

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
            <span className="text-sm font-semibold text-gray-800">
              Factuur #{factuurnummer}
            </span>
            {pdfUrls.length > 1 && (
              <span className="text-xs text-gray-400">({pdfUrls.length} bestanden)</span>
            )}
          </div>

          {/* Tabs als meerdere PDFs */}
          {pdfUrls.length > 1 && (
            <div className="flex gap-1">
              {pdfUrls.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActivePdf(url)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                    activePdf === url
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  PDF {i + 1}
                </button>
              ))}
            </div>
          )}

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">PDF laden…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <AlertCircle className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-500">{error}</p>
              <p className="text-xs text-gray-400 text-center max-w-xs">
                PDF's worden automatisch gekoppeld wanneer je een factuur verwerkt via het Valideren-scherm.
              </p>
            </div>
          ) : activePdf ? (
            <iframe
              src={activePdf}
              className="w-full h-full rounded-b-2xl"
              title={`Factuur ${factuurnummer}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
