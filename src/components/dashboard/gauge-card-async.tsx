import { getRequiredUser } from "@/lib/auth/user";
import {
  getCachedServices,
  getCachedPaymentsLite,
  getCachedActiveServiceMembers,
} from "@/lib/queries";
import { computeDashboardFromPayments } from "@/lib/compute-dashboard";
import { GaugeCard } from "@/components/dashboard/gauge-card";

/**
 * Async Server Component that independently fetches gauge data.
 * Designed to be wrapped in <Suspense> so the shell streams first.
 */
export async function GaugeCardAsync() {
  const user = await getRequiredUser();

  const [services, payments, activeMembers] = await Promise.all([
    getCachedServices(user.id),
    getCachedPaymentsLite(user.id),
    getCachedActiveServiceMembers(user.id),
  ]);

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

  return <GaugeCard dashboard={dashboard} pendingDebtors={pendingDebtors} />;
}
