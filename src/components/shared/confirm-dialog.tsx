"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isPending?: boolean;
  variant?: "destructive" | "default";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  isPending = false,
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!isPending) onOpenChange(o);
      }}
    >
      <AlertDialogContent className="bg-neutral-950 border-neutral-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-neutral-100">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white">
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              variant === "destructive"
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-violet-500 text-white hover:bg-violet-600",
            )}
          >
            {isPending ? "Procesando..." : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
