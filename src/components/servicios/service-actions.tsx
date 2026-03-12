"use client";

import { useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  toggleServiceStatus,
  deleteService,
} from "@/app/(dashboard)/servicios/actions";
import { toast } from "sonner";
import type { ServiceSummary, Member } from "@/types/database";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface ServiceActionsProps {
  service: ServiceSummary;
  members: Pick<Member, "id" | "name" | "email">[];
  isOwner: boolean;
  onEdit: () => void;
  onDeletingChange?: (deleting: boolean) => void;
}

const cardBtn =
  "h-8 rounded-lg bg-neutral-800/40 hover:bg-neutral-700/60 border-transparent hover:border-neutral-600 text-[10px] font-medium text-neutral-400 hover:text-white";

export function ServiceActions({
  service,
  isOwner,
  onEdit,
  onDeletingChange,
}: ServiceActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isActive = service.status === "active";

  function handleToggleStatus() {
    const newStatus = isActive ? "pending" : "active";
    startTransition(async () => {
      const result = await toggleServiceStatus(service.id, newStatus);
      if (result.success) {
        toast.success(
          result.newStatus === "active"
            ? `${service.name} activado`
            : `${service.name} pausado`,
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    onDeletingChange?.(true);
    startTransition(async () => {
      const result = await deleteService(service.id);
      if (result.success) {
        toast.success(`${service.name} eliminado`);
        // Don't close dialog — component unmounts from revalidation
      } else {
        toast.error(result.error);
        onDeletingChange?.(false);
        setShowDeleteDialog(false);
      }
    });
  }

  if (!isOwner) {
    return (
      <span className="col-span-5 text-center text-[10px] text-neutral-500 py-1">
        Solo lectura
      </span>
    );
  }

  return (
    <>
      {/* Edit button */}
      <Button
        variant="ghost"
        className={`col-span-2 ${cardBtn}`}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Icon icon="solar:pen-linear" width={12} />
        Editar
      </Button>

      {/* Toggle status button */}
      <Button
        variant="ghost"
        className={`col-span-2 ${cardBtn}`}
        onClick={(e) => {
          e.stopPropagation();
          handleToggleStatus();
        }}
        disabled={isPending}
      >
        {isActive ? (
          <>
            <Icon icon="solar:pause-linear" width={12} />
            Pausar
          </>
        ) : (
          <>
            <Icon icon="solar:play-linear" width={12} />
            Activar
          </>
        )}
      </Button>

      {/* Delete button (only when paused) */}
      {!isActive && (
        <Button
          variant="ghost"
          className={`col-span-1 ${cardBtn} hover:text-red-400 hover:border-red-400/20`}
          title="Eliminar"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteDialog(true);
          }}
          disabled={isPending}
        >
          <Icon icon="solar:trash-bin-trash-linear" width={12} />
        </Button>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Eliminar servicio"
        description={
          <>
            ¿Estás seguro de que deseas eliminar{" "}
            <span className="text-neutral-100 font-medium">
              {service.name}
            </span>
            ? Esta acción no se puede deshacer. Se eliminarán todos los ciclos
            de cobro y pagos asociados.
          </>
        }
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        isPending={isPending}
        variant="destructive"
      />
    </>
  );
}
