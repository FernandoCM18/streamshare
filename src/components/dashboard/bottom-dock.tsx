"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/dashboard",
    icon: "solar:widget-linear",
    label: "Inicio",
  },
  {
    href: "/servicios",
    icon: "solar:layers-linear",
    label: "Servicios",
  },
  {
    href: "/personas",
    icon: "solar:users-group-rounded-linear",
    label: "Personas",
  },
  {
    href: "/configuracion",
    icon: "solar:settings-linear",
    label: "Config",
  },
];

export function BottomDock() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 rounded-full border border-neutral-800/60 bg-neutral-900/80 p-1.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "group relative flex items-center gap-2 rounded-full transition-all",
                isActive
                  ? "bg-linear-to-b from-white/20 via-white/5 to-white/10 px-5 py-2.5 text-sm font-medium text-neutral-200 hover:from-white/25 hover:via-white/10 hover:to-white/15 active:scale-95"
                  : "h-11 w-11 justify-center text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200",
              )}
            >
              <Icon
                icon={tab.icon}
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-neutral-300" : "text-neutral-500",
                )}
              />
              {isActive && (
                <span className="font-sans text-sm tracking-tight text-neutral-100">
                  {tab.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
