"use client";

import { useState } from "react";
import DocumentenLijst, { type InkoopDoc } from "@/components/inkoop/blue10/DocumentenLijst";
import InvoerFormulier from "@/components/inkoop/blue10/InvoerFormulier";
import PDFViewer from "@/components/inkoop/blue10/PDFViewer";
import CodingsRegelTabel from "@/components/inkoop/blue10/CodingsRegelTabel";
import FactuurFlowStappen from "@/components/inkoop/FactuurFlowStappen";

export default function FacturenBoekenPage() {
  const [geselecteerd, setGeselecteerd] = useState<InkoopDoc | null>(null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <FactuurFlowStappen actief={3} />
      {/* Drie kolommen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Kolom 1: Documentenlijst */}
        <div className="w-56 shrink-0 overflow-hidden">
          <DocumentenLijst
            geselecteerd={geselecteerd?.ID ?? null}
            onSelect={setGeselecteerd}
          />
        </div>

        {/* Kolom 2: Invoerformulier */}
        <div className="w-72 shrink-0 overflow-hidden border-r border-gray-200">
          <InvoerFormulier
            doc={geselecteerd}
            onVerwerkt={() => setGeselecteerd(null)}
          />
        </div>

        {/* Kolom 3: PDF viewer */}
        <div className="flex-1 overflow-hidden">
          <PDFViewer
            docId={geselecteerd?.ID ?? null}
            storagePath={geselecteerd?.storagePath ?? null}
          />
        </div>
      </div>

      {/* Coderingsregel tabel onderaan */}
      <CodingsRegelTabel />
    </div>
  );
}
