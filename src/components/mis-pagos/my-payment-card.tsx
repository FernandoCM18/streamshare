"use client";

import { useTransition } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { markMyPaymentAsPaid } from "@/app/(dashboard)/mis-pagos/actions";
import { PaymentNotesSection } from "@/components/dashboard/payment-notes-section";
import { ServiceIconBox } from "@/components/shared/service-icon-box";
import { paymentStatusConfig } from "@/lib/status-config";
import {
  paymentRemaining,
  derivePaymentStatus,
} from "@/lib/payment-utils";

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
  creditAmountUsed?: number;
  requiresConfirmation?: boolean;
  confirmedAt?: string | null;
  paidAt?: string | null;
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
  creditAmountUsed = 0,
  requiresConfirmation,
  confirmedAt,
  paidAt,
  notes = [],
}: MyPaymentCardProps) {
  const [isPending, startTransition] = useTransition();

  // Derive status and remaining from amounts — never trust persisted status directly
  const paymentShape = {
    amount_due: amountDue,
    amount_paid: amountPaid,
    accumulated_debt: accumulatedDebt,
    credit_amount_used: creditAmountUsed,
    requires_confirmation: requiresConfirmation,
    confirmed_at: confirmedAt,
    paid_at: paidAt,
    due_date: dueDate,
  };
  const effectiveStatus = derivePaymentStatus(paymentShape);
  const remaining = paymentRemaining(paymentShape);
  // Restante propio del mes (sin arrastre): cada ciclo ya tiene su propia
  // tarjeta, mostrar el encadenado duplicaría la deuda visualmente
  const ownRemaining = Math.max(
    0,
    Math.round((amountDue - amountPaid - creditAmountUsed) * 100) / 100,
  );
  const actionable =
    effectiveStatus === "pending" ||
    effectiveStatus === "partial" ||
    effectiveStatus === "overdue";

  const statusCfg = paymentStatusConfig[effectiveStatus];
  const statusStyles = statusCfg.badgeClass;
  const statusLabel =
    effectiveStatus === "paid" ? "En verificación" : statusCfg.label;

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
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ServiceIconBox
            iconUrl={serviceIcon}
            color={serviceColor}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-100 truncate">
              {serviceName}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              Propietario: {ownerName}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-medium shrink-0",
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
            {formatCurrency(ownRemaining)}
          </p>
          {accumulatedDebt > 0 && remaining > 0 && (
            <p className="text-[10px] text-red-400 mt-0.5">
              + {formatCurrency(accumulatedDebt)} deuda anterior
            </p>
          )}
          {effectiveStatus === "partial" && amountPaid > 0 && (
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
