"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { PendingDebtor } from "@/types/database";

interface PendingListProps {
  debtors: PendingDebtor[];
}

export function PendingList({ debtors }: PendingListProps) {
  if (debtors.length === 0) {
    return (
      <p className="text-xs text-white/30 text-center py-4">
        Sin pagos pendientes
      </p>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto w-full">
      {debtors.map((debtor, index) => (
        <motion.div
          key={debtor.id}
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            delay: index * 0.05,
          }}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
              <span className="text-[10px] font-medium text-white/70">
                {debtor.initials}
              </span>
            </div>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-neutral-900",
                debtor.status === "overdue" ? "bg-red-400" : "bg-orange-400",
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {debtor.name}
            </p>
            <p
              className={cn(
                "text-[10px]",
                debtor.status === "overdue"
                  ? "text-red-400"
                  : "text-orange-400",
              )}
            >
              {debtor.status === "overdue" ? "Vencido" : "Pendiente"} —{" "}
              {debtor.serviceName}
            </p>
          </div>
          <span className="text-xs font-medium text-white/70">
            {formatCurrency(debtor.amount)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
