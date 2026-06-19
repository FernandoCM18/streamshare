import type { PaymentStatus } from "@/types/database";

// ── Core payment calculations ─────────────────────────────────────

/** Monto total a cubrir en el pago (cuota + deuda arrastrada). */
export function paymentObligation(p: {
  amount_due: number;
  accumulated_debt: number;
}): number {
  return Number(p.amount_due ?? 0) + Number(p.accumulated_debt ?? 0);
}

/** Lo que falta por cubrir respecto a obligation (incluye crédito ya aplicado). */
export function paymentRemaining(p: {
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number;
  credit_amount_used?: number;
}): number {
  const obl = paymentObligation(p);
  const paid = Number(p.amount_paid ?? 0);
  const credit = Number(p.credit_amount_used ?? 0);
  return Math.max(0, Math.round((obl - paid - credit) * 100) / 100);
}

// ── Payment history sort ──────────────────────────────────────────

interface SortablePayment {
  billing_cycles?:
    | { period_start?: string }
    | { period_start?: string }[]
    | null;
  confirmed_at?: string | null;
  paid_at?: string | null;
  due_date?: string;
  amount_paid?: number;
  members?: { name?: string } | { name?: string }[] | null;
}

function periodStartMs(p: SortablePayment): number {
  const bc = p.billing_cycles;
  if (!bc) return 0;
  const o = Array.isArray(bc) ? bc[0] : bc;
  const s = o?.period_start;
  if (!s) return 0;
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function activityMs(p: SortablePayment): number {
  const iso = p.confirmed_at ?? p.paid_at;
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function dueMs(p: SortablePayment): number {
  if (!p.due_date) return 0;
  const t = new Date(p.due_date).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function memberNameKey(p: SortablePayment): string {
  const m = p.members;
  const row = Array.isArray(m) ? m[0] : m;
  return (row?.name ?? "").toLowerCase();
}

/**
 * Deriva el estado correcto de un pago a partir de sus montos y timestamps,
 * replicando la misma lógica que reconcile_payment_debt_chain en la DB.
 * Usar en lugar de leer directamente `payment.status` para mostrar badges
 * o controlar accionabilidad, garantizando que la UI siempre sea coherente.
 */
export function derivePaymentStatus(p: {
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number;
  credit_amount_used?: number;
  requires_confirmation?: boolean;
  confirmed_at?: string | null;
  paid_at?: string | null;
  due_date?: string;
}): PaymentStatus {
  const remaining = paymentRemaining(p);
  if (remaining <= 0) {
    const isConfirmed =
      Boolean(p.confirmed_at) || !p.requires_confirmation;
    return isConfirmed ? "confirmed" : "paid";
  }
  if (p.due_date && new Date(p.due_date) < new Date(new Date().toDateString())) {
    return "overdue";
  }
  const covered = Number(p.amount_paid ?? 0) + Number(p.credit_amount_used ?? 0);
  if (covered > 0) return "partial";
  return "pending";
}

// ── Derived-status helpers ────────────────────────────────────────
// Build all business predicates on top of derivePaymentStatus so every
// caller that needs a boolean or a count goes through the same derivation.

type DeriveInput = Parameters<typeof derivePaymentStatus>[0];

/** True when the member still owes money and the owner should act (or wait). */
export function isActionablePayment(p: DeriveInput): boolean {
  const s = derivePaymentStatus(p);
  return s === "pending" || s === "partial" || s === "overdue";
}

/** True when the member has marked the payment but the owner hasn't confirmed yet. */
export function isAwaitingConfirmation(p: DeriveInput): boolean {
  return derivePaymentStatus(p) === "paid";
}

/** True when the payment is fully settled and owner-confirmed. */
export function isSettled(p: DeriveInput): boolean {
  return derivePaymentStatus(p) === "confirmed";
}

/**
 * Count payments by derived status.
 * Returns an object with a key per PaymentStatus + "all" for the total.
 * Use this for filter-chip counts so they always match card badges.
 */
export function countByDerivedStatus<T extends DeriveInput>(
  payments: T[],
): Record<PaymentStatus, number> & { all: number } {
  const counts: Record<string, number> = { all: payments.length };
  for (const p of payments) {
    const s = derivePaymentStatus(p);
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts as Record<PaymentStatus, number> & { all: number };
}

/**
 * Ordena pagos para el historial:
 * - Ciclo más reciente primero
 * - Dentro del mismo ciclo: sin pago arriba, luego por actividad reciente
 */
export function sortPaymentsForHistory<T extends SortablePayment>(
  payments: T[],
): T[] {
  return [...payments].sort((a, b) => {
    const byPeriod = periodStartMs(b) - periodStartMs(a);
    if (byPeriod !== 0) return byPeriod;

    // "Sin pago" = ni dinero pagado ni crédito aplicado
    const aSinPago =
      Number(a.amount_paid ?? 0) <= 0 &&
      Number((a as { credit_amount_used?: number }).credit_amount_used ?? 0) <= 0;
    const bSinPago =
      Number(b.amount_paid ?? 0) <= 0 &&
      Number((b as { credit_amount_used?: number }).credit_amount_used ?? 0) <= 0;
    if (aSinPago !== bSinPago) return aSinPago ? -1 : 1;

    if (aSinPago && bSinPago) {
      const byDueAsc = dueMs(a) - dueMs(b);
      if (byDueAsc !== 0) return byDueAsc;
      return memberNameKey(a).localeCompare(memberNameKey(b), "es");
    }

    const byActivity = activityMs(b) - activityMs(a);
    if (byActivity !== 0) return byActivity;
    const byDue = dueMs(b) - dueMs(a);
    if (byDue !== 0) return byDue;
    return memberNameKey(a).localeCompare(memberNameKey(b), "es");
  });
}
