"use client";

import { useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  toggleServiceStatus,
  deleteService,
} from "@/app/(dashboard)/servicios/actions";
import { toast } from "sonner";
import EditServiceDrawer from "./edit-service-drawer";
import type { ServiceSummary, Persona } from "@/types/database";

interface ServiceActionsProps {
  service: ServiceSummary;
  personas: Pick<Persona, "id" | "name" | "email">[];
  isOwner: boolean;
}

const cardBtn =
  "h-8 rounded-lg bg-neutral-800/40 hover:bg-neutral-700/60 border-transparent hover:border-neutral-600 text-[10px] font-medium text-neutral-400 hover:text-white";

export function ServiceActions({ service, personas, isOwner }: ServiceActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isActive = service.status === "active";

  function handleToggleStatus() {
    startTransition(async () => {
      const result = await toggleServiceStatus(service.id);
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
    startTransition(async () => {
      const result = await deleteService(service.id);
      if (result.success) {
        toast.success(`${service.name} eliminado`);
      } else {
        toast.error(result.error);
      }
      setShowDeleteDialog(false);
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
        onClick={() => setShowEditDrawer(true)}
      >
        <Icon icon="solar:pen-linear" width={12} />
        Editar
      </Button>

      {/* Toggle status button */}
      <Button
        variant="ghost"
        className={`col-span-2 ${cardBtn}`}
        onClick={handleToggleStatus}
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

      {/* Delete / Share button */}
      {isActive ? (
        <Button
          variant="ghost"
          className={`col-span-1 ${cardBtn}`}
          title="Compartir"
        >
          <Icon icon="solar:share-linear" width={12} />
        </Button>
      ) : (
        <Button
          variant="ghost"
          className={`col-span-1 ${cardBtn} hover:text-red-400 hover:border-red-400/20`}
          title="Eliminar"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isPending}
        >
          <Icon icon="solar:trash-bin-trash-linear" width={12} />
        </Button>
      )}

      {/* Edit Drawer */}
      <EditServiceDrawer
        open={showEditDrawer}
        onOpenChange={setShowEditDrawer}
        service={service}
        personas={personas}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-neutral-950 border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-100">
              Eliminar servicio
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="text-neutral-100 font-medium">
                {service.name}
              </span>
              ? Esta acción no se puede deshacer. Se eliminarán todos los ciclos
              de cobro y pagos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
