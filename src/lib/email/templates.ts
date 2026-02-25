import { formatCurrency } from "@/types/database";

// ─── Payment Reminder ──────────────────────────────────────

export function paymentReminderHtml({
  personaName,
  serviceName,
  amount,
  dueDate,
  ownerName,
}: {
  personaName: string;
  serviceName: string;
  amount: number;
  dueDate: string;
  ownerName: string;
}) {
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
  }).format(new Date(dueDate));

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="color:#fff;font-size:20px;margin:0">StreamShare</h1>
    </div>
    <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:32px 24px">
      <h2 style="color:#fff;font-size:16px;margin:0 0 8px">Recordatorio de pago</h2>
      <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 24px">
        Hola ${personaName}, te recordamos que tienes un pago pendiente.
      </p>
      <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:16px;margin-bottom:24px">
        <p style="color:#a3a3a3;font-size:12px;margin:0 0 4px">Servicio</p>
        <p style="color:#fff;font-size:16px;font-weight:600;margin:0 0 12px">${serviceName}</p>
        <p style="color:#a3a3a3;font-size:12px;margin:0 0 4px">Monto</p>
        <p style="color:#fff;font-size:20px;font-weight:700;margin:0 0 12px;font-family:monospace">${formatCurrency(amount)}</p>
        <p style="color:#a3a3a3;font-size:12px;margin:0 0 4px">Vencimiento</p>
        <p style="color:#fb923c;font-size:14px;font-weight:500;margin:0">${formattedDate}</p>
      </div>
      <p style="color:#737373;font-size:12px;margin:0;text-align:center">
        Enviado por ${ownerName} via StreamShare
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function paymentReminderSubject(serviceName: string) {
  return `Recordatorio de pago — ${serviceName}`;
}

// ─── Payment Confirmed ─────────────────────────────────────

export function paymentConfirmedHtml({
  personaName,
  serviceName,
  amount,
  ownerName,
}: {
  personaName: string;
  serviceName: string;
  amount: number;
  ownerName: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="color:#fff;font-size:20px;margin:0">StreamShare</h1>
    </div>
    <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:32px 24px">
      <div style="text-align:center;margin-bottom:16px">
        <span style="font-size:40px">✅</span>
      </div>
      <h2 style="color:#fff;font-size:16px;margin:0 0 8px;text-align:center">¡Pago confirmado!</h2>
      <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 24px;text-align:center">
        ${ownerName} confirmó tu pago de ${serviceName}.
      </p>
      <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center">
        <p style="color:#a3a3a3;font-size:12px;margin:0 0 4px">Monto confirmado</p>
        <p style="color:#34d399;font-size:24px;font-weight:700;margin:0;font-family:monospace">${formatCurrency(amount)}</p>
      </div>
      <p style="color:#737373;font-size:12px;margin:0;text-align:center">
        Gracias por tu pago, ${personaName}.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function paymentConfirmedSubject(serviceName: string) {
  return `¡Pago confirmado! — ${serviceName}`;
}

// ─── Invitation ─────────────────────────────────────────────

export function invitationHtml({
  personaName,
  serviceName,
  amount,
  ownerName,
  inviteUrl,
}: {
  personaName: string;
  serviceName: string;
  amount: number;
  ownerName: string;
  inviteUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="color:#fff;font-size:20px;margin:0">StreamShare</h1>
    </div>
    <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:32px 24px">
      <h2 style="color:#fff;font-size:16px;margin:0 0 8px;text-align:center">Te invitaron a compartir</h2>
      <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 24px;text-align:center">
        ${ownerName} te invitó a compartir ${serviceName} en StreamShare.
      </p>
      <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center">
        <p style="color:#a3a3a3;font-size:12px;margin:0 0 4px">Tu parte mensual</p>
        <p style="color:#fff;font-size:24px;font-weight:700;margin:0;font-family:monospace">${formatCurrency(amount)}</p>
      </div>
      <a href="${inviteUrl}" style="display:block;text-align:center;background:linear-gradient(to right,#7c3aed,#8b5cf6);color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 24px;border-radius:12px;margin-bottom:16px">
        Ver invitación
      </a>
      <p style="color:#737373;font-size:12px;margin:0;text-align:center">
        Este enlace expira en 7 días.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function invitationSubject(ownerName: string, serviceName: string) {
  return `${ownerName} te invitó a compartir ${serviceName}`;
}
