import type { PaymentStatus, ServiceStatus } from "@/types/database";

// ── Service Status ──────────────────────────────────────────────

export interface ServiceStatusEntry {
  label: string;
  badgeClass: string;
  icon?: string;
  dotClass?: string;
}

export const serviceStatusConfig: Record<ServiceStatus, ServiceStatusEntry> = {
  active: {
    label: "Activo",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    icon: "solar:check-circle-bold",
  },
  pending: {
    label: "Pausado",
    badgeClass: "bg-neutral-800 border border-neutral-700 text-neutral-500",
  },
  overdue: {
    label: "Vence pronto",
    badgeClass: "bg-red-500/10 border border-red-500/20 text-red-400",
    dotClass: "animate-pulse",
  },
};

// ── Payment Status ──────────────────────────────────────────────

export interface PaymentStatusEntry {
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  description: string;
  icon?: string;
}

export const paymentStatusConfig: Record<PaymentStatus, PaymentStatusEntry> = {
  confirmed: {
    label: "Confirmado",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    description: "El propietario confirmo tu pago.",
    icon: "solar:check-circle-bold",
  },
  paid: {
    label: "Por confirmar",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    badgeClass: "bg-blue-500/10 border border-blue-500/20 text-blue-400",
    description: "Tu pago esta siendo verificado por el propietario.",
    icon: "solar:hourglass-bold",
  },
  partial: {
    label: "Parcial",
    textClass: "text-orange-400",
    bgClass: "bg-orange-400/10",
    borderClass: "border-orange-400/20",
    badgeClass: "bg-orange-400/10 border border-orange-400/20 text-orange-400",
    description: "Has pagado una parte del monto total.",
    icon: "solar:clock-circle-bold",
  },
  pending: {
    label: "Pendiente",
    textClass: "text-orange-400",
    bgClass: "bg-orange-400/10",
    borderClass: "border-orange-400/20",
    badgeClass: "bg-orange-400/10 border border-orange-400/20 text-orange-400",
    description: "Aun no has realizado el pago.",
    icon: "solar:clock-circle-bold",
  },
  overdue: {
    label: "Vencido",
    textClass: "text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
    badgeClass: "bg-red-500/10 border border-red-500/20 text-red-400",
    description: "La fecha de vencimiento ya paso.",
    icon: "solar:danger-circle-bold",
  },
};

// ── Persona Status (derived from service statuses) ──────────────

export interface PersonaStatusEntry {
  label: string;
  badgeClass: string;
  dotClass?: string;
  icon?: string;
}

export const personaStatusConfig: Record<string, PersonaStatusEntry> = {
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
