import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  type Payment,
  type BillingCycle,
  type Persona,
  type PersonaCredit,
  type ServiceMemberInfo,
  type PaymentNote,
} from "@/types/database";
import { PaymentHistorySection } from "@/components/servicios/service-detail-sections";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const paymentStatusConfig: Record<
  string,
  { label: string; badgeClass: string }
> = {
  confirmed: {
    label: "Confirmado",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
  },
  paid: {
    label: "Pagado",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
  },
  pending: {
    label: "Pendiente",
    badgeClass: "bg-orange-400/10 border border-orange-400/20 text-orange-400",
  },
  partial: {
    label: "Parcial",
    badgeClass: "bg-orange-400/10 border border-orange-400/20 text-orange-400",
  },
  overdue: {
    label: "Vencido",
    badgeClass: "bg-red-500/10 border border-red-500/20 text-red-400",
  },
};

const serviceStatusConfig: Record<
  string,
  { label: string; badgeClass: string; icon?: string; dotClass?: string }
> = {
  active: {
    label: "Activo",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    icon: "solar:check-circle-bold",
  },
  pending: {
    label: "Pausado",
    badgeClass: "bg-neutral-800 border border-neutral-700 text-neutral-500",
  },
  overdue: {
    label: "Vence pronto",
    badgeClass: "bg-red-500/10 border border-red-500/20 text-red-400",
    dotClass: "animate-pulse",
  },
};

const splitTypeLabels: Record<string, string> = {
  equal: "Dividido igual",
  custom: "Montos personalizados",
};

// Types for joined queries
interface PaymentWithPersona extends Payment {
  personas: Pick<Persona, "id" | "name" | "avatar_url" | "profile_id">;
  payment_notes: PaymentNote[];
}

