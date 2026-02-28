import { getRequiredUser } from "@/lib/auth/user";
import { getCachedPersonasData } from "@/lib/queries";
import { PersonasClient } from "./personas-client";
import type { PersonaCardData } from "@/components/personas/persona-card";

export default async function PersonasPage() {
  const user = await getRequiredUser();
  const { members, serviceMembers, payments, services } =
    await getCachedPersonasData(user.id);

  // Build service lookup
  const svcMap = new Map(services.map((s) => [s.id, s]));

  // Build persona cards
  const personas: PersonaCardData[] = members.map((m) => {
    const memberServices = serviceMembers
      .filter((sm) => sm.member_id === m.id)
      .map((sm) => {
        const svc = svcMap.get(sm.service_id);
        const latestPayment = payments.find(
          (p) => p.member_id === m.id && p.service_id === sm.service_id,
        );
        const memberCount = serviceMembers.filter(
          (s) => s.service_id === sm.service_id,
        ).length;
        return {
          service_id: sm.service_id,
          service_name: svc?.name ?? "—",
          service_color: svc?.color ?? "#6366f1",
          service_icon: svc?.icon_url ?? null,
          amount_due:
            sm.custom_amount ??
            (svc?.monthly_cost ?? 0) / Math.max(memberCount, 1),
          status: latestPayment?.status ?? null,
        };
      });

    const memberPayments = payments.filter(
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

  return <PersonasClient personas={personas} />;
}
