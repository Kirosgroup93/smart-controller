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

export async function GET(request: NextRequest) {
  const conn = await getConnection();
  if (!conn) return NextResponse.json({ error: "Niet geautoriseerd of geen Exact verbinding" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const exact = createExactClient(conn.access_token, conn.division);
  const filter = status && status !== "all" ? `Status eq ${status}` : undefined;

  const response = await exact.get("/purchaseorder/PurchaseInvoices", {
    params: {
      ...(filter ? { $filter: filter } : {}),
      $select: "ID,InvoiceID,InvoiceNumber,InvoiceDate,DueDate,Description,AmountDC,VATAmountDC,AmountDCExclVAT,Status,SupplierName,YourRef",
      $orderby: "InvoiceDate desc",
      $top: 100,
    },
  });

  return NextResponse.json(response.data.d.results);
}

export async function POST(request: NextRequest) {
  const conn = await getConnection();
  if (!conn) return NextResponse.json({ error: "Niet geautoriseerd of geen Exact verbinding" }, { status: 401 });

  const body = await request.json();
  const exact = createExactClient(conn.access_token, conn.division);

  const payload: Record<string, unknown> = {
    InvoiceNumber: body.factuurnummer,
    Description: body.omschrijving || body.factuurnummer,
    Journal: body.dagboek ?? 70,
  };

  if (body.leverancier_id) payload.Supplier = body.leverancier_id;
  if (body.factuurdatum) payload.InvoiceDate = `/Date(${new Date(body.factuurdatum).getTime()})/`;
  if (body.vervaldatum) payload.DueDate = `/Date(${new Date(body.vervaldatum).getTime()})/`;
  if (body.bedrag_excl_btw != null) payload.AmountDCExclVAT = body.bedrag_excl_btw;
  if (body.btw_bedrag != null) payload.VATAmountDC = body.btw_bedrag;
  if (body.totaal_bedrag != null) payload.AmountDC = body.totaal_bedrag;

  try {
    const response = await exact.post("/purchaseorder/PurchaseInvoices", payload);
    return NextResponse.json(response.data.d);
  } catch (err: unknown) {
    const detail = (err as { response?: { data?: unknown } })?.response?.data;
    const msg = detail ? JSON.stringify(detail) : (err instanceof Error ? err.message : "Onbekende fout");
    console.error("Exact Online POST PurchaseInvoices:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
