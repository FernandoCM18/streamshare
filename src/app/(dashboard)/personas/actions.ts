"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePersonas } from "@/lib/revalidate";

// ── Schemas ──────────────────────────────────────────────────────

const createPersonaSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200).nullable(),
  phone: z.string().max(30).nullable(),
  notes: z.string().max(500).nullable(),
});

const updatePersonaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(200).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// ── Actions ──────────────────────────────────────────────────────

export async function createPersona(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  persona?: { id: string; name: string; email: string };
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const raw = {
    name: formData.get("name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };

  const parsed = createPersonaSchema.safeParse(raw);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { data, error } = await supabase
    .from("members")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
    })
    .select("id, name, email")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePersonas();
  return {
    success: true,
    persona: data
      ? { id: data.id, name: data.name, email: data.email ?? "" }
      : undefined,
  };
}

export async function updatePersona(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const raw: Record<string, unknown> = { id: formData.get("id") };
  const fields = ["name", "email", "phone", "notes"];
  for (const field of fields) {
    const val = formData.get(field);
    if (val !== null) {
      raw[field] = val === "" ? null : val;
    }
  }

  const parsed = updatePersonaSchema.safeParse(raw);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { id, ...updates } = parsed.data;
  // Remove undefined fields
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined),
  );

  if (Object.keys(cleanUpdates).length === 0)
    return { success: true };

  const { error } = await supabase
    .from("members")
    .update(cleanUpdates)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePersonas();
  return { success: true };
}

export async function deletePersona(
  personaId: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = z.string().uuid().safeParse(personaId);
  if (!parsed.success) return { success: false, error: "ID inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", parsed.data)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePersonas();
  return { success: true };
}
