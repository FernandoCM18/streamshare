"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { signOut } from "@/app/(dashboard)/configuracion/actions";

export function ZonaPeligro() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-rose-500/80 font-medium px-1">
        Zona de Peligro
      </h3>
      <button
        onClick={handleSignOut}
        disabled={isPending}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-rose-900/20 bg-neutral-900/40 hover:bg-rose-900/5 transition-colors cursor-pointer disabled:opacity-50"
      >
        <div className="w-9 h-9 rounded-lg bg-rose-900/20 border border-rose-900/30 flex items-center justify-center">
          <Icon
            icon="solar:logout-2-linear"
            width={18}
            className="text-rose-400"
          />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-rose-200">
            {isPending ? "Cerrando sesión..." : "Cerrar Sesión"}
          </p>
          <p className="text-[11px] text-neutral-500">
            Salir de tu cuenta en este dispositivo
          </p>
        </div>
      </button>
    </div>
  );
}
