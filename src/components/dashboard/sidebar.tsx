import { GaugeCard } from "@/components/dashboard/gauge-card";
import type { DashboardSummary } from "@/types/database";
import type { PendingDebtor } from "@/components/dashboard/gauge-card";

interface SidebarProps {
  dashboard: DashboardSummary;
  pendingDebtors: PendingDebtor[];
}

export function Sidebar({ dashboard, pendingDebtors }: SidebarProps) {
  return (
    <div className="space-y-6">
      <GaugeCard dashboard={dashboard} pendingDebtors={pendingDebtors} />
    </div>
  );
}
