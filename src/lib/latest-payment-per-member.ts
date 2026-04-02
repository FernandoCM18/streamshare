type WithMemberServiceCycle = {
  id: string;
  member_id: string;
  service_id: string;
  billing_cycles: { period_start: string } | { period_start: string }[] | null;
  created_at?: string;
};

function periodStart(p: WithMemberServiceCycle): string {
  const bc = p.billing_cycles;
  if (!bc) return "";
  const o = Array.isArray(bc) ? bc[0] : bc;
  return o?.period_start ?? "";
}

/** Ciclo más reciente; si falta period_start, respaldo por created_at (evita elegir fila al azar). */
function isNewerPayment<T extends WithMemberServiceCycle>(a: T, b: T): boolean {
  const ap = periodStart(a);
  const bp = periodStart(b);
  if (ap !== bp) return ap > bp;
  const ac = a.created_at ?? "";
  const bc = b.created_at ?? "";
  if (ac !== bc) return ac > bc;
  return a.id > b.id;
}

/**
 * Evita doble conteo cuando hay varios pagos abiertos por miembro/servicio
 * (p. ej. ciclo anterior vencido + ciclo actual con deuda acumulada).
 * Conserva solo el pago del ciclo con period_start más reciente.
 */
export function latestPaymentsPerMemberForService<
  T extends WithMemberServiceCycle,
>(payments: T[]): T[] {
  const best = new Map<string, T>();
  for (const p of payments) {
    const key = `${p.member_id}:${p.service_id}`;
    const cur = best.get(key);
    if (!cur || isNewerPayment(p, cur)) {
      best.set(key, p);
    }
  }
  return [...best.values()];
}
