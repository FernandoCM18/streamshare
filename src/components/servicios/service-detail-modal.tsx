"use client";

import { useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
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
  addPaymentNote,
  updatePaymentNote,
  deletePaymentNote,
  voidPayment,
  editPaymentAmount,
} from "@/app/(dashboard)/dashboard/actions";

const serviceStatusConfig: Record<
  string,
  { label: string; badgeClass: string; icon?: string; dotClass?: string }
> = {
  active: {
    label: "Activo",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    icon: "solar:check-circle-bold",
  },
  pending: {
    label: "Pausado",
    badgeClass: "bg-neutral-800 border border-neutral-700 text-neutral-500",
  },
  overdue: {
    label: "Vence pronto",
    badgeClass: "bg-red-500/10 border border-red-500/20 text-red-400",
    dotClass: "animate-pulse",
  },
};

const splitTypeLabels: Record<string, string> = {
  equal: "Dividido igual",
  custom: "Montos personalizados",
};

const paymentStatusConfig: Record<
  string,
  { label: string; textClass: string; bgClass: string; borderClass: string }
> = {
  confirmed: {
    label: "Confirmado",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
  },
  paid: {
    label: "Por confirmar",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
  },
  partial: {
    label: "Parcial",
    textClass: "text-orange-400",
    bgClass: "bg-orange-400/10",
    borderClass: "border-orange-400/20",
  },
  pending: {
    label: "Pendiente",
    textClass: "text-orange-400",
    bgClass: "bg-orange-400/10",
    borderClass: "border-orange-400/20",
  },
  overdue: {
    label: "Vencido",
    textClass: "text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
  },
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

/* ─── Inline Note Item (edit/delete) ─── */

interface NoteData {
  id: string;
  content: string;
  author_id: string;
  is_edited: boolean;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

function NoteItem({
  note,
  isOwner,
}: {
  note: NoteData;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isPending, startTransition] = useTransition();

  const authorName = note.profiles?.display_name ?? "Usuario";
  const authorAvatar = note.profiles?.avatar_url;
  const initials = getInitials(authorName);

  function handleSave() {
    if (!editContent.trim()) return;
    startTransition(async () => {
      const result = await updatePaymentNote(note.id, editContent.trim());
      if (result.success) {
        setEditing(false);
        toast.success("Nota actualizada");
      } else {
        toast.error("Error al actualizar nota", {
          description: result.error,
        });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePaymentNote(note.id);
      if (result.success) {
        toast.success("Nota eliminada");
      } else {
        toast.error("Error al eliminar nota", {
          description: result.error,
        });
      }
    });
  }

  return (
    <div
      className={cn(
        "flex gap-2.5 px-2.5 py-2 rounded-lg bg-neutral-800/30",
        isPending && "opacity-60 pointer-events-none",
      )}
    >
      {/* Author avatar */}
      {authorAvatar ? (
        <img
          src={authorAvatar}
          alt={authorName}
          className="w-5 h-5 rounded-full object-cover border border-neutral-700 shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[7px] font-semibold text-neutral-400">
            {initials}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
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
                disabled={isPending || !editContent.trim()}
                onClick={handleSave}
              >
                <Icon icon="solar:check-read-bold" width={10} />
                Guardar
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="px-2 py-0.5 text-[10px] font-medium bg-neutral-800/40 hover:bg-neutral-700/60 text-neutral-400"
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditContent(note.content);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-medium text-neutral-400">
                {authorName}
              </span>
              <p className="text-[11px] text-neutral-300 break-words mt-0.5">
                {note.content}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-neutral-600">
                  {formatRelativeDate(note.created_at)}
                </span>
                {note.is_edited && (
                  <span className="text-[9px] text-neutral-600 italic">
                    (editado)
                  </span>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-5 w-5 text-neutral-600 hover:text-neutral-300"
                  type="button"
                  onClick={() => setEditing(true)}
                >
                  <Icon icon="solar:pen-linear" width={10} />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-5 w-5 text-neutral-600 hover:text-red-400"
                      type="button"
                    >
                      <Icon icon="solar:trash-bin-2-linear" width={10} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-neutral-950 border-neutral-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-neutral-100">
                        Eliminar nota
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        Esta accion no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                        onClick={handleDelete}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className={cn("flex flex-col gap-1.5", isPending && "opacity-60 pointer-events-none")}>
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
            <Icon icon="solar:refresh-bold" width={10} className="animate-spin" />
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
    ? (payment.members as unknown as { name: string; avatar_url: string | null }[])[0]
    : payment.members;
  const statusCfg = paymentStatusConfig[payment.status] ?? paymentStatusConfig.pending;
  const paidDate = payment.confirmed_at ?? payment.paid_at;
  const notes = payment.payment_notes ?? [];
  const period = payment.billing_cycles
    ? formatPeriod(payment.billing_cycles.period_start)
    : null;
  const hasPaid = Number(payment.amount_paid) > 0;

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
        if (result.result?.credit_generated && result.result.credit_generated > 0) {
          toast.info(`Se generó un crédito de ${formatCurrency(result.result.credit_generated)}`);
        }
      } else {
        toast.error("Error al editar pago", { description: result.error });
      }
    });
  }

  return (
    <div className={cn("px-4 py-3", isPending && "opacity-60 pointer-events-none")}>
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
          <div className="flex items-center gap-1.5 mt-0.5">
            {paidDate ? (
              <span className="text-[10px] text-neutral-500">
                {formatPaymentDate(paidDate)}
              </span>
            ) : (
              <span className="text-[10px] text-neutral-600">
                Sin pagar
              </span>
            )}
            {period && (
              <>
                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                <span className="text-[10px] text-neutral-600">{period}</span>
              </>
            )}
          </div>
        </div>

        {/* Amount + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span
              className={cn(
                "text-[13px] font-semibold tabular-nums",
                payment.status === "confirmed"
                  ? "text-emerald-400"
                  : payment.status === "paid"
                    ? "text-emerald-400/70"
                    : "text-neutral-400",
              )}
            >
              {formatCurrency(Number(payment.amount_paid) || Number(payment.amount_due))}
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
            <NoteItem key={note.id} note={note} isOwner={true} />
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
}

export default function ServiceDetailModal({
  open,
  onOpenChange,
  service,
  payments = [],
}: ServiceDetailModalProps) {
  const viewMembers: ServiceMemberInfo[] = service.members ?? [];
  const status =
    serviceStatusConfig[service.status] ?? serviceStatusConfig.pending;

  const totalCost = service.monthly_cost;
  const collectedPercent =
    totalCost > 0
      ? Math.min(
          100,
          Math.round((service.collected_amount / totalCost) * 100),
        )
      : 0;

  // Sort payments: most recent first
  const sortedPayments = [...payments].sort((a, b) => {
    const dateA = a.confirmed_at ?? a.paid_at ?? a.due_date;
    const dateB = b.confirmed_at ?? b.paid_at ?? b.due_date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

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
        <div className="relative shrink-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: `linear-gradient(135deg, ${service.color} 0%, transparent 60%)`,
            }}
          />
          <div className="relative sm:px-6 flex bg-neutral-950/60 border-neutral-800/80 border-b pt-3 pr-5 pb-4 pl-5 sm:pt-5 backdrop-blur-xl items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div
                className="w-[52px] h-[52px] rounded-2xl bg-black/80 border border-neutral-700/50 flex items-center justify-center shrink-0"
                style={{
                  boxShadow: `0 4px 20px ${service.color}26, 0 0 0 1px ${service.color}10`,
                }}
              >
                <Icon
                  icon={service.icon_url ?? "solar:tv-bold"}
                  width={26}
                  style={{ color: service.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg font-bold text-white tracking-tight">
                    {service.name}
                  </DialogTitle>
                  <div
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 ${status.badgeClass}`}
                  >
                    {service.status === "overdue" ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full bg-current ${status.dotClass ?? ""}`}
                      />
                    ) : status.icon ? (
                      <Icon icon={status.icon} width={10} />
                    ) : null}
                    {status.label}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-medium text-violet-400">
                    <Icon icon="solar:crown-bold" width={9} />
                    Propietario
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[13px] text-neutral-400">
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
                </div>
              </div>
            </div>
            <DialogClose className="w-8 h-8 flex items-center justify-center rounded-xl bg-neutral-800/60 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-700/60 hover:border-neutral-600 transition-all duration-150 focus:outline-none shrink-0 mt-0.5">
              <Icon icon="solar:close-square-linear" width={15} />
            </DialogClose>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* Financial Overview */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  Cobro del mes
                </span>
                <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
                  {collectedPercent}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${collectedPercent}%`,
                    background:
                      collectedPercent === 100
                        ? "linear-gradient(90deg, #34d399, #10b981)"
                        : `linear-gradient(90deg, ${service.color}cc, ${service.color})`,
                  }}
                />
              </div>
            </div>
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
                    service.pending_amount > 0
                      ? "text-orange-400"
                      : "text-neutral-500",
                  )}
                >
                  {formatCurrency(service.pending_amount)}
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
                    service.collected_amount > 0
                      ? "text-emerald-400"
                      : "text-neutral-500",
                  )}
                >
                  {formatCurrency(service.collected_amount)}
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

                  return (
                    <div
                      key={member.member_id}
                      className="px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center text-[10px] font-semibold text-neutral-300 shrink-0">
                          {getInitials(member.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] font-medium text-neutral-200 truncate block">
                            {member.name}
                          </span>
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
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 overflow-hidden divide-y divide-neutral-800/40" style={{ contentVisibility: "auto" }}>
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
