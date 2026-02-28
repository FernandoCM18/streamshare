"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { PersonaCard } from "@/components/personas/persona-card";
import { PersonaModal } from "@/components/personas/persona-modal";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
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
        <EmptyStateCard
          icon={
            <Icon
              icon="solar:users-group-rounded-bold"
              width={28}
              className="text-neutral-400"
            />
          }
          iconContainerClassName="bg-neutral-500/10"
          title="No tienes personas aún"
          description="Agrega personas para asignarlas a tus servicios compartidos y gestionar los pagos."
        />
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
