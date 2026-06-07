import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createExactClient } from "@/lib/exact-online/client";
import type { ExactConnection } from "@/types/database";

async function getConnection() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("exact_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data as ExactConnection | null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const conn = await getConnection();
  if (!conn) return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const exact = createExactClient(conn.access_token, conn.division);

  const payload: Record<string, unknown> = {};
  if (body.factuurnummer !== undefined) payload.InvoiceNumber = body.factuurnummer;
  if (body.factuurdatum !== undefined) payload.InvoiceDate = `/Date(${new Date(body.factuurdatum).getTime()})/`;
  if (body.vervaldatum !== undefined) payload.DueDate = `/Date(${new Date(body.vervaldatum).getTime()})/`;
  if (body.omschrijving !== undefined) payload.Description = body.omschrijving;
  if (body.bedrag_excl_btw !== undefined) payload.AmountDCExclVAT = body.bedrag_excl_btw;
  if (body.btw_bedrag !== undefined) payload.VATAmountDC = body.btw_bedrag;
  if (body.totaal_bedrag !== undefined) payload.AmountDC = body.totaal_bedrag;

  await exact.put(`/purchaseorder/PurchaseInvoices(guid'${id}')`, payload);
  return NextResponse.json({ success: true });
}
