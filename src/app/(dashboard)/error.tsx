"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Icon icon="solar:danger-triangle-bold" width={28} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-100 mb-1">
            Algo salió mal
          </h2>
          <p className="text-sm text-neutral-500">
            Ocurrió un error inesperado. Intenta de nuevo.
          </p>
        </div>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700/60 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
