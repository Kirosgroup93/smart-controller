import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let email = "";
  let hasConnection = false;
  let division: number | undefined;

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    email = user.email ?? "";

    const { data: conn } = await supabase
      .from("exact_connections")
      .select("division")
      .eq("user_id", user.id)
      .maybeSingle();

    hasConnection = !!conn;
    division = conn?.division ?? undefined;
  } catch (e: unknown) {
    // Als het een redirect is, gooi hem door
    const msg = (e as Error)?.message ?? "";
    if (msg.includes("NEXT_REDIRECT")) throw e;
    // Anders gewoon doorgaan zonder verbinding
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navbar email={email} hasConnection={hasConnection} division={division} />
      {children}
    </div>
  );
}
