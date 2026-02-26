import { createClient } from "@/lib/supabase/server";
import { ServiceCard } from "@/components/servicios/service-card";
import { Icon } from "@iconify/react";
import ServiciosHeader from "@/components/servicios/servicios-header";
import type { ServiceSummary } from "@/types/database";

export default async function ServiciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 1. Own services + own personas (for adding members)
  // 2. Services where user is a member (via personas.profile_id)
  const [{ data: ownServices }, { data: personas }, { data: linkedPersonas }] =
    await Promise.all([
      supabase
        .from("service_summary")
        .select("*")
        .eq("owner_id", user.id)
        .order("name"),
      supabase
        .from("personas")
        .select("id, name, email")
        .eq("owner_id", user.id),
      supabase
        .from("personas")
        .select("id, owner_id")
        .eq("profile_id", user.id),
    ]);

  // Find service IDs where user is a member (but not the owner)
  const linkedPersonaIds = (linkedPersonas ?? [])
    .filter((p) => p.owner_id !== user.id)
    .map((p) => p.id);

  let guestServices: ServiceSummary[] = [];

  if (linkedPersonaIds.length > 0) {
    // Get service_ids from service_members for these personas
    const { data: memberships } = await supabase
      .from("service_members")
      .select("service_id")
      .in("persona_id", linkedPersonaIds)
      .eq("is_active", true);

    const guestServiceIds = [
      ...new Set((memberships ?? []).map((m) => m.service_id)),
    ];

    if (guestServiceIds.length > 0) {
      const { data: guestData } = await supabase
        .from("service_summary")
        .select("*")
        .in("id", guestServiceIds)
        .order("name");

      guestServices = (guestData ?? []) as ServiceSummary[];
    }
  }

  const ownList = (ownServices ?? []) as ServiceSummary[];
  const allServices = [...ownList, ...guestServices];
  const activeCount = allServices.filter((s) => s.status === "active").length;
  const inactiveCount = allServices.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <ServiciosHeader
        serviceCount={allServices.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        personas={personas ?? []}
      />

      {/* Grid */}
      {allServices.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {allServices.map((service) => {
            const isOwner = service.owner_id === user.id;
            return (
              <ServiceCard
                key={service.id}
                service={service}
                personas={personas ?? []}
                isOwner={isOwner}
              />
            );
          })}
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
