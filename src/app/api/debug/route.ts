import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createExactClient, refreshAccessToken } from "@/lib/exact-online/client";
import type { ExactConnection } from "@/types/database";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connData } = await supabase.from("exact_connections").select("*").eq("user_id", user.id).single();
  if (!connData) return NextResponse.json({ error: "Geen verbinding" }, { status: 404 });

  let conn = connData as ExactConnection;

  // Forceer token refresh
  try {
    const tokens = await refreshAccessToken(conn.refresh_token);
    await supabase.from("exact_connections").update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    }).eq("user_id", user.id);
    conn = { ...conn, access_token: tokens.access_token };
  } catch (e) {
    return NextResponse.json({ error: "Token refresh mislukt", detail: (e as Error).message });
  }

  const client = createExactClient(conn.access_token, conn.division);
  const results: Record<string, unknown> = { division: conn.division };

  const tests = [
    { key: "accounts", path: "/crm/Accounts", params: { $filter: "IsSupplier eq true", $top: 2, $select: "ID,Name,Code" } },
    { key: "glaccounts", path: "/financial/GLAccounts", params: { $top: 2, $select: "ID,Code,Description" } },
    { key: "costcenters", path: "/hrm/Costcenters", params: { $top: 2, $select: "ID,Code,Description" } },
    { key: "purchaseinvoices", path: "/purchase/PurchaseInvoices", params: { $top: 2, $select: "ID,InvoiceNumber,Status" } },
    { key: "payables", path: "/read/financial/PayablesList", params: { $top: 2 } },
    { key: "receivables", path: "/read/financial/ReceivablesList", params: { $top: 2 } },
  ];

  for (const t of tests) {
    try {
      const res = await client.get(t.path, { params: t.params });
      // Toon de volledige raw response structuur
      results[t.key] = {
        status: res.status,
        dataKeys: Object.keys(res.data ?? {}),
        dKeys: res.data?.d ? Object.keys(res.data.d) : null,
        resultsCount: res.data?.d?.results?.length,
        firstItem: res.data?.d?.results?.[0] ?? res.data,
      };
    } catch (e: unknown) {
      results[t.key] = {
        error: (e as Error)?.message,
        status: (e as { response?: { status?: number } })?.response?.status,
        data: (e as { response?: { data?: unknown } })?.response?.data,
      };
    }
  }

  return NextResponse.json(results, { headers: { "Content-Type": "application/json" } });
}
