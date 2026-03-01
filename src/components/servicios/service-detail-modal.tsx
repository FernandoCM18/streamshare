"use client";

import { Icon } from "@iconify/react";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] bg-neutral-950 border-neutral-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 gap-0 flex flex-col overflow-hidden sm:max-w-2xl sm:max-h-[90vh]"
        showCloseButton={false}
      >
        {/* Drag Handle (mobile only) */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="sm:px-6 flex shrink-0 bg-neutral-950/80 border-neutral-800/80 border-b pt-3 pr-5 pb-4 pl-5 sm:pt-4 backdrop-blur-xl items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-xl bg-black border border-neutral-800 flex items-center justify-center shadow-lg shrink-0"
              style={{ boxShadow: `0 4px 14px ${service.color}1a` }}
            >
              <Icon
                icon={service.icon_url ?? "solar:tv-bold"}
                width={24}
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
              <div className="mt-1 flex items-center gap-3 text-sm text-neutral-400">
                <span>{formatCurrency(service.monthly_cost)}/mes</span>
                <span className="text-neutral-700">|</span>
                <span>Día {service.billing_day}</span>
                <span className="text-neutral-700">|</span>
                <span>
                  {splitTypeLabels[service.split_type] ?? service.split_type}
                </span>
              </div>
            </div>
          </div>
          <DialogClose className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none shrink-0 mt-1">
            <Icon icon="solar:close-circle-linear" width={20} />
          </DialogClose>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Por cobrar"
              value={formatCurrency(service.pending_amount)}
              icon="solar:wallet-money-linear"
              color={
                service.pending_amount > 0
                  ? "text-orange-400"
                  : "text-neutral-500"
              }
            />
            <StatCard
              label="Cobrado"
              value={formatCurrency(service.collected_amount)}
              icon="solar:check-circle-linear"
              color={
                service.collected_amount > 0
                  ? "text-emerald-400"
                  : "text-neutral-500"
              }
            />
          </div>

          {/* Members */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-200 mb-3">
              Miembros ({viewMembers.length})
            </h2>
            {viewMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {viewMembers.map((member) => (
                  <div
                    key={member.member_id}
                    className="flex items-center gap-3 p-3.5 rounded-xl border bg-neutral-900/30 border-neutral-800"
                  >
                    <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-900 flex items-center justify-center text-[10px] font-medium text-neutral-400 shrink-0">
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-neutral-200 truncate block">
                        {member.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-neutral-500">
                          {member.custom_amount
                            ? formatCurrency(member.custom_amount)
                            : formatCurrency(
                                service.monthly_cost /
                                  (viewMembers.length + 1),
                              )}
                          /mes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/10 p-6 text-center">
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
