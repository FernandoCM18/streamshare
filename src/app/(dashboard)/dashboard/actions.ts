"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { RegisterPaymentResult } from "@/types/database";

export async function registerPayment(
  paymentId: string,
  amountPaid: number,
): Promise<{
  success: boolean;
  error?: string;
  result: RegisterPaymentResult | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_payment", {
    p_payment_id: paymentId,
    p_amount_paid: amountPaid,
  });

  if (error) return { success: false, error: error.message, result: null };

  revalidatePath("/", "layout");
  return { success: true, result: data };
}

export async function registerAndConfirmPayment(
  paymentId: string,
  amountPaid: number,
): Promise<{
  success: boolean;
  confirmed: boolean;
  error?: string;
  result: {
    cycles_paid: { payment_id: string; amount: number }[];
    credit_generated: boolean;
    credit_amount: number;
  } | null;
}> {
  const supabase = await createClient();

  // First register the payment
  const { data, error } = await supabase.rpc("register_payment", {
    p_payment_id: paymentId,
    p_amount_paid: amountPaid,
  });

  if (error) {
    return {
      success: false,
      confirmed: false,
      error: error.message,
      result: null,
    };
  }

  // Then confirm it (owner action — skips double-verification)
  const { error: confirmError } = await supabase.rpc("confirm_payment", {
    p_payment_id: paymentId,
  });

  if (confirmError) {
    // Payment registered but not confirmed — still partial success
    revalidatePath("/", "layout");
    return {
      success: true,
      confirmed: false,
      error: confirmError.message,
      result: data,
    };
  }

  revalidatePath("/", "layout");
  return { success: true, confirmed: true, result: data };
}

export async function confirmPayment(paymentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_payment", {
    p_payment_id: paymentId,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function rejectPaymentClaim(
  paymentId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_payment_claim", {
    p_payment_id: paymentId,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
