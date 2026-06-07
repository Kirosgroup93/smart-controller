import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exactGet } from "@/lib/exact-online/withRefresh";
import type { ExactConnection } from "@/types/database";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connData } = await supabase
    .from("exact_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!connData) return NextResponse.json({ error: "Exact Online not connected" }, { status: 404 });

  const conn = connData as ExactConnection;

  try {
    const [receivablesRaw, payablesRaw] = await Promise.all([
      exactGet("/read/financial/ReceivablesList", {
        $select: "HID,AccountName,Amount,Description,DueDate,EntryNumber,YourRef",
        $orderby: "DueDate asc",
        $top: 100,
      }),
      exactGet("/read/financial/PayablesList", {
        $select: "HID,AccountName,Amount,Description,DueDate,EntryNumber,YourRef",
        $orderby: "DueDate asc",
        $top: 100,
      }),
    ]);

    const mapInvoice = (r: Record<string, unknown>) => ({
      InvoiceID: String(r.HID ?? r.EntryNumber ?? ""),
      InvoiceNumber: Number(r.EntryNumber ?? 0),
      AccountName: String(r.AccountName ?? ""),
      AmountDC: Number(r.Amount ?? 0),
      DueDate: String(r.DueDate ?? ""),
      YourRef: String(r.YourRef ?? ""),
    });

    const receivables = (receivablesRaw ?? []).map(mapInvoice);
    const payables = (payablesRaw ?? []).map(mapInvoice);

    const totalReceivables = receivables.reduce((s: number, i: { AmountDC: number }) => s + i.AmountDC, 0);
    const totalPayables = payables.reduce((s: number, i: { AmountDC: number }) => s + i.AmountDC, 0);

    // Sla snapshot op (fire-and-forget)
    supabase.from("financial_snapshots").insert([
      { user_id: user.id, division: conn.division, snapshot_date: new Date().toISOString(), type: "receivables", data: receivables },
      { user_id: user.id, division: conn.division, snapshot_date: new Date().toISOString(), type: "payables", data: payables },
    ]).then(() => {}).catch(() => {});

    return NextResponse.json({
      receivables,
      payables,
      summary: { totalReceivables, totalPayables, netPosition: totalReceivables - totalPayables },
    });
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? "Fout bij ophalen data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
