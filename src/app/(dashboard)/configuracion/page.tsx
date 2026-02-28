import { getRequiredUser } from "@/lib/auth/user";
import { getCachedProfile, getCachedSettings } from "@/lib/queries";
import { ConfiguracionClient } from "@/components/configuracion/configuracion-client";
import type { Profile } from "@/types/database";

export default async function ConfiguracionPage() {
  const user = await getRequiredUser();

  const [profileData, settings] = await Promise.all([
    getCachedProfile(user.id),
    getCachedSettings(user.id),
  ]);

  const profile: Profile = profileData ?? {
    id: user.id,
    display_name: user.email?.split("@")[0] ?? "Usuario",
    email: user.email ?? "",
    avatar_url: null,
    currency: "MXN",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <ConfiguracionClient profile={profile} settings={settings} />;
}
