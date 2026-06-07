"use client";

import { useRef } from "react";
import { FileText, List } from "lucide-react";
import HandmatigInvoerForm from "@/components/inkoop/HandmatigInvoerForm";
import GeboekteFacturenTabel from "@/components/inkoop/GeboekteFacturenTabel";

export default function FacturenBoekenPage() {
  const tabelRef = useRef<{ ververs: () => void }>(null);

  return (
    <div className="space-y-10">
      {/* Sectie 1: Handmatig invoerformulier */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900">Inkoopfactuur invoeren</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <HandmatigInvoerForm onGeboekt={() => tabelRef.current?.ververs()} />
        </div>
      </section>

      {/* Sectie 2: Overzicht */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Geboekte inkoopfacturen</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <GeboekteFacturenTabel ref={tabelRef} />
        </div>
      </section>
    </div>
  );
}
