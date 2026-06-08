import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/inkoop/pdf-links?factuurnummer=12345
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const factuurnummer = new URL(req.url).searchParams.get("factuurnummer");
  if (!factuurnummer) return NextResponse.json({ error: "Geen factuurnummer" }, { status: 400 });

  const { data, error } = await supabase
    .from("factuur_pdf_links")
    .select("pdf_path, created_at")
    .eq("user_id", user.id)
    .eq("factuurnummer", factuurnummer)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/inkoop/pdf-links  { factuurnummer, pdfPath }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { factuurnummer, pdfPath } = await req.json() as { factuurnummer: string; pdfPath: string };
  if (!factuurnummer || !pdfPath) return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });

  const { error } = await supabase
    .from("factuur_pdf_links")
    .upsert({ user_id: user.id, factuurnummer, pdf_path: pdfPath }, { onConflict: "user_id,factuurnummer,pdf_path" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
