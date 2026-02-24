"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/dashboard",
    icon: "solar:home-2-bold-duotone",
    label: "Inicio",
  },
  {
    href: "/servicios",
    icon: "solar:tv-bold-duotone",
    label: "Servicios",
  },
  {
    href: "/personas",
    icon: "solar:users-group-rounded-bold-duotone",
    label: "Personas",
  },
  {
    href: "/configuracion",
    icon: "solar:settings-bold-duotone",
    label: "Config",
  },
];

export function BottomDock() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
      <div className="flex items-center gap-1 bg-neutral-900/80 backdrop-blur-xl rounded-full p-1.5 border border-neutral-800/60">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 rounded-full transition-all",
                isActive
                  ? "bg-gradient-to-r from-violet-600/20 to-violet-500/10 border border-violet-500/30 px-4 py-2"
                  : "w-10 h-10 justify-center hover:bg-neutral-800/40",
              )}
            >
              <Icon
                icon={tab.icon}
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-violet-400" : "text-white/40",
                )}
              />
              {isActive && (
                <span className="text-xs font-medium text-violet-300">
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
