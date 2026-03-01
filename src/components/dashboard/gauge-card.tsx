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
import { formatCurrency } from "@/lib/utils";
import type { DashboardSummary, PendingDebtor } from "@/types/database";
import { Badge } from "../ui/badge";

interface GaugeCardProps {
  dashboard: DashboardSummary;
  pendingDebtors: PendingDebtor[];
}

export function GaugeCard({ dashboard, pendingDebtors }: GaugeCardProps) {
  const data = dashboard;
  const remaining = data.total_month_receivable - data.total_month_collected;

  return (
    <Card className="rounded-2xl border border-neutral-800/60 bg-neutral-900/40 py-4 ring-0 lg:py-6">
      <CardHeader className="flex items-center justify-between pb-3">
        <CardTitle className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 lg:text-xs">
          progreso
        </CardTitle>
        <Badge className="badge-active px-2 py-0.5 text-[9px] font-medium lg:px-2.5 lg:py-1 lg:text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVO
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="mx-auto w-full max-w-[260px] lg:max-w-none">
          <SemicircularGauge
            collectedAmount={data.total_month_collected}
            totalAmount={data.total_month_receivable}
            remainingAmount={remaining}
          />
        </div>
        <div className="flex items-center justify-center gap-3 lg:gap-4">
          <div className="text-center">
            <p className="text-[9px] text-white/40 lg:text-[10px]">Pagado</p>
            <p className="text-xs font-medium text-emerald-400 lg:text-sm">
              {formatCurrency(data.total_month_collected)}
            </p>
          </div>
          <div className="h-7 w-px bg-neutral-800 lg:h-8" />
          <div className="text-center">
            <p className="text-[9px] text-white/40 lg:text-[10px]">Total</p>
            <p className="text-xs font-medium text-white/70 lg:text-sm">
              {formatCurrency(data.total_month_receivable)}
            </p>
          </div>
        </div>
      </CardContent>

      <div className="mx-4 h-px bg-neutral-800" />

      <CardFooter className="flex-col items-start gap-3 border-t-0 bg-transparent pt-0">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            pendientes
          </h3>
          <Badge className="text-[10px] font-medium text-neutral-500 bg-neutral-900 border-neutral-800 border">
            {pendingDebtors.length}
          </Badge>
        </div>
        <PendingList debtors={pendingDebtors} />
      </CardFooter>
    </Card>
  );
}
