"use client";

import { useRef, useState, useTransition } from "react";
import confetti from "canvas-confetti";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/types/database";
import type { ServiceSummary, PaymentStatus } from "@/types/database";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  registerPayment,
  registerAndConfirmPayment,
  confirmPayment,
  rejectPaymentClaim,
} from "@/app/(dashboard)/dashboard/actions";
import { markMyPaymentAsPaid } from "@/app/(dashboard)/mis-pagos/actions";
import { RemindDrawer } from "@/components/dashboard/remind-drawer";

// ─── Amount Popover ──────────────────────────────────────────

function AmountPopover({
  defaultAmount,
  label,
  onConfirm,
  isPending,
  children,
}: {
  defaultAmount: number;
  label: string;
  onConfirm: (amount: number) => void;
  isPending: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpen(nextOpen: boolean) {
    if (nextOpen) {
      setAmount(defaultAmount.toFixed(2));
    }
    setOpen(nextOpen);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    setOpen(false);
    onConfirm(parsed);
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 bg-neutral-950 border-neutral-800 p-3"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-[11px] font-medium text-neutral-400">{label}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
              $
            </span>
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="w-full bg-neutral-900 border border-neutral-700 focus:border-neutral-500 rounded-lg pl-7 pr-3 py-2 text-sm text-neutral-200 font-mono placeholder:text-neutral-600 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className={cn(
              "w-full h-8 rounded-lg text-[11px] font-semibold",
              "bg-emerald-500/20 hover:bg-emerald-500/30",
              "text-emerald-400 border border-emerald-500/30",
            )}
          >
            {isPending ? (
              <Icon
                icon="solar:refresh-bold"
                width={12}
                className="animate-spin"
              />
            ) : (
              "Confirmar"
            )}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPaymentDate(dateStr: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return `Venció hace ${abs} día${abs !== 1 ? "s" : ""}`;
  }
  if (diffDays === 0) return "Vence hoy";
  if (diffDays === 1) return "Vence mañana";
  return `Vence en ${diffDays} días`;
}

export interface MemberPayment {
  id: string;
  persona_id: string;
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number;
  status: PaymentStatus;
  due_date: string;
  paid_at: string | null;
  confirmed_at: string | null;
  requires_confirmation: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  personas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  billing_cycles: any;
}

const memberStatusConfig: Record<
  PaymentStatus,
  {
    label: (p: MemberPayment) => string;
    textClass: string;
    dotClass: string;
    iconName?: string;
  }
> = {
  confirmed: {
    label: (p) =>
      p.confirmed_at
        ? `Pagado el ${formatPaymentDate(p.confirmed_at)}`
        : "Confirmado",
    textClass: "text-emerald-500",
    dotClass: "bg-emerald-500",
  },
  paid: {
    label: (p) =>
      p.paid_at
        ? `Pagó el ${formatPaymentDate(p.paid_at)}`
        : "Esperando confirmación",
    textClass: "text-emerald-500",
    dotClass: "bg-emerald-500",
  },
  pending: {
    label: () => "Pendiente",
    textClass: "text-orange-400",
    dotClass: "bg-orange-500",
    iconName: "solar:clock-circle-bold",
  },
  partial: {
    label: (p) =>
      `Parcial — ${formatCurrency(p.amount_paid)} de ${formatCurrency(p.amount_due)}`,
    textClass: "text-orange-400",
    dotClass: "bg-orange-500",
    iconName: "solar:clock-circle-bold",
  },
  overdue: {
    label: (p) => `Vencido — ${formatPaymentDate(p.due_date)}`,
    textClass: "text-red-400",
    dotClass: "bg-red-500 animate-pulse",
    iconName: "solar:danger-circle-bold",
  },
};

const guestStatusConfig: Record<
  PaymentStatus,
  { label: (p: MemberPayment) => string; textClass: string; iconName: string }
