"use client";

import Link from "next/link";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { OAuthButton } from "@/components/auth/oauth-button";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Icon
            icon="solar:screencast-2-bold-duotone"
            className="h-8 w-8 text-orange-400"
          />
          <span className="text-xl font-semibold text-white">StreamShare</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Iniciar sesión</h1>
        <p className="text-sm text-white/50">
          Ingresa tu email para recibir un enlace de acceso
        </p>
      </div>

      <MagicLinkForm />

      <div className="flex items-center gap-3">
        <Separator className="flex-1 bg-neutral-800" />
        <span className="text-xs text-white/30">o continúa con</span>
        <Separator className="flex-1 bg-neutral-800" />
      </div>

      <OAuthButton />

      <p className="text-center text-sm text-white/50">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-violet-400 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
