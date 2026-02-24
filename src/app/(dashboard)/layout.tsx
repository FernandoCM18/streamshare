import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { BottomDock } from "@/components/dashboard/bottom-dock";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ??
    user.user_metadata?.display_name ??
    user.email?.split("@")[0] ??
    "Usuario";
  const avatarUrl =
    profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;
  const email = user.email ?? "";

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-[1600px] h-[92vh] rounded-[2.5rem] border border-neutral-800/60 bg-neutral-950/95 vertical-lines overflow-hidden flex flex-col">
        <Header displayName={displayName} avatarUrl={avatarUrl} email={email} />
        <div className="flex-1 flex flex-col overflow-hidden lg:grid lg:grid-cols-12">
          <aside className="col-span-12 lg:col-span-3 border-b border-neutral-800/30 p-4 lg:border-b-0 lg:border-r lg:overflow-y-auto lg:p-6">
            <Sidebar />
          </aside>
          <main className="col-span-12 lg:col-span-9 flex-1 overflow-y-auto p-6 pb-24 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      <BottomDock />
    </div>
  );
}
