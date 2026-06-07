import { NextResponse } from "next/server";
import { exactGet } from "@/lib/exact-online/withRefresh";

export async function GET() {
  try {
    const results = await exactGet("/hrm/CostCenters", {
      $select: "ID,Code,Description",
      $orderby: "Code asc",
      $top: 250,
    });
    return NextResponse.json(results ?? []);
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? "Fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
