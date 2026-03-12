"use client";

import { useTransition } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { markMyPaymentAsPaid } from "@/app/(dashboard)/mis-pagos/actions";
import { PaymentNotesSection } from "@/components/dashboard/payment-notes-section";
import { ServiceIconBox } from "@/components/shared/service-icon-box";
import { paymentStatusConfig } from "@/lib/status-config";

interface PaymentNote {
  id: string;
  content: string;
  author_id: string;
  is_edited: boolean;
  created_at: string;
}

interface MyPaymentCardProps {
  paymentId: string;
  serviceName: string;
  serviceColor: string;
  serviceIcon: string | null;
  ownerName: string;
  status: "pending" | "partial" | "paid" | "confirmed" | "overdue";
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  accumulatedDebt: number;
  notes?: PaymentNote[];
}

export function MyPaymentCard({
  paymentId,
  serviceName,
  serviceColor,
  serviceIcon,
  ownerName,
  status,
  dueDate,
  amountDue,
  amountPaid,
  accumulatedDebt,
  notes = [],
}: MyPaymentCardProps) {
  const [isPending, startTransition] = useTransition();

  const remaining = amountDue + accumulatedDebt - amountPaid;
  const actionable =
    status === "pending" || status === "partial" || status === "overdue";

  const statusCfg = paymentStatusConfig[status];
  const statusStyles = statusCfg.badgeClass;
  const statusLabel =
    status === "paid" ? "En verificación" : statusCfg.label;

  function handleMarkPaid() {
    startTransition(async () => {
      const result = await markMyPaymentAsPaid(paymentId);
      if (result.success) {
        toast.success("Pago marcado correctamente", {
          description: "Tu propietario ahora puede confirmarlo.",
        });
      } else {
        toast.error("No se pudo marcar el pago", {
          description: result.error,
        });
      }
    });
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ServiceIconBox
            iconUrl={serviceIcon}
            color={serviceColor}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-neutral-100">
              {serviceName}
            </p>
            <p className="text-xs text-neutral-500">Propietario: {ownerName}</p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-medium",
            statusStyles,
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">
            Restante
          </p>
          <p className="text-xl font-semibold text-neutral-100">
            {formatCurrency(Math.max(0, remaining))}
          </p>
          {status === "partial" && amountPaid > 0 && (
            <p className="text-[10px] text-orange-400 mt-0.5">
              Pagado: {formatCurrency(amountPaid)} de{" "}
              {formatCurrency(amountDue + accumulatedDebt)}
            </p>
          )}
        </div>
        <p className="text-xs text-neutral-500">Vence: {formatDate(dueDate)}</p>
      </div>

      {notes.length > 0 && (
        <div className="mb-4">
          <PaymentNotesSection notes={notes} isOwner={false} />
        </div>
      )}

      {actionable ? (
        <button
          type="button"
          onClick={handleMarkPaid}
          disabled={isPending || remaining <= 0}
          className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
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
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-center text-xs text-neutral-500">
          Este pago no requiere acción por ahora.
        </div>
      )}
    </div>
  );
}
