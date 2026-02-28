"use client";

import { useTransition } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import { markMyPaymentAsPaid } from "@/app/(dashboard)/mis-pagos/actions";

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
}: MyPaymentCardProps) {
  const [isPending, startTransition] = useTransition();

  const remaining = amountDue + accumulatedDebt - amountPaid;
  const actionable =
    status === "pending" || status === "partial" || status === "overdue";

  const statusStyles =
    status === "confirmed"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
      : status === "paid"
        ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
        : status === "overdue"
          ? "border-red-500/20 bg-red-500/10 text-red-400"
          : "border-orange-500/20 bg-orange-500/10 text-orange-400";

  const statusLabel =
    status === "confirmed"
      ? "Confirmado"
      : status === "paid"
        ? "En verificación"
        : status === "overdue"
          ? "Vencido"
          : status === "partial"
            ? "Parcial"
            : "Pendiente";

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
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-800 bg-black"
            style={{ boxShadow: `0 4px 14px ${serviceColor}1a` }}
          >
            <Icon
              icon={serviceIcon ?? "solar:tv-bold"}
              width={20}
              style={{ color: serviceColor }}
            />
          </div>
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
