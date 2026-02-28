"use client";

import { FilterChips } from "@/components/shared/filter-bar";

interface MisPagosFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  counts: Record<string, number>;
}

export function MisPagosFilters({
  statusFilter,
  onStatusFilterChange,
  counts,
}: MisPagosFiltersProps) {
  const statusChips = [
    { label: "Todos", value: "all", count: counts.all },
    { label: "Pendiente", value: "pending", count: counts.pending },
    { label: "Parcial", value: "partial", count: counts.partial },
    { label: "Pagado", value: "paid", count: counts.paid },
    { label: "Confirmado", value: "confirmed", count: counts.confirmed },
    { label: "Vencido", value: "overdue", count: counts.overdue },
  ];

  return (
    <FilterChips
      chips={statusChips}
      value={statusFilter}
      onChange={onStatusFilterChange}
    />
  );
}
