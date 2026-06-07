import { NextResponse } from "next/server";
import { exactGet } from "@/lib/exact-online/withRefresh";

export async function GET() {
  try {
    const results = await exactGet("/crm/Accounts", {
      $select: "ID,Name,Code,VATNumber,IBAN,IsSupplier",
      $orderby: "Name asc",
      $top: 500,
    });
    // IsSupplier is niet filterbaar via OData — filter hier client-side
    const leveranciers = (results ?? []).filter(
      (r) => (r as Record<string, unknown>).IsSupplier === true
    );
    return NextResponse.json(leveranciers);
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? "Fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
