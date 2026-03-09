"use client";

import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface PaymentConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAmount: number;
  memberName: string;
  serviceName: string;
  isPending: boolean;
  onConfirm: (amount: number, note?: string) => void;
  /** When false, amount is shown as read-only display. Default true. */
  amountEditable?: boolean;
}

export function PaymentConfirmModal({
  open,
  onOpenChange,
  defaultAmount,
  memberName,
  serviceName,
  isPending,
  onConfirm,
  amountEditable = true,
}: PaymentConfirmModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setAmount(defaultAmount.toFixed(2));
      setNote("");
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = amountEditable ? amount : defaultAmount.toFixed(2);
    const parsed = Math.round(parseFloat(value) * 100) / 100;
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    onConfirm(parsed, note.trim() || undefined);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[92vh] bg-neutral-950 border-neutral-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 gap-0 flex flex-col overflow-hidden sm:max-w-md data-closed:slide-out-to-bottom-4 data-open:slide-in-from-bottom-4 duration-200"
        showCloseButton={false}
      >
        {/* Drag Handle (mobile) */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/60 px-5 pt-3 pb-4 sm:px-6 sm:pt-5">
          <div>
            <DialogTitle className="text-base font-semibold text-white">
              Confirmar pago
            </DialogTitle>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              {memberName} &middot; {serviceName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-neutral-800/60 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-700/60 hover:border-neutral-600 transition-all duration-150 focus:outline-none shrink-0"
          >
            <Icon icon="solar:close-square-linear" width={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Amount field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Monto
              </label>
              {amountEditable ? (
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                    $
                  </span>
                  <input
                    ref={inputRef}
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
                    }}
                    autoFocus
                    className="w-full bg-neutral-900/20 border border-neutral-800 focus:border-neutral-600 rounded-xl pl-8 pr-4 py-3 text-neutral-200 font-mono text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-0 transition-all"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-xl bg-neutral-900/20 border border-neutral-800 px-4 py-3">
                  <span className="text-sm text-neutral-500">$</span>
                  <span className="text-sm font-mono font-medium text-neutral-200">
                    {defaultAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Note field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Nota
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Agregar nota (opcional)"
                rows={2}
                maxLength={500}
                className="w-full bg-neutral-900/20 border border-neutral-800 focus:border-neutral-600 rounded-xl px-4 py-3 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-0 transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-800/60 p-5 sm:p-6">
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all active:scale-[0.98]",
                "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
                "hover:bg-emerald-500/15 hover:border-emerald-500/30",
                "disabled:opacity-60 disabled:pointer-events-none",
              )}
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Icon
                    icon="solar:refresh-bold"
                    className="h-4 w-4 animate-spin"
                  />
                  Procesando...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Icon icon="solar:check-circle-bold" width={16} />
                  Confirmar pago
                </span>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
