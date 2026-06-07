import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const BUCKET = "facturen";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET: lijst geüploade bestanden voor de ingelogde gebruiker
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).list(user.id, {
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bestanden = (data ?? []).map((f) => ({
    name: f.name,
    path: `${user.id}/${f.name}`,
    size: f.metadata?.size ?? 0,
    created_at: f.created_at,
  }));

  return NextResponse.json(bestanden);
}

// POST: upload één of meerdere PDF's
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "Geen bestanden ontvangen" }, { status: 400 });

  const admin = createAdminClient();
  const results = [];

  for (const file of files) {
    if (file.type !== "application/pdf") {
      results.push({ name: file.name, error: "Alleen PDF's toegestaan" });
      continue;
    }

    const bytes = await file.arrayBuffer();
    const uniek = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const path = `${user.id}/${uniek}`;

    const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });

    if (error) {
      results.push({ name: file.name, error: error.message });
    } else {
      results.push({ name: file.name, path, size: file.size });
    }
  }

  return NextResponse.json(results);
}

// DELETE: verwijder een bestand op basis van ?path=
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = new URL(request.url).searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Geen pad opgegeven" }, { status: 400 });

  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Verboden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
