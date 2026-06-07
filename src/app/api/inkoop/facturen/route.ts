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

// GET: haal inkoopfacturen op uit Exact Online
export async function GET(request: NextRequest) {
  const conn = await getConnection();
  if (!conn) return NextResponse.json({ error: "Niet geautoriseerd of geen Exact verbinding" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const exact = createExactClient(conn.access_token, conn.division);

  const filter = status && status !== "all"
    ? `Status eq ${status}`
    : undefined;

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

// POST: boek een nieuwe inkoopfactuur in Exact Online
export async function POST(request: NextRequest) {
  const conn = await getConnection();
  if (!conn) return NextResponse.json({ error: "Niet geautoriseerd of geen Exact verbinding" }, { status: 401 });

  const body = await request.json();
  const exact = createExactClient(conn.access_token, conn.division);

  const payload = {
    InvoiceNumber: body.factuurnummer,
    InvoiceDate: body.factuurdatum ? `/Date(${new Date(body.factuurdatum).getTime()})/` : undefined,
    DueDate: body.vervaldatum ? `/Date(${new Date(body.vervaldatum).getTime()})/` : undefined,
    Description: body.omschrijving,
    AmountDCExclVAT: body.bedrag_excl_btw,
    VATAmountDC: body.btw_bedrag,
    AmountDC: body.totaal_bedrag,
    SupplierName: body.leveranciersnaam,
    YourRef: body.factuurnummer,
  };

  const response = await exact.post("/purchaseorder/PurchaseInvoices", payload);
  return NextResponse.json(response.data.d);
}
