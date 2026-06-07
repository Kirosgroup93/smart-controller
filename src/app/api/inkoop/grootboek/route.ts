import { NextResponse } from "next/server";
import { exactGet } from "@/lib/exact-online/withRefresh";

export async function GET() {
  try {
    const results = await exactGet("/financial/GLAccounts", {
      $select: "ID,Code,Description,Type,TypeDescription",
      $orderby: "Code asc",
      $top: 500,
    });
    return NextResponse.json(results ?? []);
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? "Fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
