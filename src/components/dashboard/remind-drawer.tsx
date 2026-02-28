"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { toast } from "sonner";

interface RemindDrawerProps {
  memberName: string;
  memberPhone: string | null;
  memberEmail: string | null;
  serviceName: string;
  amount: number;
  children: React.ReactNode;
}

export function RemindDrawer({
  memberName,
  memberPhone,
  memberEmail,
  serviceName,
  amount,
  children,
}: RemindDrawerProps) {
  const [open, setOpen] = useState(false);

  const message = `Hola ${memberName}, te recuerdo que tienes pendiente el pago de ${serviceName} por ${formatCurrency(amount)}. ¡Gracias!`;

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    toast.success("Mensaje copiado", {
      description: "Listo para pegar donde quieras",
    });
    setOpen(false);
  }

  function handleWhatsApp() {
    if (!memberPhone) {
      toast.error("Sin número de teléfono", {
        description: `${memberName} no tiene número registrado`,
      });
      return;
    }
    const phone = memberPhone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setOpen(false);
  }

  function handleEmail() {
    if (!memberEmail) {
      toast.error("Sin email", {
        description: `${memberName} no tiene email registrado`,
      });
      return;
    }
    const subject = encodeURIComponent(`Recordatorio de pago — ${serviceName}`);
    const body = encodeURIComponent(message);
    window.open(`mailto:${memberEmail}?subject=${subject}&body=${body}`);
    setOpen(false);
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="bg-neutral-950 border-neutral-800">
        <div className="mx-auto w-full max-w-sm pb-8">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-neutral-100 text-base">
              Recordar a {memberName}
            </DrawerTitle>
            <p className="text-xs text-neutral-500 mt-1">
              {serviceName} • {formatCurrency(amount)}
            </p>
          </DrawerHeader>

          {/* Message preview */}
          <div className="mx-4 mb-5 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 px-4">
            <button
              onClick={handleCopy}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl",
                "bg-neutral-900/30 border border-neutral-800",
                "hover:bg-neutral-900/50 hover:border-neutral-700",
                "transition-all active:scale-[0.98]",
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Icon
                  icon="solar:copy-bold"
                  width={20}
                  className="text-violet-400"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-neutral-200">
                  Copiar mensaje
                </p>
                <p className="text-[10px] text-neutral-500">
                  Pega en cualquier app de mensajes
                </p>
              </div>
            </button>

            <button
              onClick={handleWhatsApp}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl",
                "bg-neutral-900/30 border border-neutral-800",
                "hover:bg-neutral-900/50 hover:border-neutral-700",
                "transition-all active:scale-[0.98]",
                !memberPhone && "opacity-50",
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Icon
                  icon="mdi:whatsapp"
                  width={22}
                  className="text-emerald-400"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-neutral-200">
                  Abrir WhatsApp
                </p>
                <p className="text-[10px] text-neutral-500">
                  {memberPhone
                    ? `Enviar a ${memberPhone}`
                    : "No tiene número registrado"}
                </p>
              </div>
            </button>

            <button
              onClick={handleEmail}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl",
                "bg-neutral-900/30 border border-neutral-800",
                "hover:bg-neutral-900/50 hover:border-neutral-700",
                "transition-all active:scale-[0.98]",
                !memberEmail && "opacity-50",
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Icon
                  icon="solar:letter-bold"
                  width={20}
                  className="text-blue-400"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-neutral-200">
                  Enviar email
                </p>
                <p className="text-[10px] text-neutral-500">
                  {memberEmail ?? "No tiene email registrado"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
