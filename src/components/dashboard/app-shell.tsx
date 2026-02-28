"use client";

import { Header } from "@/components/dashboard/header";
import { BottomDock } from "@/components/dashboard/bottom-dock";
import type { ServiceSummary, MyPayment } from "@/types/database";
import type { CommandPersona } from "@/components/shared/command-palette";

interface AppShellProps {
  displayName: string;
  avatarUrl: string | null;
  email: string;
  services: ServiceSummary[];
  personas: CommandPersona[];
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
  return (
    <div className="min-h-screen bg-neutral-950/95 pt-14">
      <Header
        displayName={displayName}
        avatarUrl={avatarUrl}
        email={email}
        services={services}
        personas={personas}
        myPayments={myPayments}
      />
      {children}
      <BottomDock />
    </div>
  );
}
