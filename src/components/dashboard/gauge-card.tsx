"use client";

import { SemicircularGauge } from "@/components/dashboard/semicircular-gauge";
import { PendingList } from "@/components/dashboard/pending-list";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/types/database";
import type { DashboardSummary } from "@/types/database";
import { Badge } from "../ui/badge";

export interface PendingDebtor {
  id: string;
  name: string;
  initials: string;
  status: "overdue" | "pending";
  amount: number;
  serviceName: string;
}

interface GaugeCardProps {
  dashboard: DashboardSummary;
  pendingDebtors: PendingDebtor[];
}

export function GaugeCard({ dashboard, pendingDebtors }: GaugeCardProps) {
  const data = dashboard;
  const remaining = data.total_month_receivable - data.total_month_collected;

  return (
    <Card className="rounded-2xl border-neutral-800/60 bg-neutral-900/40 ring-0 border py-6 space-y-4">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          progreso
        </CardTitle>
        <div className="flex justify-center">
          <span className="badge-active inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ACTIVO
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SemicircularGauge
          collectedAmount={data.total_month_collected}
          totalAmount={data.total_month_receivable}
          remainingAmount={remaining}
        />
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-[10px] text-white/40">Pagado</p>
            <p className="text-sm font-medium text-emerald-400">
              {formatCurrency(data.total_month_collected)}
            </p>
          </div>
          <div className="w-px h-8 bg-neutral-800" />
          <div className="text-center">
            <p className="text-[10px] text-white/40">Total</p>
            <p className="text-sm font-medium text-white/70">
              {formatCurrency(data.total_month_receivable)}
            </p>
          </div>
        </div>
      </CardContent>

      <div className="mx-4 h-px bg-neutral-800" />

      <CardFooter className="flex-col items-start gap-3 border-t-0 bg-transparent">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            pendientes
          </h3>
          <Badge className="text-[9px] font-medium text-neutral-500 bg-neutral-900 border-neutral-800 border">
            3
          </Badge>
        </div>
        <PendingList debtors={pendingDebtors} />
      </CardFooter>
    </Card>
  );
}
