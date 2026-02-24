"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createServiceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  color: z.string().min(1, "El color es requerido"),
  monthly_cost: z.coerce.number().positive("El costo debe ser mayor a 0"),
  billing_day: z.coerce.number().int().min(1).max(31),
  split_type: z.enum(["equal", "custom"]),
  icon_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  persona_ids: z.string().optional(),
});

const updateServiceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "El nombre es requerido"),
  color: z.string().min(1, "El color es requerido"),
  monthly_cost: z.coerce.number().positive("El costo debe ser mayor a 0"),
  billing_day: z.coerce.number().int().min(1).max(31),
  split_type: z.enum(["equal", "custom"]),
  icon_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function createService(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const raw = Object.fromEntries(formData);
  const input = createServiceSchema.safeParse(raw);
  if (!input.success) return { success: false, error: input.error.message };

  const { persona_ids, ...serviceData } = input.data;

  const { data: service, error } = await supabase
    .from("services")
    .insert({
      ...serviceData,
      owner_id: user.id,
      icon_url: serviceData.icon_url ?? null,
      notes: serviceData.notes ?? null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  // Add service members if persona_ids provided (comma-separated)
  if (persona_ids) {
    const ids = persona_ids.split(",").filter(Boolean);
    if (ids.length > 0) {
      const members = ids.map((persona_id) => ({
        service_id: service.id,
        persona_id,
        owner_id: user.id,
        is_active: true,
      }));
      await supabase.from("service_members").insert(members);
    }
  }

  // Generate initial billing cycle
  await supabase.rpc("generate_billing_cycle", { p_service_id: service.id });

  revalidatePath("/servicios");
  return { success: true, serviceId: service.id };
}

export async function updateService(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const raw = Object.fromEntries(formData);
  const input = updateServiceSchema.safeParse(raw);
  if (!input.success) return { success: false, error: input.error.message };

  const { id, ...updateData } = input.data;

  const { error } = await supabase
    .from("services")
    .update({
      ...updateData,
      icon_url: updateData.icon_url ?? null,
      notes: updateData.notes ?? null,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/servicios");
  return { success: true };
}

export async function toggleServiceStatus(serviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  // Get current status
  const { data: service } = await supabase
    .from("services")
    .select("status")
    .eq("id", serviceId)
    .eq("owner_id", user.id)
    .single();

  if (!service) return { success: false, error: "Servicio no encontrado" };

  const newStatus = service.status === "active" ? "pending" : "active";

  const { error } = await supabase
    .from("services")
    .update({ status: newStatus })
    .eq("id", serviceId)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/servicios");
  return { success: true, newStatus };
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/servicios");
  return { success: true };
}
