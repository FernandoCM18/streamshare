import { formatPaymentDate, formatRelativeTime } from "@/lib/utils";
import type { PaymentStatus, StatusBadgeConfig } from "@/types/database";

export interface MemberPayment {
  id: string;
  service_id: string;
  member_id: string;
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number;
  status: PaymentStatus;
  due_date: string;
  paid_at: string | null;
  confirmed_at: string | null;
  requires_confirmation: boolean;
  members: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    profile_id: string | null;
  };
  services: { name: string };
  billing_cycles: { id: string; period_start: string; period_end: string };
}

export function normalize(val: unknown): unknown {
  return Array.isArray(val) ? (val[0] ?? null) : (val ?? null);
}

export function getServiceStatusBadge(
  dueDate: string | undefined,
  hasOverdue: boolean,
): StatusBadgeConfig | null {
  if (hasOverdue) {
    return {
      label: "VENCIDO",
      bgClass: "bg-red-500/10",
      borderClass: "border-red-500/20",
      textClass: "text-red-400",
      dotColor: "bg-red-500",
      animate: true,
    };
  }

  if (!dueDate) return null;

  const now = new Date();
  const target = new Date(dueDate);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) {
    return {
      label: formatRelativeTime(dueDate).toUpperCase(),
      bgClass: "bg-red-500/10",
      borderClass: "border-red-500/20",
      textClass: "text-red-400",
      dotColor: "bg-red-500",
      animate: true,
    };
  }

  if (diffDays <= 7) {
    return {
      label: formatRelativeTime(dueDate).toUpperCase(),
      bgClass: "bg-orange-400/10",
      borderClass: "border-orange-400/20",
      textClass: "text-orange-400",
      dotColor: "bg-orange-400",
      animate: false,
    };
  }

  return {
    label: `VENCE EL ${formatPaymentDate(dueDate).toUpperCase()}`,
    bgClass: "bg-neutral-800",
    borderClass: "border-neutral-700",
    textClass: "text-neutral-400",
    dotColor: null,
    animate: false,
  };
}
