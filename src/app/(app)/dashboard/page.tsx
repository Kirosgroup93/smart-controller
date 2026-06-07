import { createClient } from "@/lib/supabase/server";
import KPICards from "@/components/ui/KPICards";
import ExactConnectButton from "@/components/ui/ExactConnectButton";
import FinancialChart from "@/components/charts/FinancialChart";
import InvoiceTable from "@/components/ui/InvoiceTable";
import SessionExpiredBanner from "@/components/ui/SessionExpiredBanner";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const params = await searchParams;

  let hasConnection = false;
  let division: number | undefined;

  try {
    const { data } = await supabase
      .from("exact_connections")
      .select("division")
      .eq("user_id", user.id)
      .single();
    hasConnection = !!data;
    division = data?.division;
  } catch {
    hasConnection = false;
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {params.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Fout bij verbinding: {decodeURIComponent(params.error)}
          </div>
        )}

        {!hasConnection ? (
          <div className="text-center py-24">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Koppel uw Exact Online account
            </h2>
            <p className="text-gray-500 mb-6">
              Verbind met Exact Online om uw financiële data te bekijken
            </p>
            <ExactConnectButton large />
          </div>
        ) : (
          <>
            {division && <p className="text-xs text-gray-400">Divisie: {division}</p>}
            <SessionExpiredBanner />
            <KPICards userId={user.id} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancialChart userId={user.id} />
              <InvoiceTable userId={user.id} type="receivables" />
            </div>
            <InvoiceTable userId={user.id} type="payables" />
          </>
        )}
      </div>
    </div>
  );
}
