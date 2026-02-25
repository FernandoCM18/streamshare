"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function registerPayment(paymentId: string, amountPaid: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { data, error } = await supabase.rpc("register_payment", {
    p_payment_id: paymentId,
    p_amount_paid: amountPaid,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/servicios");
  return {
    success: true,
    result: data as {
      cycles_paid: Array<{ payment_id: string; amount: number }>;
      credit_generated: boolean;
      credit_amount: number;
    },
  };
}

export async function confirmPayment(paymentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { error } = await supabase.rpc("confirm_payment", {
    p_payment_id: paymentId,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/servicios");
  return { success: true };
}

export async function rejectPaymentClaim(paymentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  // Reset payment back to pending (owner rejects the claim)
  const { error } = await supabase
    .from("payments")
    .update({
      status: "pending" as const,
      amount_paid: 0,
      paid_at: null,
    })
    .eq("id", paymentId)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/servicios");
  return { success: true };
}
