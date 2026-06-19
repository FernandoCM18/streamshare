import type { PersonaCardData } from "@/types/database";
import { derivePaymentStatus } from "@/lib/payment-utils";
import {
  computePaymentSummaries,
  memberTotalDebt,
  type PaymentInput,
} from "@/lib/compute-payment-summaries";

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
  payments: PaymentInput[];
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

export function buildPersonaCards(data: PersonasDataInput): PersonaCardData[] {
  const svcMap = new Map(data.services.map((s) => [s.id, s]));

  const memberCountByService = new Map<string, number>();
  for (const sm of data.serviceMembers) {
    memberCountByService.set(
      sm.service_id,
      (memberCountByService.get(sm.service_id) ?? 0) + 1,
    );
  }

  const creditMap = new Map<string, number>();
  for (const c of data.credits ?? []) {
    const key = `${c.member_id}:${c.service_id}`;
    creditMap.set(key, (creditMap.get(key) ?? 0) + c.amount_remaining);
  }

  // Single source of truth for all debt/status calculations
  const summaries = computePaymentSummaries(data.payments);

  return data.members.map((m) => {
    const memberServices = data.serviceMembers
      .filter((sm) => sm.member_id === m.id)
      .map((sm) => {
        const svc = svcMap.get(sm.service_id);
        const memberCount = memberCountByService.get(sm.service_id) ?? 0;
        const summary = summaries.get(`${m.id}:${sm.service_id}`);
        return {
          service_id: sm.service_id,
          service_name: svc?.name ?? "—",
          service_color: svc?.color ?? "#6366f1",
          service_icon: svc?.icon_url ?? null,
          amount_due:
            sm.custom_amount ??
            (svc?.monthly_cost ?? 0) / Math.max(memberCount + 1, 1),
          status: summary
            ? (summary.status as PersonaCardData["services"][number]["status"])
            : null,
          available_credit: creditMap.get(`${m.id}:${sm.service_id}`) ?? 0,
        };
      });

    const totalDebt = memberTotalDebt(summaries, m.id);
    const monthlyAmount = memberServices.reduce((sum, s) => sum + s.amount_due, 0);
    const totalCredit = memberServices.reduce((sum, s) => sum + s.available_credit, 0);

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
