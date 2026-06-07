import { NextResponse } from "next/server";
import { exactGet } from "@/lib/exact-online/withRefresh";

export async function GET() {
  const endpoints = [
    { path: "/read/financial/PayablesList", params: { $top: 3 } },
    { path: "/read/financial/ReceivablesList", params: { $top: 3 } },
    { path: "/crm/Accounts", params: { $filter: "IsSupplier eq true", $top: 3, $select: "ID,Name,Code" } },
    { path: "/financial/GLAccounts", params: { $top: 3, $select: "ID,Code,Description" } },
    { path: "/hrm/CostCenters", params: { $top: 3, $select: "ID,Code,Description" } },
  ];

  const results: Record<string, unknown> = {};
  for (const ep of endpoints) {
    try {
      const data = await exactGet(ep.path, ep.params);
      results[ep.path] = { count: data?.length, sample: data?.slice(0, 2) };
    } catch (e: unknown) {
      results[ep.path] = { error: (e as Error)?.message };
    }
  }
  return NextResponse.json(results);
}
