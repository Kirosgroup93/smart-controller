"use client";

import { useEffect, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, FileX, Loader2 } from "lucide-react";

interface Props {
  docId: string | null;
}

export default function PDFViewer({ docId }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fout, setFout] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!docId) { setUrl(null); setFout(false); return; }
    setLoading(true);
    setFout(false);
    setUrl(null);

    fetch(`/api/inkoop/document/${docId}`)
      .then(async (res) => {
        if (!res.ok) { setFout(true); return; }
        const blob = await res.blob();
        setUrl(URL.createObjectURL(blob));
      })
      .catch(() => setFout(true))
      .finally(() => setLoading(false));

    return () => { if (url) URL.revokeObjectURL(url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  return (
    <div className="flex flex-col h-full bg-gray-700">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-600">
        <span className="text-xs text-gray-300 font-medium mr-auto">PDF Viewer</span>
        <button
          onClick={() => setZoom((z) => Math.max(50, z - 10))}
          className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
          title="Uitzoomen"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-400 w-10 text-center">{zoom}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(200, z + 10))}
          className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
          title="Inzoomen"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(100)}
          className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
          title="Reset zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Viewer area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        {!docId ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <FileX className="w-12 h-12 text-gray-600" />
            <p className="text-sm">Selecteer een factuur om de PDF te bekijken</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">PDF laden…</p>
          </div>
        ) : fout ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <FileX className="w-12 h-12 text-gray-600" />
            <p className="text-sm">Geen PDF beschikbaar voor deze factuur</p>
            <p className="text-xs text-gray-600 max-w-xs text-center">
              PDF-bijlagen worden opgehaald vanuit Exact Online. Niet alle facturen hebben een bijgevoegde PDF.
            </p>
          </div>
        ) : url ? (
          <div style={{ width: `${zoom}%`, minWidth: "400px", transition: "width 0.2s" }}>
            <iframe
              src={url}
              className="w-full rounded shadow-lg bg-white"
              style={{ height: "calc(100vh - 160px)", border: "none" }}
              title="Factuur PDF"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
