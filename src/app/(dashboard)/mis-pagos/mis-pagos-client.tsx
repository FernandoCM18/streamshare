"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { MyPaymentCard } from "@/components/mis-pagos/my-payment-card";
import { MisPagosFilters } from "@/components/mis-pagos/mis-pagos-filters";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import type { MyPayment } from "@/types/database";

interface MisPagosClientProps {
  payments: MyPayment[];
}

export function MisPagosClient({ payments }: MisPagosClientProps) {
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

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((payment) => (
            <MyPaymentCard
              key={payment.id}
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
            />
          ))}
        </div>
      ) : (
        <EmptyStateCard
          icon={
            <Icon
              icon="solar:wallet-money-bold"
              width={28}
              className="text-neutral-400"
            />
          }
          iconContainerClassName="bg-neutral-500/10"
          title="Sin resultados"
          description="Intenta con otros filtros."
        />
      )}
    </div>
  );
}
