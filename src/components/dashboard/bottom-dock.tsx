"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { WidgetIcon } from "../icons/WidgetIcon";
import { LayersIcon } from "../icons/LayersIcons";
import { UsersIcon } from "../icons/UsersIcons";
import { WalletIcon } from "../icons/WalletIcon";
import { SettingIcon } from "../icons/SettingIcon";

const tabs = [
  { href: "/dashboard", Icon: WidgetIcon, label: "Inicio" },
  { href: "/servicios", Icon: LayersIcon, label: "Servicios" },
  { href: "/personas", Icon: UsersIcon, label: "Personas" },
  { href: "/mis-pagos", Icon: WalletIcon, label: "Mis pagos" },
  {
    href: "/configuracion",
    Icon: (props: React.SVGProps<SVGSVGElement>) => (
      <SettingIcon width={20} height={20} {...props} />
    ),
    label: "Config",
  },
];

export function BottomDock() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-neutral-800/60 bg-neutral-900/80 p-1.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch
              className={cn(
                "group relative flex items-center justify-center rounded-full transition-colors",
                isActive
                  ? "text-neutral-200"
                  : "h-11 w-11 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="dock-active-bg"
                  className="absolute inset-0 rounded-full bg-linear-to-b from-white/20 via-white/5 to-white/10"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}

              <motion.div
                className="relative z-10 flex items-center gap-2"
                animate={{
                  paddingLeft: isActive ? 20 : 0,
                  paddingRight: isActive ? 20 : 0,
                  paddingTop: isActive ? 10 : 0,
                  paddingBottom: isActive ? 10 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              >
                <div
                  className={cn(
                    "shrink-0 transition-colors duration-200",
                    isActive ? "text-neutral-300" : "text-neutral-500",
                  )}
                >
                  <tab.Icon />
                </div>

                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.span
                      key={tab.href}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        opacity: { duration: 0.15 },
                      }}
                      className="overflow-hidden whitespace-nowrap font-sans text-sm tracking-tight text-neutral-100"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
