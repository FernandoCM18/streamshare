"use client";

import { Icon } from "@iconify/react";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { UserMenu } from "@/components/dashboard/user-menu";

interface HeaderProps {
  displayName: string;
  avatarUrl: string | null;
  email: string;
}

export function Header({ displayName, avatarUrl, email }: HeaderProps) {
  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Icon
          icon="solar:screencast-2-bold-duotone"
          className="h-6 w-6 text-orange-400"
        />
        <span className="text-sm font-semibold text-white hidden sm:inline">
          StreamShare
        </span>
        <span className="text-white/20 hidden sm:inline">/</span>
        <Breadcrumbs />
      </div>
      <div className="w-auto sm:w-full sm:max-w-md">
        <button className="flex hover:bg-neutral-800/60 transition-colors focus:outline-none group text-sm text-neutral-500 bg-neutral-900/40 w-auto sm:w-full border-neutral-800/80 border rounded-lg py-1.5 px-2 sm:px-3 items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Icon
              icon="solar:magnifer-linear"
              className="size-4 text-neutral-500 group-hover:text-neutral-400 transition-colors"
            />
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
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-neutral-800/40 transition-colors">
          <Icon icon="solar:bell-linear" className="h-4 w-4 text-white/50" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-400" />
        </button>

        <UserMenu
          displayName={displayName}
          avatarUrl={avatarUrl}
          email={email}
        />
      </div>
    </header>
  );
}
