import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KPICards from "@/components/ui/KPICards";
import ExactConnectButton from "@/components/ui/ExactConnectButton";
import FinancialChart from "@/components/charts/FinancialChart";
import InvoiceTable from "@/components/ui/InvoiceTable";
import type { ExactConnection } from "@/types/database";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: connectionData } = await supabase
    .from("exact_connections")
    .select("division, expires_at")
    .eq("user_id", user.id)
    .single();

  const connection = connectionData as Pick<ExactConnection, "division" | "expires_at"> | null;
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Smart Controller</h1>
          <p className="text-sm text-gray-500">Financieel Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          {connection ? (
            <span className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Exact Online verbonden (divisie {connection.division})
            </span>
          ) : (
            <ExactConnectButton />
          )}
          <span className="text-sm text-gray-600">{user.email}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {params.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Fout bij verbinding: {params.error}
          </div>
        )}

        {!connection ? (
          <div className="text-center py-20">
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
            <KPICards userId={user.id} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancialChart userId={user.id} />
              <InvoiceTable userId={user.id} type="receivables" />
            </div>
            <InvoiceTable userId={user.id} type="payables" />
          </>
        )}
      </main>
    </div>
  );
}
