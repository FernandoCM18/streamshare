"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidateMyPayments } from "@/lib/revalidate";

// ── Schemas ──────────────────────────────────────────────────────

const markPaidSchema = z.object({
  paymentId: z.string().uuid(),
  customAmount: z.number().min(0).max(999999).optional(),
  note: z.string().max(1000).optional(),
});

// ── Actions ──────────────────────────────────────────────────────

export async function markMyPaymentAsPaid(
  paymentId: string,
  customAmount?: number,
  note?: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = markPaidSchema.safeParse({
    paymentId,
    customAmount,
    note: note || undefined,
  });
  if (!parsed.success)
    return { success: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  // Use claim_payment RPC — this validates the member is the current user
  const { error } = await supabase.rpc("claim_payment", {
    p_payment_id: parsed.data.paymentId,
    p_claimed_amount: parsed.data.customAmount ?? 0,
  });

  if (error) return { success: false, error: error.message };

  // Insert payment note if provided
  if (parsed.data.note) {
    // Get payment owner_id (may differ from current user in guest view)
    const { data: payment } = await supabase
      .from("payments")
      .select("owner_id")
      .eq("id", parsed.data.paymentId)
      .single();

    const { error: noteError } = await supabase
      .from("payment_notes")
      .insert({
        payment_id: parsed.data.paymentId,
        author_id: user.id,
        owner_id: payment?.owner_id ?? user.id,
        content: parsed.data.note,
      });
    if (noteError) {
      console.error("Error inserting payment note:", noteError);
    }
  }

  revalidateMyPayments();
  return { success: true };
}
