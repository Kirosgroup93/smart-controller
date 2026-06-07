"use client";

import { useState } from "react";
import { Sparkles, List } from "lucide-react";
import UploadZone, { type ExtractedFactuur } from "@/components/inkoop/UploadZone";
import FactuurReviewForm from "@/components/inkoop/FactuurReviewForm";
import GeboekteFacturenTabel from "@/components/inkoop/GeboekteFacturenTabel";

export default function FacturenBoekenPage() {
  const [extracted, setExtracted] = useState<ExtractedFactuur | null>(null);

  return (
    <div className="space-y-10">
      {/* Sectie 1: AI upload */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900">AI Factuur uploaden</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          {!extracted ? (
            <UploadZone onExtracted={setExtracted} />
          ) : (
            <>
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  AI extractie voltooid — controleer de velden
                </span>
              </div>
              <FactuurReviewForm
                data={extracted}
                onReset={() => setExtracted(null)}
              />
            </>
          )}
        </div>
      </section>

      {/* Sectie 2: Overzicht */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Geboekte inkoopfacturen</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <GeboekteFacturenTabel />
        </div>
      </section>
    </div>
  );
}
