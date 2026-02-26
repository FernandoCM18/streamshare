"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GaugeCard } from "@/components/dashboard/gauge-card";
import type { DashboardSummary } from "@/types/database";
import type { PendingDebtor } from "@/components/dashboard/gauge-card";

interface SidebarProps {
  dashboard: DashboardSummary;
  pendingDebtors: PendingDebtor[];
}

export function Sidebar({ dashboard, pendingDebtors }: SidebarProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("sidebar-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        () => {
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "billing_cycles",
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className="space-y-6">
      <GaugeCard dashboard={dashboard} pendingDebtors={pendingDebtors} />
    </div>
  );
}
