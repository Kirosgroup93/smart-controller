import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createExactClient } from "@/lib/exact-online/client";
import type { ExactConnection } from "@/types/database";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connData } = await supabase.from("exact_connections").select("*").eq("user_id", user.id).single();
  if (!connData) return NextResponse.json({ error: "Geen verbinding" }, { status: 404 });

  const conn = connData as ExactConnection;
  const client = createExactClient(conn.access_token, conn.division);

  const results: Record<string, unknown> = {};

  const endpoints = [
    "/read/financial/PayablesList",
    "/read/financial/ReceivablesList",
    "/purchaseorder/PurchaseInvoices",
    "/salesinvoice/SalesInvoices",
  ];

  for (const ep of endpoints) {
    try {
      const res = await client.get(ep, { params: { $top: 5 } });
      results[ep] = { count: res.data?.d?.results?.length, sample: res.data?.d?.results?.slice(0, 2) };
    } catch (e: unknown) {
      results[ep] = { error: (e as { message?: string })?.message, status: (e as { response?: { status?: number } })?.response?.status };
    }
  }

  return NextResponse.json(results);
}
