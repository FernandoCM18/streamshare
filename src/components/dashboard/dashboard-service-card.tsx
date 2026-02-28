"use client";

import { Icon } from "@iconify/react";
import { cn, formatPaymentDate, formatCurrency } from "@/lib/utils";
import type { ServiceSummary } from "@/types/database";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getServiceStatusBadge } from "@/components/dashboard/service-card-utils";
import { MemberPaymentRow } from "@/components/dashboard/member-payment-row";
import { GuestPaymentRow } from "@/components/dashboard/guest-payment-row";
import { VerificationClaimRow } from "@/components/dashboard/verification-claim-row";

// Re-export for consumers that import MemberPayment from this module
export type { MemberPayment } from "@/components/dashboard/service-card-utils";

interface DashboardServiceCardProps {
  service: ServiceSummary;
  payments: import("@/components/dashboard/service-card-utils").MemberPayment[];
  isOwner?: boolean;
}

export function DashboardServiceCard({
  service,
  payments,
  isOwner = true,
}: DashboardServiceCardProps) {
  const firstDueDate = payments[0]?.due_date;
  const hasOverdue = payments.some((p) => p.status === "overdue");
  const statusBadge = getServiceStatusBadge(firstDueDate, hasOverdue);

  const pendingVerifications = payments.filter((p) => p.status === "paid");
  const regularPayments = payments.filter((p) => p.status !== "paid");

  const isIndividual =
    payments.length === 0 && (service.members ?? []).length === 0;

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
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium",
                isOwner
                  ? "bg-violet-500/10 border border-violet-500/20 text-violet-400"
                  : "bg-blue-500/10 border border-blue-500/20 text-blue-400",
              )}
            >
              <Icon
                icon={isOwner ? "solar:crown-bold" : "solar:user-bold"}
                width={9}
              />
              {isOwner ? "Propietario" : "Miembro"}
            </span>
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

      {/* Content — different for owner vs guest */}
      <CardContent className="p-6">
        {isOwner ? (
          // ── Owner view: show all members + their payment status ──
          isIndividual ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
              <Icon
                icon="solar:calendar-bold"
                width={16}
                className="text-neutral-500"
              />
              <p className="text-xs text-neutral-400">
                Próximo cobro:{" "}
                <span className="text-neutral-200 font-medium">
                  {firstDueDate
                    ? formatPaymentDate(firstDueDate)
                    : `${service.billing_day} de cada mes`}
                </span>
              </p>
            </div>
          ) : payments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {regularPayments.map((payment) => (
                <MemberPaymentRow
                  key={payment.id}
                  payment={payment}
                  serviceName={service.name}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-3">
              {(service.members ?? []).length > 0
                ? "Sin ciclo de cobro activo"
                : "Sin miembros asignados"}
            </p>
          )
        ) : // ── Guest view: show only your own payment ──
        payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map((payment) => (
              <GuestPaymentRow
                key={payment.id}
                payment={payment}
                serviceName={service.name}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 text-center py-3">
            Sin pagos pendientes este mes
          </p>
        )}
      </CardContent>

      {/* Verification request section — owner only */}
      {isOwner && pendingVerifications.length > 0 && (
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
              {pendingVerifications.map((payment) => (
                <VerificationClaimRow key={payment.id} payment={payment} />
              ))}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
