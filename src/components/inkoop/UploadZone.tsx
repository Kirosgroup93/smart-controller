"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

interface Props {
  onExtracted: (data: ExtractedFactuur) => void;
}

export interface ExtractedFactuur {
  leveranciersnaam: string | null;
  factuurnummer: string | null;
  factuurdatum: string | null;
  vervaldatum: string | null;
  bedrag_excl_btw: number | null;
  btw_bedrag: number | null;
  totaal_bedrag: number | null;
  omschrijving: string | null;
}

export default function UploadZone({ onExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("Alleen PDF-bestanden zijn toegestaan.");
      return;
    }
    setError(null);
    setFileName(file.name);
    setLoading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/inkoop/extract", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Extractie mislukt");
      }
      const data: ExtractedFactuur = await res.json();
      onExtracted(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Er is een fout opgetreden");
      setFileName(null);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-12 cursor-pointer transition-colors ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {loading ? (
          <>
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm font-medium text-blue-600">Factuur analyseren met AI…</p>
            <p className="text-xs text-gray-400">{fileName}</p>
          </>
        ) : fileName ? (
          <>
            <FileText className="w-10 h-10 text-green-500" />
            <p className="text-sm font-medium text-gray-700">{fileName}</p>
            <p className="text-xs text-gray-400">Klik om een andere PDF te selecteren</p>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Sleep een PDF-factuur hierheen
              </p>
              <p className="text-xs text-gray-400 mt-1">of klik om te bladeren</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
    </div>
  );
}
