"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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

      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div
            key="grid"
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
            initial={false}
          >
            {filtered.map((service, index) => (
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
                <ServiceCard
                  service={service}
                  members={members}
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
              title="Sin resultados"
              description="Intenta con otros filtros."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
