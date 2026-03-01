"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { UserMenu } from "@/components/dashboard/user-menu";
import { LogoIcon } from "@/components/icons/LogoIcon";
import { BellIcon } from "@/components/icons/BellIcon";
import { SearchIcon } from "../icons/SearchIcon";
import { CommandPalette } from "@/components/shared/command-palette";
import ServiceDetailModal from "@/components/servicios/service-detail-modal";
import { PersonaDetailModal } from "@/components/personas/persona-detail-modal";
import { MyPaymentDetailModal } from "@/components/mis-pagos/my-payment-detail-modal";
import type { ServiceSummary, MyPayment } from "@/types/database";
import type { PersonaCardData } from "@/types/database";

interface HeaderProps {
  displayName: string;
  avatarUrl: string | null;
  email: string;
  services: ServiceSummary[];
  personas: PersonaCardData[];
  myPayments: MyPayment[];
}

export function Header({
  displayName,
  avatarUrl,
  email,
  services,
  personas,
  myPayments,
}: HeaderProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceSummary | null>(
    null,
  );
  const [selectedPersona, setSelectedPersona] =
    useState<PersonaCardData | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<MyPayment | null>(
    null,
  );

  const handleSelectPersona = (personaId: string) => {
    const found = personas.find((p) => p.id === personaId);
    if (found) setSelectedPersona(found);
  };

  return (
    <>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        services={services}
        personas={personas}
        myPayments={myPayments}
        onSelectService={setSelectedService}
        onSelectPersona={handleSelectPersona}
        onSelectPayment={setSelectedPayment}
      />

      {selectedService && (
        <ServiceDetailModal
          open={!!selectedService}
          onOpenChange={(open) => {
            if (!open) setSelectedService(null);
          }}
          service={selectedService}
        />
      )}

      {selectedPersona && (
        <PersonaDetailModal
          open={!!selectedPersona}
          onOpenChange={(open) => {
            if (!open) setSelectedPersona(null);
          }}
          persona={selectedPersona}
        />
      )}

      {selectedPayment && (
        <MyPaymentDetailModal
          open={!!selectedPayment}
          onOpenChange={(open) => {
            if (!open) setSelectedPayment(null);
          }}
          payment={selectedPayment}
        />
      )}

      <header className="fixed inset-x-0 top-0 z-40 h-14 px-6 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
        {/* Logo y Breadcrumbs */}
        <div className="flex items-center gap-3">
          <LogoIcon />
          <span className="text-sm font-semibold text-white hidden sm:inline">
            StreamShare
          </span>
          <span className="text-white/20 hidden sm:inline">/</span>
          <Breadcrumbs />
        </div>
        {/* Buscador */}
        <div className="w-auto sm:w-full sm:max-w-md">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex hover:bg-neutral-800/60 transition-colors focus:outline-none group text-sm text-neutral-500 bg-neutral-900/40 w-auto sm:w-full border-neutral-800/80 border rounded-lg py-1.5 px-2 sm:px-3 items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <SearchIcon />
              <span className="font-sans sm:hidden">Buscar</span>
              <span className="font-sans hidden sm:inline">
                Buscar miembros, servicios...
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 opacity-70">
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/50 font-sans">
                ⌘
              </kbd>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/50 font-sans">
                K
              </kbd>
            </div>
          </button>
        </div>
        {/* Notificaciones y Usuario */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-neutral-800/40 transition-colors">
            <BellIcon />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-400" />
          </button>

          <UserMenu
            displayName={displayName}
            avatarUrl={avatarUrl}
            email={email}
          />
        </div>
      </header>
    </>
  );
}
