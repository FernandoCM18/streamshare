import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { GaugeCard } from "@/components/dashboard/gauge-card";
import { getRequiredUser } from "@/lib/auth/user";
import {
  getCachedProfile,
  getCachedDashboardSummary,
  getCachedPendingDebtors,
  getCachedServices,
  getCachedMyPayments,
  getCachedPersonasData,
  cleanupOrphanedPayments,
} from "@/lib/queries";
import type { PersonaCardData } from "@/components/personas/persona-card";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getRequiredUser();

  // Clean up orphaned payments from previously removed members
  await cleanupOrphanedPayments(user.id);

  const [profile, dashboard, pendingDebtors, services, personasData, myPayments] =
    await Promise.all([
      getCachedProfile(user.id),
      getCachedDashboardSummary(user.id),
      getCachedPendingDebtors(user.id),
      getCachedServices(user.id),
      getCachedPersonasData(user.id),
      getCachedMyPayments(user.id),
    ]);

  if (!profile) redirect("/login");

  // Build full PersonaCardData for command palette detail modals
  const svcMap = new Map(personasData.services.map((s) => [s.id, s]));
  const personas: PersonaCardData[] = personasData.members.map((m) => {
    const memberServices = personasData.serviceMembers
      .filter((sm) => sm.member_id === m.id)
      .map((sm) => {
        const svc = svcMap.get(sm.service_id);
        const latestPayment = personasData.payments.find(
          (p) => p.member_id === m.id && p.service_id === sm.service_id,
        );
        const memberCount = personasData.serviceMembers.filter(
          (s) => s.service_id === sm.service_id,
        ).length;
        return {
          service_id: sm.service_id,
          service_name: svc?.name ?? "—",
          service_color: svc?.color ?? "#6366f1",
          service_icon: svc?.icon_url ?? null,
          amount_due:
            sm.custom_amount ??
            (svc?.monthly_cost ?? 0) / Math.max(memberCount, 1),
          status: latestPayment?.status ?? null,
        };
      });

    const memberPayments = personasData.payments.filter(
      (p) =>
        p.member_id === m.id &&
        ["pending", "overdue", "partial"].includes(p.status),
    );
    const totalDebt = memberPayments.reduce(
      (sum, p) => sum + (p.amount_due - p.amount_paid + p.accumulated_debt),
      0,
    );
    const monthlyAmount = memberServices.reduce(
      (sum, s) => sum + s.amount_due,
      0,
    );

    return {
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      avatar_url: m.avatar_url,
      profile_id: m.profile_id,
      services: memberServices,
      total_debt: totalDebt,
      monthly_amount: monthlyAmount,
    };
  });

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
