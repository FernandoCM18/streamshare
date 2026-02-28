"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markMyPaymentAsPaid(
  paymentId: string,
  customAmount?: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Use claim_payment RPC — this validates the member is the current user
  const { error } = await supabase.rpc("claim_payment", {
    p_payment_id: paymentId,
    p_claimed_amount: customAmount ?? 0,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
