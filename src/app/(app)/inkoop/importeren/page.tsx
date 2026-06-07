"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import FactuurFlowStappen from "@/components/inkoop/FactuurFlowStappen";

interface Bestand {
  name: string;
  path: string;
  size: number;
  created_at?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function ImporterenPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [bestanden, setBestanden] = useState<Bestand[]>([]);
  const [ladingLijst, setLadingLijst] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ name: string; ok: boolean; error?: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);

  async function laadLijst() {
    setLadingLijst(true);
    try {
      const res = await fetch("/api/inkoop/importeren");
      if (res.ok) setBestanden(await res.json());
    } finally {
      setLadingLijst(false);
    }
  }

  useEffect(() => { laadLijst(); }, []);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type === "application/pdf");
    if (!arr.length) return;

    setUploading(true);
    setUploadStatus([]);

    const formData = new FormData();
    arr.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/inkoop/importeren", { method: "POST", body: formData });
      const results: { name: string; path?: string; size?: number; error?: string }[] = await res.json();
      setUploadStatus(results.map((r) => ({ name: r.name, ok: !r.error, error: r.error })));
      await laadLijst();
    } catch {
      setUploadStatus(arr.map((f) => ({ name: f.name, ok: false, error: "Upload mislukt" })));
    } finally {
      setUploading(false);
    }
  }, []);

  async function verwijder(path: string) {
    await fetch(`/api/inkoop/importeren?path=${encodeURIComponent(path)}`, { method: "DELETE" });
    setBestanden((prev) => prev.filter((b) => b.path !== path));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <FactuurFlowStappen actief={1} />

      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
            {uploading ? (
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            ) : (
              <Upload className={`w-10 h-10 ${dragOver ? "text-blue-600" : "text-gray-400"}`} />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {uploading ? "Uploaden…" : "Sleep PDF-facturen hierheen"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">of klik om bestanden te kiezen · max 20 MB per bestand</p>
            </div>
          </div>

          {/* Upload resultaten */}
          {uploadStatus.length > 0 && (
            <div className="space-y-1.5">
              {uploadStatus.map((s) => (
                <div
                  key={s.name}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    s.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {s.ok
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                    : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="font-medium">{s.name}</span>
                  {s.error && <span className="text-xs opacity-75">— {s.error}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Geüploade bestanden */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Geïmporteerde facturen
                {bestanden.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">({bestanden.length})</span>
                )}
              </h2>
              {bestanden.length > 0 && (
                <button
                  onClick={() => router.push("/inkoop/facturen-boeken")}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Doorgaan naar Valideren <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {ladingLijst ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Laden…
              </div>
            ) : bestanden.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <FileText className="w-8 h-8" />
                <p className="text-sm">Nog geen facturen geüpload</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {bestanden.map((b) => (
                  <li key={b.path} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                    <FileText className="w-5 h-5 text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {b.name.replace(/^\d+-/, "")}
                      </p>
                      <p className="text-xs text-gray-400">{formatBytes(b.size)}</p>
                    </div>
                    <button
                      onClick={() => verwijder(b.path)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Doorgaan knop onderaan */}
          {bestanden.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => router.push("/inkoop/facturen-boeken")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Doorgaan naar Valideren <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
