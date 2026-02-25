import { createClient } from "@/lib/supabase/server";
import { DashboardServiceCard } from "@/components/dashboard/dashboard-service-card";
import { Icon } from "@iconify/react";
import type { ServiceSummary } from "@/types/database";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Buenas noches";
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function formatDate(): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: services }, { data: payments }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("service_summary")
        .select("*")
        .eq("owner_id", user!.id)
        .order("name"),
      supabase
        .from("payments")
        .select(
          "id, cycle_id, service_id, persona_id, amount_due, amount_paid, accumulated_debt, status, due_date, paid_at, confirmed_at, requires_confirmation, personas!inner(id, name, email, phone, avatar_url, profile_id), billing_cycles!inner(period_start, period_end)",
        )
        .eq("owner_id", user!.id)
        .order("status", { ascending: true }),
    ]);

  const displayName =
    profile?.display_name ??
    user!.user_metadata?.display_name ??
    user!.email?.split("@")[0] ??
    "Usuario";

  const serviceList = (services ?? []) as ServiceSummary[];
  const activeServices = serviceList.filter((s) => s.status === "active");

  // Group payments by service_id
  const paymentsByService = new Map<string, typeof payments>();
  for (const p of payments ?? []) {
    const list = paymentsByService.get(p.service_id) ?? [];
    list.push(p);
    paymentsByService.set(p.service_id, list);
  }

  // Count pending verifications (status = 'paid' means awaiting owner confirmation)
  const pendingVerifications = (payments ?? []).filter(
    (p) => p.status === "paid",
  ).length;

  return (
    <div className="space-y-6">
      {/* Greeting + date */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {getGreeting()}, {displayName.split(" ")[0]}
        </h1>
        <p className="text-sm text-neutral-500 mt-1 capitalize">
          {formatDate()}
        </p>
      </div>

      {/* Title + badges */}
      <div className="flex items-center flex-wrap gap-3">
        <h2 className="text-base font-medium text-neutral-200">
          Servicios Compartidos
        </h2>
        <span className="px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-medium text-neutral-400">
          Activos: {activeServices.length}
        </span>
        {pendingVerifications > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 text-[10px] font-medium text-orange-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            {pendingVerifications} cobro{pendingVerifications > 1 ? "s" : ""}{" "}
            pendiente{pendingVerifications > 1 ? "s" : ""} de verificación
          </span>
        )}
      </div>

      {/* Expanded service cards */}
      {activeServices.length > 0 ? (
        <div className="space-y-5">
          {activeServices.map((service) => (
            <DashboardServiceCard
              key={service.id}
              service={service}
              payments={paymentsByService.get(service.id) ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/20 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <Icon icon="solar:tv-bold" width={28} className="text-violet-400" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">
            No tienes servicios aún
          </h3>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Crea tu primer servicio en la sección de Servicios para empezar a
            gestionar los pagos compartidos.
          </p>
        </div>
      )}
    </div>
  );
}
