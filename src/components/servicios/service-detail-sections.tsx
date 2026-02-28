"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { cn, formatCurrency, formatPeriod } from "@/lib/utils";
import type { PaymentStatus } from "@/types/database";

const paymentStatusConfig: Record<
  string,
  { label: string; badgeClass: string }
> = {
  confirmed: {
    label: "Confirmado",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
  },
  paid: {
    label: "Pagado",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
  },
  pending: {
    label: "Pendiente",
    badgeClass: "bg-orange-400/10 border border-orange-400/20 text-orange-400",
  },
  partial: {
    label: "Parcial",
    badgeClass: "bg-orange-400/10 border border-orange-400/20 text-orange-400",
  },
  overdue: {
    label: "Vencido",
    badgeClass: "bg-red-500/10 border border-red-500/20 text-red-400",
  },
};

interface PaymentNoteData {
  id: string;
  content: string;
  createdAt: string;
  isOwner: boolean;
}

interface CyclePayment {
  id: string;
  personaName: string;
  personaInitials: string;
  isRegistered: boolean;
  amountDue: number;
  amountPaid: number;
  accumulatedDebt: number;
  status: PaymentStatus;
  dueDate: string;
  paidAt: string | null;
  confirmedAt: string | null;
  notes: PaymentNoteData[];
}

interface CycleData {
  id: string;
  periodStart: string;
  totalAmount: number;
  payments: CyclePayment[];
}

interface PaymentHistorySectionProps {
  cycles: CycleData[];
}

export function PaymentHistorySection({ cycles }: PaymentHistorySectionProps) {
  const [expandedCycles, setExpandedCycles] = useState<Set<string>>(
    new Set(cycles.length > 0 ? [cycles[0].id] : []),
  );

  function toggleCycle(cycleId: string) {
    setExpandedCycles((prev) => {
      const next = new Set(prev);
      if (next.has(cycleId)) {
        next.delete(cycleId);
      } else {
        next.add(cycleId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {cycles.map((cycle, index) => {
        const isExpanded = expandedCycles.has(cycle.id);
        const confirmedCount = cycle.payments.filter(
          (p) => p.status === "confirmed",
        ).length;
        const totalCount = cycle.payments.length;
        const allConfirmed = confirmedCount === totalCount && totalCount > 0;

        return (
          <div
            key={cycle.id}
            className="rounded-xl bg-neutral-900/30 border border-neutral-800 overflow-hidden"
          >
            {/* Cycle header */}
            <button
              onClick={() => toggleCycle(cycle.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-900/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    allConfirmed
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-neutral-800 text-neutral-400",
                  )}
                >
                  <Icon
                    icon={
                      allConfirmed
                        ? "solar:check-circle-bold"
                        : "solar:calendar-linear"
                    }
                    width={16}
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-200 capitalize">
                    {formatPeriod(cycle.periodStart)}
                  </span>
                  {index === 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      Actual
                    </span>
                  )}
                  <p className="text-[11px] text-neutral-500">
                    {confirmedCount}/{totalCount} confirmados
                    {" \u00b7 "}
                    {formatCurrency(cycle.totalAmount)}
                  </p>
                </div>
              </div>
              <Icon
                icon="solar:alt-arrow-down-linear"
                width={16}
                className={cn(
                  "text-neutral-500 transition-transform duration-200",
                  isExpanded && "rotate-180",
                )}
              />
            </button>

            {/* Payments list */}
            {isExpanded && cycle.payments.length > 0 && (
              <div className="border-t border-neutral-800/50">
                {cycle.payments.map((payment) => {
                  const pStatus =
                    paymentStatusConfig[payment.status] ??
                    paymentStatusConfig.pending;

                  return (
                    <div
                      key={payment.id}
                      className="border-b border-neutral-800/30 last:border-b-0"
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Avatar */}
                        <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-900 flex items-center justify-center text-[8px] font-medium text-neutral-400 shrink-0">
                          {payment.personaInitials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-neutral-200 truncate">
                              {payment.personaName}
                            </span>
                            {payment.isRegistered ? (
                              <Icon
                                icon="solar:verified-check-bold"
                                width={10}
                                className="text-violet-400 shrink-0"
                              />
                            ) : (
                              <span className="px-1 py-0.5 rounded text-[7px] font-medium bg-neutral-800 border border-neutral-700 text-neutral-500 shrink-0">
                                Sin cuenta
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                            <span>
                              Debe: {formatCurrency(payment.amountDue)}
                            </span>
                            {payment.amountPaid > 0 && (
                              <>
                                <span className="text-neutral-700">
                                  &middot;
                                </span>
                                <span className="text-emerald-400">
                                  Pagó: {formatCurrency(payment.amountPaid)}
                                </span>
                              </>
                            )}
                            {payment.accumulatedDebt > 0 && (
                              <>
                                <span className="text-neutral-700">
                                  &middot;
                                </span>
                                <span className="text-red-400">
                                  Acum:{" "}
                                  {formatCurrency(payment.accumulatedDebt)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status + date */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${pStatus.badgeClass}`}
                          >
                            {pStatus.label}
                          </span>
                          {payment.confirmedAt ? (
                            <span className="text-[9px] text-neutral-600">
                              {new Date(payment.confirmedAt).toLocaleDateString(
                                "es-MX",
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </span>
                          ) : payment.paidAt ? (
                            <span className="text-[9px] text-neutral-600">
                              {new Date(payment.paidAt).toLocaleDateString(
                                "es-MX",
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                          ) : (
                            <span className="text-[9px] text-neutral-600">
                              Vence{" "}
                              {new Date(payment.dueDate).toLocaleDateString(
                                "es-MX",
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {payment.notes.length > 0 && (
                        <div className="px-4 pb-3 pl-14 space-y-1.5">
                          {payment.notes.map((note) => (
                            <div
                              key={note.id}
                              className="flex items-start gap-2"
                            >
                              <Icon
                                icon="solar:chat-line-linear"
                                width={10}
                                className="text-neutral-600 mt-0.5 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-[10px] text-neutral-400 leading-relaxed">
                                  {note.content}
                                </p>
                                <span className="text-[8px] text-neutral-600">
                                  {note.isOwner ? "Tú" : "Miembro"}
                                  {" \u00b7 "}
                                  {new Date(note.createdAt).toLocaleDateString(
                                    "es-MX",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state for cycle with no payments */}
            {isExpanded && cycle.payments.length === 0 && (
              <div className="border-t border-neutral-800/50 p-4 text-center">
                <p className="text-[11px] text-neutral-600">
                  Sin pagos en este ciclo
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
