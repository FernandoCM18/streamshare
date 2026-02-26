import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/server";
import { MyPaymentCard } from "@/components/mis-pagos/my-payment-card";

type PaymentRow = {
  id: string;
  service_id: string;
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number;
  status: "pending" | "partial" | "paid" | "confirmed" | "overdue";
  due_date: string;
  services: { id: string; name: string; color: string; icon_url: string | null };
  personas: { owner_id: string };
};

export default async function MisPagosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, service_id, amount_due, amount_paid, accumulated_debt, status, due_date, services!inner(id, name, color, icon_url), personas!inner(owner_id, profile_id)",
    )
    .eq("personas.profile_id", user.id)
    .in("status", ["pending", "partial", "paid", "confirmed", "overdue"])
    .order("due_date", { ascending: true });

  const rows = (payments ?? []) as unknown as PaymentRow[];
  const ownerIds = [...new Set(rows.map((r) => r.personas.owner_id))];

  const { data: owners } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ownerIds)
    : { data: [] as Array<{ id: string; display_name: string }> };

  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o.display_name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Mis pagos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Aquí puedes ver tus servicios compartidos y marcar cuando ya pagaste.
        </p>
      </div>

      {rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {rows.map((payment) => (
            <MyPaymentCard
              key={payment.id}
              paymentId={payment.id}
              serviceName={payment.services.name}
              serviceColor={payment.services.color}
              serviceIcon={payment.services.icon_url}
              ownerName={ownerMap.get(payment.personas.owner_id) ?? "Propietario"}
              status={payment.status}
              dueDate={payment.due_date}
              amountDue={Number(payment.amount_due)}
              amountPaid={Number(payment.amount_paid)}
              accumulatedDebt={Number(payment.accumulated_debt)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/20 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <Icon
              icon="solar:wallet-money-bold"
              width={28}
              className="text-violet-400"
            />
          </div>
          <h3 className="mb-1 text-sm font-medium text-white">
            Aún no tienes pagos asignados
          </h3>
          <p className="mx-auto max-w-xs text-xs text-neutral-500">
            Cuando el propietario te agregue a un servicio con tu email, verás tus
            pagos aquí automáticamente.
          </p>
        </div>
      )}
    </div>
  );
}
