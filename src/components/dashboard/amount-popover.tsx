"use client";

import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface AmountPopoverProps {
  defaultAmount: number;
  label: string;
  onConfirm: (amount: number) => void;
  isPending: boolean;
  children: React.ReactNode;
}

export function AmountPopover({
  defaultAmount,
  label,
  onConfirm,
  isPending,
  children,
}: AmountPopoverProps) {
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
