"use client";

import { useRef, useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateProfile } from "@/app/(dashboard)/configuracion/actions";
import type { Profile } from "@/types/database";
import { toast } from "sonner";

interface ProfileCardProps {
  profile: Profile;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function ProfileCard({
  profile,
  isEditing,
  onToggleEdit,
}: ProfileCardProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(profile.display_name);
  const formRef = useRef<HTMLFormElement>(null);

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const memberSince = new Date(profile.created_at).getFullYear();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success("Perfil actualizado");
        onToggleEdit();
      } else {
        toast.error(result.error ?? "Error al actualizar");
      }
    });
  }

  function handleCancel() {
    setName(profile.display_name);
    onToggleEdit();
  }

  return (
    <div className="rounded-2xl bg-linear-to-b from-neutral-800/40 to-neutral-900/40 border border-neutral-800/60 backdrop-blur-sm p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative group">
          <Avatar className="h-20 w-20 border-2 border-neutral-700">
            {profile.avatar_url && (
              <AvatarImage
                src={profile.avatar_url}
                alt={profile.display_name}
              />
            )}
            <AvatarFallback className="bg-neutral-800 text-white text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Icon
              icon="solar:camera-linear"
              width={20}
              className="text-white/70"
            />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left">
          {isEditing ? (
            <form ref={formRef} action={handleSubmit} className="space-y-3">
              <Input
                name="display_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-neutral-900/20 border-neutral-800 focus:border-neutral-600 text-white"
                placeholder="Tu nombre"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 px-4"
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  className="text-neutral-400 hover:text-white text-xs h-8 px-4"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white">
                {profile.display_name}
              </h2>
              <p className="text-sm text-neutral-400">{profile.email}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/20 text-[10px]">
                  PRO
                </Badge>
                <Badge className="bg-neutral-800 text-neutral-400 border-neutral-700 text-[10px]">
                  Miembro desde {memberSince}
                </Badge>
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <Button
            variant="outline"
            onClick={onToggleEdit}
            className="border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-600 bg-transparent text-xs h-8"
          >
            <Icon icon="solar:pen-linear" width={14} className="mr-1.5" />
            Editar Perfil
          </Button>
        )}
      </div>
    </div>
  );
}
