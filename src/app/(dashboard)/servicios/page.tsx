import { createClient } from "@/lib/supabase/server";
import { ServiceCard } from "@/components/servicios/service-card";
import { Icon } from "@iconify/react";
import ServiciosHeader from "@/components/servicios/servicios-header";
import type { ServiceSummary } from "@/types/database";

export default async function ServiciosPage() {
  const supabase = await createClient();

  const [{ data: services }, { data: personas }] = await Promise.all([
    supabase.from("service_summary").select("*").order("name"),
    supabase.from("personas").select("id, name, email"),
  ]);

  const serviceList = (services ?? []) as ServiceSummary[];
  const activeCount = serviceList.filter((s) => s.status === "active").length;
  const inactiveCount = serviceList.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <ServiciosHeader
        serviceCount={serviceList.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        personas={personas ?? []}
      />

      {/* Grid */}
      {serviceList.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {serviceList.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              personas={personas ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#252540] bg-[#0f0f18]/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <Icon icon="solar:tv-bold" width={28} className="text-violet-400" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">
            No tienes servicios aún
          </h3>
          <p className="text-xs text-white/40 max-w-xs mx-auto">
            Crea tu primer servicio para empezar a gestionar los pagos
            compartidos de tus suscripciones.
          </p>
        </div>
      )}
    </div>
  );
}
