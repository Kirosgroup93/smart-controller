import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthorizationUrl, refreshAccessToken } from "@/lib/exact-online/client";
import type { ExactConnection } from "@/types/database";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = crypto.randomUUID();
  const authUrl = getAuthorizationUrl(state);

  return NextResponse.redirect(authUrl);
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connection } = await supabase
    .from("exact_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!connection) {
    return NextResponse.json({ error: "No Exact connection found" }, { status: 404 });
  }

  const conn = connection as ExactConnection;
  const expiresAt = new Date(conn.expires_at);

  if (expiresAt > new Date()) {
    return NextResponse.json({ access_token: conn.access_token });
  }

  const tokens = await refreshAccessToken(conn.refresh_token);
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from("exact_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: newExpiresAt,
    })
    .eq("user_id", user.id);

  return NextResponse.json({ access_token: tokens.access_token });
}
