import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createExactClient, refreshAccessToken } from "@/lib/exact-online/client";
import type { ExactConnection } from "@/types/database";
import type { AxiosInstance } from "axios";

/**
 * Vernieuwt het access token als het binnen 2 minuten verloopt.
 * Slaat nieuwe tokens op in Supabase via de admin client.
 * Geeft een verse ExactConnection terug.
 */
async function ensureFreshToken(conn: ExactConnection, userId: string): Promise<ExactConnection> {
  const expiresAt = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;

  // Alleen refreshen als token daadwerkelijk verlopen is
  // Exact Online rate-limit: geen refresh als token nog geldig is
  if (expiresAt > Date.now()) return conn;

  // Proactief vernieuwen
  const tokens = await refreshAccessToken(conn.refresh_token);
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const admin = createAdminClient();
  await admin
    .from("exact_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: newExpiresAt,
    })
    .eq("user_id", userId);

  return {
    ...conn,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: newExpiresAt,
  };
}

/**
 * Voert een Exact Online API GET uit met automatische token refresh.
 * Vernieuwt proactief als token bijna verloopt, en retryeert bij 401.
 */
export async function exactGet(
  path: string,
  params?: Record<string, unknown>
): Promise<unknown[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data } = await supabase
    .from("exact_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!data) throw new Error("Geen Exact verbinding");

  // Proactief vernieuwen als token bijna verloopt
  let conn = await ensureFreshToken(data as ExactConnection, user.id);

  async function doRequest(token: string) {
    const client = createExactClient(token, conn.division);
    return client.get(path, { params });
  }

  try {
    const res = await doRequest(conn.access_token);
    return res.data?.d?.results ?? [];
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== 401) throw err;

    // Alsnog 401 — token toch verlopen, forceer refresh
    try {
      const tokens = await refreshAccessToken(conn.refresh_token);
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      const admin = createAdminClient();
      await admin.from("exact_connections").update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: newExpiresAt,
      }).eq("user_id", user.id);

      conn = { ...conn, access_token: tokens.access_token };
      const res = await doRequest(tokens.access_token);
      return res.data?.d?.results ?? [];
    } catch {
      throw new Error("EXACT_SESSION_EXPIRED");
    }
  }
}

/**
 * Geeft een Exact axios client terug met een vers access token.
 */
export async function getExactClient(): Promise<{ client: AxiosInstance; conn: ExactConnection } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("exact_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!data) return null;

  try {
    const conn = await ensureFreshToken(data as ExactConnection, user.id);
    const client = createExactClient(conn.access_token, conn.division);
    return { client, conn };
  } catch {
    return null;
  }
}
