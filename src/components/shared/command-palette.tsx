"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Command as CommandPrimitive } from "cmdk";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import type {
  ServiceSummary,
  MyPayment,
  PersonaCardData,
} from "@/types/database";

const paymentStatusLabel: Record<string, { label: string; className: string }> =
  {
    confirmed: {
      label: "Al dia",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    paid: {
      label: "Pagado",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    pending: {
      label: "Pendiente",
      className: "bg-orange-400/10 text-orange-400 border-orange-400/20",
    },
    partial: {
      label: "Parcial",
      className: "bg-orange-400/10 text-orange-400 border-orange-400/20",
    },
    overdue: {
      label: "Vencido",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  };

// ── Types ─────────────────────────────────────────────────────

export interface CommandPersona {
  id: string;
  name: string;
  email: string | null;
  profile_id: string | null;
  status: PaymentStatus | null;
  serviceCount: number;
}

import type { PaymentStatus } from "@/types/database";

// ── Props ─────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ServiceSummary[];
  personas: PersonaCardData[];
  myPayments: MyPayment[];
  onSelectService?: (service: ServiceSummary) => void;
  onSelectPersona?: (personaId: string) => void;
  onSelectPayment?: (payment: MyPayment) => void;
}

// ── Component ─────────────────────────────────────────────────

export function CommandPalette({
  open,
  onOpenChange,
  services,
  personas,
  myPayments,
  onSelectService,
  onSelectPersona,
  onSelectPayment,
}: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const selectService = (service: ServiceSummary) => {
    onOpenChange(false);
    if (onSelectService) {
      onSelectService(service);
    } else {
      router.push("/servicios");
    }
  };

  const selectPersona = (persona: PersonaCardData) => {
    onOpenChange(false);
    if (onSelectPersona) {
      onSelectPersona(persona.id);
    } else {
      router.push("/personas");
    }
  };

  const selectPayment = (payment: MyPayment) => {
    onOpenChange(false);
    if (onSelectPayment) {
      onSelectPayment(payment);
    } else {
      router.push("/mis-pagos");
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 duration-150" />

        {/* Content */}
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-[15%] z-50 w-full max-w-[560px] -translate-x-1/2",
            "data-open:animate-in data-closed:animate-out",
            "data-closed:fade-out-0 data-open:fade-in-0",
            "data-closed:zoom-out-98 data-open:zoom-in-98",
            "data-closed:slide-out-to-top-2 data-open:slide-in-from-top-2",
            "duration-150 outline-none",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Buscar
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Buscar servicios, personas y pagos
          </DialogPrimitive.Description>

          <CommandPrimitive
            className={cn(
              "flex flex-col overflow-hidden",
              "rounded-2xl border border-neutral-800/80",
              "bg-neutral-950 shadow-2xl shadow-black/50",
              "ring-1 ring-white/[0.03]",
            )}
          >
            {/* ── Search input ── */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-neutral-800/60">
              <Icon
                icon="solar:magnifer-linear"
                width={20}
                className="text-neutral-500 shrink-0"
              />
              <CommandPrimitive.Input
                placeholder="Buscar servicios, personas, pagos..."
                className="flex-1 bg-transparent text-sm text-neutral-200 placeholder:text-neutral-600 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-500 font-mono">
                ESC
              </kbd>
            </div>

            {/* ── Results ── */}
            <CommandPrimitive.List className="max-h-[min(420px,60vh)] overflow-y-auto overflow-x-hidden overscroll-contain p-2">
              <CommandPrimitive.Empty className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <Icon
                    icon="solar:magnifer-linear"
                    width={18}
                    className="text-neutral-600"
                  />
                </div>
                <p className="text-sm text-neutral-500">
                  No se encontraron resultados
                </p>
              </CommandPrimitive.Empty>

              {/* ── Servicios ── */}
              {services.length > 0 && (
                <CommandPrimitive.Group
                  heading="Servicios"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-neutral-600"
                >
                  {services.map((s) => (
                    <CommandPrimitive.Item
                      key={s.id}
                      value={s.name}
                      onSelect={() => selectService(s)}
                      className={cn(
                        "flex items-center gap-3 px-2.5 py-2.5 rounded-xl cursor-pointer",
                        "text-sm text-neutral-300 outline-none select-none",
                        "data-[selected=true]:bg-neutral-900/80",
                        "transition-colors duration-75",
                      )}
                    >
                      <div
                        className="w-9 h-9 rounded-lg bg-black border border-neutral-800 flex items-center justify-center shrink-0"
                        style={{
                          boxShadow: `0 2px 8px ${s.color}15`,
                        }}
                      >
                        <Icon
                          icon={s.icon_url ?? "solar:tv-bold"}
                          width={18}
                          style={{ color: s.color }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-neutral-200 truncate">
                          {s.name}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {formatCurrency(s.monthly_cost)}/mes ·{" "}
                          {s.member_count} miembro
                          {s.member_count !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-medium border",
                            s.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-neutral-800 text-neutral-500 border-neutral-700",
                          )}
                        >
                          {s.status === "active" ? "Activo" : "Pausado"}
                        </span>
                        <Icon
                          icon="solar:alt-arrow-right-linear"
                          width={14}
                          className="text-neutral-700"
                        />
                      </div>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              )}

              {/* ── Personas ── */}
              {personas.length > 0 && (
                <CommandPrimitive.Group
                  heading="Personas"
                  className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-neutral-600"
                >
                  {personas.map((p) => {
                    // Derive overall status from services
                    let overallStatus: string | null = null;
                    if (p.services.length > 0) {
                      if (p.services.some((s) => s.status === "overdue"))
                        overallStatus = "overdue";
                      else if (
                        p.services.some(
                          (s) =>
                            s.status === "pending" || s.status === "partial",
                        )
                      )
                        overallStatus = "pending";
                      else overallStatus = "confirmed";
                    }
                    const statusStyle = overallStatus
                      ? paymentStatusLabel[overallStatus]
                      : null;

                    return (
                      <CommandPrimitive.Item
                        key={p.id}
                        value={`${p.name} ${p.email ?? ""}`}
                        onSelect={() => selectPersona(p)}
                        className={cn(
                          "flex items-center gap-3 px-2.5 py-2.5 rounded-xl cursor-pointer",
                          "text-sm text-neutral-300 outline-none select-none",
                          "data-[selected=true]:bg-neutral-900/80",
                          "transition-colors duration-75",
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold",
                            p.profile_id
                              ? "bg-violet-500/10 border border-violet-500/20 text-violet-400"
                              : "bg-neutral-800 border border-neutral-700 text-neutral-400",
                          )}
                        >
                          {getInitials(p.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-neutral-200 truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">
                            {p.email}
                            {p.services.length > 0 && (
                              <>
                                {" "}
                                · {p.services.length} servicio
                                {p.services.length !== 1 ? "s" : ""}
                              </>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {statusStyle && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-medium border",
                                statusStyle.className,
                              )}
                            >
                              {statusStyle.label}
                            </span>
                          )}
                          <Icon
                            icon="solar:alt-arrow-right-linear"
                            width={14}
                            className="text-neutral-700"
                          />
                        </div>
                      </CommandPrimitive.Item>
                    );
                  })}
                </CommandPrimitive.Group>
              )}

              {/* ── Mis Pagos ── */}
              {myPayments.length > 0 && (
                <CommandPrimitive.Group
                  heading="Mis Pagos"
                  className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-neutral-600"
                >
                  {myPayments.map((p) => {
                    const statusStyle = paymentStatusLabel[p.status];
                    return (
                      <CommandPrimitive.Item
                        key={p.id}
                        value={`${p.service_name} ${p.owner_name}`}
                        onSelect={() => selectPayment(p)}
                        className={cn(
                          "flex items-center gap-3 px-2.5 py-2.5 rounded-xl cursor-pointer",
                          "text-sm text-neutral-300 outline-none select-none",
                          "data-[selected=true]:bg-neutral-900/80",
                          "transition-colors duration-75",
                        )}
                      >
                        <div
                          className="w-9 h-9 rounded-lg bg-black border border-neutral-800 flex items-center justify-center shrink-0"
                          style={{
                            boxShadow: `0 2px 8px ${p.service_color}15`,
                          }}
                        >
                          <Icon
                            icon={p.service_icon ?? "solar:wallet-money-bold"}
                            width={18}
                            style={{ color: p.service_color }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-neutral-200 truncate">
                            {p.service_name}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">
                            Propietario: {p.owner_name}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[12px] font-medium text-neutral-300 tabular-nums">
                            {formatCurrency(p.amount_due)}
                          </span>
                          {statusStyle && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-medium border",
                                statusStyle.className,
                              )}
                            >
                              {statusStyle.label}
                            </span>
                          )}
                          <Icon
                            icon="solar:alt-arrow-right-linear"
                            width={14}
                            className="text-neutral-700"
                          />
                        </div>
                      </CommandPrimitive.Item>
                    );
                  })}
                </CommandPrimitive.Group>
              )}
            </CommandPrimitive.List>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-4 h-10 border-t border-neutral-800/60 bg-neutral-900/30">
              <div className="flex items-center gap-3 text-[11px] text-neutral-600">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700/50 text-[10px] text-neutral-500 font-mono">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700/50 text-[10px] text-neutral-500 font-mono">
                    ↓
                  </kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700/50 text-[10px] text-neutral-500 font-mono">
                    ↵
                  </kbd>
                  abrir
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-600">
                <Icon
                  icon="solar:command-bold"
                  width={12}
                  className="text-neutral-600"
                />
                StreamShare
              </div>
            </div>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
