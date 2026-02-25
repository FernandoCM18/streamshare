"use server";

import { createClient } from "@/lib/supabase/server";
import { getResend, EMAIL_FROM } from "@/lib/email/resend";
import {
  paymentReminderHtml,
  paymentReminderSubject,
} from "@/lib/email/templates";

export async function sendPaymentReminder(paymentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  // Get payment + persona + service data
  const { data: payment, error: fetchError } = await supabase
    .from("payments")
    .select(
      "id, amount_due, due_date, personas!inner(name, email), services!inner(name)",
    )
    .eq("id", paymentId)
    .eq("owner_id", user.id)
    .single();

  if (fetchError || !payment) {
    return { success: false, error: "Pago no encontrado" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const persona = (Array.isArray(payment.personas) ? payment.personas[0] : payment.personas) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = (Array.isArray(payment.services) ? payment.services[0] : payment.services) as any;

  if (!persona?.email) {
    return { success: false, error: "La persona no tiene email registrado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const ownerName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "Usuario";

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: persona.email,
    subject: paymentReminderSubject(service.name),
    html: paymentReminderHtml({
      personaName: persona.name,
      serviceName: service.name,
      amount: Number(payment.amount_due),
      dueDate: payment.due_date,
      ownerName,
    }),
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}
