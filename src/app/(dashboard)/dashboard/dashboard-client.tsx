"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DashboardServiceCard } from "@/components/dashboard/dashboard-service-card";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import type { MemberPayment } from "@/components/dashboard/service-card-utils";
import { getGreeting, formatDate } from "@/lib/utils";
import { TvIcon } from "@/components/icons/TvIcon";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import type { ServiceSummary } from "@/types/database";
import {
  isAwaitingConfirmation,
  isSettled,
  isActionablePayment,
  derivePaymentStatus,
} from "@/lib/payment-utils";
import type { PairSummary } from "@/lib/compute-payment-summaries";

interface DashboardClientProps {
  services: ServiceSummary[];
  payments: MemberPayment[];
  summaries: Record<string, PairSummary>;
  displayName: string;
}

export function DashboardClient({
  services,
  payments,
  summaries,
  displayName,
}: DashboardClientProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  const activeServices = services.filter((s) => s.status === "active");

  // Build paymentsByService: one entry per member per service (latest cycle),
  // with amount_due replaced by the total accumulated debt across all open cycles
  const paymentsByService = new Map<string, MemberPayment[]>();
  for (const p of payments) {
    if (!p.service_id) continue;
    const list = paymentsByService.get(p.service_id) ?? [];
    list.push(p);
    paymentsByService.set(p.service_id, list);
  }
  for (const sid of paymentsByService.keys()) {
    const list = paymentsByService.get(sid) ?? [];
    const latestMap = new Map<string, MemberPayment>();
    for (const p of list) {
      const cur = latestMap.get(p.member_id);
      const curPeriod = cur?.billing_cycles?.period_start ?? "";
      const thisPeriod = p.billing_cycles?.period_start ?? "";
      if (!cur || thisPeriod > curPeriod) latestMap.set(p.member_id, p);
    }
    const merged = Array.from(latestMap.values()).map((p) => {
      const summary = summaries[`${p.member_id}:${p.service_id}`];
      const totalDebt = summary?.totalDebt ?? 0;
      const s = derivePaymentStatus(p);
      const isActionable = s === "overdue" || s === "pending" || s === "partial";
      if (isActionable && totalDebt > 0) {
        return { ...p, amount_due: totalDebt, amount_paid: 0, accumulated_debt: 0, credit_amount_used: 0 };
      }
      return p;
    });
    paymentsByService.set(sid, merged);
  }

  // Count pending verifications (derived "paid" = awaiting owner confirmation)
  const pendingVerifications = payments.filter(isAwaitingConfirmation).length;

  // Compute filter counts — always via derived status so chips match card badges
  const allPaidCount = activeServices.filter((s) => {
    const svcPayments = paymentsByService.get(s.id) ?? [];
    return svcPayments.length > 0 && svcPayments.every(isSettled);
  }).length;

  const hasPendingCount = activeServices.filter((s) => {
    const svcPayments = paymentsByService.get(s.id) ?? [];
    return svcPayments.some(
      (p) => isActionablePayment(p) || isAwaitingConfirmation(p),
    );
  }).length;

  const hasOverdueCount = activeServices.filter((s) => {
    const svcPayments = paymentsByService.get(s.id) ?? [];
    return svcPayments.some((p) => derivePaymentStatus(p) === "overdue");
  }).length;

  // Apply filter — same derived-status predicates
  const filteredServices = activeServices.filter((s) => {
    const svcPayments = paymentsByService.get(s.id) ?? [];
    if (statusFilter === "allPaid") {
      return svcPayments.length > 0 && svcPayments.every(isSettled);
    }
    if (statusFilter === "hasPending") {
      return svcPayments.some(
        (p) => isActionablePayment(p) || isAwaitingConfirmation(p),
      );
    }
    if (statusFilter === "hasOverdue") {
      return svcPayments.some((p) => derivePaymentStatus(p) === "overdue");
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Greeting + date */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <h1 className="text-2xl font-semibold text-white">
          {getGreeting()}, {displayName.split(" ")[0]}
        </h1>
        <p className="text-sm text-neutral-500 mt-1 capitalize">
          {formatDate()}
        </p>
      </motion.div>

      {/* Title + badges */}
      <div className="flex items-center flex-wrap gap-3">
        <h2 className="text-base font-medium text-neutral-200">
          Servicios Compartidos
        </h2>
        <span className="px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-medium text-neutral-400">
          Activos: {activeServices.length}
        </span>
        {pendingVerifications > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 text-[10px] font-medium text-orange-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            {pendingVerifications} cobro
            {pendingVerifications > 1 ? "s" : ""} pendiente
            {pendingVerifications > 1 ? "s" : ""} de verificacion
          </span>
        )}
      </div>

      {/* Filters */}
      <DashboardFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        counts={{
          total: activeServices.length,
          allPaid: allPaidCount,
          hasPending: hasPendingCount,
          hasOverdue: hasOverdueCount,
        }}
      />

      {/* Service cards */}
      <AnimatePresence mode="popLayout">
        {filteredServices.length > 0 ? (
          <motion.div key="cards" className="space-y-5" initial={false}>
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: index * 0.05,
                }}
                layout
              >
                <DashboardServiceCard
                  service={service}
                  payments={paymentsByService.get(service.id) ?? []}
                  isOwner={true}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <EmptyStateCard
              icon={<TvIcon className="h-7 w-7 text-neutral-400" />}
              title={
                statusFilter !== "all"
                  ? "Sin resultados"
                  : "No tienes servicios aun"
              }
              description={
                statusFilter !== "all"
                  ? "Intenta con otros filtros."
                  : "Crea tu primer servicio en la seccion de Servicios para empezar a gestionar los pagos compartidos."
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
