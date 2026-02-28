"use client";

import { useState, useTransition } from "react";
import confetti from "canvas-confetti";
import { Icon } from "@iconify/react";
import {
  cn,
  formatPaymentDate,
  getInitials,
  formatCurrency,
} from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  registerAndConfirmPayment,
  rejectPaymentClaim,
} from "@/app/(dashboard)/dashboard/actions";
import {
  normalize,
  type MemberPayment,
} from "@/components/dashboard/service-card-utils";

export function VerificationClaimRow({ payment }: { payment: MemberPayment }) {
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  const member = normalize(payment.members) as {
    id: string;
    name: string;
    email: string | null;
    avatar_url: string | null;
    profile_id: string | null;
  } | null;
  if (!member || dismissed) return null;

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
          { description: `Se aplicará al próximo ciclo de ${member!.name}` },
        );
      }

      toast.success("¡Pago confirmado!", {
        description: `${member!.name} — ${formatCurrency(claimedAmount)}`,
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
          description: `El pago de ${member!.name} volvió a pendiente`,
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
            {member.name} indica que pagó
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
            {member.avatar_url ? (
              <AvatarImage
                src={member.avatar_url}
                alt={member.name}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback
              className={cn(
                "text-xs font-medium text-neutral-400",
                "bg-neutral-800 border border-neutral-700",
              )}
            >
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-neutral-200 font-medium truncate">
              {member.name}
            </p>
            <p className="text-[10px] text-neutral-500">
              Dice que pagó{" "}
              <span className="text-neutral-300 font-medium">
                {formatCurrency(claimedAmount)}
              </span>{" "}
              de {formatCurrency(totalOwed)}
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
              <Icon
                icon="solar:refresh-bold"
                width={14}
                className="animate-spin"
              />
            ) : (
              "Confirmar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
