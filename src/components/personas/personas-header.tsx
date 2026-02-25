"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { PersonaModal } from "@/components/personas/persona-modal";

interface PersonasHeaderProps {
  totalCount: number;
  upToDateCount: number;
  pendingCount: number;
}

export function PersonasHeader({
  totalCount,
  upToDateCount,
  pendingCount,
}: PersonasHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end gap-6 w-full justify-between">
        <div className="max-w-2xl">
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white tracking-tight">
            Gestión de Personas
            <Badge className="text-[10px] font-medium text-neutral-400 bg-neutral-800 border-neutral-700 border rounded-full px-2.5 py-0.5">
              Total: {totalCount}
            </Badge>
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Visualiza y gestiona a los participantes de tus suscripciones.
            {totalCount > 0 && (
              <>
                {" "}
                Tienes{" "}
                <span className="text-neutral-300">
                  {upToDateCount} al día
                </span>{" "}
                y{" "}
                <span className="text-neutral-400">
                  {pendingCount} con pagos pendientes
                </span>
                .
              </>
            )}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-cta-gold flex items-center gap-2 shrink-0"
        >
          <span className="flex items-center gap-2 text-[13px] relative z-10">
            Nueva Persona
            <Icon icon="solar:user-plus-bold" width={16} />
          </span>
        </button>
      </div>

      <PersonaModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
