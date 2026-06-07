import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentDivision } from "@/lib/exact-online/queries";
import { exchangeCodeForTokens } from "@/lib/exact-online/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${error ?? "no_code"}`, request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const division = await getCurrentDivision(tokens.access_token);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase.from("exact_connections").upsert({
      user_id: user.id,
      division,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    }, { onConflict: "user_id" });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("Exact Online OAuth callback error:", err);
    return NextResponse.redirect(new URL("/dashboard?error=oauth_failed", request.url));
  }
}
