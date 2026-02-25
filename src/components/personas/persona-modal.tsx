"use client";

import { useTransition } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createPersona,
  updatePersona,
} from "@/app/(dashboard)/personas/actions";
import type { PersonaCardData } from "@/components/personas/persona-card";

interface PersonaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPersona?: PersonaCardData | null;
}

export function PersonaModal({
  open,
  onOpenChange,
  editingPersona,
}: PersonaModalProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingPersona;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (isEditing) {
      formData.set("id", editingPersona!.id);
    }

    startTransition(async () => {
      const result = isEditing
        ? await updatePersona(formData)
        : await createPersona(formData);

      if (result.success) {
        toast.success(isEditing ? "Persona actualizada" : "Persona creada", {
          description: formData.get("name") as string,
        });
        onOpenChange(false);
      } else {
        toast.error("Error", { description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-3xl bg-neutral-950 border-neutral-800 p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-lg font-semibold text-neutral-100">
            {isEditing ? "Editar Persona" : "Nueva Persona"}
          </DialogTitle>
          <p className="text-xs text-neutral-500 mt-1">
            {isEditing
              ? "Actualiza los datos de esta persona"
              : "Agrega un contacto para compartir servicios"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          {/* Name */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <Icon icon="solar:user-bold" width={18} />
            </div>
            <input
              name="name"
              type="text"
              placeholder="Nombre completo"
              defaultValue={editingPersona?.name ?? ""}
              required
              className={cn(
                "w-full h-11 bg-neutral-900/20 border border-neutral-800",
                "focus:border-neutral-600 rounded-xl pl-10 pr-4",
                "text-neutral-200 placeholder:text-neutral-600 text-sm",
                "focus:outline-none focus:ring-0 transition-all",
              )}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <Icon icon="solar:letter-bold" width={18} />
            </div>
            <input
              name="email"
              type="email"
              placeholder="Email (opcional)"
              defaultValue={editingPersona?.email ?? ""}
              className={cn(
                "w-full h-11 bg-neutral-900/20 border border-neutral-800",
                "focus:border-neutral-600 rounded-xl pl-10 pr-4",
                "text-neutral-200 placeholder:text-neutral-600 text-sm",
                "focus:outline-none focus:ring-0 transition-all",
              )}
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <Icon icon="solar:phone-bold" width={18} />
            </div>
            <input
              name="phone"
              type="tel"
              placeholder="Teléfono (opcional)"
              defaultValue={editingPersona?.phone ?? ""}
              className={cn(
                "w-full h-11 bg-neutral-900/20 border border-neutral-800",
                "focus:border-neutral-600 rounded-xl pl-10 pr-4",
                "text-neutral-200 placeholder:text-neutral-600 text-sm",
                "focus:outline-none focus:ring-0 transition-all",
              )}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full py-3.5 rounded-2xl font-semibold text-white text-sm",
              "bg-gradient-to-r from-violet-600 to-violet-500",
              "shadow-[0_0_20px_rgba(139,92,246,0.4),0_4px_15px_rgba(139,92,246,0.3),0_1px_3px_rgba(0,0,0,0.5)]",
              "active:scale-[0.98] transition-transform",
              "disabled:opacity-60 disabled:pointer-events-none",
            )}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Icon
                  icon="solar:refresh-bold"
                  width={16}
                  className="animate-spin"
                />
                {isEditing ? "Guardando..." : "Creando..."}
              </span>
            ) : isEditing ? (
              "Guardar Cambios"
            ) : (
              "Crear Persona"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
