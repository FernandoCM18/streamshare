import { createClient } from "@/lib/supabase/server";
import { PersonasHeader } from "@/components/personas/personas-header";
import { PersonasGrid } from "@/components/personas/personas-grid";
import type { PersonaCardData, ServiceInfo } from "@/components/personas/persona-card";
import type { PaymentStatus } from "@/types/database";

export default async function PersonasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: personas }, { data: memberships }, { data: payments }] =
    await Promise.all([
      supabase
        .from("personas")
        .select("id, name, email, phone, avatar_url, profile_id")
        .eq("owner_id", user!.id)
        .order("name"),
      supabase
        .from("service_members")
        .select(
          "persona_id, custom_amount, is_active, services!inner(id, name, color, icon_url, monthly_cost, billing_day, status)",
        )
        .eq("owner_id", user!.id)
        .eq("is_active", true),
      supabase
        .from("payments")
        .select("persona_id, service_id, amount_due, amount_paid, status")
        .eq("owner_id", user!.id)
        .in("status", ["pending", "partial", "overdue", "paid", "confirmed"]),
    ]);

  // Build persona card data
  const personaList: PersonaCardData[] = (personas ?? []).map((p) => {
    // Find services this persona is subscribed to
    const personaMemberships = (memberships ?? []).filter(
      (m) => m.persona_id === p.id,
    );

    const services: ServiceInfo[] = personaMemberships.map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = (Array.isArray(m.services) ? m.services[0] : m.services) as any;
      // Find latest payment for this persona+service
      const latestPayment = (payments ?? []).find(
        (pay) => pay.persona_id === p.id && pay.service_id === svc?.id,
      );

      return {
        service_id: svc?.id ?? "",
        service_name: svc?.name ?? "",
        service_color: svc?.color ?? "#666",
        service_icon: svc?.icon_url ?? null,
        amount_due: m.custom_amount ?? (svc?.monthly_cost ?? 0),
        status: (latestPayment?.status as PaymentStatus) ?? null,
      };
    });

    const monthlyAmount = services.reduce((sum, s) => sum + s.amount_due, 0);

    // Calculate total debt (pending + overdue amounts)
    const personaPayments = (payments ?? []).filter(
      (pay) =>
        pay.persona_id === p.id &&
        (pay.status === "pending" || pay.status === "overdue" || pay.status === "partial"),
    );
    const totalDebt = personaPayments.reduce(
      (sum, pay) =>
        sum + (Number(pay.amount_due) - Number(pay.amount_paid)),
      0,
    );

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      avatar_url: p.avatar_url,
      profile_id: p.profile_id,
      services,
      total_debt: totalDebt,
      monthly_amount: monthlyAmount,
    };
  });

  // Compute counts
  const upToDateCount = personaList.filter(
    (p) =>
      p.services.length > 0 &&
      p.services.every(
        (s) => s.status === "confirmed" || s.status === "paid",
      ),
  ).length;

  const pendingCount = personaList.filter((p) =>
    p.services.some(
      (s) =>
        s.status === "pending" ||
        s.status === "overdue" ||
        s.status === "partial",
    ),
  ).length;

  return (
    <div className="space-y-8">
      <PersonasHeader
        totalCount={personaList.length}
        upToDateCount={upToDateCount}
        pendingCount={pendingCount}
      />
      <PersonasGrid personas={personaList} />
    </div>
  );
}
