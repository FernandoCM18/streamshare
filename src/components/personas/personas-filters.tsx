"use client";

import { FilterChips } from "@/components/shared/filter-bar";

interface PersonasFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  accountFilter: string;
  onAccountFilterChange: (value: string) => void;
  counts: {
    total: number;
    upToDate: number;
    pending: number;
    overdue: number;
    linked: number;
    unlinked: number;
  };
}

export function PersonasFilters({
  statusFilter,
  onStatusFilterChange,
  accountFilter,
  onAccountFilterChange,
  counts,
}: PersonasFiltersProps) {
  const statusChips = [
    { label: "Todos", value: "all", count: counts.total },
    { label: "Al dia", value: "upToDate", count: counts.upToDate },
    { label: "Pendientes", value: "pending", count: counts.pending },
    { label: "Vencidos", value: "overdue", count: counts.overdue },
  ];

  const accountChips = [
    { label: "Todos", value: "all" },
    { label: "Vinculados", value: "linked", count: counts.linked },
    { label: "Sin cuenta", value: "unlinked", count: counts.unlinked },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterChips
        chips={statusChips}
        value={statusFilter}
        onChange={onStatusFilterChange}
      />
      <div className="w-px h-6 bg-neutral-800/60 hidden sm:block" />
      <FilterChips
        chips={accountChips}
        value={accountFilter}
        onChange={onAccountFilterChange}
      />
    </div>
  );
}
