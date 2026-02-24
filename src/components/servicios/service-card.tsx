import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/types/database";
import { ServiceActions } from "./service-actions";
import type { ServiceSummary } from "@/types/database";

const statusConfig: Record<string, { label: string; badge: string }> = {
  active: { label: "Activo", badge: "badge-active" },
  pending: { label: "Pausado", badge: "badge-pending" },
  overdue: { label: "Vencido", badge: "badge-overdue" },
};

interface ServiceCardProps {
  service: ServiceSummary;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const isInactive = service.status !== "active";
  const status = statusConfig[service.status] ?? statusConfig.pending;
  const total = service.monthly_cost;
  const collected = service.collected_amount;
  const progressPercent =
    total > 0 ? Math.min((collected / total) * 100, 100) : 0;

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-[#1e1e30] bg-[#0f0f18] p-5 overflow-hidden transition-all hover:border-[#2d2d50]",
        isInactive && "card-inactive",
      )}
    >
      {/* Service color glow */}
      <div
        className="service-glow"
        style={{ backgroundColor: service.color }}
      />

      {/* Header: icon + name + actions */}
      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${service.color}20` }}
          >
            {service.icon_url ? (
              <Icon
                icon={service.icon_url}
                width={22}
                style={{ color: service.color }}
              />
            ) : (
              <Icon
                icon="solar:tv-bold"
                width={22}
                style={{ color: service.color }}
              />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {service.name}
            </h3>
            <p className="text-xs text-white/50">
              Día {service.billing_day} de cada mes
            </p>
          </div>
        </div>
        <ServiceActions
          serviceId={service.id}
          serviceName={service.name}
          status={service.status}
        />
      </div>

      {/* Price + Status */}
      <div className="mt-4 flex items-center justify-between relative">
        <span className="text-lg font-bold text-white">
          {formatCurrency(service.monthly_cost)}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            status.badge,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status.label}
        </span>
      </div>

      {/* Members */}
      <div className="mt-4 flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {Array.from({ length: Math.min(service.member_count, 4) }).map(
              (_, i) => (
                <div
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-[#0f0f18] bg-[#1a1a2e] flex items-center justify-center"
                >
                  <Icon
                    icon="solar:user-bold"
                    width={14}
                    className="text-white/40"
                  />
                </div>
              ),
            )}
            {service.member_count > 4 && (
              <div className="h-7 w-7 rounded-full border-2 border-[#0f0f18] bg-[#1a1a2e] flex items-center justify-center">
                <span className="text-[10px] text-white/50 font-medium">
                  +{service.member_count - 4}
                </span>
              </div>
            )}
          </div>
          <span className="text-xs text-white/40">
            {service.member_count}{" "}
            {service.member_count === 1 ? "miembro" : "miembros"}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 relative">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-white/40">Cobrado</span>
          <span className="text-white/60 font-medium">
            {formatCurrency(collected)} / {formatCurrency(total)}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#1a1a2e] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              backgroundColor:
                progressPercent === 100 ? "#10b981" : service.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}
