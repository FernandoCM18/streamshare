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

/**
 * Neto propio del ciclo: cuota del mes menos lo cubierto, SIN accumulated_debt.
 * accumulated_debt es solo el arrastre de ciclos anteriores (ya contados como
 * filas propias), así que incluirlo al sumar varios ciclos duplica la deuda.
 * Puede ser negativo (sobrepago) para compensar otros ciclos al sumar.
 */
function cycleNet(p: PaymentInput): number {
  return (
    Number(p.amount_due ?? 0) -
    Number(p.amount_paid ?? 0) -
    Number(p.credit_amount_used ?? 0)
  );
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
 * - totalDebt: real net debt across all cycles. Suma el neto propio de cada
 *   ciclo (sin accumulated_debt, que duplicaría el arrastre encadenado) más
 *   el arrastre del ciclo más antiguo visible (deuda previa a la ventana).
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

  // Net debt per pair: sum of per-cycle nets (can offset overpayments) plus
  // the carry entering the window (accumulated_debt of the OLDEST cycle, which
  // represents debt from cycles not present in the input). Counting the carry
  // of every row would duplicate the chained debt. Clamped to >= 0 at the end.
  const netByPair = new Map<string, number>();
  const oldestByPair = new Map<string, { period: string; carry: number }>();

  for (const p of payments) {
    const key = `${p.member_id}:${p.service_id}`;
    const derived = derivePaymentStatus(p);
    const remaining = paymentRemaining(p);
    const ps = periodStart(p);
    const isLatestCycle = ps === (latestPeriodByPair.get(key) ?? "");

    netByPair.set(key, (netByPair.get(key) ?? 0) + cycleNet(p));
    const oldest = oldestByPair.get(key);
    if (!oldest || ps < oldest.period) {
      oldestByPair.set(key, {
        period: ps,
        carry: Number(p.accumulated_debt ?? 0),
      });
    }

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
        totalDebt: 0,
        totalCollected: collected,
        status: derived as PairSummary["status"],
        latestPayment: p,
      });
    } else {
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

  for (const [key, net] of netByPair) {
    const summary = map.get(key);
    if (summary) {
      const carryIn = oldestByPair.get(key)?.carry ?? 0;
      summary.totalDebt = Math.max(
        0,
        Math.round((net + carryIn) * 100) / 100,
      );
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
