"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, getInitials } from "@/lib/utils";
import type { ServiceSummary, ServiceMemberInfo } from "@/types/database";

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

interface ServiceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceSummary;
}

export default function ServiceDetailModal({
  open,
  onOpenChange,
  service,
}: ServiceDetailModalProps) {
  const viewMembers: ServiceMemberInfo[] = service.members ?? [];
  const status =
    serviceStatusConfig[service.status] ?? serviceStatusConfig.pending;

  const totalCost = service.monthly_cost;
  const collectedPercent =
    totalCost > 0
      ? Math.min(
          100,
          Math.round((service.collected_amount / totalCost) * 100),
        )
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] bg-neutral-950 border-neutral-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 gap-0 flex flex-col overflow-hidden sm:max-w-2xl sm:max-h-[90vh] data-closed:slide-out-to-bottom-4 data-open:slide-in-from-bottom-4 duration-200"
        showCloseButton={false}
      >
        {/* Drag Handle (mobile only) */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header with colored accent */}
        <div className="relative shrink-0 overflow-hidden">
          {/* Colored gradient backdrop */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: `linear-gradient(135deg, ${service.color} 0%, transparent 60%)`,
            }}
          />
          <div className="relative sm:px-6 flex bg-neutral-950/60 border-neutral-800/80 border-b pt-3 pr-5 pb-4 pl-5 sm:pt-5 backdrop-blur-xl items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div
                className="w-[52px] h-[52px] rounded-2xl bg-black/80 border border-neutral-700/50 flex items-center justify-center shrink-0"
                style={{
                  boxShadow: `0 4px 20px ${service.color}26, 0 0 0 1px ${service.color}10`,
                }}
              >
                <Icon
                  icon={service.icon_url ?? "solar:tv-bold"}
                  width={26}
                  style={{ color: service.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg font-bold text-white tracking-tight">
                    {service.name}
                  </DialogTitle>
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-medium text-violet-400">
                    <Icon icon="solar:crown-bold" width={9} />
                    Propietario
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[13px] text-neutral-400">
                  <span className="font-medium text-neutral-300">
                    {formatCurrency(service.monthly_cost)}
                  </span>
                  <span className="text-neutral-600">/mes</span>
                  <span className="w-1 h-1 rounded-full bg-neutral-700" />
                  <span>Día {service.billing_day}</span>
                  <span className="w-1 h-1 rounded-full bg-neutral-700" />
                  <span>
                    {splitTypeLabels[service.split_type] ?? service.split_type}
                  </span>
                </div>
              </div>
            </div>
            <DialogClose className="w-8 h-8 flex items-center justify-center rounded-xl bg-neutral-800/60 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-700/60 hover:border-neutral-600 transition-all duration-150 focus:outline-none shrink-0 mt-0.5">
              <Icon icon="solar:close-square-linear" width={15} />
            </DialogClose>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* Financial Overview — unified card */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden">
            {/* Progress bar header */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  Cobro del mes
                </span>
                <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
                  {collectedPercent}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${collectedPercent}%`,
                    background:
                      collectedPercent === 100
                        ? "linear-gradient(90deg, #34d399, #10b981)"
                        : `linear-gradient(90deg, ${service.color}cc, ${service.color})`,
                  }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 divide-x divide-neutral-800/60">
              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                    Por cobrar
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums tracking-tight",
                    service.pending_amount > 0
                      ? "text-orange-400"
                      : "text-neutral-500",
                  )}
                >
                  {formatCurrency(service.pending_amount)}
                </span>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                    Cobrado
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums tracking-tight",
                    service.collected_amount > 0
                      ? "text-emerald-400"
                      : "text-neutral-500",
                  )}
                >
                  {formatCurrency(service.collected_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Members */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Miembros
              </h2>
              <span className="text-[11px] font-medium text-neutral-600 tabular-nums">
                {viewMembers.length}{" "}
                {viewMembers.length === 1 ? "persona" : "personas"}
              </span>
            </div>
            {viewMembers.length > 0 ? (
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden divide-y divide-neutral-800/40">
                {viewMembers.map((member) => {
                  const memberAmount = member.custom_amount
                    ? member.custom_amount
                    : service.monthly_cost / (viewMembers.length + 1);
                  const memberPercent =
                    totalCost > 0
                      ? Math.round((memberAmount / totalCost) * 100)
                      : 0;

                  return (
                    <div
                      key={member.member_id}
                      className="flex items-center gap-3 px-4 py-3 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center text-[10px] font-semibold text-neutral-300 shrink-0">
                        {getInitials(member.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-neutral-200 truncate block">
                          {member.name}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {memberPercent}% del total
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold text-neutral-300 tabular-nums shrink-0">
                        {formatCurrency(memberAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/10 p-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Icon
                    icon="solar:users-group-rounded-linear"
                    width={20}
                    className="text-neutral-600"
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  No hay miembros en este servicio
                </p>
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
