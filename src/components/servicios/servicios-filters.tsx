"use client";

import { FilterChips } from "@/components/shared/filter-bar";

interface ServiciosFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  activeCount: number;
  inactiveCount: number;
  totalCount: number;
}

export function ServiciosFilters({
  statusFilter,
  onStatusFilterChange,
  activeCount,
  inactiveCount,
  totalCount,
}: ServiciosFiltersProps) {
  const statusChips = [
    { label: "Todos", value: "all", count: totalCount },
    { label: "Activos", value: "active", count: activeCount },
    { label: "Inactivos", value: "pending", count: inactiveCount },
  ];

  return (
    <FilterChips
      chips={statusChips}
      value={statusFilter}
      onChange={onStatusFilterChange}
    />
  );
}
