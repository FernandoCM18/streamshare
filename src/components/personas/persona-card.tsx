"use client";

import { useTransition } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/types/database";
import type { PaymentStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deletePersona } from "@/app/(dashboard)/personas/actions";
import { RemindDrawer } from "@/components/dashboard/remind-drawer";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export interface ServiceInfo {
  service_id: string;
  service_name: string;
  service_color: string;
  service_icon: string | null;
  amount_due: number;
  status: PaymentStatus | null;
}

export interface PersonaCardData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  profile_id: string | null;
  services: ServiceInfo[];
  total_debt: number;
  monthly_amount: number;
}

const statusConfig: Record<
  string,
  { label: string; badgeClass: string; dotClass?: string; icon?: string }
> = {
  overdue: {
    label: "Vencido",
    badgeClass: "bg-red-500/10 border-red-500/20 text-red-400",
    dotClass: "bg-red-500 animate-pulse",
  },
  pending: {
    label: "Pendiente",
    badgeClass: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    dotClass: "bg-orange-500 animate-pulse",
  },
  confirmed: {
    label: "Al día",
    badgeClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    icon: "solar:check-circle-bold",
  },
  none: {
    label: "Inactivo",
    badgeClass: "bg-neutral-800 border-neutral-700 text-neutral-500",
  },
};

function getOverallStatus(services: ServiceInfo[]): string {
  if (services.length === 0) return "none";
  if (services.some((s) => s.status === "overdue")) return "overdue";
  if (services.some((s) => s.status === "pending" || s.status === "partial"))
    return "pending";
  return "confirmed";
}

function getGlowColor(status: string): string {
  if (status === "overdue") return "bg-red-600/5";
  if (status === "pending") return "bg-orange-600/5";
  if (status === "confirmed") return "bg-emerald-600/5";
  return "";
}

interface PersonaCardProps {
  persona: PersonaCardData;
  onEdit: (persona: PersonaCardData) => void;
}

