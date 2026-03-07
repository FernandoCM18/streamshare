import type { Metadata } from "next";
import { getRequiredUser } from "@/lib/auth/user";

export const metadata: Metadata = {
  title: "Mis Pagos",
};
import { getCachedMyPayments, getCachedMyPaymentNotes } from "@/lib/queries";
import { MisPagosClient } from "./mis-pagos-client";

export default async function MisPagosPage() {
  const user = await getRequiredUser();
  const [payments, allNotes] = await Promise.all([
    getCachedMyPayments(user.id),
    getCachedMyPaymentNotes(),
  ]);

  // Build a map of payment_id -> notes[]
  const notesMap: Record<
    string,
    { id: string; content: string; author_id: string; is_edited: boolean; created_at: string }[]
  > = {};
  for (const note of allNotes) {
    if (!notesMap[note.payment_id]) notesMap[note.payment_id] = [];
    notesMap[note.payment_id].push({
      id: note.id,
      content: note.content,
      author_id: note.author_id,
      is_edited: note.is_edited,
      created_at: note.created_at,
    });
  }

  return <MisPagosClient payments={payments} notesMap={notesMap} />;
}
