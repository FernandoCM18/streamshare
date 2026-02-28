"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import CreateServiceModal from "@/components/servicios/create-service-modal";
import type { Member } from "@/types/database";

interface ServiciosHeaderProps {
  serviceCount: number;
  activeCount: number;
  inactiveCount: number;
  members: Pick<Member, "id" | "name" | "email">[];
}

export default function ServiciosHeader({
  serviceCount,
  activeCount,
  inactiveCount,
  members,
}: ServiciosHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end gap-6 w-full justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">
              Gestión de Servicios
            </h1>
            <Badge className="text-[10px] font-medium text-neutral-400 bg-neutral-800 border-neutral-700 border rounded-full pt-0.5 pr-2.5 pb-0.5 pl-2.5">
              Total: {serviceCount}
            </Badge>
          </div>
          <p className="text-neutral-500 text-sm mt-1">
            Visualiza el estado de tus suscripciones. Tienes
            <span className="text-neutral-300">
              {" "}
              {activeCount} activa{activeCount !== 1 ? "s" : ""}{" "}
            </span>
            y{" "}
            <span className="text-neutral-400">
              {inactiveCount} inactiva{inactiveCount !== 1 ? "s" : ""}
            </span>
            .
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-cta-gold flex items-center justify-center gap-2 shrink-0"
        >
          <Icon icon="solar:add-circle-bold" width={18} />
          <span className="relative z-10">Nuevo Servicio</span>
        </button>
      </div>

      <CreateServiceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        members={members}
      />
    </>
  );
}
