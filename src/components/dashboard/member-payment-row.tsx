"use client";

import { useTransition } from "react";
import { Icon } from "@iconify/react";
import {
  cn,
  formatPaymentDate,
  getInitials,
  formatCurrency,
} from "@/lib/utils";
import type { PaymentStatus } from "@/types/database";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { registerAndConfirmPayment } from "@/app/(dashboard)/dashboard/actions";
import { RemindDrawer } from "@/components/dashboard/remind-drawer";
import { AmountPopover } from "@/components/dashboard/amount-popover";
import {
  normalize,
  type MemberPayment,
} from "@/components/dashboard/service-card-utils";

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

export function MemberPaymentRow({
  payment,
  serviceName,
}: {
  payment: MemberPayment;
  serviceName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const member = normalize(payment.members) as {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    profile_id: string | null;
  } | null;
  if (!member) return null;

  const config = memberStatusConfig[payment.status];
  const totalOwed =
    Number(payment.amount_due) + Number(payment.accumulated_debt);
  const remaining =
    totalOwed - Number(payment.amount_paid);
  const isActionable =
    payment.status === "pending" ||
    payment.status === "partial" ||
    payment.status === "overdue";

  function handleRegister(amount: number) {
    startTransition(async () => {
      const result = await registerAndConfirmPayment(payment.id, amount);
      if (result.success) {
        toast.success(
          result.confirmed
            ? `Pago de ${member!.name} confirmado`
            : `Pago parcial de ${member!.name} registrado`,
          { description: `${formatCurrency(amount)} en ${serviceName}` },
        );
        if (result.result?.credit_generated) {
          toast.info(
            `Crédito generado: ${formatCurrency(result.result.credit_amount)}`,
            { description: `Se aplicará al próximo ciclo de ${member!.name}` },
          );
        }
      } else {
        toast.error("Error al registrar pago", {
          description: result.error,
        });
      }
    });
  }

  function handleMarkFullPaid() {
    handleRegister(remaining);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        "p-3 rounded-xl",
        "bg-neutral-900/50",
        "border border-neutral-800/50",
        isActionable && "hover:bg-neutral-800/40 transition-colors",
        isPending && "opacity-60 pointer-events-none",
      )}
    >
      {/* Top row: Avatar + name + status + amount */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar size="lg" className="shrink-0">
            {member.avatar_url ? (
              <AvatarImage
                src={member.avatar_url}
                alt={member.name}
                className="object-cover border border-neutral-800"
              />
            ) : null}
            <AvatarFallback
              className={cn(
                "text-xs font-medium text-neutral-400",
                "bg-neutral-800 border border-neutral-700",
              )}
            >
              {getInitials(member.name)}
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
              {member.name}
            </p>
            <p className={cn("text-[10px] font-medium", config.textClass)}>
              {config.label(payment)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-500 shrink-0">
            {formatCurrency(remaining)}
          </span>
          {/* Confirmed/paid amount (non-actionable states) */}
          {!isActionable && (
            <div className="flex items-center gap-2 justify-end">
              {(payment.status === "confirmed" ||
                payment.status === "paid") && (
                <Icon
                  icon="solar:check-circle-bold"
                  className="text-emerald-500"
                  width={16}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {isActionable && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            className={cn(
              "flex-1 px-2.5 py-1 text-[10px] font-medium",
              "bg-emerald-500/10 hover:bg-emerald-500/20",
              "text-emerald-400",
              "border border-emerald-500/20",
            )}
            type="button"
            disabled={isPending}
            onClick={handleMarkFullPaid}
          >
            {isPending ? (
              <Icon
                icon="solar:refresh-bold"
                width={12}
                className="animate-spin"
              />
            ) : (
              <Icon icon="solar:check-circle-bold" width={12} />
            )}
            {payment.status === "partial" ? "Pagó el resto" : "Pagó todo"}
          </Button>
          <AmountPopover
            defaultAmount={remaining}
            label={`¿Cuánto pagó ${member.name}?`}
            onConfirm={handleRegister}
            isPending={isPending}
          >
            <Button
              variant="ghost"
              size="xs"
              className={cn(
                "flex-1 px-2.5 py-1 text-[10px] font-medium",
                "bg-violet-500/10 hover:bg-violet-500/20",
                "text-violet-400",
                "border border-violet-500/20",
              )}
              type="button"
              disabled={isPending}
            >
              <Icon icon="solar:pen-new-square-bold" width={12} />
              Otro monto
            </Button>
          </AmountPopover>
          <RemindDrawer
            memberName={member.name}
            memberPhone={member.phone}
            memberEmail={member.email}
            serviceName={serviceName}
            amount={remaining}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                "px-1.5 py-1",
                "bg-orange-500/10 hover:bg-orange-500/20",
                "text-orange-400",
                "border border-orange-500/20",
              )}
              type="button"
            >
              <Icon icon="solar:bell-bold" width={12} />
            </Button>
          </RemindDrawer>
        </div>
      )}
    </div>
  );
}
