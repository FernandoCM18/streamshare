"use client";

import { useState } from "react";
import { ServiceCard } from "@/components/servicios/service-card";
import ServiciosHeader from "@/components/servicios/servicios-header";
import { ServiciosFilters } from "@/components/servicios/servicios-filters";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { TvIcon } from "@/components/icons/TvIcon";
import type { ServiceSummary } from "@/types/database";

interface ServiciosClientProps {
  services: ServiceSummary[];
  members: { id: string; name: string; email: string | null }[];
}

export function ServiciosClient({ services, members }: ServiciosClientProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  const activeCount = services.filter((s) => s.status === "active").length;
  const inactiveCount = services.length - activeCount;

  const filtered = services.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <ServiciosHeader
        serviceCount={services.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        members={members}
      />

      <ServiciosFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        totalCount={services.length}
      />

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              members={members}
              isOwner={true}
            />
          ))}
        </div>
      ) : (
        <EmptyStateCard
          icon={<TvIcon className="h-7 w-7 text-neutral-400" />}
          title="Sin resultados"
          description="Intenta con otros filtros."
        />
      )}
    </div>
  );
}
