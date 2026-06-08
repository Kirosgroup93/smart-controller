import { NextRequest, NextResponse } from "next/server";
import { exactGet } from "@/lib/exact-online/withRefresh";
import { createClient } from "@/lib/supabase/server";
import { createExactClient } from "@/lib/exact-online/client";
import type { ExactConnection } from "@/types/database";

// GET /api/inkoop/factuur-pdf?hid=GUID
// Haalt de PDF-bijlage van een boeking op via Exact Online /docs/
export async function GET(req: NextRequest) {
  const hid = new URL(req.url).searchParams.get("hid");
  if (!hid) return NextResponse.json({ error: "Geen HID opgegeven" }, { status: 400 });

  try {
    // Zoek documenten gekoppeld aan deze boeking
    const docs = await exactGet("/docs/Documents", {
      $filter: `SubjectHID eq guid'${hid}'`,
      $select: "ID,Subject,Type,TypeDescription,Created",
      $top: 10,
    }) as Record<string, unknown>[];

    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: "Geen document gevonden bij deze factuur" }, { status: 404 });
    }

    // Pak het eerste document
    const docId = docs[0].ID as string;

    // Haal de bijlage(n) op voor dit document
    const attachments = await exactGet("/docs/DocumentAttachments", {
      $filter: `Document eq guid'${docId}'`,
      $select: "ID,Document,FileName,FileSize",
      $top: 5,
    }) as Record<string, unknown>[];

    if (!attachments || attachments.length === 0) {
      return NextResponse.json({ error: "Geen bijlage gevonden" }, { status: 404 });
    }

    const attachmentId = attachments[0].ID as string;
    const fileName = (attachments[0].FileName as string) ?? "factuur.pdf";

    // Download de bijlage als binair bestand via Exact Online
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: connData } = await supabase
      .from("exact_connections").select("*").eq("user_id", user.id).single();
    if (!connData) return NextResponse.json({ error: "Geen Exact verbinding" }, { status: 404 });

    const conn = connData as ExactConnection;
    const client = createExactClient(conn.access_token, conn.division);

    const response = await client.get(`/docs/DocumentAttachments(guid'${attachmentId}')`, {
      params: { $select: "Attachment" },
      responseType: "arraybuffer",
    });

    return new NextResponse(response.data as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? "Fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/inkoop/factuur-pdf/check?hid=GUID — geeft terug of er een document bestaat
export async function HEAD(req: NextRequest) {
  const hid = new URL(req.url).searchParams.get("hid");
  if (!hid) return new NextResponse(null, { status: 400 });

  try {
    const docs = await exactGet("/docs/Documents", {
      $filter: `SubjectHID eq guid'${hid}'`,
      $select: "ID",
      $top: 1,
    }) as unknown[];

    return new NextResponse(null, { status: docs?.length ? 200 : 404 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
