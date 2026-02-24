import { createClient } from "@/lib/supabase/server";
import { Icon } from "@iconify/react";
import { ServiceCard } from "@/components/servicios/service-card";
import type { ServiceSummary } from "@/types/database";
import { Badge } from "@/components/ui/badge";

export default async function ServiciosPage() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("service_summary")
    .select("*")
    .order("name");

  const serviceList = (services ?? []) as ServiceSummary[];
  const activeCount = serviceList.filter((s) => s.status === "active").length;
  const inactiveCount = serviceList.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">
              Gestión de Servicios
            </h1>
            <Badge className="text-[10px] font-medium text-neutral-400 bg-neutral-800 border-neutral-700 border rounded-full pt-0.5 pr-2.5 pb-0.5 pl-2.5">
              Total: {serviceList.length}
            </Badge>
          </div>
          <p className="text-neutral-500 text-sm mt-1">
            Visualiza el estado de tus suscripciones. Tienes
            <span className="text-neutral-300">
              {" "}
              {activeCount} activa{activeCount !== 1 ? "s" : ""}{" "}
            </span>
            y{" "}
            <span className="text-neutral-400">
              {inactiveCount} inactiva{inactiveCount !== 1 ? "s" : ""}
            </span>
            .
          </p>
        </div>
        <button className="btn-cta-gold flex items-center gap-2 shrink-0">
          <Icon icon="solar:add-circle-bold" width={18} />
          <span className="relative z-10">Nuevo Servicio</span>
        </button>
      </div>

      {/* Grid */}
      {serviceList.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {serviceList.map((service) => (
            <ServiceCard key={service.id} service={service} />
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
