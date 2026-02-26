"use client";

import { useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/app/(dashboard)/configuracion/actions";
import type { UserSettings } from "@/types/database";
import { toast } from "sonner";

interface NotificacionesCardProps {
  settings: UserSettings;
}

export function NotificacionesCard({ settings }: NotificacionesCardProps) {
  const [isPending, startTransition] = useTransition();
  const [notifyOverdue, setNotifyOverdue] = useState(settings.notify_overdue);
  const [autoGenerate, setAutoGenerate] = useState(
    settings.auto_generate_cycles,
  );
  const [alertDays, setAlertDays] = useState(settings.notify_before_days);

  function saveSettings(overrides: Partial<UserSettings>) {
    const merged = {
      notify_before_days: overrides.notify_before_days ?? alertDays,
      notify_overdue:
        overrides.notify_overdue !== undefined
          ? overrides.notify_overdue
          : notifyOverdue,
      default_currency: settings.default_currency,
      auto_generate_cycles:
        overrides.auto_generate_cycles !== undefined
          ? overrides.auto_generate_cycles
          : autoGenerate,
    };

    const formData = new FormData();
    formData.set("notify_before_days", String(merged.notify_before_days));
    formData.set("notify_overdue", String(merged.notify_overdue));
    formData.set("default_currency", merged.default_currency);
    formData.set("auto_generate_cycles", String(merged.auto_generate_cycles));

    startTransition(async () => {
      const result = await updateSettings(formData);
      if (!result.success) {
        toast.error(result.error ?? "Error al actualizar");
      }
    });
  }

  function handleToggleOverdue(checked: boolean) {
    setNotifyOverdue(checked);
    saveSettings({ notify_overdue: checked });
  }

  function handleToggleAutoGenerate(checked: boolean) {
    setAutoGenerate(checked);
    saveSettings({ auto_generate_cycles: checked });
  }

  function handleAlertDays(delta: number) {
    const next = Math.max(1, Math.min(30, alertDays + delta));
    setAlertDays(next);
    saveSettings({ notify_before_days: next });
  }

  return (
    <div className="rounded-2xl bg-neutral-900/40 border border-neutral-800/50 backdrop-blur-md divide-y divide-neutral-800/50 overflow-hidden">
      <div className="px-5 py-3">
        <h3 className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-medium">
          Notificaciones e Integraciones
        </h3>
      </div>

      {/* Notificaciones de vencimiento */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-800/50 border border-neutral-700/30 flex items-center justify-center">
            <Icon
              icon="solar:bell-bing-linear"
              width={18}
              className="text-emerald-400"
            />
          </div>
          <div>
            <p className="text-sm text-neutral-200">
              Notificaciones de vencimiento
            </p>
            <p className="text-[11px] text-neutral-500">
              Alertar cuando un pago está por vencer
            </p>
          </div>
        </div>
        <Switch
          checked={notifyOverdue}
          onCheckedChange={handleToggleOverdue}
          disabled={isPending}
          className="data-[state=checked]:bg-emerald-500"
        />
      </div>

      {/* Generación automática de ciclos */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-800/50 border border-neutral-700/30 flex items-center justify-center">
            <Icon
              icon="solar:refresh-circle-linear"
              width={18}
              className="text-orange-400"
            />
          </div>
          <div>
            <p className="text-sm text-neutral-200">
              Ciclos automáticos
            </p>
            <p className="text-[11px] text-neutral-500">
              Generar cobros mensuales automáticamente
            </p>
          </div>
        </div>
        <Switch
          checked={autoGenerate}
          onCheckedChange={handleToggleAutoGenerate}
          disabled={isPending}
          className="data-[state=checked]:bg-orange-500"
        />
      </div>

      {/* Anticipación de alerta */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-800/50 border border-neutral-700/30 flex items-center justify-center">
            <Icon
              icon="solar:calendar-mark-linear"
              width={18}
              className="text-violet-400"
            />
          </div>
          <div>
            <p className="text-sm text-neutral-200">
              Anticipación de alerta
            </p>
            <p className="text-[11px] text-neutral-500">
              Días antes del vencimiento para notificar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleAlertDays(-1)}
            disabled={isPending || alertDays <= 1}
            className="h-7 w-7 rounded-lg bg-neutral-800/50 border border-neutral-700/30 text-neutral-400 hover:text-white hover:bg-neutral-700/60"
          >
            <Icon icon="solar:minus-circle-linear" width={14} />
          </Button>
          <span className="w-8 text-center text-sm font-medium text-white bg-neutral-950 border border-neutral-800 rounded-lg py-0.5">
            {alertDays}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleAlertDays(1)}
            disabled={isPending || alertDays >= 30}
            className="h-7 w-7 rounded-lg bg-neutral-800/50 border border-neutral-700/30 text-neutral-400 hover:text-white hover:bg-neutral-700/60"
          >
            <Icon icon="solar:add-circle-linear" width={14} />
          </Button>
        </div>
      </div>

      {/* Sincronizar Calendario (placeholder) */}
      <div className="flex items-center justify-between px-5 py-4 opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-800/50 border border-neutral-700/30 flex items-center justify-center">
            <Icon
              icon="solar:calendar-linear"
              width={18}
              className="text-blue-400"
            />
          </div>
          <div>
            <p className="text-sm text-neutral-200">
              Sincronizar Calendario
            </p>
            <p className="text-[11px] text-neutral-500">
              Exportar vencimientos a tu calendario
            </p>
          </div>
        </div>
        <span className="text-[11px] text-neutral-600 px-2.5 py-1 rounded-lg bg-neutral-800/40 border border-neutral-700/30">
          Próximamente
        </span>
      </div>
    </div>
  );
}
