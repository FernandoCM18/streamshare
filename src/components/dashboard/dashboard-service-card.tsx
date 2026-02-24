"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/types/database";
import type { ServiceSummary, PaymentStatus } from "@/types/database";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPaymentDate(dateStr: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return `Venció hace ${abs} día${abs !== 1 ? "s" : ""}`;
  }
  if (diffDays === 0) return "Vence hoy";
  if (diffDays === 1) return "Vence mañana";
  return `Vence en ${diffDays} días`;
}

export interface MemberPayment {
  id: string;
  persona_id: string;
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number;
  status: PaymentStatus;
  due_date: string;
  paid_at: string | null;
  confirmed_at: string | null;
  requires_confirmation: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  personas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  billing_cycles: any;
}

const memberStatusConfig: Record<
  PaymentStatus,
  {
    label: (p: MemberPayment) => string;
    textClass: string;
    dotClass: string;
    iconName?: string;
  }
> = {
  confirmed: {
    label: (p) =>
      p.confirmed_at
        ? `Pagado el ${formatPaymentDate(p.confirmed_at)}`
        : "Confirmado",
    textClass: "text-emerald-500",
    dotClass: "bg-emerald-500",
  },
  paid: {
    label: (p) =>
      p.paid_at
        ? `Pagó el ${formatPaymentDate(p.paid_at)}`
        : "Esperando confirmación",
    textClass: "text-emerald-500",
    dotClass: "bg-emerald-500",
  },
  pending: {
    label: () => "Pendiente",
    textClass: "text-orange-400",
    dotClass: "bg-orange-500",
    iconName: "solar:clock-circle-bold",
  },
  partial: {
    label: (p) =>
      `Parcial — ${formatCurrency(p.amount_paid)} de ${formatCurrency(p.amount_due)}`,
    textClass: "text-orange-400",
    dotClass: "bg-orange-500",
    iconName: "solar:clock-circle-bold",
  },
  overdue: {
    label: (p) => `Vencido — ${formatPaymentDate(p.due_date)}`,
    textClass: "text-red-400",
    dotClass: "bg-red-500 animate-pulse",
    iconName: "solar:danger-circle-bold",
  },
};

function getServiceStatusBadge(
  dueDate: string | undefined,
  hasOverdue: boolean,
) {
  if (hasOverdue) {
    return {
      label: "VENCIDO",
      bgClass: "bg-red-500/10",
      borderClass: "border-red-500/20",
      textClass: "text-red-400",
      dotColor: "bg-red-500",
      animate: true,
    };
  }

  if (!dueDate) return null;

  const now = new Date();
  const target = new Date(dueDate);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) {
    return {
      label: formatRelativeTime(dueDate).toUpperCase(),
      bgClass: "bg-red-500/10",
      borderClass: "border-red-500/20",
      textClass: "text-red-400",
      dotColor: "bg-red-500",
      animate: true,
    };
  }

  if (diffDays <= 7) {
    return {
      label: formatRelativeTime(dueDate).toUpperCase(),
      bgClass: "bg-orange-400/10",
      borderClass: "border-orange-400/20",
      textClass: "text-orange-400",
      dotColor: "bg-orange-400",
      animate: false,
    };
  }

  return {
    label: `VENCE EL ${formatPaymentDate(dueDate).toUpperCase()}`,
    bgClass: "bg-neutral-800",
    borderClass: "border-neutral-700",
    textClass: "text-neutral-400",
    dotColor: null,
    animate: false,
  };
}

interface DashboardServiceCardProps {
  service: ServiceSummary;
  payments: MemberPayment[];
}

