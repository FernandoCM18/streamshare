"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
  display_name: z.string().min(1, "El nombre es requerido"),
});

const updateSettingsSchema = z.object({
  notify_before_days: z.coerce.number().int().min(1).max(30),
  notify_overdue: z.coerce.boolean(),
  default_currency: z.string().min(1),
  auto_generate_cycles: z.coerce.boolean(),
});

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const raw = Object.fromEntries(formData);
  const input = updateProfileSchema.safeParse(raw);
  if (!input.success) return { success: false, error: input.error.message };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.data.display_name,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const raw = Object.fromEntries(formData);
  const input = updateSettingsSchema.safeParse({
    notify_before_days: raw.notify_before_days,
    notify_overdue: raw.notify_overdue === "true",
    default_currency: raw.default_currency,
    auto_generate_cycles: raw.auto_generate_cycles === "true",
  });
  if (!input.success) return { success: false, error: input.error.message };

  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        id: user.id,
        ...input.data,
      },
      { onConflict: "id" },
    );

  if (error) return { success: false, error: error.message };

  revalidatePath("/configuracion");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
