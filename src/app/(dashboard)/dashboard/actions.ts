"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  RegisterPaymentResult,
  EditPaymentResult,
} from "@/types/database";

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
  note?: string,
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

  // First register the payment (RPC handles note insertion internally)
  const { data, error } = await supabase.rpc("register_payment", {
    p_payment_id: paymentId,
    p_amount_paid: amountPaid,
    p_note: note ?? null,
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

export async function updatePaymentNote(
  noteId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { error } = await supabase
    .from("payment_notes")
    .update({ content, is_edited: true, edited_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("author_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deletePaymentNote(
  noteId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { error } = await supabase
    .from("payment_notes")
    .delete()
    .eq("id", noteId)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function addPaymentNote(
  paymentId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { data: payment } = await supabase
    .from("payments")
    .select("owner_id")
    .eq("id", paymentId)
    .single();

  if (!payment) return { success: false, error: "Pago no encontrado" };

  const { error } = await supabase.from("payment_notes").insert({
    payment_id: paymentId,
    author_id: user.id,
    owner_id: payment.owner_id,
    content,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function voidPayment(
  paymentId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_payment", {
    p_payment_id: paymentId,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function editPaymentAmount(
  paymentId: string,
  newAmount: number,
): Promise<{
  success: boolean;
  error?: string;
  result: EditPaymentResult | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("edit_payment_amount", {
    p_payment_id: paymentId,
    p_new_amount: newAmount,
  });

  if (error) return { success: false, error: error.message, result: null };

  revalidatePath("/", "layout");
  return { success: true, result: data };
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
