import { createClient } from "@/lib/supabase/server";
import { CheckCircle, AlertTriangle, Link2, RefreshCw } from "lucide-react";
import ExactConnectButton from "@/components/ui/ExactConnectButton";

export default async function ExactInstellingenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let conn: { division?: number; expires_at?: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("exact_connections")
      .select("division, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    conn = data;
  }

  const isExpired = conn?.expires_at
    ? new Date(conn.expires_at).getTime() < Date.now()
    : true;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Link2 className="w-6 h-6 text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-800">Exact Online koppeling</h1>
        </div>

        {conn ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            {/* Status */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isExpired ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
              {isExpired
                ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                : <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              }
              <div>
                <p className={`text-sm font-medium ${isExpired ? "text-amber-800" : "text-green-800"}`}>
                  {isExpired ? "Sessie verlopen" : "Verbonden met Exact Online"}
                </p>
                {conn.division && (
                  <p className="text-xs text-gray-500 mt-0.5">Divisie: {conn.division}</p>
                )}
                {conn.expires_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Token verloopt: {new Date(conn.expires_at).toLocaleString("nl-NL")}
                  </p>
                )}
              </div>
            </div>

            {/* Opnieuw koppelen */}
            <div>
              <p className="text-sm text-gray-600 mb-3">
                {isExpired
                  ? "De verbinding is verlopen. Koppel opnieuw om data op te halen."
                  : "Wil je de verbinding vernieuwen? Klik op de knop hieronder."}
              </p>
              <ExactConnectButton large />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Er is nog geen Exact Online account gekoppeld. Klik op de knop om te beginnen.
            </p>
            <ExactConnectButton large />
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Na het koppelen word je teruggestuurd naar het dashboard.
        </p>
      </div>
    </div>
  );
}
