import type { DashboardSummary, PendingDebtor } from "@/types/database";
import type { MemberPayment } from "@/components/dashboard/service-card-utils";
import { getInitials } from "@/lib/utils";

/**
 * Compute dashboard summary and pending debtors from a single payments array.
 * This replaces the `dashboard_summary` Supabase view and `getCachedPendingDebtors`
 * to guarantee all numbers in the UI come from the same data source.
 */
export function computeDashboardFromPayments(
  payments: MemberPayment[],
  activeServiceIds: Set<string>,
  activeServiceMemberPairs: Set<string>,
  ownerId: string,
): { dashboard: DashboardSummary; pendingDebtors: PendingDebtor[] } {
  let totalReceivable = 0;
  let totalCollected = 0;
  let overdueCount = 0;
  let totalAccumulatedDebt = 0;

  const serviceIds = new Set<string>();
  const memberIds = new Set<string>();

  // Pending debtors tracking (deduplicated by member+service)
  const debtorSeen = new Set<string>();
  const pendingDebtors: PendingDebtor[] = [];

  for (const p of payments) {
    // Skip payments for inactive services
    if (!activeServiceIds.has(p.service_id)) continue;

    // Skip payments for inactive service members
    const pairKey = `${p.member_id}:${p.service_id}`;
    if (!activeServiceMemberPairs.has(pairKey)) continue;

    serviceIds.add(p.service_id);
    memberIds.add(p.member_id);

    const amountDue = p.amount_due ?? 0;
    const amountPaid = p.amount_paid ?? 0;
    const accDebt = p.accumulated_debt ?? 0;
    const fullOwed = amountDue + accDebt;

    // Every payment contributes to receivable (what was expected)
    totalReceivable += fullOwed;

    if (p.status === "confirmed") {
      // Confirmed = owner verified receipt → counts as collected
      totalCollected += amountPaid;
    } else if (p.status === "paid") {
      // Paid = member says they paid, owner hasn't confirmed
      // Count partial collection (amount_paid) as collected for gauge accuracy
      totalCollected += amountPaid;
    } else {
      // pending, partial, overdue → count any partial payments
      totalCollected += amountPaid;
    }

    if (p.status === "overdue") {
      overdueCount++;
    }

    if (accDebt > 0) {
      totalAccumulatedDebt += accDebt;
    }

    // Build pending debtors list (only pending/partial/overdue)
    if (
      (p.status === "pending" ||
        p.status === "partial" ||
        p.status === "overdue") &&
      !debtorSeen.has(pairKey)
    ) {
      debtorSeen.add(pairKey);
      const memberName = p.members?.name ?? "—";

      pendingDebtors.push({
        id: p.id,
        name: memberName,
        initials: getInitials(memberName),
        status:
          p.status === "overdue" ? ("overdue" as const) : ("pending" as const),
        amount: amountDue - amountPaid + accDebt,
        serviceName: p.services?.name ?? "—",
      });
    }
  }

  // Sort: overdue first, then by amount descending
  pendingDebtors.sort((a, b) => {
    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (a.status !== "overdue" && b.status === "overdue") return 1;
    return b.amount - a.amount;
  });

  const dashboard: DashboardSummary = {
    owner_id: ownerId,
    total_services: serviceIds.size,
    total_members: memberIds.size,
    total_month_receivable: totalReceivable,
    total_month_collected: totalCollected,
    overdue_count: overdueCount,
    total_accumulated_debt: totalAccumulatedDebt,
  };

  return { dashboard, pendingDebtors: pendingDebtors.slice(0, 10) };
}
