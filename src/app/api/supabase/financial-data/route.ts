import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOutstandingReceivables,
  getOutstandingPayables,
  getProfitLoss,
} from "@/lib/exact-online/queries";
import type { ExactConnection } from "@/types/database";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connectionData } = await supabase
    .from("exact_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!connectionData) {
    return NextResponse.json({ error: "Exact Online not connected" }, { status: 404 });
  }

  const connection = connectionData as ExactConnection;
  const year = new Date().getFullYear();

  const [receivables, payables, profitLoss] = await Promise.all([
    getOutstandingReceivables(connection.access_token, connection.division),
    getOutstandingPayables(connection.access_token, connection.division),
    getProfitLoss(connection.access_token, connection.division, year),
  ]);

  const totalReceivables = receivables.reduce((sum, inv) => sum + inv.AmountDC, 0);
  const totalPayables = payables.reduce((sum, inv) => sum + inv.AmountDC, 0);

  await supabase.from("financial_snapshots").insert([
    {
      user_id: user.id,
      division: connection.division,
      snapshot_date: new Date().toISOString(),
      type: "receivables" as const,
      data: receivables,
    },
    {
      user_id: user.id,
      division: connection.division,
      snapshot_date: new Date().toISOString(),
      type: "payables" as const,
      data: payables,
    },
  ]);

  return NextResponse.json({
    receivables,
    payables,
    profitLoss,
    summary: {
      totalReceivables,
      totalPayables,
      netPosition: totalReceivables - totalPayables,
    },
  });
}