> = {
  confirmed: {
    label: () => "Confirmado",
    textClass: "text-emerald-500",
    iconName: "solar:check-circle-bold",
  },
  paid: {
    label: () => "Esperando confirmación",
    textClass: "text-emerald-500",
    iconName: "solar:hourglass-bold",
  },
  pending: {
    label: () => "Pendiente de pago",
    textClass: "text-orange-400",
    iconName: "solar:clock-circle-bold",
  },
  partial: {
    label: (p) =>
      `Pago parcial — ${formatCurrency(p.amount_paid)} de ${formatCurrency(Number(p.amount_due) + Number(p.accumulated_debt))}`,
    textClass: "text-orange-400",
    iconName: "solar:clock-circle-bold",
  },
  overdue: {
    label: () => "Vencido",
    textClass: "text-red-400",
    iconName: "solar:danger-circle-bold",
  },
};

function getServiceStatusBadge(
  dueDate: string | undefined,
  hasOverdue: boolean,
) {
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

interface DashboardServiceCardProps {
  service: ServiceSummary;
  payments: MemberPayment[];
  isOwner?: boolean;
}

export function DashboardServiceCard({
  service,
  payments,
  isOwner = true,
}: DashboardServiceCardProps) {
  const normalize = (val: unknown) =>
    Array.isArray(val) ? (val[0] ?? null) : (val ?? null);

  const firstDueDate = payments[0]?.due_date;
  const hasOverdue = payments.some((p) => p.status === "overdue");
  const statusBadge = getServiceStatusBadge(firstDueDate, hasOverdue);

  const pendingVerifications = payments.filter((p) => p.status === "paid");
  const regularPayments = payments.filter((p) => p.status !== "paid");

  const isIndividual = payments.length === 0 && (service.members ?? []).length === 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden",
        "rounded-[2rem] p-0 gap-0",
        "bg-neutral-900/30 ring-0",
        "border border-neutral-800",
        "hover:border-neutral-700",
        "transition-all",
      )}
    >
      {/* Glow — always visible, intensifies on hover */}
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] pointer-events-none transition-opacity duration-500"
        style={{
          backgroundColor: `${service.color}0d`,
        }}
      />

      {/* Header */}
      <CardHeader className="flex items-center justify-between gap-4 rounded-t-none p-6 pb-0">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 shrink-0 rounded-2xl bg-black border border-neutral-800 flex items-center justify-center shadow-lg"
            style={{
              boxShadow: `0 4px 14px ${service.color}1a`,
            }}
          >
            <Icon
              icon={service.icon_url ?? "solar:tv-bold"}
              width={28}
              style={{ color: service.color }}
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-neutral-200">
              {service.name}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Día {service.billing_day} •
              {" " + formatCurrency(service.monthly_cost)}
              /mes
            </p>
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium",
                isOwner
                  ? "bg-violet-500/10 border border-violet-500/20 text-violet-400"
                  : "bg-blue-500/10 border border-blue-500/20 text-blue-400",
              )}
            >
              <Icon
                icon={isOwner ? "solar:crown-bold" : "solar:user-bold"}
                width={9}
              />
              {isOwner ? "Propietario" : "Miembro"}
            </span>
          </div>
        </div>

        {statusBadge && (
          <Badge
            variant="outline"
            className={cn(
              "h-auto px-3 py-1 rounded-full",
              "text-[10px] font-medium gap-1.5 shrink-0",
              statusBadge.bgClass,
              statusBadge.borderClass,
              statusBadge.textClass,
            )}
          >
            {statusBadge.dotColor && (
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  statusBadge.dotColor,
                  statusBadge.animate && "animate-pulse",
                )}
              />
            )}
            {statusBadge.label}
          </Badge>
        )}
      </CardHeader>

      {/* Content — different for owner vs guest */}
      <CardContent className="p-6">
        {isOwner ? (
          // ── Owner view: show all members + their payment status ──
          isIndividual ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
              <Icon
                icon="solar:calendar-bold"
                width={16}
                className="text-neutral-500"
              />
              <p className="text-xs text-neutral-400">
                Próximo cobro:{" "}
                <span className="text-neutral-200 font-medium">
                  {firstDueDate
                    ? formatPaymentDate(firstDueDate)
                    : `${service.billing_day} de cada mes`}
                </span>
              </p>
            </div>
          ) : payments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {regularPayments.map((payment) => (
                <MemberPaymentRow
                  key={payment.id}
                  payment={payment}
                  normalize={normalize}
                  serviceName={service.name}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-3">
              {(service.members ?? []).length > 0
                ? "Sin ciclo de cobro activo"
                : "Sin miembros asignados"}
            </p>
          )
        ) : (
          // ── Guest view: show only your own payment ──
          payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <GuestPaymentRow
                  key={payment.id}
                  payment={payment}
                  serviceName={service.name}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-3">
              Sin pagos pendientes este mes
            </p>
          )
        )}
      </CardContent>

      {/* Verification request section — owner only */}
      {isOwner && pendingVerifications.length > 0 && (
        <CardFooter
          className={cn(
            "flex-col items-stretch gap-0 p-0",
            "border-t-0 bg-transparent",
            "rounded-b-[2rem]",
          )}
        >
          <Separator className="bg-neutral-800/60" />
          <div className="relative">
            <div className="absolute inset-0 bg-neutral-800/10" />
            <div className="relative p-6 pt-4 space-y-3">
              {pendingVerifications.map((payment) => (
                <VerificationClaimRow
                  key={payment.id}
                  payment={payment}
                  normalize={normalize}
                />
              ))}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// ─── Member Payment Row ────────────────────────────────────

function MemberPaymentRow({
  payment,
  normalize,
  serviceName,
}: {
  payment: MemberPayment;
  normalize: (val: unknown) => unknown;
  serviceName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const persona = normalize(payment.personas) as {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    profile_id: string | null;
  } | null;
  if (!persona) return null;

  const config = memberStatusConfig[payment.status];
  const totalOwed =
    Number(payment.amount_due) + Number(payment.accumulated_debt);
  const isActionable =
    payment.status === "pending" ||
    payment.status === "partial" ||
    payment.status === "overdue";

  function handleRegister(amount: number) {
    startTransition(async () => {
      const result = await registerAndConfirmPayment(payment.id, amount);
      if (result.success) {
        toast.success(
          result.confirmed
            ? `Pago de ${persona!.name} confirmado`
            : `Pago parcial de ${persona!.name} registrado`,
          { description: `${formatCurrency(amount)} en ${serviceName}` },
        );
        if (result.result?.credit_generated) {
          toast.info(
            `Crédito generado: ${formatCurrency(result.result.credit_amount)}`,
            { description: `Se aplicará al próximo ciclo de ${persona!.name}` },
          );
        }
      } else {
        toast.error("Error al registrar pago", {
          description: result.error,
        });
      }
    });
  }

  function handleMarkFullPaid() {
    handleRegister(totalOwed);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        "p-3 rounded-xl",
        "bg-neutral-900/50",
        "border border-neutral-800/50",
        isActionable && "hover:bg-neutral-800/40 transition-colors",
        isPending && "opacity-60 pointer-events-none",
      )}
    >
      {/* Top row: Avatar + name + status + amount */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar size="lg" className="shrink-0">
            {persona.avatar_url ? (
              <AvatarImage
                src={persona.avatar_url}
                alt={persona.name}
                className="object-cover border border-neutral-800"
              />
            ) : null}
            <AvatarFallback
              className={cn(
                "text-xs font-medium text-neutral-400",
                "bg-neutral-800 border border-neutral-700",
              )}
            >
              {getInitials(persona.name)}
            </AvatarFallback>
            {config.iconName && (
              <AvatarBadge
                className={cn(
                  "size-4 bg-neutral-900 ring-neutral-900",
                  "border border-neutral-800",
                )}
              >
                <Icon
                  icon={config.iconName}
                  width={10}
                  className={config.textClass}
                />
              </AvatarBadge>
            )}
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-300 truncate">
              {persona.name}
            </p>
            <p
              className={cn(
                "text-[10px] font-medium",
                config.textClass,
              )}
            >
              {config.label(payment)}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-neutral-500 shrink-0">
          {formatCurrency(totalOwed)}
        </span>
      </div>

      {/* Action buttons */}
      {isActionable && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            className={cn(
              "flex-1 px-2.5 py-1 text-[10px] font-medium",
              "bg-emerald-500/10 hover:bg-emerald-500/20",
              "text-emerald-400",
              "border border-emerald-500/20",
            )}
            type="button"
            disabled={isPending}
            onClick={handleMarkFullPaid}
          >
            {isPending ? (
              <Icon icon="solar:refresh-bold" width={12} className="animate-spin" />
            ) : (
              <Icon icon="solar:check-circle-bold" width={12} />
            )}
            Pagó todo
          </Button>
          <AmountPopover
            defaultAmount={totalOwed}
            label={`¿Cuánto pagó ${persona.name}?`}
            onConfirm={handleRegister}
            isPending={isPending}
          >
            <Button
              variant="ghost"
              size="xs"
              className={cn(
                "flex-1 px-2.5 py-1 text-[10px] font-medium",
                "bg-violet-500/10 hover:bg-violet-500/20",
                "text-violet-400",
                "border border-violet-500/20",
              )}
              type="button"
              disabled={isPending}
            >
              <Icon icon="solar:pen-new-square-bold" width={12} />
              Otro monto
            </Button>
          </AmountPopover>
          <RemindDrawer
            personaName={persona.name}
            personaPhone={persona.phone}
            personaEmail={persona.email}
            serviceName={serviceName}
            amount={totalOwed}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                "px-1.5 py-1",
                "bg-orange-500/10 hover:bg-orange-500/20",
                "text-orange-400",
                "border border-orange-500/20",
              )}
              type="button"
            >
              <Icon icon="solar:bell-bold" width={12} />
            </Button>
          </RemindDrawer>
        </div>
      )}

      {/* Confirmed/paid amount (non-actionable states) */}
      {!isActionable && (
        <div className="flex items-center gap-2 justify-end">
          {(payment.status === "confirmed" || payment.status === "paid") && (
            <Icon
              icon="solar:check-circle-bold"
              className="text-emerald-500"
              width={16}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Guest Payment Row (member view) ─────────────────────────

function GuestPaymentRow({
  payment,
  serviceName,
}: {
  payment: MemberPayment;
  serviceName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const totalOwed =
    Number(payment.amount_due) + Number(payment.accumulated_debt);
  const config = guestStatusConfig[payment.status];
  const canPay =
    payment.status === "pending" ||
    payment.status === "partial" ||
    payment.status === "overdue";

  function handleMarkPaid(amount: number) {
    startTransition(async () => {
      const result = await markMyPaymentAsPaid(payment.id, amount);
      if (result.success) {
        toast.success("¡Pago registrado!", {
          description: `${formatCurrency(amount)} en ${serviceName}`,
        });
      } else {
        toast.error("Error al registrar pago", {
          description: result.error,
        });
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        "p-3 rounded-xl",
        "bg-neutral-900/50",
        "border border-neutral-800/50",
        isPending && "opacity-60 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center",
            "bg-neutral-800 border border-neutral-700",
          )}
        >
          <Icon icon={config.iconName} width={16} className={config.textClass} />
        </div>
        <div className="min-w-0">
          <p className={cn("text-xs font-medium", config.textClass)}>
            {config.label(payment)}
          </p>
          <p className="text-[10px] text-neutral-500">
            {payment.status === "partial"
              ? `Restante: ${formatCurrency(totalOwed - Number(payment.amount_paid))} • Vence ${formatPaymentDate(payment.due_date)}`
              : `${formatCurrency(totalOwed)} • Vence ${formatPaymentDate(payment.due_date)}`}
          </p>
        </div>
      </div>

      {canPay ? (
        <AmountPopover
          defaultAmount={payment.status === "partial" ? totalOwed - Number(payment.amount_paid) : totalOwed}
          label="¿Cuánto pagaste?"
          onConfirm={handleMarkPaid}
          isPending={isPending}
        >
          <Button
            variant="ghost"
            size="xs"
            className={cn(
              "px-3 py-1.5 text-[10px] font-medium shrink-0",
              "bg-violet-500/10 hover:bg-violet-500/20",
              "text-violet-400",
              "border border-violet-500/20",
            )}
            type="button"
            disabled={isPending}
          >
            {isPending ? (
              <Icon
                icon="solar:refresh-bold"
                width={12}
                className="animate-spin"
              />
            ) : (
              <Icon icon="solar:hand-money-bold" width={12} />
            )}
            Ya pagué
          </Button>
        </AmountPopover>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          <Icon
            icon="solar:check-circle-bold"
            className="text-emerald-500"
            width={14}
          />
          <span className="text-[10px] font-medium text-emerald-400">
            {payment.status === "paid" ? "Enviado" : "Listo"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Verification Claim Row ────────────────────────────────

function VerificationClaimRow({
  payment,
  normalize,
}: {
  payment: MemberPayment;
  normalize: (val: unknown) => unknown;
}) {
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  const persona = normalize(payment.personas) as {
    id: string;
    name: string;
    email: string | null;
    avatar_url: string | null;
    profile_id: string | null;
  } | null;
  if (!persona || dismissed) return null;

  const totalOwed =
    Number(payment.amount_due) + Number(payment.accumulated_debt);
  const claimedAmount = Number(payment.amount_paid);

  function handleConfirm() {
    startTransition(async () => {
      // Reject claim first (resets to pending), then register + confirm
      const rejectResult = await rejectPaymentClaim(payment.id);
      if (!rejectResult.success) {
        toast.error("Error al procesar", {
          description: rejectResult.error,
        });
        return;
      }

      const registerResult = await registerAndConfirmPayment(
        payment.id,
        claimedAmount,
      );
      if (!registerResult.success) {
        toast.error("Error al confirmar pago", {
          description: registerResult.error,
        });
        return;
      }

      if (registerResult.result?.credit_generated) {
        toast.info(
          `Crédito generado: ${formatCurrency(registerResult.result.credit_amount)}`,
          { description: `Se aplicará al próximo ciclo de ${persona!.name}` },
        );
      }

      toast.success("¡Pago confirmado!", {
        description: `${persona!.name} — ${formatCurrency(claimedAmount)}`,
      });

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(200);

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#34d399", "#6ee7b7", "#a78bfa", "#ffffff"],
      });
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectPaymentClaim(payment.id);
      if (result.success) {
        setDismissed(true);
        toast("Reclamo rechazado", {
          description: `El pago de ${persona!.name} volvió a pendiente`,
        });
      } else {
        toast.error("Error al rechazar", {
          description: result.error,
        });
      }
    });
  }

  return (
    <div className={cn(isPending && "opacity-60 pointer-events-none")}>
      {/* Claim header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
            {persona.name} indica que pagó
          </span>
        </div>
        {payment.paid_at && (
          <span className="text-[9px] text-neutral-500 font-mono">
            {formatPaymentDate(payment.paid_at)}
          </span>
        )}
      </div>

      {/* Claim card */}
      <div
        className={cn(
          "flex items-center justify-between",
          "p-3 rounded-xl",
          "bg-neutral-950",
          "border border-neutral-800",
          "shadow-inner",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar size="lg" className="shrink-0">
            {persona.avatar_url ? (
              <AvatarImage
                src={persona.avatar_url}
                alt={persona.name}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback
              className={cn(
                "text-xs font-medium text-neutral-400",
                "bg-neutral-800 border border-neutral-700",
              )}
            >
              {getInitials(persona.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-neutral-200 font-medium truncate">
              {persona.name}
            </p>
            <p className="text-[10px] text-neutral-500">
              Dice que pagó{" "}
              <span className="text-neutral-300 font-medium">
                {formatCurrency(claimedAmount)}
              </span>
              {" "}de {formatCurrency(totalOwed)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg bg-transparent",
              "border-neutral-700",
              "text-neutral-400 hover:text-white",
              "hover:bg-neutral-800",
            )}
            type="button"
            disabled={isPending}
            onClick={handleReject}
          >
            <Icon icon="solar:close-circle-linear" width={18} />
          </Button>
          <Button
            size="sm"
            className={cn(
              "h-8 px-3 rounded-lg",
              "bg-white text-black",
              "text-[10px] font-semibold",
              "hover:bg-neutral-200",
              "border-transparent",
              "shadow-[0_0_10px_rgba(255,255,255,0.1)]",
            )}
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <Icon icon="solar:refresh-bold" width={14} className="animate-spin" />
            ) : (
              "Confirmar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
