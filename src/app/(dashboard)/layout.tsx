import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { GaugeCard } from "@/components/dashboard/gauge-card";
import { getRequiredUser } from "@/lib/auth/user";
import {
  getCachedProfile,
  getCachedDashboardSummary,
  getCachedPendingDebtors,
  getCachedServices,
  getCachedCommandPersonas,
  getCachedMyPayments,
} from "@/lib/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getRequiredUser();

  const [profile, dashboard, pendingDebtors, services, personas, myPayments] =
    await Promise.all([
      getCachedProfile(user.id),
      getCachedDashboardSummary(user.id),
      getCachedPendingDebtors(user.id),
      getCachedServices(user.id),
      getCachedCommandPersonas(user.id),
      getCachedMyPayments(user.id),
    ]);

  if (!profile) redirect("/login");

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
          <GaugeCard dashboard={dashboard} pendingDebtors={pendingDebtors} />
        </aside>
        <main className="flex-1 lg:ml-85">{children}</main>
      </div>
    </AppShell>
  );
}
