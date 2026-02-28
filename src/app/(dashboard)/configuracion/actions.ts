"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const display_name = formData.get("display_name") as string;
  const currency = (formData.get("currency") as string) || "MXN";

  const { error } = await supabase
    .from("profiles")
    .update({ display_name, currency })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
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

  const notify_before_days = Number(formData.get("notify_before_days") ?? 3);
  const notify_overdue = formData.get("notify_overdue") === "true";
  const auto_generate_cycles = formData.get("auto_generate_cycles") === "true";
  const default_currency =
    (formData.get("default_currency") as string) || "MXN";

  const { error } = await supabase
    .from("user_settings")
    .update({
      notify_before_days,
      notify_overdue,
      auto_generate_cycles,
      default_currency,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
