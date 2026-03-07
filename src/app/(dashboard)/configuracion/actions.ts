"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidateSettings } from "@/lib/revalidate";

// ── Schemas ──────────────────────────────────────────────────────

const profileSchema = z.object({
  display_name: z.string().min(1).max(100),
  currency: z.string().min(3).max(3),
});

const settingsSchema = z.object({
  notify_before_days: z.number().int().min(0).max(30),
  notify_overdue: z.boolean(),
  auto_generate_cycles: z.boolean(),
  default_currency: z.string().min(3).max(3),
});

// ── Actions ──────────────────────────────────────────────────────

export async function updateProfile(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const raw = {
    display_name: formData.get("display_name") as string,
    currency: (formData.get("currency") as string) || "MXN",
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      currency: parsed.data.currency,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidateSettings();
  return { success: true };
}

export async function updateSettings(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const raw = {
    notify_before_days: Number(formData.get("notify_before_days") ?? 3),
    notify_overdue: formData.get("notify_overdue") === "true",
    auto_generate_cycles: formData.get("auto_generate_cycles") === "true",
    default_currency:
      (formData.get("default_currency") as string) || "MXN",
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { error } = await supabase
    .from("user_settings")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidateSettings();
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
