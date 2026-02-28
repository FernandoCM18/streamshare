import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  DashboardSummary,
  Member,
  PaymentNote,
  PaymentStatus,
  ServiceStatus,
} from "@/types/database";

const LOCALE = "es-MX";
const DAY_IN_MS = 1000 * 60 * 60 * 24;

// =========================
// Helpers generales
// =========================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// =========================
// Utilidades de fechas y tiempo
// =========================
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Buenas noches";
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function formatDate(date?: string): string {
  if (date) {
    return new Intl.DateTimeFormat(LOCALE, {
      day: "numeric",
      month: "short",
    }).format(new Date(date));
  }

  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function formatPaymentDate(dateStr: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / DAY_IN_MS);

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return `Venció hace ${abs} día${abs !== 1 ? "s" : ""}`;
  }
  if (diffDays === 0) return "Vence hoy";
  if (diffDays === 1) return "Vence mañana";
  return `Vence en ${diffDays} días`;
}

export function formatPeriod(periodStart: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    year: "numeric",
  }).format(new Date(periodStart));
}

// =========================
// Utilidades de monedas
// =========================
export function formatCurrency(amount: number, currency = "MXN"): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// =========================
// Utilidades de dashboard/estado
// =========================
export function calcCollectedPercent(summary: DashboardSummary): number {
  if (summary.total_month_receivable === 0) return 0;
  return Math.round(
    (summary.total_month_collected / summary.total_month_receivable) * 100,
  );
}

export const statusColors: Record<PaymentStatus | ServiceStatus, string> = {
  active: "text-emerald-400",
  confirmed: "text-emerald-400",
  paid: "text-emerald-400",
  pending: "text-orange-400",
  partial: "text-orange-400",
  overdue: "text-red-400",
};

// =========================
// Reglas de negocio
// =========================
export function canUseDoubleVerification(member: Member): boolean {
  return member.profile_id !== null;
}

export function isNoteAuthor(note: PaymentNote, userId: string): boolean {
  return note.author_id === userId;
}
