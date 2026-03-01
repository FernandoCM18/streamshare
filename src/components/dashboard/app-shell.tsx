"use client";

import { motion } from "motion/react";
import { Header } from "@/components/dashboard/header";
import { BottomDock } from "@/components/dashboard/bottom-dock";
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
      <BottomDock />
    </div>
  );
}