interface CycleWithPayments extends BillingCycle {
  payments: PaymentWithPersona[];
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch all data in parallel
  // - service_summary view for members list (works for both owner and guest)
  // - services table for full details (notes, etc.)
  // - billing_cycles + payments + notes (RLS allows members via is_service_member())
  // - persona_credits for saldo a favor
  const [
    { data: summary },
    { data: service },
    { data: cycles },
    { data: credits },
    { data: linkedPersona },
  ] = await Promise.all([
    supabase.from("service_summary").select("*").eq("id", id).single(),
    supabase.from("services").select("*").eq("id", id).single(),
    supabase
      .from("billing_cycles")
      .select(
        "*, payments(*, personas(id, name, avatar_url, profile_id), payment_notes(*))",
      )
      .eq("service_id", id)
      .order("period_start", { ascending: false })
      .limit(6),
    supabase
      .from("persona_credits")
      .select("*")
      .eq("service_id", id)
      .eq("status", "available"),
    // Find the guest's persona (to highlight "tú" in the members list)
    supabase
      .from("personas")
      .select("id")
      .eq("profile_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  if (!summary || !service) notFound();

  const isOwner = service.owner_id === user.id;
  const viewMembers: ServiceMemberInfo[] = summary.members ?? [];
  const typedCycles = (cycles ?? []) as unknown as CycleWithPayments[];
  const typedCredits = (credits ?? []) as PersonaCredit[];
  const guestPersonaId = linkedPersona?.id ?? null;

  // Current cycle (most recent)
  const currentCycle = typedCycles[0] ?? null;
  const currentPayments = currentCycle?.payments ?? [];

  // Stats
  const pendingThisMonth = currentPayments
    .filter((p) => ["pending", "partial", "overdue"].includes(p.status))
    .reduce((sum, p) => sum + (p.amount_due - p.amount_paid), 0);

  const collectedThisMonth = currentPayments
    .filter((p) => ["paid", "confirmed"].includes(p.status))
    .reduce((sum, p) => sum + p.amount_paid, 0);

  const accumulatedDebt = currentPayments.reduce(
    (sum, p) => sum + p.accumulated_debt,
    0,
  );

  const totalCredits = typedCredits.reduce(
    (sum, c) => sum + c.amount_remaining,
    0,
  );

  // Build credit map by persona_id
  const creditByPersona: Record<string, number> = {};
  for (const c of typedCredits) {
    creditByPersona[c.persona_id] =
      (creditByPersona[c.persona_id] ?? 0) + c.amount_remaining;
  }

  // Build current payment status by persona_id
  const paymentByPersona: Record<string, Payment> = {};
  for (const p of currentPayments) {
    paymentByPersona[p.persona_id] = p;
  }

  const status =
    serviceStatusConfig[service.status] ?? serviceStatusConfig.pending;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/servicios"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        <Icon icon="solar:alt-arrow-left-linear" width={14} />
        Servicios
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5">
        <div
          className="w-16 h-16 rounded-2xl bg-black border border-neutral-800 flex items-center justify-center shadow-lg shrink-0"
          style={{ boxShadow: `0 4px 20px ${service.color}1a` }}
        >
          <Icon
            icon={service.icon_url ?? "solar:tv-bold"}
            width={32}
            style={{ color: service.color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {service.name}
            </h1>
            <div
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 ${status.badgeClass}`}
            >
              {service.status === "overdue" ? (
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-current ${status.dotClass ?? ""}`}
                />
              ) : status.icon ? (
                <Icon icon={status.icon} width={10} />
              ) : null}
              {status.label}
            </div>
            {isOwner ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-medium text-violet-400">
                <Icon icon="solar:crown-bold" width={9} />
                Propietario
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-medium text-blue-400">
                <Icon icon="solar:user-bold" width={9} />
                Miembro
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-neutral-400">
            <span>{formatCurrency(service.monthly_cost)}/mes</span>
            <span className="text-neutral-700">|</span>
            <span>Día {service.billing_day}</span>
            <span className="text-neutral-700">|</span>
            <span>
              {splitTypeLabels[service.split_type] ?? service.split_type}
            </span>
          </div>
          {service.notes && (
            <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
              {service.notes}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Por cobrar"
          value={formatCurrency(pendingThisMonth)}
          icon="solar:wallet-money-linear"
          color="text-orange-400"
        />
        <StatCard
          label="Cobrado"
          value={formatCurrency(collectedThisMonth)}
          icon="solar:check-circle-linear"
          color="text-emerald-400"
        />
        <StatCard
          label="Deuda acumulada"
          value={formatCurrency(accumulatedDebt)}
          icon="solar:danger-triangle-linear"
          color={accumulatedDebt > 0 ? "text-red-400" : "text-neutral-500"}
        />
        <StatCard
          label="Créditos activos"
          value={formatCurrency(totalCredits)}
          icon="solar:star-linear"
          color={totalCredits > 0 ? "text-violet-400" : "text-neutral-500"}
        />
      </div>

      {/* Members (from service_summary view — works for both owner and guest) */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-200 mb-3">
          Miembros ({viewMembers.length})
        </h2>
        {viewMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {viewMembers.map((member) => {
              const payment = paymentByPersona[member.persona_id];
              const credit = creditByPersona[member.persona_id];
              const pStatus = payment
                ? paymentStatusConfig[payment.status] ??
                  paymentStatusConfig.pending
                : null;
              const isMe =
                !isOwner && member.persona_id === guestPersonaId;

              return (
                <div
                  key={member.member_id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                    isMe
                      ? "bg-violet-500/5 border-violet-500/20"
                      : "bg-neutral-900/30 border-neutral-800"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-900 flex items-center justify-center text-[10px] font-medium text-neutral-400 shrink-0 overflow-hidden">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(member.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-200 truncate">
                        {member.name}
                        {isMe && (
                          <span className="text-violet-400 text-[10px] ml-1">
                            (tú)
                          </span>
                        )}
                      </span>
                      {!member.email ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-neutral-800 border border-neutral-700 text-neutral-500 shrink-0">
                          No registrado
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-neutral-500">
                        {member.custom_amount
                          ? formatCurrency(member.custom_amount)
                          : formatCurrency(
                              service.monthly_cost /
                                (viewMembers.length || 1),
                            )}
                        /mes
                      </span>
                      {credit != null && credit > 0 && (
                        <span className="text-[11px] text-violet-400 flex items-center gap-1">
                          <Icon icon="solar:star-bold" width={10} />
                          Saldo: {formatCurrency(credit)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pStatus && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${pStatus.badgeClass}`}
                      >
                        {pStatus.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/10 p-6 text-center">
            <p className="text-xs text-neutral-500">
              No hay miembros en este servicio
            </p>
          </div>
        )}
      </section>

      {/* Payment History */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-200 mb-3">
          Historial de pagos
        </h2>
        {typedCycles.length > 0 ? (
          <PaymentHistorySection
            cycles={typedCycles.map((cycle) => ({
              id: cycle.id,
              periodStart: cycle.period_start,
              totalAmount: cycle.total_amount,
              payments: cycle.payments.map((p) => ({
                id: p.id,
                personaName: p.personas.name,
                personaInitials: getInitials(p.personas.name),
                isRegistered: !!p.personas.profile_id,
                amountDue: p.amount_due,
                amountPaid: p.amount_paid,
                accumulatedDebt: p.accumulated_debt,
                status: p.status,
                dueDate: p.due_date,
                paidAt: p.paid_at,
                confirmedAt: p.confirmed_at,
                notes: (p.payment_notes ?? []).map((n) => ({
                  id: n.id,
                  content: n.content,
                  createdAt: n.created_at,
                  isOwner: n.author_id === user.id,
                })),
              })),
            }))}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/10 p-6 text-center">
            <p className="text-xs text-neutral-500">
              No hay ciclos de cobro aún
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-neutral-900/30 border border-neutral-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon icon={icon} width={14} className={color} />
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}
