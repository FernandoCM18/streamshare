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
  revalidatePath("/mis-pagos");
  return {
    success: true,
    result: data as {
      cycles_paid: Array<{ payment_id: string; amount: number }>;
      credit_generated: boolean;
      credit_amount: number;
    },
  };
}

export async function registerAndConfirmPayment(
  paymentId: string,
  amountPaid: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  // Step 1: register the payment
  const { data, error } = await supabase.rpc("register_payment", {
    p_payment_id: paymentId,
    p_amount_paid: amountPaid,
  });

  if (error) return { success: false, error: error.message };

  // Step 2: try to confirm (only works if status became 'paid', i.e. full payment)
  // For partial payments confirm_payment will fail — that's expected, not an error
  const { error: confirmError } = await supabase.rpc("confirm_payment", {
    p_payment_id: paymentId,
  });

  // Always revalidate regardless of confirm result
  revalidatePath("/dashboard");
  revalidatePath("/servicios");
  revalidatePath("/mis-pagos");

  const result = data as {
    cycles_paid: Array<{ payment_id: string; amount: number }>;
    credit_generated: boolean;
    credit_amount: number;
  };

  return {
    success: true,
    // Let the caller know if it was fully confirmed or just registered (partial)
    confirmed: !confirmError,
    result,
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
  revalidatePath("/mis-pagos");
  return { success: true };
}

export async function rejectPaymentClaim(paymentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  // Reset payment back to pending via raw SQL to handle enum cast
  const { error } = await supabase.rpc("reject_payment_claim", {
    p_payment_id: paymentId,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/servicios");
  revalidatePath("/mis-pagos");
  return { success: true };
}
