import type { PersonaCardData } from "@/types/database";

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
    member_id: string;
    service_id: string;
    amount_due: number;
    amount_paid: number;
    accumulated_debt: number;
    status: string;
  }[];
  services: {
    id: string;
    name: string;
    color: string;
    icon_url: string | null;
    monthly_cost: number;
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

  return data.members.map((m) => {
    const memberServices = data.serviceMembers
      .filter((sm) => sm.member_id === m.id)
      .map((sm) => {
        const svc = svcMap.get(sm.service_id);
        const latestPayment = data.payments.find(
          (p) => p.member_id === m.id && p.service_id === sm.service_id,
        );
        const memberCount = memberCountByService.get(sm.service_id) ?? 0;
        return {
          service_id: sm.service_id,
          service_name: svc?.name ?? "—",
          service_color: svc?.color ?? "#6366f1",
          service_icon: svc?.icon_url ?? null,
          amount_due:
            sm.custom_amount ??
            (svc?.monthly_cost ?? 0) / Math.max(memberCount + 1, 1),
          status: (latestPayment?.status as PersonaCardData["services"][number]["status"]) ?? null,
        };
      });

    const memberPayments = data.payments.filter(
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
}
