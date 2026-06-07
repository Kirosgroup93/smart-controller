import { NextResponse } from "next/server";
import { exactGet, exactPost } from "@/lib/exact-online/withRefresh";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { naam, code, btwNummer } = body as { naam: string; code?: string; btwNummer?: string };
    if (!naam?.trim()) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });

    const payload: Record<string, unknown> = {
      Name: naam.trim(),
      IsSupplier: true,
    };
    if (code?.trim()) payload.Code = code.trim();
    if (btwNummer?.trim()) payload.VATNumber = btwNummer.trim();

    const result = await exactPost("/crm/Accounts", payload);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: unknown }; message?: string };
    const detail = axiosErr?.response?.data ?? axiosErr?.message ?? "Fout";
    return NextResponse.json({ error: String(typeof detail === "object" ? JSON.stringify(detail) : detail) }, { status: 500 });
  }
}
