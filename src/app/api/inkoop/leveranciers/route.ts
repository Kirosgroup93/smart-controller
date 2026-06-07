import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createExactClient } from "@/lib/exact-online/client";
import type { ExactConnection } from "@/types/database";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("exact_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data) return NextResponse.json({ error: "Geen Exact verbinding" }, { status: 404 });

  const conn = data as ExactConnection;
  const exact = createExactClient(conn.access_token, conn.division);

  const response = await exact.get("/crm/Accounts", {
    params: {
      $filter: "IsSupplier eq true",
      $select: "ID,Name,Code",
      $orderby: "Name asc",
      $top: 250,
    },
  });

  return NextResponse.json(response.data.d.results);
}
