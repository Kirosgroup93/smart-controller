import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createExactClient } from "@/lib/exact-online/client";
import type { ExactConnection } from "@/types/database";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("exact_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!data) return NextResponse.json({ error: "Geen verbinding" }, { status: 404 });

  const conn = data as ExactConnection;
  const exact = createExactClient(conn.access_token, conn.division);
  const { id } = await params;

  try {
    // Zoek het document gekoppeld aan de inkoopfactuur
    const docsRes = await exact.get("/documents/DocumentAttachments", {
      params: {
        $filter: `Attachment eq guid'${id}'`,
        $select: "ID,FileName,FileSize",
        $top: 1,
      },
    });

    const results = docsRes.data?.d?.results ?? [];
    if (!results.length) {
      return NextResponse.json({ error: "Geen document gevonden" }, { status: 404 });
    }

    const docId = results[0].ID;

    // Download de bytes
    const fileRes = await exact.get(`/documents/DocumentAttachments(guid'${docId}')`, {
      params: { $select: "Attachment" },
      responseType: "arraybuffer",
    });

    return new NextResponse(fileRes.data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${results[0].FileName ?? "factuur.pdf"}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Document niet beschikbaar" }, { status: 404 });
  }
}
