import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfiguracionClient } from "@/components/configuracion/configuracion-client";
import type { Profile, UserSettings } from "@/types/database";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_settings").select("*").eq("id", user.id).single(),
  ]);

  const userProfile: Profile = profile ?? {
    id: user.id,
    display_name:
      user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "",
    email: user.email ?? "",
    avatar_url: user.user_metadata?.avatar_url ?? null,
    currency: "MXN",
    created_at: user.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const userSettings: UserSettings = settings ?? {
    id: user.id,
    notify_before_days: 3,
    notify_overdue: true,
    default_currency: "MXN",
    auto_generate_cycles: true,
    updated_at: new Date().toISOString(),
  };

  return <ConfiguracionClient profile={userProfile} settings={userSettings} />;
}
