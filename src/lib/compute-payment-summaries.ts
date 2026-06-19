import { paymentRemaining, derivePaymentStatus } from "@/lib/payment-utils";

export interface PaymentInput {
  id: string;
  member_id: string;
  service_id: string;
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number;
  credit_amount_used?: number;
  status: string;
  requires_confirmation?: boolean;
  confirmed_at?: string | null;
  paid_at?: string | null;
  due_date?: string;
  created_at?: string;
  billing_cycles?:
    | { period_start: string }
    | { period_start: string }[]
    | null;
  members?: { name: string } | { name: string }[] | null;
  services?: { name: string } | { name: string }[] | null;
}

export interface PairSummary {
  /** Total remaining across ALL open cycles for this member+service pair. */
  totalDebt: number;
  /** Total collected in the most recent cycle. */
  totalCollected: number;
  /** Worst derived status across all open cycles. */
  status: "overdue" | "partial" | "pending" | "paid" | "confirmed";
  /** Most recent payment (by period_start) for display purposes. */
  latestPayment: PaymentInput;
}

function periodStart(p: PaymentInput): string {
  const bc = p.billing_cycles;
  if (!bc) return p.created_at ?? "";
  const o = Array.isArray(bc) ? bc[0] : bc;
  return o?.period_start ?? p.created_at ?? "";
}

const STATUS_RANK: Record<string, number> = {
  overdue: 4,
  partial: 3,
  pending: 2,
  paid: 1,
  confirmed: 0,
};

/**
 * Single source of truth for payment summaries across the whole app.
 *
 * Returns a Map keyed by "memberId:serviceId" with:
 * - totalDebt: sum of paymentRemaining() across ALL open cycles
 * - totalCollected: amount collected in the most recent cycle
 * - status: worst status across all open cycles
 * - latestPayment: most recent payment by period_start (for display/actions)
 *
 * Use this in server components (page.tsx) and pass results as props.
 * Never recompute summaries in individual UI components.
 */
export function computePaymentSummaries(
  payments: PaymentInput[],
): Map<string, PairSummary> {
  const map = new Map<string, PairSummary>();

  // Find latest period_start per pair for collected calculation
  const latestPeriodByPair = new Map<string, string>();
  for (const p of payments) {
    const key = `${p.member_id}:${p.service_id}`;
    const ps = periodStart(p);
    const cur = latestPeriodByPair.get(key) ?? "";
    if (ps > cur) latestPeriodByPair.set(key, ps);
  }

  for (const p of payments) {
    const key = `${p.member_id}:${p.service_id}`;
    const derived = derivePaymentStatus(p);
    const remaining = paymentRemaining(p);
    const ps = periodStart(p);
    const isLatestCycle = ps === (latestPeriodByPair.get(key) ?? "");

    const existing = map.get(key);

    if (!existing) {
      // Collected only from latest cycle
      const collected = isLatestCycle
        ? Math.max(
            0,
            Number(p.amount_due ?? 0) +
              Number(p.accumulated_debt ?? 0) -
              remaining,
          )
        : 0;

      map.set(key, {
        totalDebt: remaining,
        totalCollected: collected,
        status: derived as PairSummary["status"],
        latestPayment: p,
      });
    } else {
      // Accumulate debt from all open cycles
      existing.totalDebt = Math.round((existing.totalDebt + remaining) * 100) / 100;

      // Collected only from latest cycle
      if (isLatestCycle) {
        existing.totalCollected = Math.max(
          0,
          Number(p.amount_due ?? 0) +
            Number(p.accumulated_debt ?? 0) -
            remaining,
        );
      }

      // Escalate to worst status
      if ((STATUS_RANK[derived] ?? 0) > (STATUS_RANK[existing.status] ?? 0)) {
        existing.status = derived as PairSummary["status"];
      }

      // Keep most recent payment for display
      if (ps > periodStart(existing.latestPayment)) {
        existing.latestPayment = p;
      }
    }
  }

  return map;
}

/** Total debt for a specific member across all services. */
export function memberTotalDebt(
  summaries: Map<string, PairSummary>,
  memberId: string,
): number {
  let total = 0;
  for (const [key, s] of summaries) {
    if (key.startsWith(`${memberId}:`)) total += s.totalDebt;
  }
  return Math.round(total * 100) / 100;
}

/** Total pending across all pairs for a specific service. */
export function serviceTotalPending(
  summaries: Map<string, PairSummary>,
  serviceId: string,
): number {
  let total = 0;
  for (const [key, s] of summaries) {
    if (key.endsWith(`:${serviceId}`)) total += s.totalDebt;
  }
  return Math.round(total * 100) / 100;
}

/** Total collected in current cycle for a specific service. */
export function serviceTotalCollected(
  summaries: Map<string, PairSummary>,
  serviceId: string,
): number {
  let total = 0;
  for (const [key, s] of summaries) {
    if (key.endsWith(`:${serviceId}`)) total += s.totalCollected;
  }
  return Math.round(total * 100) / 100;
}
