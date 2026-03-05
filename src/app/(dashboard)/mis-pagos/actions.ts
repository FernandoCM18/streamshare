"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markMyPaymentAsPaid(
  paymentId: string,
  customAmount?: number,
  note?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Use claim_payment RPC — this validates the member is the current user
  const { error } = await supabase.rpc("claim_payment", {
    p_payment_id: paymentId,
    p_claimed_amount: customAmount ?? 0,
  });

  if (error) return { success: false, error: error.message };

  // Insert payment note if provided
  if (note) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Get payment owner_id (may differ from current user in guest view)
      const { data: payment } = await supabase
        .from("payments")
        .select("owner_id")
        .eq("id", paymentId)
        .single();

      const { error: noteError } = await supabase
        .from("payment_notes")
        .insert({
          payment_id: paymentId,
          author_id: user.id,
          owner_id: payment?.owner_id ?? user.id,
          content: note,
        });
      if (noteError) {
        console.error("Error inserting payment note:", noteError);
      }
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}
