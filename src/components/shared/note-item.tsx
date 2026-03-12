"use client";

import { useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import { cn, getInitials, formatRelativeDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export interface NoteData {
  id: string;
  content: string;
  author_id: string;
  is_edited: boolean;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface NoteItemProps {
  note: NoteData;
  isOwner: boolean;
  onUpdate: (
    id: string,
    content: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function NoteItem({ note, isOwner, onUpdate, onDelete }: NoteItemProps) {
  const authorName = note.profiles?.display_name ?? "Usuario";
  const authorAvatar = note.profiles?.avatar_url;
  const initials = getInitials(authorName);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!editContent.trim()) return;
    startTransition(async () => {
      const result = await onUpdate(note.id, editContent.trim());
      if (result.success) {
        setEditing(false);
        toast.success("Nota actualizada");
      } else {
        toast.error("Error al actualizar nota", {
          description: result.error,
        });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await onDelete(note.id);
      if (result.success) {
        toast.success("Nota eliminada");
      } else {
        toast.error("Error al eliminar nota", {
          description: result.error,
        });
      }
    });
  }

  return (
    <div
      className={cn(
        "flex gap-2 p-2 rounded-lg bg-neutral-900/30",
        isPending && "opacity-60 pointer-events-none",
      )}
    >
      {authorAvatar ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={authorAvatar}
          alt={authorName}
          className="w-5 h-5 rounded-full object-cover border border-neutral-700 shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[7px] font-semibold text-neutral-400">
            {initials}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={cn(
                "w-full bg-neutral-900/20 border border-neutral-800",
                "focus:border-neutral-600 rounded-lg px-2.5 py-1.5",
                "text-neutral-200 placeholder:text-neutral-600",
                "text-[11px] focus:outline-none focus:ring-0",
                "transition-all resize-none",
              )}
              rows={2}
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="xs"
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium",
                  "bg-violet-500/10 hover:bg-violet-500/20",
                  "text-violet-400 border border-violet-500/20",
                )}
                type="button"
                disabled={isPending || !editContent.trim()}
                onClick={handleSave}
              >
                {isPending ? (
                  <Icon
                    icon="solar:refresh-bold"
                    width={10}
                    className="animate-spin"
                  />
                ) : (
                  <Icon icon="solar:check-read-bold" width={10} />
                )}
                Guardar
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium",
                  "bg-neutral-800/40 hover:bg-neutral-700/60",
                  "text-neutral-400",
                )}
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditContent(note.content);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-medium text-neutral-400">
                {authorName}
              </span>
              <p className="text-[11px] text-neutral-300 break-words mt-0.5">
                {note.content}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-neutral-600">
                  {formatRelativeDate(note.created_at)}
                </span>
                {note.is_edited && (
                  <span className="text-[9px] text-neutral-600 italic">
                    (editado)
                  </span>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-5 w-5 text-neutral-600 hover:text-neutral-300"
                  type="button"
                  onClick={() => setEditing(true)}
                >
                  <Icon icon="solar:pen-linear" width={11} />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-5 w-5 text-neutral-600 hover:text-red-400"
                      type="button"
                    >
                      <Icon icon="solar:trash-bin-2-linear" width={11} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-neutral-950 border-neutral-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-neutral-100">
                        Eliminar nota
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        Esta accion no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                        onClick={handleDelete}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
