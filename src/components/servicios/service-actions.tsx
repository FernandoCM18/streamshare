"use client";

import { useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { ServiceStatus } from "@/types/database";

interface ServiceActionsProps {
  serviceId: string;
  serviceName: string;
  status: ServiceStatus;
}

export function ServiceActions({
  serviceId,
  serviceName,
  status,
}: ServiceActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggleStatus() {
    startTransition(async () => {
      const result = await toggleServiceStatus(serviceId);
      if (result.success) {
        toast.success(
          result.newStatus === "active"
            ? `${serviceName} activado`
            : `${serviceName} pausado`,
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteService(serviceId);
      if (result.success) {
        toast.success(`${serviceName} eliminado`);
      } else {
        toast.error(result.error);
      }
      setShowDeleteDialog(false);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            aria-label="Acciones del servicio"
          >
            <Icon icon="solar:menu-dots-bold" width={18} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 bg-[#141420] border-[#252540]"
        >
          <DropdownMenuItem
            disabled
            className="text-white/70 focus:text-white focus:bg-white/5"
          >
            <Icon icon="solar:pen-bold" className="mr-2" width={16} />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleStatus}
            disabled={isPending}
            className="text-white/70 focus:text-white focus:bg-white/5"
          >
            {status === "active" ? (
              <>
                <Icon icon="solar:pause-bold" className="mr-2" width={16} />
                Pausar
              </>
            ) : (
              <>
                <Icon icon="solar:play-bold" className="mr-2" width={16} />
                Activar
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#252540]" />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
          >
            <Icon
              icon="solar:trash-bin-trash-bold"
              className="mr-2"
              width={16}
            />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#141420] border-[#252540]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Eliminar servicio
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="text-white font-medium">{serviceName}</span>?
              Esta acción no se puede deshacer. Se eliminarán todos los ciclos
              de cobro y pagos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1a1a2e] border-[#252540] text-white hover:bg-[#252540] hover:text-white">
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
