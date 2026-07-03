import type { DashboardSummary, PendingDebtor } from "@/types/database";
import { getInitials } from "@/lib/utils";
import { derivePaymentStatus } from "@/lib/payment-utils";
import {
  computePaymentSummaries,
  type PaymentInput,
} from "@/lib/compute-payment-summaries";

function getName(
  val: { name: string } | { name: string }[] | null | undefined,
): string {
  if (!val) return "—";
  if (Array.isArray(val)) return val[0]?.name ?? "—";
  return val.name;
}

export function computeDashboardFromPayments(
  payments: PaymentInput[],
  activeServiceIds: Set<string>,
  activeServiceMemberPairs: Set<string>,
  ownerId: string,
): { dashboard: DashboardSummary; pendingDebtors: PendingDebtor[] } {
  // Filter to active services and active member pairs only
  const filteredPayments = payments.filter((p) => {
    if (!activeServiceIds.has(p.service_id)) return false;
    const pairKey = `${p.member_id}:${p.service_id}`;
    if (!activeServiceMemberPairs.has(pairKey)) return false;
    return true;
  });

  const summaries = computePaymentSummaries(filteredPayments);

  let totalReceivable = 0;
  let totalCollected = 0;
  let overdueCount = 0;
  let totalAccumulatedDebt = 0;

  const serviceIds = new Set<string>();
  const memberIds = new Set<string>();

  for (const p of filteredPayments) {
    serviceIds.add(p.service_id);
    memberIds.add(p.member_id);
  }

  // Gauge totals: use latest cycle per pair (from summaries).
  // accumulated_debt solo del ciclo más reciente por par: cada fila ya
  // encadena el arrastre de las anteriores, sumarlas todas duplica.
  for (const [, s] of summaries) {
    const p = s.latestPayment;
    const accDebt = Number(p.accumulated_debt ?? 0);
    if (accDebt > 0) totalAccumulatedDebt += accDebt;
    const obligation = Number(p.amount_due ?? 0) + accDebt;
    totalReceivable += obligation;
    totalCollected += s.totalCollected;
    if (derivePaymentStatus(p) === "overdue") overdueCount++;
  }

  // Pending debtors: use accumulated debt from all cycles
  const pendingDebtors: PendingDebtor[] = [];
  for (const [key, s] of summaries) {
    if (s.totalDebt <= 0) continue;
    if (s.status === "confirmed" || s.status === "paid") continue;
    const p = s.latestPayment;
    const memberName = getName(p.members);
    const [memberId] = key.split(":");
    pendingDebtors.push({
      id: p.id,
      name: memberName,
      initials: getInitials(memberName),
      status: s.status === "overdue" ? "overdue" : "pending",
      amount: s.totalDebt,
      serviceName: getName(p.services),
    });
    // Ensure member/service IDs are tracked even if filtered above
    if (memberId) memberIds.add(memberId);
  }

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
