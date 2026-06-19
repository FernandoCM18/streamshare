"use client";

import { useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  formatCurrency,
  getInitials,
  formatPaymentDate,
  formatPeriod,
} from "@/lib/utils";
import type { ServiceSummary, ServiceMemberInfo } from "@/types/database";
import type { MemberPayment } from "@/components/dashboard/service-card-utils";
import {
  paymentObligation,
  paymentRemaining,
  sortPaymentsForHistory,
  derivePaymentStatus,
} from "@/lib/payment-utils";
import type { PairSummary } from "@/lib/compute-payment-summaries";
import {
  addPaymentNote,
  updatePaymentNote,
  deletePaymentNote,
  voidPayment,
  editPaymentAmount,
} from "@/app/(dashboard)/dashboard/actions";
import { serviceStatusConfig, paymentStatusConfig } from "@/lib/status-config";
import { StatusBadge } from "@/components/shared/status-badge";
import { ModalHeader } from "@/components/shared/modal-header";
import { PaymentProgressBar } from "@/components/shared/payment-progress-bar";
import { NoteItem } from "@/components/shared/note-item";
import type { NoteData } from "@/components/shared/note-item";

const splitTypeLabels: Record<string, string> = {
  equal: "Dividido igual",
  custom: "Montos personalizados",
};

/* ─── Add Note Inline Form ─── */

function AddNoteForm({
  paymentId,
  onDone,
}: {
  paymentId: string;
  onDone: () => void;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await addPaymentNote(paymentId, content.trim());
      if (result.success) {
        setContent("");
        onDone();
        toast.success("Nota agregada");
      } else {
        toast.error("Error al agregar nota", { description: result.error });
      }
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        isPending && "opacity-60 pointer-events-none",
      )}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe una nota..."
        className={cn(
          "w-full bg-neutral-900/20 border border-neutral-800",
          "focus:border-neutral-600 rounded-lg px-2.5 py-1.5",
          "text-neutral-200 placeholder:text-neutral-600",
          "text-[11px] focus:outline-none focus:ring-0",
          "transition-all resize-none",
        )}
        rows={2}
        autoFocus
      />
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="xs"
          className="px-2 py-0.5 text-[10px] font-medium bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20"
          type="button"
          disabled={isPending || !content.trim()}
          onClick={handleSubmit}
        >
          {isPending ? (
            <Icon
              icon="solar:refresh-bold"
              width={10}
              className="animate-spin"
            />
          ) : (
            <Icon icon="solar:chat-line-bold" width={10} />
          )}
          Agregar
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className="px-2 py-0.5 text-[10px] font-medium bg-neutral-800/40 hover:bg-neutral-700/60 text-neutral-400"
          type="button"
          onClick={onDone}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/* ─── Payment History Row ─── */

