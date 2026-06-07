import { createClient } from "@/lib/supabase/server";
import InvoiceTable from "@/components/ui/InvoiceTable";
import ExactConnectButton from "@/components/ui/ExactConnectButton";
import type { ExactConnection } from "@/types/database";

export default async function InkoopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: connectionData } = await supabase
    .from("exact_connections")
    .select("division")
    .eq("user_id", user!.id)
    .single();

  const connection = connectionData as Pick<ExactConnection, "division"> | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Inkoop</h1>
        <p className="text-sm text-gray-500 mt-0.5">Openstaande inkoopfacturen en schulden</p>
      </div>

      {!connection ? (
        <div className="text-center py-24">
          <p className="text-gray-500 mb-6">Verbind met Exact Online om inkoopdata te bekijken</p>
          <ExactConnectButton large />
        </div>
      ) : (
        <InvoiceTable userId={user!.id} type="payables" />
      )}
    </div>
  );
}
