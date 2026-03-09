"use client";

import { useTransition } from "react";
import { Icon } from "@iconify/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSettings } from "@/app/(dashboard)/configuracion/actions";
import type { UserSettings } from "@/types/database";
import { toast } from "sonner";

interface PreferenciasCardProps {
  settings: UserSettings;
}

const currencies = [
  { value: "MXN", label: "MXN ($)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "COP", label: "COP ($)" },
  { value: "ARS", label: "ARS ($)" },
  { value: "CLP", label: "CLP ($)" },
  { value: "PEN", label: "PEN (S/)" },
];

export function PreferenciasCard({ settings }: PreferenciasCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleCurrencyChange(value: string) {
    const formData = new FormData();
    formData.set("default_currency", value);
    formData.set("notify_before_days", String(settings.notify_before_days));
    formData.set("notify_overdue", String(settings.notify_overdue));
    formData.set("auto_generate_cycles", String(settings.auto_generate_cycles));

    startTransition(async () => {
      const result = await updateSettings(formData);
      if (result.success) {
        toast.success("Divisa actualizada");
      } else {
        toast.error(result.error ?? "Error al actualizar");
      }
    });
  }

  return (
    <div className="rounded-2xl bg-neutral-900/40 border border-neutral-800/50 backdrop-blur-md divide-y divide-neutral-800/50 overflow-hidden">
      <div className="px-5 py-3">
        <h3 className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-medium">
          Preferencias Generales
        </h3>
      </div>

      {/* Divisa Principal */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-800/50 border border-neutral-700/30 flex items-center justify-center">
            <Icon
              icon="solar:wallet-money-linear"
              width={18}
              className="text-neutral-400"
            />
          </div>
          <div>
            <p className="text-sm text-neutral-200">Divisa Principal</p>
            <p className="text-[11px] text-neutral-500">
              Moneda para mostrar montos
            </p>
          </div>
        </div>
        <Select
          defaultValue={settings.default_currency}
          onValueChange={handleCurrencyChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-[120px] h-8 bg-neutral-900 border-neutral-800 text-neutral-200 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-800">
            {currencies.map((c) => (
              <SelectItem
                key={c.value}
                value={c.value}
                className="text-neutral-200 focus:bg-neutral-800 focus:text-white text-xs"
              >
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Idioma */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-800/50 border border-neutral-700/30 flex items-center justify-center">
            <Icon
              icon="solar:global-linear"
              width={18}
              className="text-neutral-400"
            />
          </div>
          <div>
            <p className="text-sm text-neutral-200">Idioma</p>
            <p className="text-[11px] text-neutral-500">Español (México)</p>
          </div>
        </div>
        <span className="text-[11px] text-neutral-600 px-2.5 py-1 rounded-lg bg-neutral-800/40 border border-neutral-700/30">
          Próximamente
        </span>
      </div>
    </div>
  );
}
