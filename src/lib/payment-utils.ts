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

    const aSinPago = Number(a.amount_paid ?? 0) <= 0;
    const bSinPago = Number(b.amount_paid ?? 0) <= 0;
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
