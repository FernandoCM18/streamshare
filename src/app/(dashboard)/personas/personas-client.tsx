"use client";

import { useState } from "react";
import { PersonasHeader } from "@/components/personas/personas-header";
import { PersonasGrid } from "@/components/personas/personas-grid";
import { PersonasFilters } from "@/components/personas/personas-filters";
import type { PersonaCardData } from "@/types/database";

interface PersonasClientProps {
  personas: PersonaCardData[];
}

export function PersonasClient({ personas }: PersonasClientProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");

  const upToDateCount = personas.filter(
    (p) =>
      p.services.length > 0 &&
      p.services.every((s) => s.status === "confirmed" || s.status === "paid"),
  ).length;

  const pendingCount = personas.filter((p) =>
    p.services.some((s) => s.status === "pending" || s.status === "partial"),
  ).length;

  const overdueCount = personas.filter((p) =>
    p.services.some((s) => s.status === "overdue"),
  ).length;

  const linkedCount = personas.filter((p) => p.profile_id).length;
  const unlinkedCount = personas.filter((p) => !p.profile_id).length;

  const filtered = personas.filter((p) => {
    if (statusFilter === "upToDate") {
      const allGood =
        p.services.length > 0 &&
        p.services.every(
          (s) => s.status === "confirmed" || s.status === "paid",
        );
      if (!allGood) return false;
    } else if (statusFilter === "pending") {
      if (
        !p.services.some(
          (s) => s.status === "pending" || s.status === "partial",
        )
      )
        return false;
    } else if (statusFilter === "overdue") {
      if (!p.services.some((s) => s.status === "overdue")) return false;
    }

    if (accountFilter === "linked" && !p.profile_id) return false;
    if (accountFilter === "unlinked" && p.profile_id) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      <PersonasHeader
        totalCount={personas.length}
        upToDateCount={upToDateCount}
        pendingCount={pendingCount}
      />
      <PersonasFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        accountFilter={accountFilter}
        onAccountFilterChange={setAccountFilter}
        counts={{
          total: personas.length,
          upToDate: upToDateCount,
          pending: pendingCount,
          overdue: overdueCount,
          linked: linkedCount,
          unlinked: unlinkedCount,
        }}
      />
      <PersonasGrid personas={filtered} />
    </div>
  );
}
