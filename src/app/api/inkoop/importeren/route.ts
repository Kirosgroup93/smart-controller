import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "facturen-import";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function ensureBucket(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 20971520 });
  }
}

// GET: lijst geüploade bestanden voor de ingelogde gebruiker
export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureBucket(supabase);

  const { data, error } = await supabase.storage.from(BUCKET).list(user.id, {
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
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureBucket(supabase);

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "Geen bestanden ontvangen" }, { status: 400 });

  const results = [];
  for (const file of files) {
    if (file.type !== "application/pdf") {
      results.push({ name: file.name, error: "Alleen PDF's toegestaan" });
      continue;
    }

    const bytes = await file.arrayBuffer();
    const uniek = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const path = `${user.id}/${uniek}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
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
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = new URL(request.url).searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Geen pad opgegeven" }, { status: 400 });

  // Zorg dat gebruiker alleen eigen bestanden kan verwijderen
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Verboden" }, { status: 403 });
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
