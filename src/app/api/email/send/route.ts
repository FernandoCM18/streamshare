import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, EMAIL_FROM } from "@/lib/email/resend";
import {
  paymentReminderHtml,
  paymentReminderSubject,
  paymentConfirmedHtml,
  paymentConfirmedSubject,
  invitationHtml,
  invitationSubject,
} from "@/lib/email/templates";

type EmailType = "payment_reminder" | "payment_confirmed" | "invitation";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { type, data } = body as { type: EmailType; data: Record<string, string> };

  if (!type || !data) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: type, data" },
      { status: 400 },
    );
  }

  // Get owner profile for sender name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const ownerName = profile?.display_name ?? user.email?.split("@")[0] ?? "Usuario";

  try {
    let html: string;
    let subject: string;
    let to: string;

    switch (type) {
      case "payment_reminder": {
        to = data.email;
        subject = paymentReminderSubject(data.serviceName);
        html = paymentReminderHtml({
          personaName: data.personaName,
          serviceName: data.serviceName,
          amount: Number(data.amount),
          dueDate: data.dueDate,
          ownerName,
        });
        break;
      }
      case "payment_confirmed": {
        to = data.email;
        subject = paymentConfirmedSubject(data.serviceName);
        html = paymentConfirmedHtml({
          personaName: data.personaName,
          serviceName: data.serviceName,
          amount: Number(data.amount),
          ownerName,
        });
        break;
      }
      case "invitation": {
        to = data.email;
        subject = invitationSubject(ownerName, data.serviceName);
        html = invitationHtml({
          personaName: data.personaName,
          serviceName: data.serviceName,
          amount: Number(data.amount),
          ownerName,
          inviteUrl: data.inviteUrl,
        });
        break;
      }
      default:
        return NextResponse.json(
          { error: `Tipo de email no soportado: ${type}` },
          { status: 400 },
        );
    }

    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
