"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@iconify/react";
import { PersonaCard } from "@/components/personas/persona-card";
import { PersonaModal } from "@/components/personas/persona-modal";
import { PersonaDetailModal } from "@/components/personas/persona-detail-modal";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import type { PersonaCardData } from "@/types/database";

interface PersonasGridProps {
  personas: PersonaCardData[];
}

export function PersonasGrid({ personas }: PersonasGridProps) {
  const [editingPersona, setEditingPersona] = useState<PersonaCardData | null>(
    null,
  );
  const [viewingPersona, setViewingPersona] = useState<PersonaCardData | null>(
    null,
  );

  return (
    <>
      <AnimatePresence mode="popLayout">
        {personas.length > 0 ? (
          <motion.div
            key="grid"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            initial={false}
          >
            {personas.map((persona, index) => (
              <motion.div
                key={persona.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: index * 0.05,
                }}
                layout
              >
                <PersonaCard
                  persona={persona}
                  onEdit={setEditingPersona}
                  onViewDetail={setViewingPersona}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      <PersonaModal
        open={!!editingPersona}
        onOpenChange={(open) => {
          if (!open) setEditingPersona(null);
        }}
        editingPersona={editingPersona}
      />

      {viewingPersona && (
        <PersonaDetailModal
          open={!!viewingPersona}
          onOpenChange={(open) => {
            if (!open) setViewingPersona(null);
          }}
          persona={viewingPersona}
        />
      )}
    </>
  );
}
