"use client";

import { useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { markMyPaymentAsPaid } from "@/app/(dashboard)/mis-pagos/actions";
import { PaymentConfirmModal } from "@/components/dashboard/payment-confirm-modal";
import type { MyPayment } from "@/types/database";
import { PaymentNotesSection } from "@/components/dashboard/payment-notes-section";
import { paymentStatusConfig } from "@/lib/status-config";
import { ModalHeader } from "@/components/shared/modal-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaymentProgressBar } from "@/components/shared/payment-progress-bar";

// ── Component ─────────────────────────────────────────────────

interface PaymentNote {
  id: string;
  content: string;
  author_id: string;
  is_edited: boolean;
  created_at: string;
}

interface MyPaymentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: MyPayment;
  notes?: PaymentNote[];
}

export function MyPaymentDetailModal({
  open,
  onOpenChange,
  payment,
  notes = [],
}: MyPaymentDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const remaining =
    payment.amount_due + payment.accumulated_debt - payment.amount_paid;
  const actionable =
    payment.status === "pending" ||
    payment.status === "partial" ||
    payment.status === "overdue";
  const status = paymentStatusConfig[payment.status as keyof typeof paymentStatusConfig] ?? paymentStatusConfig.pending;

  function handleMarkPaid(amount: number, note?: string) {
    startTransition(async () => {
      const result = await markMyPaymentAsPaid(payment.id, amount, note);
      if (result.success) {
        setConfirmModalOpen(false);
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

  const totalOwed = payment.amount_due + payment.accumulated_debt;
  const paidPercent =
    totalOwed > 0
      ? Math.min(100, Math.round((payment.amount_paid / totalOwed) * 100))
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] bg-neutral-950 border-neutral-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 gap-0 flex flex-col overflow-hidden sm:max-w-md sm:max-h-[90vh] data-closed:slide-out-to-bottom-4 data-open:slide-in-from-bottom-4 duration-200"
        showCloseButton={false}
      >
        {/* Drag Handle (mobile) */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header with colored accent */}
        <ModalHeader
          color={payment.service_color}
          iconUrl={payment.service_icon}
          title={payment.service_name}
          badge={
            <StatusBadge
              badgeClass={status.badgeClass}
              label={payment.status === "paid" ? "En verificacion" : status.label}
            />
          }
          subtitle={
            <>
              <span>Propietario:</span>
              <span className="font-medium text-neutral-300">
                {payment.owner_name}
              </span>
            </>
          }
        />

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* Status description */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-900/30 border border-neutral-800/60">
            <Icon
              icon="solar:info-circle-linear"
              width={16}
              className="text-neutral-500 shrink-0 mt-0.5"
            />
            <p className="text-[13px] text-neutral-400 leading-relaxed">
              {status.description}
            </p>
          </div>

          {/* Amount breakdown — unified card */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden">
            {/* Progress header */}
            <PaymentProgressBar
              percent={paidPercent}
              color={payment.service_color}
              label="Progreso de pago"
            />

            {/* Breakdown rows */}
            <div className="divide-y divide-neutral-800/40">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                  <span className="text-[13px] text-neutral-400">
                    Monto mensual
                  </span>
                </div>
                <span className="text-[13px] font-medium text-neutral-200 tabular-nums">
                  {formatCurrency(payment.amount_due)}
                </span>
              </div>
              {payment.accumulated_debt > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="text-[13px] text-red-400">
                      Deuda acumulada
                    </span>
                  </div>
                  <span className="text-[13px] font-medium text-red-400 tabular-nums">
                    +{formatCurrency(payment.accumulated_debt)}
                  </span>
                </div>
              )}
              {payment.amount_paid > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[13px] text-emerald-400">Pagado</span>
                  </div>
                  <span className="text-[13px] font-medium text-emerald-400 tabular-nums">
                    -{formatCurrency(payment.amount_paid)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3.5 bg-neutral-800/20">
                <span className="text-[13px] font-semibold text-neutral-200">
                  Restante
                </span>
                <span className="text-lg font-bold text-white tabular-nums tracking-tight">
                  {formatCurrency(Math.max(0, remaining))}
                </span>
              </div>
            </div>
          </div>

          {/* Due date */}
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-neutral-800/80 bg-neutral-900/20">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
              <Icon
                icon="solar:calendar-bold"
                width={16}
                className="text-neutral-400"
              />
            </div>
            <div>
              <p className="text-[13px] font-medium text-neutral-200">
                Fecha de vencimiento
              </p>
              <p className="text-[11px] text-neutral-500">
                {formatDate(payment.due_date)}
              </p>
            </div>
          </div>

          {/* Payment notes */}
          {notes.length > 0 && (
            <section>
              <h2 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-3">
                Notas
              </h2>
              <PaymentNotesSection notes={notes} isOwner={false} />
            </section>
          )}
        </div>

        {/* Footer action */}
        {actionable && (
          <div className="shrink-0 border-t border-neutral-800/60 p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              disabled={isPending || remaining <= 0}
              className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/15 hover:border-emerald-500/30 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              Marcar como pagado
            </button>
            <PaymentConfirmModal
              open={confirmModalOpen}
              onOpenChange={setConfirmModalOpen}
              defaultAmount={Math.max(0, remaining)}
              memberName="Mi pago"
              serviceName={payment.service_name}
              isPending={isPending}
              onConfirm={handleMarkPaid}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
