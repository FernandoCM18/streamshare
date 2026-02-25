"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { toast } from "sonner";

export function PushBanner() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe } =
    usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if not supported, already subscribed, denied, or dismissed
  if (!isSupported || isSubscribed || permission === "denied" || dismissed) {
    return null;
  }

  async function handleActivate() {
    const success = await subscribe();
    if (success) {
      toast.success("Notificaciones activadas", {
        description: "Recibirás alertas de pagos pendientes",
      });
    } else {
      toast.error("No se pudieron activar", {
        description:
          process.env.NODE_ENV === "development"
            ? "Push requiere production build (pnpm build && pnpm start)"
            : "Revisa los permisos de tu navegador",
      });
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl",
        "bg-violet-500/5 border border-violet-500/20",
        "mb-6",
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
        <Icon icon="solar:bell-bing-bold" width={20} className="text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-200">
          Activa las notificaciones
        </p>
        <p className="text-[11px] text-neutral-500">
          Recibe alertas cuando tus participantes confirmen pagos
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="text-[10px] text-neutral-500 hover:text-neutral-300 px-2 py-1 transition-colors"
        >
          Ahora no
        </button>
        <button
          onClick={handleActivate}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold",
            "bg-violet-600 hover:bg-violet-500 text-white",
            "transition-all active:scale-[0.97]",
            "disabled:opacity-60",
          )}
        >
          {isLoading ? (
            <Icon icon="solar:refresh-bold" width={14} className="animate-spin" />
          ) : (
            "Activar"
          )}
        </button>
      </div>
    </div>
  );
}
