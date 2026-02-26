"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markMyPaymentAsPaid(
  paymentId: string,
  customAmount?: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select(
      "id, amount_due, amount_paid, accumulated_debt, status, personas!inner(profile_id)",
    )
    .eq("id", paymentId)
    .eq("personas.profile_id", user.id)
    .single();

  if (paymentError || !payment) {
    return { success: false, error: "Pago no encontrado para tu usuario." };
  }

  if (!["pending", "partial", "overdue"].includes(payment.status)) {
    return { success: false, error: "Este pago no se puede actualizar." };
  }

  const remaining =
    Number(payment.amount_due) +
    Number(payment.accumulated_debt) -
    Number(payment.amount_paid);

  if (remaining <= 0) {
    return { success: false, error: "Este pago ya está cubierto." };
  }

  const claimedAmount = customAmount ?? remaining;
  if (claimedAmount <= 0) {
    return { success: false, error: "El monto debe ser mayor a 0." };
  }

  // Use claim_payment — only marks as "paid" (awaiting owner confirmation)
  // Does NOT actually reconcile the payment
  const { error } = await supabase.rpc("claim_payment", {
    p_payment_id: paymentId,
    p_claimed_amount: claimedAmount,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/mis-pagos");
  revalidatePath("/dashboard");
  revalidatePath("/servicios");
  return { success: true };
}
