"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePayments, revalidateNotes } from "@/lib/revalidate";
import type {
  RegisterPaymentResult,
  EditPaymentResult,
} from "@/types/database";

// ── Schemas ──────────────────────────────────────────────────────

const uuidSchema = z.string().uuid();
const amountSchema = z.number().positive().max(999999);
const contentSchema = z.string().min(1).max(1000);

// ── Actions ──────────────────────────────────────────────────────

export async function registerPayment(
  paymentId: string,
  amountPaid: number,
): Promise<{
  success: boolean;
  error?: string;
  result: RegisterPaymentResult | null;
}> {
  const parsed = z
    .object({ paymentId: uuidSchema, amountPaid: amountSchema })
    .safeParse({ paymentId, amountPaid });
  if (!parsed.success)
    return { success: false, error: "Datos inválidos", result: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado", result: null };

  const { data, error } = await supabase.rpc("register_payment", {
    p_payment_id: parsed.data.paymentId,
    p_amount_paid: parsed.data.amountPaid,
  });

  if (error) return { success: false, error: error.message, result: null };

  revalidatePayments();
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
  const parsed = z
    .object({
      paymentId: uuidSchema,
      amountPaid: amountSchema,
      note: contentSchema.optional(),
    })
    .safeParse({ paymentId, amountPaid, note: note || undefined });
  if (!parsed.success)
    return {
      success: false,
      confirmed: false,
      error: "Datos inválidos",
      result: null,
    };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      confirmed: false,
      error: "No autenticado",
      result: null,
    };

  // First register the payment (RPC handles note insertion internally)
  const { data, error } = await supabase.rpc("register_payment", {
    p_payment_id: parsed.data.paymentId,
    p_amount_paid: parsed.data.amountPaid,
    p_note: parsed.data.note ?? null,
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
    p_payment_id: parsed.data.paymentId,
  });

  if (confirmError) {
    // Payment registered but not confirmed — still partial success
    revalidatePayments();
    return {
      success: true,
      confirmed: false,
      error: confirmError.message,
      result: data,
    };
  }

  revalidatePayments();
  return { success: true, confirmed: true, result: data };
}

export async function confirmPayment(paymentId: string) {
  const parsed = uuidSchema.safeParse(paymentId);
  if (!parsed.success) return { success: false, error: "ID inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { error } = await supabase.rpc("confirm_payment", {
    p_payment_id: parsed.data,
  });

  if (error) return { success: false, error: error.message };

  revalidatePayments();
  return { success: true };
}

export async function updatePaymentNote(
  noteId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = z
    .object({ noteId: uuidSchema, content: contentSchema })
    .safeParse({ noteId, content });
  if (!parsed.success) return { success: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { error } = await supabase
    .from("payment_notes")
    .update({
      content: parsed.data.content,
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.noteId)
    .eq("author_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidateNotes();
  return { success: true };
}

export async function deletePaymentNote(
  noteId: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = uuidSchema.safeParse(noteId);
  if (!parsed.success) return { success: false, error: "ID inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { error } = await supabase
    .from("payment_notes")
    .delete()
    .eq("id", parsed.data)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidateNotes();
  return { success: true };
}

export async function addPaymentNote(
  paymentId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = z
    .object({ paymentId: uuidSchema, content: contentSchema })
    .safeParse({ paymentId, content });
  if (!parsed.success) return { success: false, error: "Datos inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { data: payment } = await supabase
    .from("payments")
    .select("owner_id")
    .eq("id", parsed.data.paymentId)
    .single();

  if (!payment) return { success: false, error: "Pago no encontrado" };

  const { error } = await supabase.from("payment_notes").insert({
    payment_id: parsed.data.paymentId,
    author_id: user.id,
    owner_id: payment.owner_id,
    content: parsed.data.content,
  });

  if (error) return { success: false, error: error.message };

  revalidateNotes();
  return { success: true };
}

export async function voidPayment(
  paymentId: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = uuidSchema.safeParse(paymentId);
  if (!parsed.success) return { success: false, error: "ID inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { error } = await supabase.rpc("void_payment", {
    p_payment_id: parsed.data,
  });

  if (error) return { success: false, error: error.message };

  revalidatePayments();
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
  const parsed = z
    .object({ paymentId: uuidSchema, newAmount: amountSchema })
    .safeParse({ paymentId, newAmount });
  if (!parsed.success)
    return { success: false, error: "Datos inválidos", result: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado", result: null };

  const { data, error } = await supabase.rpc("edit_payment_amount", {
    p_payment_id: parsed.data.paymentId,
    p_new_amount: parsed.data.newAmount,
  });

  if (error) return { success: false, error: error.message, result: null };

  revalidatePayments();
  return { success: true, result: data };
}

export async function rejectPaymentClaim(
  paymentId: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = uuidSchema.safeParse(paymentId);
  if (!parsed.success) return { success: false, error: "ID inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { error } = await supabase.rpc("reject_payment_claim", {
    p_payment_id: parsed.data,
  });

  if (error) return { success: false, error: error.message };

  revalidatePayments();
  return { success: true };
}
