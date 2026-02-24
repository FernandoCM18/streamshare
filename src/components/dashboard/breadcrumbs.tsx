"use client";

import { usePathname } from "next/navigation";

const routeNames: Record<string, string> = {
  "/dashboard": "Panel General",
  "/servicios": "Servicios",
  "/personas": "Personas",
  "/configuracion": "Configuración",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const name = routeNames[pathname] ?? "Panel General";

  return <span className="text-sm text-white/50">{name}</span>;
}
