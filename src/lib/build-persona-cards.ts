import type { PersonaCardData } from "@/types/database";
import { paymentRemaining } from "@/lib/payment-utils";

interface PersonasDataInput {
  members: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    profile_id: string | null;
  }[];
  serviceMembers: {
    member_id: string;
    service_id: string;
    custom_amount: number | null;
    is_active: boolean;
  }[];
  payments: {
    id?: string;
    member_id: string;
    service_id: string;
    amount_due: number;
    amount_paid: number;
    accumulated_debt: number;
    credit_amount_used: number;
    status: string;
    created_at: string;
    due_date?: string;
    paid_at?: string | null;
    confirmed_at?: string | null;
    billing_cycles?: unknown;
  }[];
  services: {
    id: string;
    name: string;
    color: string;
    icon_url: string | null;
    monthly_cost: number;
  }[];
  credits?: {
    member_id: string;
    service_id: string;
    amount_remaining: number;
  }[];
}

/**
 * Build PersonaCardData[] from raw personas data.
 * Shared between layout.tsx and personas/page.tsx.
 *
 * Note: memberCount includes the owner (+1) for the amount_due calculation.
 */
export function buildPersonaCards(data: PersonasDataInput): PersonaCardData[] {
  const svcMap = new Map(data.services.map((s) => [s.id, s]));

  // Pre-compute member count per service to avoid O(n^2)
  const memberCountByService = new Map<string, number>();
  for (const sm of data.serviceMembers) {
    memberCountByService.set(
      sm.service_id,
      (memberCountByService.get(sm.service_id) ?? 0) + 1,
    );
  }

  // Build credit lookup: "memberId:serviceId" → total amount_remaining
  const creditMap = new Map<string, number>();
  for (const c of data.credits ?? []) {
    const key = `${c.member_id}:${c.service_id}`;
    creditMap.set(key, (creditMap.get(key) ?? 0) + c.amount_remaining);
  }

  const openForDebt = new Set(["pending", "overdue", "partial", "paid"]);
  const latestOpenByPair = new Map<string, (typeof data.payments)[number]>();
  for (const p of data.payments) {
    if (!openForDebt.has(p.status)) continue;
    const key = `${p.member_id}:${p.service_id}`;
    const cur = latestOpenByPair.get(key);
    if (!cur || p.created_at > cur.created_at) latestOpenByPair.set(key, p);
  }

  const latestAnyByPair = new Map<string, (typeof data.payments)[number]>();
  for (const p of data.payments) {
    const key = `${p.member_id}:${p.service_id}`;
    const cur = latestAnyByPair.get(key);
    if (!cur || p.created_at > cur.created_at) latestAnyByPair.set(key, p);
  }

  return data.members.map((m) => {
    const memberServices = data.serviceMembers
      .filter((sm) => sm.member_id === m.id)
      .map((sm) => {
        const svc = svcMap.get(sm.service_id);
        const latestPayment = latestAnyByPair.get(`${m.id}:${sm.service_id}`);
        const memberCount = memberCountByService.get(sm.service_id) ?? 0;
        return {
          service_id: sm.service_id,
          service_name: svc?.name ?? "—",
          service_color: svc?.color ?? "#6366f1",
          service_icon: svc?.icon_url ?? null,
          amount_due:
            sm.custom_amount ??
            (svc?.monthly_cost ?? 0) / Math.max(memberCount + 1, 1),
          status:
            (latestPayment?.status as PersonaCardData["services"][number]["status"]) ??
            null,
          available_credit: creditMap.get(`${m.id}:${sm.service_id}`) ?? 0,
        };
      });

    const totalDebt = [...latestOpenByPair.entries()]
      .filter(([key]) => key.startsWith(`${m.id}:`))
      .reduce((sum, [, p]) => sum + paymentRemaining(p), 0);
    const monthlyAmount = memberServices.reduce(
      (sum, s) => sum + s.amount_due,
      0,
    );
    const totalCredit = memberServices.reduce(
      (sum, s) => sum + s.available_credit,
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
      available_credit: totalCredit,
    };
  });
}
