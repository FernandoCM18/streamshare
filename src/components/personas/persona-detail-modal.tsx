"use client";

import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import type { PersonaCardData, ServiceInfo } from "@/types/database";

const statusConfig: Record<
  string,
  { label: string; badgeClass: string; dotClass?: string; icon?: string }
> = {
  overdue: {
    label: "Vencido",
    badgeClass: "bg-red-500/10 border border-red-500/20 text-red-400",
    dotClass: "bg-red-500 animate-pulse",
  },
  pending: {
    label: "Pendiente",
    badgeClass: "bg-orange-500/10 border border-orange-500/20 text-orange-400",
    dotClass: "bg-orange-500 animate-pulse",
  },
  partial: {
    label: "Parcial",
    badgeClass: "bg-orange-500/10 border border-orange-500/20 text-orange-400",
    dotClass: "bg-orange-500",
  },
  confirmed: {
    label: "Al dia",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    icon: "solar:check-circle-bold",
  },
  paid: {
    label: "Pagado",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    icon: "solar:check-circle-bold",
  },
};

function getOverallStatus(services: ServiceInfo[]): string {
  if (services.length === 0) return "none";
  if (services.some((s) => s.status === "overdue")) return "overdue";
  if (services.some((s) => s.status === "pending" || s.status === "partial"))
    return "pending";
  return "confirmed";
}

// ── Component ─────────────────────────────────────────────────

interface PersonaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: PersonaCardData;
}

export function PersonaDetailModal({
  open,
  onOpenChange,
  persona,
}: PersonaDetailModalProps) {
  const overallStatus = getOverallStatus(persona.services);
  const status = statusConfig[overallStatus] ?? statusConfig.pending;

  const accentColor = persona.profile_id ? "#8b5cf6" : "#737373";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] bg-neutral-950 border-neutral-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 gap-0 flex flex-col overflow-hidden sm:max-w-lg sm:max-h-[90vh] data-closed:slide-out-to-bottom-4 data-open:slide-in-from-bottom-4 duration-200"
        showCloseButton={false}
      >
        {/* Drag Handle (mobile) */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header with colored accent */}
        <div className="relative shrink-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, transparent 60%)`,
            }}
          />
          <div className="relative flex bg-neutral-950/60 border-b border-neutral-800/80 pt-3 pr-5 pb-4 pl-5 sm:px-6 sm:pt-5 backdrop-blur-xl items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Avatar */}
              <div
                className={cn(
                  "w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 border",
                  persona.profile_id
                    ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                    : "bg-neutral-800 border-neutral-700 text-neutral-300",
                )}
                style={{
                  boxShadow: `0 4px 20px ${accentColor}26`,
                }}
              >
                {getInitials(persona.name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg font-bold text-white tracking-tight">
                    {persona.name}
                  </DialogTitle>
                  <div
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5",
                      status.badgeClass,
                    )}
                  >
                    {status.dotClass && (
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          status.dotClass,
                        )}
                      />
                    )}
                    {status.icon && <Icon icon={status.icon} width={10} />}
                    {status.label}
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border",
                      persona.profile_id
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-neutral-700 bg-neutral-800 text-neutral-500",
                    )}
                  >
                    <Icon
                      icon={
                        persona.profile_id
                          ? "solar:link-bold"
                          : "solar:link-broken-bold"
                      }
                      width={9}
                    />
                    {persona.profile_id ? "Vinculado" : "Sin cuenta"}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[13px] text-neutral-400">
                  {persona.email && <span>{persona.email}</span>}
                  {persona.email && persona.phone && (
                    <span className="w-1 h-1 rounded-full bg-neutral-700" />
                  )}
                  {persona.phone && <span>{persona.phone}</span>}
                </div>
              </div>
            </div>

            <DialogClose className="w-8 h-8 flex items-center justify-center rounded-xl bg-neutral-800/60 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-700/60 hover:border-neutral-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70 shrink-0 mt-0.5">
              <Icon icon="solar:close-square-linear" width={15} />
            </DialogClose>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* Financial Overview — unified card */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-neutral-800/60">
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                  <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                    Mensual
                  </span>
                </div>
                <span className="text-xl font-bold tabular-nums tracking-tight text-neutral-300">
                  {formatCurrency(persona.monthly_amount)}
                </span>
              </div>
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      persona.total_debt > 0
                        ? "bg-red-400 animate-pulse"
                        : "bg-neutral-600",
                    )}
                  />
                  <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                    Deuda
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums tracking-tight",
                    persona.total_debt > 0
                      ? "text-red-400"
                      : "text-neutral-500",
                  )}
                >
                  {formatCurrency(persona.total_debt)}
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Servicios
              </h2>
              <span className="text-[11px] font-medium text-neutral-600 tabular-nums">
                {persona.services.length}{" "}
                {persona.services.length === 1 ? "servicio" : "servicios"}
              </span>
            </div>
            {persona.services.length > 0 ? (
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden divide-y divide-neutral-800/40">
                {persona.services.map((s) => {
                  const sStatus = s.status ? statusConfig[s.status] : null;

                  return (
                    <div
                      key={s.service_id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div
                        className="w-9 h-9 rounded-xl bg-black/80 border border-neutral-700/50 flex items-center justify-center shrink-0"
                        style={{
                          boxShadow: `0 2px 10px ${s.service_color}15`,
                        }}
                      >
                        {s.service_icon ? (
                          <Icon
                            icon={s.service_icon}
                            width={16}
                            style={{ color: s.service_color }}
                          />
                        ) : (
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: s.service_color }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-neutral-200 truncate block">
                          {s.service_name}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {formatCurrency(s.amount_due)}/mes
                        </span>
                      </div>
                      {sStatus && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-medium",
                            sStatus.badgeClass,
                          )}
                        >
                          {sStatus.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/10 p-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Icon
                    icon="solar:box-minimalistic-linear"
                    width={20}
                    className="text-neutral-600"
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Sin servicios asignados
                </p>
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