function PaymentRow({ payment }: { payment: MemberPayment }) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const member = Array.isArray(payment.members)
    ? (
        payment.members as unknown as {
          name: string;
          avatar_url: string | null;
        }[]
      )[0]
    : payment.members;
  const effectiveStatus = derivePaymentStatus(payment);
  const statusCfg =
    paymentStatusConfig[effectiveStatus] ?? paymentStatusConfig.pending;
  const paidDate = payment.confirmed_at ?? payment.paid_at;
  const notes = payment.payment_notes ?? [];
  const period = payment.billing_cycles
    ? formatPeriod(
        payment.billing_cycles.period_end ?? payment.billing_cycles.period_start,
      )
    : null;
  const hasPaid =
    Number(payment.amount_paid) > 0 ||
    Number(payment.credit_amount_used ?? 0) > 0;

  // Detect late payment: paid/confirmed after the billing cycle's period ended
  const isLatePayment = (() => {
    if (!paidDate || !payment.billing_cycles?.period_end) return false;
    const paid = new Date(paidDate).getTime();
    const periodEnd = new Date(payment.billing_cycles.period_end).getTime();
    return paid > periodEnd;
  })();

  // Detect credit-covered payment: confirmed but amount_paid = 0
  const isCreditCovered =
    (effectiveStatus === "confirmed" || effectiveStatus === "paid") &&
    Number(payment.amount_paid) === 0 &&
    Number(payment.credit_amount_used ?? 0) > 0;

  function handleVoid() {
    startTransition(async () => {
      const result = await voidPayment(payment.id);
      if (result.success) {
        toast.success("Pago anulado");
      } else {
        toast.error("Error al anular pago", { description: result.error });
      }
    });
  }

  function handleEditSave() {
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount < 0) {
      toast.error("Monto inválido");
      return;
    }
    startTransition(async () => {
      const result = await editPaymentAmount(payment.id, newAmount);
      if (result.success) {
        setEditing(false);
        toast.success("Monto actualizado");
        if (
          result.result?.credit_generated &&
          result.result.credit_generated > 0
        ) {
          toast.info(
            `Se generó un crédito de ${formatCurrency(result.result.credit_generated)}`,
          );
        }
      } else {
        toast.error("Error al editar pago", { description: result.error });
      }
    });
  }

  return (
    <div
      className={cn("px-4 py-3", isPending && "opacity-60 pointer-events-none")}
    >
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center text-[9px] font-semibold text-neutral-300 shrink-0">
          {member ? getInitials(member.name) : "?"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium text-neutral-200 truncate">
              {member?.name ?? "Desconocido"}
            </span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[9px] font-medium border shrink-0",
                statusCfg.bgClass,
                statusCfg.borderClass,
                statusCfg.textClass,
              )}
            >
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {paidDate ? (
              <span className="text-[10px] text-neutral-500">
                {formatPaymentDate(paidDate)}
              </span>
            ) : isCreditCovered ? (
              <span className="text-[10px] text-violet-400/70">
                Saldo a favor
              </span>
            ) : Number(payment.credit_amount_used ?? 0) > 0 ? (
              <span className="text-[10px] text-violet-400/70">
                Crédito: {formatCurrency(Number(payment.credit_amount_used))}
              </span>
            ) : (
              <span className="text-[10px] text-neutral-600">Sin pagar</span>
            )}
            {period && (
              <>
                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                <span className="text-[10px] text-neutral-600">{period}</span>
              </>
            )}
            {isLatePayment && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-400/10 border border-amber-400/20 text-amber-400 shrink-0">
                Tardío
              </span>
            )}
            {isCreditCovered && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-violet-500/10 border border-violet-500/20 text-violet-400 shrink-0">
                Crédito
              </span>
            )}
          </div>
        </div>

        {/* Amount + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span
              className={cn(
                "text-[13px] font-semibold tabular-nums",
                effectiveStatus === "confirmed"
                  ? "text-emerald-400"
                  : effectiveStatus === "paid"
                    ? "text-emerald-400/70"
                    : "text-neutral-400",
              )}
            >
              {formatCurrency(
                Number(payment.amount_paid) ||
                  Number(payment.credit_amount_used ?? 0) ||
                  Number(payment.amount_due),
              )}
            </span>
            {Number(payment.amount_paid) > 0 &&
              Number(payment.amount_paid) < Number(payment.amount_due) && (
                <p className="text-[9px] text-neutral-600">
                  de {formatCurrency(payment.amount_due)}
                </p>
              )}
          </div>

          {/* Edit/Delete buttons — only for payments with amount_paid > 0 */}
          {hasPaid && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6 text-neutral-600 hover:text-neutral-300"
                type="button"
                onClick={() => {
                  setEditAmount(String(payment.amount_paid));
                  setEditing(true);
                }}
              >
                <Icon icon="solar:pen-linear" width={12} />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-6 w-6 text-neutral-600 hover:text-red-400"
                    type="button"
                  >
                    <Icon icon="solar:trash-bin-2-linear" width={12} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-neutral-950 border-neutral-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-neutral-100">
                      Anular pago
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-400">
                      Se revertirá el pago de{" "}
                      <span className="text-neutral-200 font-medium">
                        {formatCurrency(payment.amount_paid)}
                      </span>{" "}
                      de {member?.name ?? "este miembro"} a estado pendiente.
                      Los créditos generados serán cancelados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                      onClick={handleVoid}
                    >
                      Anular pago
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {/* Edit Amount Inline Form */}
      {editing && (
        <div className="mt-2 ml-11 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500">Nuevo monto:</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className={cn(
                "w-28 bg-neutral-900/20 border border-neutral-800",
                "focus:border-neutral-600 rounded-lg px-2.5 py-1",
                "text-neutral-200 text-[12px] tabular-nums",
                "focus:outline-none focus:ring-0 transition-all",
              )}
              autoFocus
            />
            <span className="text-[10px] text-neutral-600">
              de {formatCurrency(payment.amount_due)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="xs"
              className="px-2 py-0.5 text-[10px] font-medium bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20"
              type="button"
              disabled={isPending || !editAmount}
              onClick={handleEditSave}
            >
              <Icon icon="solar:check-read-bold" width={10} />
              Guardar
            </Button>
            <Button
              variant="ghost"
              size="xs"
              className="px-2 py-0.5 text-[10px] font-medium bg-neutral-800/40 hover:bg-neutral-700/60 text-neutral-400"
              type="button"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <div className="mt-2 ml-11 flex flex-col gap-1">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note as NoteData}
              isOwner={true}
              onUpdate={updatePaymentNote}
              onDelete={deletePaymentNote}
            />
          ))}
        </div>
      )}

      {/* Add note */}
      <div className="mt-1.5 ml-11">
        {showAddNote ? (
          <AddNoteForm
            paymentId={payment.id}
            onDone={() => setShowAddNote(false)}
          />
        ) : (
          <button
            type="button"
            className="flex items-center gap-1 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
            onClick={() => setShowAddNote(true)}
          >
            <Icon icon="solar:chat-line-bold" width={10} />
            Agregar nota
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main Modal ─── */

interface ServiceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceSummary;
  payments?: MemberPayment[];
  summaries?: Record<string, PairSummary>;
}

export default function ServiceDetailModal({
  open,
  onOpenChange,
  service,
  payments = [],
  summaries = {},
}: ServiceDetailModalProps) {
  const viewMembers: ServiceMemberInfo[] = service.members ?? [];
  const status =
    serviceStatusConfig[service.status] ?? serviceStatusConfig.pending;

  const latestPeriodStart = payments.reduce((best, p) => {
    const ps = p.billing_cycles?.period_start ?? "";
    return ps > best ? ps : best;
  }, "");

  const currentCyclePayments =
    latestPeriodStart !== ""
      ? payments.filter(
          (p) => (p.billing_cycles?.period_start ?? "") === latestPeriodStart,
        )
      : payments;

  const { computedCollected, computedPending } = (() => {
    if (payments.length === 0) {
      return {
        computedCollected: service.collected_amount,
        computedPending: service.pending_amount,
      };
    }
    let collected = 0;
    let pending = 0;
    for (const [key, s] of Object.entries(summaries)) {
      if (!key.endsWith(`:${service.id}`)) continue;
      collected += s.totalCollected;
      pending += s.totalDebt;
    }
    return {
      computedCollected: Math.round(collected * 100) / 100,
      computedPending: Math.round(pending * 100) / 100,
    };
  })();

  const totalCost = service.monthly_cost;
  const totalObligation =
    currentCyclePayments.length > 0
      ? currentCyclePayments.reduce((sum, p) => sum + paymentObligation(p), 0)
      : totalCost;
  const collectedPercent =
    totalObligation > 0
      ? Math.min(100, Math.round((computedCollected / totalObligation) * 100))
      : 0;

  // Map member_id → their most recent cycle payment
  const memberLatestPayment = new Map<string, MemberPayment>();
  for (const payment of payments) {
    const existing = memberLatestPayment.get(payment.member_id);
    if (!existing) {
      memberLatestPayment.set(payment.member_id, payment);
    } else {
      const existingPeriod = existing.billing_cycles?.period_start ?? "";
      const newPeriod = payment.billing_cycles?.period_start ?? "";
      if (newPeriod > existingPeriod) {
        memberLatestPayment.set(payment.member_id, payment);
      }
    }
  }

  // Historial: ciclo más reciente primero; sin pago registrado arriba del ciclo; luego por actividad
  const sortedPayments = sortPaymentsForHistory(payments);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] bg-neutral-950 border-neutral-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 gap-0 flex flex-col overflow-hidden sm:max-w-2xl sm:max-h-[90vh] data-closed:slide-out-to-bottom-4 data-open:slide-in-from-bottom-4 duration-200"
        showCloseButton={false}
      >
        {/* Drag Handle (mobile only) */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header with colored accent */}
        <ModalHeader
          color={service.color}
          iconUrl={service.icon_url}
          title={service.name}
          badge={
            <>
              <StatusBadge
                badgeClass={status.badgeClass}
                label={status.label}
                icon={status.icon}
                dotClass={status.dotClass}
              />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-medium text-violet-400">
                <Icon icon="solar:crown-bold" width={9} />
                Propietario
              </span>
            </>
          }
          subtitle={
            <>
              <span className="font-medium text-neutral-300">
                {formatCurrency(service.monthly_cost)}
              </span>
              <span className="text-neutral-600">/mes</span>
              <span className="w-1 h-1 rounded-full bg-neutral-700" />
              <span>Dia {service.billing_day}</span>
              <span className="w-1 h-1 rounded-full bg-neutral-700" />
              <span>
                {splitTypeLabels[service.split_type] ?? service.split_type}
              </span>
            </>
          }
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* Financial Overview */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden">
            <PaymentProgressBar
              percent={collectedPercent}
              color={service.color}
              label="Cobro del mes"
            />
            <div className="grid grid-cols-2 divide-x divide-neutral-800/60">
              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                    Por cobrar
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums tracking-tight",
                    computedPending > 0
                      ? "text-orange-400"
                      : "text-neutral-500",
                  )}
                >
                  {formatCurrency(computedPending)}
                </span>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                    Cobrado
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums tracking-tight",
                    computedCollected > 0
                      ? "text-emerald-400"
                      : "text-neutral-500",
                  )}
                >
                  {formatCurrency(computedCollected)}
                </span>
              </div>
            </div>
          </div>

          {/* Members */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Miembros
              </h2>
              <span className="text-[11px] font-medium text-neutral-600 tabular-nums">
                {viewMembers.length}{" "}
                {viewMembers.length === 1 ? "persona" : "personas"}
              </span>
            </div>
            {viewMembers.length > 0 ? (
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden divide-y divide-neutral-800/40">
                {viewMembers.map((member) => {
                  const memberAmount = member.custom_amount
                    ? member.custom_amount
                    : service.monthly_cost / (viewMembers.length + 1);
                  const memberPercent =
                    totalCost > 0
                      ? Math.round((memberAmount / totalCost) * 100)
                      : 0;
                  const latestPayment = memberLatestPayment.get(
                    member.member_id,
                  );
                  const memberStatusCfg = latestPayment
                    ? (paymentStatusConfig[derivePaymentStatus(latestPayment)] ?? null)
                    : null;

                  return (
                    <div key={member.member_id} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center text-[10px] font-semibold text-neutral-300 shrink-0">
                          {getInitials(member.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium text-neutral-200 truncate">
                              {member.name}
                            </span>
                            {memberStatusCfg && (
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded-full text-[9px] font-medium border shrink-0",
                                  memberStatusCfg.bgClass,
                                  memberStatusCfg.borderClass,
                                  memberStatusCfg.textClass,
                                )}
                              >
                                {memberStatusCfg.label}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-500">
                            {memberPercent}% del total
                          </span>
                        </div>
                        <span className="text-[13px] font-semibold text-neutral-300 tabular-nums shrink-0">
                          {formatCurrency(memberAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/10 p-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Icon
                    icon="solar:users-group-rounded-linear"
                    width={20}
                    className="text-neutral-600"
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  No hay miembros en este servicio
                </p>
              </div>
            )}
          </section>

          {/* Payment History */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Historial de pagos
              </h2>
              <span className="text-[11px] font-medium text-neutral-600 tabular-nums">
                {sortedPayments.length}{" "}
                {sortedPayments.length === 1 ? "pago" : "pagos"}
              </span>
            </div>
            {sortedPayments.length > 0 ? (
              <div
                className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden divide-y divide-neutral-800/40"
                style={{ contentVisibility: "auto" }}
              >
                {sortedPayments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/10 p-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Icon
                    icon="solar:wallet-money-linear"
                    width={20}
                    className="text-neutral-600"
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  No hay pagos registrados
                </p>
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
