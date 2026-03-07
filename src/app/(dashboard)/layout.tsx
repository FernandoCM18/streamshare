import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { GaugeCardAsync } from "@/components/dashboard/gauge-card-async";
import { GaugeCardSkeleton } from "@/components/dashboard/gauge-card-skeleton";
import { getRequiredUser } from "@/lib/auth/user";
import {
  getCachedProfile,
  getCachedServices,
  getCachedMyPayments,
  getCachedPersonasData,
} from "@/lib/queries";
import { buildPersonaCards } from "@/lib/build-persona-cards";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getRequiredUser();

  const [profile, services, personasData, myPayments] = await Promise.all([
    getCachedProfile(user.id),
    getCachedServices(user.id),
    getCachedPersonasData(user.id),
    getCachedMyPayments(user.id),
  ]);

  if (!profile) redirect("/login");

  const personas = buildPersonaCards(personasData);

  return (
    <AppShell
      displayName={profile.display_name}
      avatarUrl={profile.avatar_url}
      email={profile.email}
      services={services}
      personas={personas}
      myPayments={myPayments}
    >
      <div className="m-5 flex flex-col gap-5 lg:flex-row">
        <aside className="w-full lg:fixed lg:top-19 lg:bottom-5 lg:w-80">
          <Suspense fallback={<GaugeCardSkeleton />}>
            <GaugeCardAsync />
          </Suspense>
        </aside>
        <main className="flex-1 lg:ml-85 pb-24">{children}</main>
      </div>
    </AppShell>
  );
}
