import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import type { ExactConnection } from "@/types/database";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: connectionData } = await supabase
    .from("exact_connections")
    .select("division, expires_at")
    .eq("user_id", user.id)
    .single();

  const connection = connectionData as Pick<ExactConnection, "division" | "expires_at"> | null;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navbar
        email={user.email ?? ""}
        hasConnection={!!connection}
        division={connection?.division}
      />
      {children}
    </div>
  );
}
