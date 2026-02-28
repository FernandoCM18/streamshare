"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/app/(dashboard)/configuracion/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingIcon } from "../icons/SettingIcon";
import { LogoutIcon } from "../icons/LogoutIcon";

interface UserMenuProps {
  displayName: string;
  avatarUrl: string | null;
  email: string;
}

export function UserMenu({ displayName, avatarUrl, email }: UserMenuProps) {
  const router = useRouter();

  function handleSignOut() {
    signOut();
  }

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500/30">
          <Avatar className="h-8 w-8 border border-neutral-700">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-neutral-800 text-white/70 text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-neutral-900 border-neutral-800"
      >
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-white">{displayName}</p>
          <p className="text-xs text-white/50">{email}</p>
        </div>
        <DropdownMenuSeparator className="bg-neutral-800" />
        <DropdownMenuItem
          onClick={() => router.push("/configuracion")}
          className="text-white/70 focus:text-white focus:bg-neutral-800"
        >
          <SettingIcon />
          Configuración
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-neutral-800" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-400 focus:text-red-400 focus:bg-neutral-800"
        >
          <LogoutIcon />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