export function PersonaCard({ persona, onEdit }: PersonaCardProps) {
  const [isDeleting, startTransition] = useTransition();
  const overallStatus = getOverallStatus(persona.services);
  const status = statusConfig[overallStatus];
  const hasServices = persona.services.length > 0;
  const isInactive = !hasServices;
  const hasPending = persona.services.some(
    (s) => s.status === "pending" || s.status === "overdue" || s.status === "partial",
  );
  const genderSuffix = persona.name.endsWith("a") ? "a" : "o";

  function handleDelete() {
    if (!confirm(`¿Eliminar a ${persona.name}?`)) return;
    startTransition(async () => {
      const result = await deletePersona(persona.id);
      if (result.success) {
        toast.success("Persona eliminada", {
          description: persona.name,
        });
      } else {
        toast.error("Error al eliminar", {
          description: result.error,
        });
      }
    });
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between p-5 rounded-[1.5rem] border transition-all cursor-pointer h-full backdrop-blur-sm",
        isInactive
          ? "bg-neutral-900/10 border-dashed border-neutral-800 opacity-80 hover:opacity-100 hover:border-neutral-600 hover:bg-neutral-900/30"
          : "bg-neutral-900/30 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/50",
        isDeleting && "opacity-50 pointer-events-none",
      )}
    >
      {/* Hover glow */}
      {!isInactive && (
        <div
          className={cn(
            "absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            getGlowColor(overallStatus),
          )}
        />
      )}

      {/* Header: avatar + name + amount */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative w-10 h-10 rounded-full border flex items-center justify-center text-xs font-medium shadow-lg",
              isInactive
                ? "bg-neutral-900 border-neutral-800 text-neutral-500 shadow-sm grayscale group-hover:grayscale-0 transition-all"
                : "bg-neutral-800 border-neutral-700 text-neutral-300",
            )}
          >
            {persona.avatar_url ? (
              <img
                src={persona.avatar_url}
                alt={persona.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(persona.name)
            )}
          </div>
          <div>
            <h3
              className={cn(
                "text-sm font-semibold leading-tight tracking-tight",
                isInactive
                  ? "text-neutral-400 group-hover:text-neutral-200 transition-colors"
                  : "text-neutral-200",
              )}
            >
              {persona.name}
            </h3>
            {persona.email && (
              <p
                className={cn(
                  "text-[11px] mt-0.5 font-normal",
                  isInactive ? "text-neutral-600" : "text-neutral-500",
                )}
              >
                {persona.email}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <span
            className={cn(
              "text-xs font-semibold",
              isInactive ? "text-neutral-500" : "text-neutral-200",
            )}
          >
            {formatCurrency(persona.monthly_amount)}
          </span>
          <p
            className={cn(
              "text-[9px] uppercase font-medium",
              isInactive ? "text-neutral-600" : "text-neutral-500",
            )}
          >
            / mes
          </p>
        </div>
      </div>

      {/* Service pills */}
      <div className="mt-4 mb-3 relative z-10">
        <span
          className={cn(
            "text-[10px] font-medium mb-2 block",
            isInactive ? "text-neutral-600" : "text-neutral-500",
          )}
        >
          Suscrit{genderSuffix} a ({persona.services.length}):
        </span>
        <div className="flex flex-wrap gap-2">
          {hasServices ? (
            persona.services.map((s) => (
              <div
                key={s.service_id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-800/40 border border-neutral-700/50"
              >
                {s.service_icon ? (
                  <Icon
                    icon={s.service_icon}
                    width={10}
                    style={{ color: s.service_color }}
                  />
                ) : (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.service_color }}
                  />
                )}
                <span className="text-[10px] text-neutral-300">
                  {s.service_name}
                </span>
              </div>
            ))
          ) : (
            <span className="text-[10px] text-neutral-600 italic">
              Sin servicios asignados
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="mb-4 flex items-center justify-between relative z-10">
        <div
          className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 border",
            status.badgeClass,
          )}
        >
          {status.dotClass && (
            <span className={cn("w-1.5 h-1.5 rounded-full", status.dotClass)} />
          )}
          {status.icon && <Icon icon={status.icon} width={10} />}
          {status.label}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-5 gap-2 relative z-10 pt-3 border-t border-neutral-800/50">
        {/* Editar — always present */}
        <Button
          variant="ghost"
          size="xs"
          className="col-span-2 h-8 rounded-lg bg-neutral-800/40 hover:bg-neutral-700/60 border-transparent hover:border-neutral-600 text-[10px] font-medium text-neutral-400 hover:text-white"
          onClick={() => onEdit(persona)}
        >
          <Icon icon="solar:pen-2-bold" width={12} />
          Editar
        </Button>

        {/* Middle button — contextual */}
        {isInactive ? (
          <Button
            variant="ghost"
            size="xs"
            className="col-span-2 h-8 rounded-lg bg-neutral-800/40 hover:bg-neutral-700/60 border-transparent hover:border-neutral-600 text-[10px] font-medium text-neutral-400 hover:text-white"
            disabled
          >
            <Icon icon="solar:add-circle-linear" width={12} />
            Asignar
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="xs"
            className="col-span-2 h-8 rounded-lg bg-neutral-800/40 hover:bg-neutral-700/60 border-transparent hover:border-neutral-600 text-[10px] font-medium text-neutral-400 hover:text-white"
            disabled
          >
            <Icon icon="solar:checklist-minimalistic-bold" width={12} />
            Servicios
          </Button>
        )}

        {/* Last button — contextual */}
        {isInactive ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="col-span-1 h-8 w-full rounded-lg bg-neutral-800/40 hover:bg-red-500/10 border-transparent hover:border-red-500/20 text-neutral-400 hover:text-red-400"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Eliminar"
          >
            <Icon icon="solar:trash-bin-trash-bold" width={12} />
          </Button>
        ) : hasPending ? (
          <RemindDrawer
            personaName={persona.name}
            personaPhone={persona.phone}
            personaEmail={persona.email}
            serviceName={persona.services.map((s) => s.service_name).join(", ")}
            amount={persona.total_debt || persona.monthly_amount}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className="col-span-1 h-8 w-full rounded-lg bg-neutral-800/40 hover:bg-neutral-700/60 border-transparent hover:border-neutral-600 text-neutral-400 hover:text-white"
              title="Enviar recordatorio"
            >
              <Icon icon="solar:bell-bing-bold" width={12} />
            </Button>
          </RemindDrawer>
        ) : (
          <Button
            variant="ghost"
            size="icon-xs"
            className="col-span-1 h-8 w-full rounded-lg bg-neutral-800/40 hover:bg-neutral-700/60 border-transparent hover:border-neutral-600 text-neutral-400 hover:text-white"
            title="Mensaje"
            disabled
          >
            <Icon icon="solar:chat-round-dots-bold" width={12} />
          </Button>
        )}
      </div>
    </div>
  );
}
