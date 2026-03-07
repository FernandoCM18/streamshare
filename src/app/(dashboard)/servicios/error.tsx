"use client";

import { Icon } from "@iconify/react";

export default function ServiciosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <Icon
          icon="solar:danger-triangle-bold"
          width={28}
          className="text-red-400"
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-100">
          Algo salio mal
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          No pudimos cargar los servicios. Intenta de nuevo.
        </p>
      </div>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-neutral-800/40 hover:bg-neutral-700/60 border border-transparent hover:border-neutral-600 text-sm font-medium text-neutral-200 hover:text-white transition-all"
      >
        Reintentar
      </button>
    </div>
  );
}
