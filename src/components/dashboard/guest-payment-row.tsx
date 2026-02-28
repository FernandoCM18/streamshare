"use client";

import { useTransition } from "react";
import { Icon } from "@iconify/react";
import { cn, formatPaymentDate, formatCurrency } from "@/lib/utils";
import type { PaymentStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { markMyPaymentAsPaid } from "@/app/(dashboard)/mis-pagos/actions";
import { AmountPopover } from "@/components/dashboard/amount-popover";
import type { MemberPayment } from "@/components/dashboard/service-card-utils";

const guestStatusConfig: Record<
  PaymentStatus,
  { label: (p: MemberPayment) => string; textClass: string; iconName: string }
> = {
  confirmed: {
    label: () => "Confirmado",
    textClass: "text-emerald-500",
    iconName: "solar:check-circle-bold",
  },
  paid: {
    label: () => "Esperando confirmación",
    textClass: "text-emerald-500",
    iconName: "solar:hourglass-bold",
  },
  pending: {
    label: () => "Pendiente de pago",
    textClass: "text-orange-400",
    iconName: "solar:clock-circle-bold",
  },
  partial: {
    label: (p) =>
      `Pago parcial — ${formatCurrency(p.amount_paid)} de ${formatCurrency(Number(p.amount_due) + Number(p.accumulated_debt))}`,
    textClass: "text-orange-400",
    iconName: "solar:clock-circle-bold",
  },
  overdue: {
    label: () => "Vencido",
    textClass: "text-red-400",
    iconName: "solar:danger-circle-bold",
  },
};

export function GuestPaymentRow({
  payment,
  serviceName,
}: {
  payment: MemberPayment;
  serviceName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const totalOwed =
    Number(payment.amount_due) + Number(payment.accumulated_debt);
  const config = guestStatusConfig[payment.status];
  const canPay =
    payment.status === "pending" ||
    payment.status === "partial" ||
    payment.status === "overdue";

  function handleMarkPaid(amount: number) {
    startTransition(async () => {
      const result = await markMyPaymentAsPaid(payment.id, amount);
      if (result.success) {
        toast.success("¡Pago registrado!", {
          description: `${formatCurrency(amount)} en ${serviceName}`,
        });
      } else {
        toast.error("Error al registrar pago", {
          description: result.error,
        });
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        "p-3 rounded-xl",
        "bg-neutral-900/50",
        "border border-neutral-800/50",
        isPending && "opacity-60 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center",
            "bg-neutral-800 border border-neutral-700",
          )}
        >
          <Icon
            icon={config.iconName}
            width={16}
            className={config.textClass}
          />
        </div>
        <div className="min-w-0">
          <p className={cn("text-xs font-medium", config.textClass)}>
            {config.label(payment)}
          </p>
          <p className="text-[10px] text-neutral-500">
            {payment.status === "partial"
              ? `Restante: ${formatCurrency(totalOwed - Number(payment.amount_paid))} • Vence ${formatPaymentDate(payment.due_date)}`
              : `${formatCurrency(totalOwed)} • Vence ${formatPaymentDate(payment.due_date)}`}
          </p>
        </div>
      </div>

      {canPay ? (
        <AmountPopover
          defaultAmount={
            payment.status === "partial"
              ? totalOwed - Number(payment.amount_paid)
              : totalOwed
          }
          label="¿Cuánto pagaste?"
          onConfirm={handleMarkPaid}
          isPending={isPending}
        >
          <Button
            variant="ghost"
            size="xs"
            className={cn(
              "px-3 py-1.5 text-[10px] font-medium shrink-0",
              "bg-violet-500/10 hover:bg-violet-500/20",
              "text-violet-400",
              "border border-violet-500/20",
            )}
            type="button"
            disabled={isPending}
          >
            {isPending ? (
              <Icon
                icon="solar:refresh-bold"
                width={12}
                className="animate-spin"
              />
            ) : (
              <Icon icon="solar:hand-money-bold" width={12} />
            )}
            Ya pagué
          </Button>
        </AmountPopover>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          <Icon
            icon="solar:check-circle-bold"
            className="text-emerald-500"
            width={14}
          />
          <span className="text-[10px] font-medium text-emerald-400">
            {payment.status === "paid" ? "Enviado" : "Listo"}
          </span>
        </div>
      )}
    </div>
  );
}
