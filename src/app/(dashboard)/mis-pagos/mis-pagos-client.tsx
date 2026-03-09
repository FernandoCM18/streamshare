"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@iconify/react";
import { MyPaymentCard } from "@/components/mis-pagos/my-payment-card";
import { MisPagosFilters } from "@/components/mis-pagos/mis-pagos-filters";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import type { MyPayment } from "@/types/database";

export interface PaymentNoteData {
  id: string;
  content: string;
  author_id: string;
  is_edited: boolean;
  created_at: string;
}

interface MisPagosClientProps {
  payments: MyPayment[];
  notesMap?: Record<string, PaymentNoteData[]>;
}

export function MisPagosClient({
  payments,
  notesMap = {},
}: MisPagosClientProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  const counts: Record<string, number> = { all: payments.length };
  for (const p of payments) {
    counts[p.status] = (counts[p.status] ?? 0) + 1;
  }

  const filtered = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Mis pagos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Aqui puedes ver tus servicios compartidos y marcar cuando ya pagaste.
        </p>
      </div>

      <MisPagosFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        counts={counts}
      />

      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div
            key="grid"
            className="grid grid-cols-1 gap-4 xl:grid-cols-2"
            initial={false}
          >
            {filtered.map((payment, index) => (
              <motion.div
                key={payment.id}
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
                <MyPaymentCard
                  paymentId={payment.id}
                  serviceName={payment.service_name}
                  serviceColor={payment.service_color}
                  serviceIcon={payment.service_icon}
                  ownerName={payment.owner_name}
                  status={payment.status}
                  dueDate={payment.due_date}
                  amountDue={payment.amount_due}
                  amountPaid={payment.amount_paid}
                  accumulatedDebt={payment.accumulated_debt}
                  notes={notesMap[payment.id] ?? []}
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
              icon={
                <Icon
                  icon="solar:wallet-money-bold"
                  width={28}
                  className="text-neutral-400"
                />
              }
              iconContainerClassName="bg-neutral-500/10"
              title={
                payments.length === 0 ? "No tienes pagos aun" : "Sin resultados"
              }
              description={
                payments.length === 0
                  ? "Cuando te agreguen a un servicio compartido, tus pagos apareceran aqui."
                  : "Intenta con otros filtros."
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
