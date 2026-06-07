import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const BUCKET = "facturen";

// GET /api/inkoop/importeren/pdf?path=user_id/bestand.pdf
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = new URL(request.url).searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Geen pad" }, { status: 400 });

  // Gebruiker mag alleen eigen bestanden openen
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Verboden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Niet gevonden" }, { status: 404 });
  }

  const bytes = await data.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${path.split("/").pop()}"`,
    },
  });
}
