import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { GaugeCard } from "@/components/dashboard/gauge-card";
import { getRequiredUser } from "@/lib/auth/user";
import {
  getCachedProfile,
  getCachedServices,
  getCachedMyPayments,
  getCachedPersonasData,
  getCachedPayments,
  getCachedActiveServiceMembers,
  cleanupOrphanedPayments,
} from "@/lib/queries";
import { computeDashboardFromPayments } from "@/lib/compute-dashboard";
import { buildPersonaCards } from "@/lib/build-persona-cards";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getRequiredUser();

  // Clean up orphaned payments from previously removed members
  await cleanupOrphanedPayments(user.id);

  const [profile, services, personasData, myPayments, payments, activeMembers] =
    await Promise.all([
      getCachedProfile(user.id),
      getCachedServices(user.id),
      getCachedPersonasData(user.id),
      getCachedMyPayments(user.id),
      getCachedPayments(user.id),
      getCachedActiveServiceMembers(user.id),
    ]);

  // Compute dashboard summary + pending debtors from the SAME payments data
  // that powers the service cards. This eliminates data discrepancies.
  const activeServiceIds = new Set(
    services.filter((s) => s.status === "active").map((s) => s.id),
  );
  const activeServiceMemberPairs = new Set(
    activeMembers.map((m) => `${m.member_id}:${m.service_id}`),
  );
  const { dashboard, pendingDebtors } = computeDashboardFromPayments(
    payments,
    activeServiceIds,
    activeServiceMemberPairs,
    user.id,
  );

  if (!profile) redirect("/login");

  // Build full PersonaCardData for command palette detail modals
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
          <GaugeCard dashboard={dashboard} pendingDebtors={pendingDebtors} />
        </aside>
        <main className="flex-1 lg:ml-85">{children}</main>
      </div>
    </AppShell>
  );
}
