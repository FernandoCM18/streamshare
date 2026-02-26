"use client";

import { useState } from "react";
import { ProfileCard } from "./profile-card";
import { PreferenciasCard } from "./preferencias-card";
import { NotificacionesCard } from "./notificaciones-card";
import { ZonaPeligro } from "./zona-peligro";
import type { Profile, UserSettings } from "@/types/database";

interface ConfiguracionClientProps {
  profile: Profile;
  settings: UserSettings;
}

export function ConfiguracionClient({
  profile,
  settings,
}: ConfiguracionClientProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Configuración</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Ajustes de tu cuenta y preferencias
        </p>
      </div>

      <ProfileCard
        profile={profile}
        isEditing={isEditingProfile}
        onToggleEdit={() => setIsEditingProfile((v) => !v)}
      />

      <PreferenciasCard settings={settings} />

      <NotificacionesCard settings={settings} />

      <ZonaPeligro />

      <p className="text-[10px] font-mono text-neutral-500 opacity-40 text-center pb-4">
        StreamShare v1.0.0
      </p>
    </div>
  );
}
