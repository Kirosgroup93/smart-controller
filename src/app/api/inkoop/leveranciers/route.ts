import { NextResponse } from "next/server";
import { exactGet } from "@/lib/exact-online/withRefresh";

export async function GET() {
  try {
    // Minimale request: alleen ID en Name, geen filter
    const results = await exactGet("/crm/Accounts", {
      $select: "ID,Name,Code,VATNumber",
      $top: 100,
    });
    return NextResponse.json(results ?? []);
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
    const detail = axiosErr?.response?.data ?? axiosErr?.message ?? "Fout";
    return NextResponse.json({ error: String(typeof detail === "object" ? JSON.stringify(detail) : detail) }, { status: 500 });
  }
}
