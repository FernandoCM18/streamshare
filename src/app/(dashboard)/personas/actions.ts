"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createPersonaSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().or(z.literal("")),
});

const updatePersonaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().or(z.literal("")),
});

export async function createPersona(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const raw = Object.fromEntries(formData);
  const input = createPersonaSchema.safeParse(raw);
  if (!input.success) return { success: false, error: input.error.message };

  const { data: persona, error } = await supabase
    .from("personas")
    .insert({
      name: input.data.name.trim(),
      email: input.data.email.trim().toLowerCase(),
      phone: input.data.phone?.trim() || null,
      owner_id: user.id,
    })
    .select("id, name, email")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/personas");
  revalidatePath("/servicios");
  return { success: true, persona };
}

export async function updatePersona(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const raw = Object.fromEntries(formData);
  const input = updatePersonaSchema.safeParse(raw);
  if (!input.success) return { success: false, error: input.error.message };

  const { id, ...updateData } = input.data;

  const { error } = await supabase
    .from("personas")
    .update({
      name: updateData.name.trim(),
      email: updateData.email.trim().toLowerCase(),
      phone: updateData.phone?.trim() || null,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/personas");
  revalidatePath("/servicios");
  return { success: true };
}

export async function deletePersona(personaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  // Check if persona has active service memberships
  const { data: memberships } = await supabase
    .from("service_members")
    .select("id")
    .eq("persona_id", personaId)
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .limit(1);

  if (memberships && memberships.length > 0) {
    return {
      success: false,
      error:
        "Esta persona tiene servicios activos asignados. Retírala de los servicios primero.",
    };
  }

  const { error } = await supabase
    .from("personas")
    .delete()
    .eq("id", personaId)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/personas");
  revalidatePath("/servicios");
  return { success: true };
}
