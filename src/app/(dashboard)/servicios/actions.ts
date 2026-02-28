"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createService(
  formData: FormData,
): Promise<{ success: boolean; error?: string; serviceId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const name = formData.get("name") as string;
  const icon_url = (formData.get("icon_url") as string) || null;
  const color = (formData.get("color") as string) || "#6366f1";
  const monthly_cost = Number(formData.get("monthly_cost"));
  const billing_day = Number(formData.get("billing_day"));
  const split_type =
    (formData.get("split_type") as "equal" | "custom") || "equal";

  const { data, error } = await supabase
    .from("services")
    .insert({
      owner_id: user.id,
      name,
      icon_url,
      color,
      monthly_cost,
      billing_day,
      split_type,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  // Parse member IDs if provided
  const memberIds = formData.get("member_ids") as string;
  if (memberIds && data) {
    const ids = memberIds.split(",").filter(Boolean);
    for (const memberId of ids) {
      const customAmount = formData.get(`custom_amount_${memberId}`);
      await supabase.from("service_members").insert({
        service_id: data.id,
        member_id: memberId,
        owner_id: user.id,
        custom_amount: customAmount ? Number(customAmount) : null,
      });
    }

    // Generate billing cycle for the new service
    await supabase.rpc("generate_billing_cycle", {
      p_service_id: data.id,
    });
  }

  revalidatePath("/", "layout");
  return { success: true, serviceId: data?.id };
}

export async function updateService(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const serviceId = formData.get("id") as string;

  const updates: Record<string, unknown> = {};
  const fields = [
    "name",
    "icon_url",
    "color",
    "monthly_cost",
    "billing_day",
    "split_type",
    "notes",
  ];
  for (const field of fields) {
    const val = formData.get(field);
    if (val !== null && val !== "") {
      updates[field] =
        field === "monthly_cost" || field === "billing_day" ? Number(val) : val;
    }
  }

  const { error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", serviceId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleServiceStatus(
  serviceId: string,
): Promise<{ success: boolean; error?: string; newStatus?: string }> {
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("status")
    .eq("id", serviceId)
    .single();

  const newStatus = service?.status === "active" ? "pending" : "active";

  const { error } = await supabase
    .from("services")
    .update({ status: newStatus })
    .eq("id", serviceId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, newStatus };
}

export async function addServiceMember(
  serviceId: string,
  memberId: string,
  customAmount?: number | null,
): Promise<{ success: boolean; error?: string; memberId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { error } = await supabase.from("service_members").insert({
    service_id: serviceId,
    member_id: memberId,
    owner_id: user.id,
    custom_amount: customAmount ?? null,
  });

  if (error) return { success: false, error: error.message };

  // Add member to active billing cycles
  await supabase.rpc("add_member_to_active_cycles", {
    p_service_id: serviceId,
    p_member_id: memberId,
  });

  revalidatePath("/", "layout");
  return { success: true, memberId };
}

export async function removeServiceMember(
  memberId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("service_members")
    .update({ is_active: false })
    .eq("id", memberId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateMemberAmount(
  memberId: string,
  customAmount: number | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("service_members")
    .update({ custom_amount: customAmount })
    .eq("id", memberId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteService(
  serviceId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
