"use client";

import { Header } from "@/components/dashboard/header";
import { BottomDock } from "@/components/dashboard/bottom-dock";
import { useSwUpdate } from "@/hooks/use-sw-update";
import type { ServiceSummary, MyPayment } from "@/types/database";
import type { PersonaCardData } from "@/types/database";

interface AppShellProps {
  displayName: string;
  avatarUrl: string | null;
  email: string;
  services: ServiceSummary[];
  personas: PersonaCardData[];
  myPayments: MyPayment[];
  children: React.ReactNode;
}

export function AppShell({
  displayName,
  avatarUrl,
  email,
  services,
  personas,
  myPayments,
  children,
}: AppShellProps) {
  useSwUpdate();

  return (
    <div className="min-h-screen bg-neutral-950/95 pt-[calc(3.5rem+env(safe-area-inset-top))]">
      <Header
        displayName={displayName}
        avatarUrl={avatarUrl}
        email={email}
        services={services}
        personas={personas}
        myPayments={myPayments}
      />
      <div className="animate-[fadeIn_0.3s_ease-out]">{children}</div>
      <BottomDock />
    </div>
  );
}