export function DashboardServiceCard({
  service,
  payments,
}: DashboardServiceCardProps) {
  const normalize = (val: unknown) =>
    Array.isArray(val) ? (val[0] ?? null) : (val ?? null);

  const firstDueDate = payments[0]?.due_date;
  const hasOverdue = payments.some((p) => p.status === "overdue");
  const statusBadge = getServiceStatusBadge(firstDueDate, hasOverdue);

  const pendingVerifications = payments.filter((p) => p.status === "paid");
  const regularPayments = payments.filter((p) => p.status !== "paid");

  return (
    <Card
      className={cn(
        "group relative overflow-hidden",
        "rounded-[2rem] p-0 gap-0",
        "bg-neutral-900/30 ring-0",
        "border border-neutral-800",
        "hover:border-neutral-700",
        "transition-all",
      )}
    >
      {/* Glow — always visible, intensifies on hover */}
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] pointer-events-none transition-opacity duration-500"
        style={{
          backgroundColor: `${service.color}0d`,
        }}
      />

      {/* Header */}
      <CardHeader className="flex items-center justify-between gap-4 rounded-t-none p-6 pb-0">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 shrink-0 rounded-2xl bg-black border border-neutral-800 flex items-center justify-center shadow-lg"
            style={{
              boxShadow: `0 4px 14px ${service.color}1a`,
            }}
          >
            <Icon
              icon={service.icon_url ?? "solar:tv-bold"}
              width={28}
              style={{ color: service.color }}
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-neutral-200">
              {service.name}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Día {service.billing_day} •
              {" " + formatCurrency(service.monthly_cost)}
              /mes
            </p>
          </div>
        </div>

        {statusBadge && (
          <Badge
            variant="outline"
            className={cn(
              "h-auto px-3 py-1 rounded-full",
              "text-[10px] font-medium gap-1.5 shrink-0",
              statusBadge.bgClass,
              statusBadge.borderClass,
              statusBadge.textClass,
            )}
          >
            {statusBadge.dotColor && (
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  statusBadge.dotColor,
                  statusBadge.animate && "animate-pulse",
                )}
              />
            )}
            {statusBadge.label}
          </Badge>
        )}
      </CardHeader>

      {/* Members grid */}
      <CardContent className="p-6">
        {payments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {regularPayments.map((payment) => {
              const persona = normalize(payment.personas) as {
                id: string;
                name: string;
                email: string | null;
                avatar_url: string | null;
                profile_id: string | null;
              } | null;
              if (!persona) return null;

              const config = memberStatusConfig[payment.status];
              const totalOwed =
                Number(payment.amount_due) + Number(payment.accumulated_debt);
              const isPendingOrOverdue =
                payment.status === "pending" || payment.status === "overdue";

              return (
                <div
                  key={payment.id}
                  className={cn(
                    "flex items-center justify-between gap-2",
                    "p-3 rounded-xl",
                    "bg-neutral-900/50",
                    "border border-neutral-800/50",
                    isPendingOrOverdue &&
                      "hover:bg-neutral-800/40 transition-colors",
                  )}
                >
                  {/* Top: avatar + name + amount */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar size="lg" className="shrink-0">
                        {persona.avatar_url ? (
                          <AvatarImage
                            src={persona.avatar_url}
                            alt={persona.name}
                            className="object-cover border border-neutral-800"
                          />
                        ) : null}
                        <AvatarFallback
                          className={cn(
                            "text-xs font-medium text-neutral-400",
                            "bg-neutral-800 border border-neutral-700",
                          )}
                        >
                          {getInitials(persona.name)}
                        </AvatarFallback>
                        {config.iconName && (
                          <AvatarBadge
                            className={cn(
                              "size-4 bg-neutral-900 ring-neutral-900",
                              "border border-neutral-800",
                            )}
                          >
                            <Icon
                              icon={config.iconName}
                              width={10}
                              className={config.textClass}
                            />
                          </AvatarBadge>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-neutral-300 truncate">
                          {persona.name}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] font-medium",
                            config.textClass,
                          )}
                        >
                          {config.label(payment)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isPendingOrOverdue && (
                    <div className="flex items-center justify-end gap-1.5 pl-13">
                      <div className="flex items-center gap-2 shrink-0">
                        {payment.status === "confirmed" && (
                          <Icon
                            icon="solar:check-circle-bold"
                            className="text-emerald-500"
                            width={16}
                          />
                        )}
                        <span className="text-xs font-mono text-neutral-500">
                          {formatCurrency(totalOwed)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-medium",
                          "bg-emerald-500/10 hover:bg-emerald-500/20",
                          "text-emerald-400",
                          "border border-emerald-500/20",
                        )}
                        type="button"
                      >
                        <Icon icon="solar:check-circle-bold" width={12} />
                        Pagó
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-medium",
                          "bg-orange-500/10 hover:bg-orange-500/20",
                          "text-orange-400",
                          "border border-orange-500/20",
                        )}
                        type="button"
                      >
                        <Icon icon="solar:bell-bold" width={12} />
                        Recordar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 text-center py-3">
            {(service.members ?? []).length > 0
              ? "Sin ciclo de cobro activo"
              : "Sin miembros asignados"}
          </p>
        )}
      </CardContent>

      {/* Verification request section */}
      {pendingVerifications.length > 0 && (
        <CardFooter
          className={cn(
            "flex-col items-stretch gap-0 p-0",
            "border-t-0 bg-transparent",
            "rounded-b-[2rem]",
          )}
        >
          <Separator className="bg-neutral-800/60" />
          <div className="relative">
            <div className="absolute inset-0 bg-neutral-800/10" />
            <div className="relative p-6 pt-4 space-y-3">
              {pendingVerifications.map((payment) => {
                const persona = normalize(payment.personas) as {
                  id: string;
                  name: string;
                  email: string | null;
                  avatar_url: string | null;
                  profile_id: string | null;
                } | null;
                if (!persona) return null;

                const totalOwed =
                  Number(payment.amount_due) + Number(payment.accumulated_debt);

                return (
                  <div key={payment.id}>
                    {/* Claim header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
                          {persona.name} reclama pago
                        </span>
                      </div>
                      {payment.paid_at && (
                        <span className="text-[9px] text-neutral-500 font-mono">
                          {formatPaymentDate(payment.paid_at)}
                        </span>
                      )}
                    </div>

                    {/* Claim card */}
                    <div
                      className={cn(
                        "flex items-center justify-between",
                        "p-3 rounded-xl",
                        "bg-neutral-950",
                        "border border-neutral-800",
                        "shadow-inner",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar size="lg" className="shrink-0">
                          {persona.avatar_url ? (
                            <AvatarImage
                              src={persona.avatar_url}
                              alt={persona.name}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback
                            className={cn(
                              "text-xs font-medium text-neutral-400",
                              "bg-neutral-800 border border-neutral-700",
                            )}
                          >
                            {getInitials(persona.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs text-neutral-200 font-medium truncate">
                            {persona.name}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            Transferencia • {formatCurrency(totalOwed)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-lg bg-transparent",
                            "border-neutral-700",
                            "text-neutral-400 hover:text-white",
                            "hover:bg-neutral-800",
                          )}
                          type="button"
                        >
                          <Icon icon="solar:close-circle-linear" width={18} />
                        </Button>
                        <Button
                          size="sm"
                          className={cn(
                            "h-8 px-3 rounded-lg",
                            "bg-white text-black",
                            "text-[10px] font-semibold",
                            "hover:bg-neutral-200",
                            "border-transparent",
                            "shadow-[0_0_10px_rgba(255,255,255,0.1)]",
                          )}
                          type="button"
                        >
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
