"use client";

import { NoteItem } from "@/components/shared/note-item";
import type { NoteData } from "@/components/shared/note-item";
import {
  updatePaymentNote,
  deletePaymentNote,
} from "@/app/(dashboard)/dashboard/actions";

interface PaymentNote {
  id: string;
  content: string;
  author_id: string;
  is_edited: boolean;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

export function PaymentNotesSection({
  notes,
  isOwner,
}: {
  notes: PaymentNote[];
  isOwner: boolean;
}) {
  if (!notes || notes.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note as NoteData}
          isOwner={isOwner}
          onUpdate={updatePaymentNote}
          onDelete={deletePaymentNote}
        />
      ))}
    </div>
  );
}
