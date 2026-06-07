import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createExactClient } from "@/lib/exact-online/client";
import type { ExactConnection } from "@/types/database";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connData } = await supabase.from("exact_connections").select("*").eq("user_id", user.id).single();
  if (!connData) return NextResponse.json({ error: "Geen verbinding in database" }, { status: 404 });

  const conn = connData as ExactConnection;
  const client = createExactClient(conn.access_token, conn.division);
  const results: Record<string, unknown> = { division: conn.division };

  const tests = [
    { key: "accounts",         path: "/crm/Accounts",              params: { $filter: "IsSupplier eq true", $top: 2, $select: "ID,Name,Code" } },
    { key: "glaccounts",       path: "/financial/GLAccounts",      params: { $top: 2, $select: "ID,Code,Description" } },
    { key: "costcenters",      path: "/hrm/Costcenters",           params: { $top: 2, $select: "ID,Code,Description" } },
    { key: "purchaseinvoices", path: "/purchase/PurchaseInvoices", params: { $top: 2, $select: "ID,InvoiceNumber,Status" } },
    { key: "salesinvoices",    path: "/salesinvoice/SalesInvoices",params: { $top: 2, $select: "ID,InvoiceNumber,Status" } },
    { key: "payables",         path: "/read/financial/PayablesList",   params: { $top: 2 } },
    { key: "receivables",      path: "/read/financial/ReceivablesList", params: { $top: 2 } },
  ];

  for (const t of tests) {
    try {
      const res = await client.get(t.path, { params: t.params });
      const items = res.data?.d?.results;
      results[t.key] = {
        status: res.status,
        count: items?.length ?? "geen d.results",
        first: items?.[0] ?? res.data,
      };
    } catch (e: unknown) {
      results[t.key] = {
        error: (e as Error)?.message,
        httpStatus: (e as { response?: { status?: number } })?.response?.status,
        body: (e as { response?: { data?: unknown } })?.response?.data,
      };
    }
  }

  return NextResponse.json(results);
}
