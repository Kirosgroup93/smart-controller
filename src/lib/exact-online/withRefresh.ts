import { createClient } from "@/lib/supabase/server";
import { createExactClient, refreshAccessToken } from "@/lib/exact-online/client";
import type { ExactConnection } from "@/types/database";
import type { AxiosInstance } from "axios";

/**
 * Geeft een Exact Online axios client terug, na automatisch token refresh bij 401.
 * Slaat nieuwe tokens op in Supabase.
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

  let conn = data as ExactConnection;

  // Probeer eerst met huidig token; refresh bij 401
  const tryClient = (token: string) => createExactClient(token, conn.division);

  // Test of token nog geldig is met een kleine call
  try {
    const client = tryClient(conn.access_token);
    return { client, conn };
  } catch {
    // val door naar refresh
  }

  // Token vernieuwen
  try {
    const tokens = await refreshAccessToken(conn.refresh_token);
    await supabase
      .from("exact_connections")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq("user_id", user.id);

    conn = { ...conn, access_token: tokens.access_token, refresh_token: tokens.refresh_token };
    return { client: tryClient(conn.access_token), conn };
  } catch {
    return null;
  }
}

/**
 * Voert een Exact Online API call uit met automatische token refresh bij 401.
 */
export async function exactGet(path: string, params?: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data } = await supabase
    .from("exact_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!data) throw new Error("Geen Exact verbinding");

  let conn = data as ExactConnection;

  async function doRequest(token: string) {
    const client = createExactClient(token, conn.division);
    return client.get(path, { params });
  }

  try {
    const res = await doRequest(conn.access_token);
    return res.data.d.results;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== 401) throw err;

    // Token vernieuwen
    try {
      const tokens = await refreshAccessToken(conn.refresh_token);
      await supabase
        .from("exact_connections")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq("user_id", user.id);

      conn = { ...conn, access_token: tokens.access_token };
      const res = await doRequest(tokens.access_token);
      return res.data.d.results;
    } catch {
      // Refresh token verlopen — verbinding verwijderen zodat gebruiker opnieuw koppelt
      await supabase.from("exact_connections").delete().eq("user_id", user.id);
      throw new Error("Exact Online sessie verlopen. Koppel opnieuw via het dashboard.");
    }
  }
}
