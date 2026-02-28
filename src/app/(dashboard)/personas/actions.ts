"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const { data, error } = await supabase
    .from("members")
    .insert({
      owner_id: user.id,
      name,
      email,
      phone,
      notes,
    })
    .select("id, name, email")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
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
  const personaId = formData.get("id") as string;

  const updates: Record<string, unknown> = {};
  const fields = ["name", "email", "phone", "notes"];
  for (const field of fields) {
    const val = formData.get(field);
    if (val !== null) {
      updates[field] = val === "" ? null : val;
    }
  }

  const { error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", personaId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deletePersona(
  personaId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("members").delete().eq("id", personaId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
