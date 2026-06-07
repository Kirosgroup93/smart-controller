import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentDivision } from "@/lib/exact-online/queries";
import { exchangeCodeForTokens } from "@/lib/exact-online/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error || !code) {
    const msg = errorDescription ? encodeURIComponent(errorDescription) : (error ?? "no_code");
    return NextResponse.redirect(
      new URL(`/dashboard?error=${msg}`, request.url)
    );
  }

  try {
    // Stap 1: wissel de code in voor tokens
    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code);
    } catch (tokenErr: unknown) {
      const msg = tokenErr instanceof Error ? tokenErr.message : "token_exchange_failed";
      const detail = (tokenErr as { response?: { data?: unknown } })?.response?.data;
      console.error("Token exchange failed:", msg, detail);
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent("token_exchange: " + JSON.stringify(detail ?? msg))}`, request.url)
      );
    }

    // Stap 2: haal de divisie op
    let division: number;
    try {
      division = await getCurrentDivision(tokens.access_token);
    } catch (divErr: unknown) {
      const msg = divErr instanceof Error ? divErr.message : "division_lookup_failed";
      console.error("Division lookup failed:", msg);
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent("division: " + msg)}`, request.url)
      );
    }

    // Stap 3: controleer of de gebruiker nog ingelogd is
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("OAuth callback: geen actieve gebruikerssessie na redirect");
      return NextResponse.redirect(
        new URL("/login?error=session_lost", request.url)
      );
    }

    // Stap 4: sla tokens op in Supabase
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase.from("exact_connections").upsert({
      user_id: user.id,
      division,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Supabase upsert failed:", upsertError.message);
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent("db: " + upsertError.message)}`, request.url)
      );
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("Exact Online OAuth callback onverwachte fout:", msg);
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent("oauth_failed: " + msg)}`, request.url)
    );
  }
}
