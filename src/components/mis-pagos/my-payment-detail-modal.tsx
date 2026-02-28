"use client";

import { useTransition } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { markMyPaymentAsPaid } from "@/app/(dashboard)/mis-pagos/actions";
import type { MyPayment } from "@/types/database";

// ── Helpers ───────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; badgeClass: string; description: string }
> = {
  pending: {
    label: "Pendiente",
    badgeClass: "bg-orange-400/10 border border-orange-400/20 text-orange-400",
    description: "Aun no has realizado el pago.",
  },
  partial: {
    label: "Parcial",
    badgeClass: "bg-orange-400/10 border border-orange-400/20 text-orange-400",
    description: "Has pagado una parte del monto total.",
  },
  paid: {
    label: "En verificacion",
    badgeClass: "bg-blue-500/10 border border-blue-500/20 text-blue-400",
    description: "Tu pago esta siendo verificado por el propietario.",
  },
  confirmed: {
    label: "Confirmado",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    description: "El propietario confirmo tu pago.",
  },
  overdue: {
    label: "Vencido",
    badgeClass: "bg-red-500/10 border border-red-500/20 text-red-400",
    description: "La fecha de vencimiento ya paso.",
  },
};

// ── Component ─────────────────────────────────────────────────

interface MyPaymentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: MyPayment;
}

export function MyPaymentDetailModal({
  open,
  onOpenChange,
  payment,
}: MyPaymentDetailModalProps) {
  const [isPending, startTransition] = useTransition();

  const remaining =
    payment.amount_due + payment.accumulated_debt - payment.amount_paid;
  const actionable =
    payment.status === "pending" ||
    payment.status === "partial" ||
    payment.status === "overdue";
  const status = statusConfig[payment.status] ?? statusConfig.pending;

  function handleMarkPaid() {
    startTransition(async () => {
      const result = await markMyPaymentAsPaid(payment.id);
      if (result.success) {
        toast.success("Pago marcado correctamente", {
          description: "Tu propietario ahora puede confirmarlo.",
        });
        onOpenChange(false);
      } else {
        toast.error("No se pudo marcar el pago", {
          description: result.error,
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] bg-neutral-950 border-neutral-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 gap-0 flex flex-col overflow-hidden sm:max-w-md sm:max-h-[90vh]"
        showCloseButton={false}
      >
        {/* Drag Handle (mobile) */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 bg-neutral-950/80 border-b border-neutral-800/80 pt-3 pr-5 pb-4 pl-5 sm:px-6 sm:pt-5 backdrop-blur-xl items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-xl bg-black border border-neutral-800 flex items-center justify-center shadow-lg shrink-0"
              style={{
                boxShadow: `0 4px 14px ${payment.service_color}1a`,
              }}
            >
              <Icon
                icon={payment.service_icon ?? "solar:tv-bold"}
                width={24}
                style={{ color: payment.service_color }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg font-bold text-white tracking-tight">
                  {payment.service_name}
                </DialogTitle>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium",
                    status.badgeClass,
                  )}
                >
                  {status.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                Propietario: {payment.owner_name}
              </p>
            </div>
          </div>

          <DialogClose className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none shrink-0 mt-1">
            <Icon icon="solar:close-circle-linear" width={20} />
          </DialogClose>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          {/* Status description */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800/60">
            <Icon
              icon="solar:info-circle-linear"
              width={16}
              className="text-neutral-500 shrink-0 mt-0.5"
            />
            <p className="text-[13px] text-neutral-400 leading-relaxed">
              {status.description}
            </p>
          </div>

          {/* Amount breakdown */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-200">Desglose</h2>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 divide-y divide-neutral-800/60">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-neutral-400">
                  Monto mensual
                </span>
                <span className="text-[13px] font-medium text-neutral-200 tabular-nums">
                  {formatCurrency(payment.amount_due)}
                </span>
              </div>
              {payment.accumulated_debt > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[13px] text-red-400">
                    Deuda acumulada
                  </span>
                  <span className="text-[13px] font-medium text-red-400 tabular-nums">
                    +{formatCurrency(payment.accumulated_debt)}
                  </span>
                </div>
              )}
              {payment.amount_paid > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[13px] text-emerald-400">Pagado</span>
                  <span className="text-[13px] font-medium text-emerald-400 tabular-nums">
                    -{formatCurrency(payment.amount_paid)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/40">
                <span className="text-[13px] font-semibold text-neutral-200">
                  Restante
                </span>
                <span className="text-base font-bold text-white tabular-nums">
                  {formatCurrency(Math.max(0, remaining))}
                </span>
              </div>
            </div>
          </div>

          {/* Due date */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-neutral-900/30 border-neutral-800">
            <Icon
              icon="solar:calendar-bold"
              width={16}
              className="text-neutral-500 shrink-0"
            />
            <div>
              <p className="text-[13px] font-medium text-neutral-200">
                Fecha de vencimiento
              </p>
              <p className="text-[11px] text-neutral-500">
                {formatDate(payment.due_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer action */}
        {actionable && (
          <div className="shrink-0 border-t border-neutral-800/60 p-5 sm:p-6">
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={isPending || remaining <= 0}
              className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Icon
                    icon="solar:refresh-bold"
                    className="h-4 w-4 animate-spin"
                  />
                  Enviando...
                </span>
              ) : (
                "Marcar como pagado"
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
