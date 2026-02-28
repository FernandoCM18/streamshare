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

    // Parse custom amounts JSON if split_type is custom
    let customAmounts: Record<string, number> = {};
    const customAmountsJson = formData.get("custom_amounts") as string;
    if (customAmountsJson) {
      try {
        customAmounts = JSON.parse(customAmountsJson);
      } catch {
        // ignore parse errors, amounts will be null
      }
    }

    for (const memberId of ids) {
      const amount = customAmounts[memberId];
      await supabase.from("service_members").insert({
        service_id: data.id,
        member_id: memberId,
        owner_id: user.id,
        custom_amount: amount && amount > 0 ? amount : null,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

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

  // Process member additions
  const addedMembersJson = formData.get("added_members") as string;
  if (addedMembersJson) {
    try {
      const addedMembers: { id: string; custom_amount: number | null }[] =
        JSON.parse(addedMembersJson);
      for (const member of addedMembers) {
        // Check for existing deactivated record
        const { data: existing } = await supabase
          .from("service_members")
          .select("id")
          .eq("service_id", serviceId)
          .eq("member_id", member.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("service_members")
            .update({ is_active: true, custom_amount: member.custom_amount })
            .eq("id", existing.id);
        } else {
          await supabase.from("service_members").insert({
            service_id: serviceId,
            member_id: member.id,
            owner_id: user.id,
            custom_amount: member.custom_amount,
          });
        }

        await supabase.rpc("add_member_to_active_cycles", {
          p_service_id: serviceId,
          p_member_id: member.id,
        });
      }
    } catch {
      // ignore parse errors
    }
  }

  // Process member removals
  const removedMembersJson = formData.get("removed_members") as string;
  if (removedMembersJson) {
    try {
      const removedMemberIds: string[] = JSON.parse(removedMembersJson);
      for (const memberId of removedMemberIds) {
        await supabase
          .from("service_members")
          .update({ is_active: false })
          .eq("service_id", serviceId)
          .eq("member_id", memberId);

        // Cancel pending payments
        await supabase
          .from("payments")
          .update({ status: "cancelled" })
          .eq("service_id", serviceId)
          .eq("member_id", memberId)
          .in("status", ["pending", "partial"]);
      }
    } catch {
      // ignore parse errors
    }
  }

  // Process custom amount updates
  const amountUpdatesJson = formData.get("amount_updates") as string;
  if (amountUpdatesJson) {
    try {
      const amountUpdates: { member_id: string; custom_amount: number | null }[] =
        JSON.parse(amountUpdatesJson);
      for (const update of amountUpdates) {
        await supabase
          .from("service_members")
          .update({ custom_amount: update.custom_amount })
          .eq("service_id", serviceId)
          .eq("member_id", update.member_id);
      }
    } catch {
      // ignore parse errors
    }
  }

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
): Promise<{ success: boolean; error?: string; memberId?: string; serviceMemberId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  // Check if a deactivated record already exists (re-adding a removed member)
  const { data: existing } = await supabase
    .from("service_members")
    .select("id")
    .eq("service_id", serviceId)
    .eq("member_id", memberId)
    .maybeSingle();

  let serviceMemberId: string;

  if (existing) {
    // Reactivate existing record
    const { error } = await supabase
      .from("service_members")
      .update({ is_active: true, custom_amount: customAmount ?? null })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    serviceMemberId = existing.id;
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from("service_members")
      .insert({
        service_id: serviceId,
        member_id: memberId,
        owner_id: user.id,
        custom_amount: customAmount ?? null,
      })
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };
    serviceMemberId = data.id;
  }

  // Add member to active billing cycles
  await supabase.rpc("add_member_to_active_cycles", {
    p_service_id: serviceId,
    p_member_id: memberId,
  });

  revalidatePath("/", "layout");
  return { success: true, memberId, serviceMemberId };
}

export async function removeServiceMember(
  serviceId: string,
  memberId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Deactivate the service member
  const { error } = await supabase
    .from("service_members")
    .update({ is_active: false })
    .eq("service_id", serviceId)
    .eq("member_id", memberId);

  if (error) return { success: false, error: error.message };

  // Cancel pending/partial payments for this member in this service
  await supabase
    .from("payments")
    .update({ status: "cancelled" })
    .eq("service_id", serviceId)
    .eq("member_id", memberId)
    .in("status", ["pending", "partial"]);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateMemberAmount(
  serviceId: string,
  memberId: string,
  customAmount: number | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("service_members")
    .update({ custom_amount: customAmount })
    .eq("service_id", serviceId)
    .eq("member_id", memberId);

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
