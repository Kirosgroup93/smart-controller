import { Scissors } from "lucide-react";
import FactuurFlowStappen from "@/components/inkoop/FactuurFlowStappen";

export default function SplitsenPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <FactuurFlowStappen actief={2} />
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-5">
            <Scissors className="w-8 h-8 text-purple-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Stap 2 — Splitsen</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Deze functie is nog in ontwikkeling.
          </p>
          <span className="mt-4 inline-block text-xs text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full font-medium">
            Binnenkort beschikbaar
          </span>
        </div>
      </div>
    </div>
  );
}
