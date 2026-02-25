"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { PersonaCard } from "@/components/personas/persona-card";
import { PersonaModal } from "@/components/personas/persona-modal";
import type { PersonaCardData } from "@/components/personas/persona-card";

interface PersonasGridProps {
  personas: PersonaCardData[];
}

export function PersonasGrid({ personas }: PersonasGridProps) {
  const [editingPersona, setEditingPersona] = useState<PersonaCardData | null>(
    null,
  );

  return (
    <>
      {personas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onEdit={setEditingPersona}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/20 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <Icon
              icon="solar:users-group-rounded-bold"
              width={28}
              className="text-violet-400"
            />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">
            No tienes personas aún
          </h3>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Agrega personas para asignarlas a tus servicios compartidos y
            gestionar los pagos.
          </p>
        </div>
      )}

      <PersonaModal
        open={!!editingPersona}
        onOpenChange={(open) => {
          if (!open) setEditingPersona(null);
        }}
        editingPersona={editingPersona}
      />
    </>
  );
}
