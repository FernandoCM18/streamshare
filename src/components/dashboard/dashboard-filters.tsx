"use client";

import { FilterChips } from "@/components/shared/filter-bar";

interface DashboardFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  counts: {
    total: number;
    allPaid: number;
    hasPending: number;
    hasOverdue: number;
  };
}

export function DashboardFilters({
  statusFilter,
  onStatusFilterChange,
  counts,
}: DashboardFiltersProps) {
  const chips = [
    { label: "Todos", value: "all", count: counts.total },
    { label: "Al dia", value: "allPaid", count: counts.allPaid },
    { label: "Pendientes", value: "hasPending", count: counts.hasPending },
    { label: "Vencidos", value: "hasOverdue", count: counts.hasOverdue },
  ];

  return (
    <FilterChips
      chips={chips}
      value={statusFilter}
      onChange={onStatusFilterChange}
    />
  );
}
