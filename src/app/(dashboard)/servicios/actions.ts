"use server";

import { getAuthenticatedClient } from "@/lib/supabase/auth-action";
import { z } from "zod";
import { revalidateServices, revalidateServiceMembers } from "@/lib/revalidate";
import type { UpdateService } from "@/types/database";

// ── Schemas ──────────────────────────────────────────────────────

const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  icon_url: z.string().max(200).nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  monthly_cost: z.number().positive().max(999999),
  billing_day: z.number().int().min(1).max(31),
  split_type: z.enum(["equal", "custom"]),
  member_ids: z.string().optional(),
  custom_amounts: z.string().optional(),
  auto_generate_cycle: z.string().optional(),
});

const updateServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  icon_url: z.string().max(200).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  monthly_cost: z.number().positive().max(999999).optional(),
  billing_day: z.number().int().min(1).max(31).optional(),
  split_type: z.enum(["equal", "custom"]).optional(),
  notes: z.string().max(500).optional(),
  added_members: z.string().optional(),
  removed_members: z.string().optional(),
  amount_updates: z.string().optional(),
});

const addedMemberSchema = z.array(
  z.object({
    id: z.string().uuid(),
    custom_amount: z.number().positive().nullable(),
  }),
);

const removedMembersSchema = z.array(z.string().uuid());

const amountUpdateSchema = z.array(
  z.object({
    member_id: z.string().uuid(),
    custom_amount: z.number().positive().nullable(),
  }),
);

// ── Actions ──────────────────────────────────────────────────────

export async function createService(
  formData: FormData,
): Promise<{ success: boolean; error?: string; serviceId?: string }> {
  const { supabase, user } = await getAuthenticatedClient();

  const raw = {
    name: formData.get("name") as string,
    icon_url: (formData.get("icon_url") as string) || null,
    color: (formData.get("color") as string) || "#6366f1",
    monthly_cost: Number(formData.get("monthly_cost")),
    billing_day: Number(formData.get("billing_day")),
    split_type: (formData.get("split_type") as string) || "equal",
    member_ids: (formData.get("member_ids") as string) || undefined,
    custom_amounts: (formData.get("custom_amounts") as string) || undefined,
    auto_generate_cycle:
      (formData.get("auto_generate_cycle") as string) || undefined,
  };

  const parsed = createServiceSchema.safeParse(raw);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };

  const { name, icon_url, color, monthly_cost, billing_day, split_type } =
    parsed.data;

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
  if (parsed.data.member_ids && data) {
    const ids = parsed.data.member_ids.split(",").filter(Boolean);

    // Parse custom amounts JSON if split_type is custom
    let customAmounts: Record<string, number> = {};
    if (parsed.data.custom_amounts) {
      try {
        customAmounts = JSON.parse(parsed.data.custom_amounts);
      } catch {
        // ignore parse errors, amounts will be null
      }
    }

    const memberRows = ids.map((memberId) => ({
      service_id: data.id,
      member_id: memberId,
      owner_id: user.id,
      custom_amount:
        customAmounts[memberId] && customAmounts[memberId] > 0
          ? customAmounts[memberId]
          : null,
    }));
    await supabase.from("service_members").insert(memberRows);
  }

  // Generate billing cycle (even without members, so it's ready when they're added)
  const autoGenerate = parsed.data.auto_generate_cycle !== "false";
  if (autoGenerate && data) {
    await supabase.rpc("generate_billing_cycle", {
      p_service_id: data.id,
    });
  }

  revalidateServices();
  return { success: true, serviceId: data?.id };
}

export async function updateService(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await getAuthenticatedClient();

  const raw: Record<string, unknown> = { id: formData.get("id") };
  const fields = [
    "name",
    "icon_url",
    "color",
    "monthly_cost",
    "billing_day",
    "split_type",
    "notes",
    "added_members",
    "removed_members",
    "amount_updates",
  ] as const;
  for (const field of fields) {
    const val = formData.get(field);
    if (val !== null && val !== "") {
      if (field === "monthly_cost" || field === "billing_day") {
        raw[field] = Number(val);
      } else {
        raw[field] = val;
      }
    }
  }

  const parsed = updateServiceSchema.safeParse(raw);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };

  const serviceId = parsed.data.id;

  // Build update object from validated data
  const updates: UpdateService = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.icon_url !== undefined)
    updates.icon_url = parsed.data.icon_url;
  if (parsed.data.color !== undefined) updates.color = parsed.data.color;
  if (parsed.data.monthly_cost !== undefined)
    updates.monthly_cost = parsed.data.monthly_cost;
  if (parsed.data.billing_day !== undefined)
    updates.billing_day = parsed.data.billing_day;
  if (parsed.data.split_type !== undefined)
    updates.split_type = parsed.data.split_type;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", serviceId)
      .eq("owner_id", user.id);

    if (error) return { success: false, error: error.message };
  }

  // Process member additions
  if (parsed.data.added_members) {
    const addedParsed = addedMemberSchema.safeParse(
      JSON.parse(parsed.data.added_members),
    );
    if (addedParsed.success) {
      const upsertRows = addedParsed.data.map((m) => ({
        service_id: serviceId,
        member_id: m.id,
        owner_id: user.id,
        is_active: true,
        custom_amount: m.custom_amount,
      }));
      await supabase
        .from("service_members")
        .upsert(upsertRows, { onConflict: "service_id,member_id" });

      await supabase.rpc("generate_billing_cycle", {
        p_service_id: serviceId,
      });

      await Promise.all(
        addedParsed.data.map((m) =>
          supabase.rpc("add_member_to_active_cycles", {
            p_service_id: serviceId,
            p_member_id: m.id,
          }),
        ),
      );
    }
  }

  // Process member removals
  if (parsed.data.removed_members) {
    const removedParsed = removedMembersSchema.safeParse(
      JSON.parse(parsed.data.removed_members),
    );
    if (removedParsed.success && removedParsed.data.length > 0) {
      await Promise.all([
        supabase
          .from("service_members")
          .update({ is_active: false })
          .eq("service_id", serviceId)
          .eq("owner_id", user.id)
          .in("member_id", removedParsed.data),
        supabase
          .from("payments")
          .delete()
          .eq("service_id", serviceId)
          .eq("owner_id", user.id)
          .in("member_id", removedParsed.data)
          .in("status", ["pending", "partial"]),
      ]);
    }
  }

  // Process custom amount updates
  if (parsed.data.amount_updates) {
    const amountParsed = amountUpdateSchema.safeParse(
      JSON.parse(parsed.data.amount_updates),
    );
    if (amountParsed.success) {
      await Promise.all(
        amountParsed.data.map((u) =>
          supabase
            .from("service_members")
            .update({ custom_amount: u.custom_amount })
            .eq("service_id", serviceId)
            .eq("owner_id", user.id)
            .eq("member_id", u.member_id),
        ),
      );
    }
  }

  revalidateServices();
  return { success: true };
}

export async function toggleServiceStatus(
  serviceId: string,
  newStatus: "active" | "pending",
): Promise<{ success: boolean; error?: string; newStatus?: string }> {
  const idParsed = z.string().uuid().safeParse(serviceId);
  const statusParsed = z.enum(["active", "pending"]).safeParse(newStatus);
  if (!idParsed.success || !statusParsed.success)
    return { success: false, error: "Datos inválidos" };

  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("services")
    .update({ status: statusParsed.data })
    .eq("id", idParsed.data)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidateServices();
  return { success: true, newStatus: statusParsed.data };
}

export async function addServiceMember(
  serviceId: string,
  memberId: string,
  customAmount?: number | null,
): Promise<{
  success: boolean;
  error?: string;
  memberId?: string;
  serviceMemberId?: string;
}> {
  const schema = z.object({
    serviceId: z.string().uuid(),
    memberId: z.string().uuid(),
    customAmount: z.number().positive().nullable().optional(),
  });
  const parsed = schema.safeParse({ serviceId, memberId, customAmount });
  if (!parsed.success) return { success: false, error: "Datos inválidos" };

  const { supabase, user } = await getAuthenticatedClient();

  // Check if a deactivated record already exists (re-adding a removed member)
  const { data: existing } = await supabase
    .from("service_members")
    .select("id")
    .eq("service_id", parsed.data.serviceId)
    .eq("member_id", parsed.data.memberId)
    .eq("owner_id", user.id)
    .maybeSingle();

  let serviceMemberId: string;

  if (existing) {
    // Reactivate existing record
    const { error } = await supabase
      .from("service_members")
      .update({
        is_active: true,
        custom_amount: parsed.data.customAmount ?? null,
      })
      .eq("id", existing.id)
      .eq("owner_id", user.id);
    if (error) return { success: false, error: error.message };
    serviceMemberId = existing.id;
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from("service_members")
      .insert({
        service_id: parsed.data.serviceId,
        member_id: parsed.data.memberId,
        owner_id: user.id,
        custom_amount: parsed.data.customAmount ?? null,
      })
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };
    serviceMemberId = data.id;
  }

  // Ensure a billing cycle exists before adding member to it
  await supabase.rpc("generate_billing_cycle", {
    p_service_id: parsed.data.serviceId,
  });

  await supabase.rpc("add_member_to_active_cycles", {
    p_service_id: parsed.data.serviceId,
    p_member_id: parsed.data.memberId,
  });

  revalidateServiceMembers();
  return {
    success: true,
    memberId: parsed.data.memberId,
    serviceMemberId,
  };
}

export async function removeServiceMember(
  serviceId: string,
  memberId: string,
): Promise<{ success: boolean; error?: string }> {
  const schema = z.object({
    serviceId: z.string().uuid(),
    memberId: z.string().uuid(),
  });
  const parsed = schema.safeParse({ serviceId, memberId });
  if (!parsed.success) return { success: false, error: "Datos inválidos" };

  const { supabase, user } = await getAuthenticatedClient();

  // Deactivate the service member
  const { error } = await supabase
    .from("service_members")
    .update({ is_active: false })
    .eq("service_id", parsed.data.serviceId)
    .eq("member_id", parsed.data.memberId)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  // Delete pending/partial payments for this member in this service
  await supabase
    .from("payments")
    .delete()
    .eq("service_id", parsed.data.serviceId)
    .eq("member_id", parsed.data.memberId)
    .eq("owner_id", user.id)
    .in("status", ["pending", "partial"]);

  revalidateServiceMembers();
  return { success: true };
}

export async function updateMemberAmount(
  serviceId: string,
  memberId: string,
  customAmount: number | null,
): Promise<{ success: boolean; error?: string }> {
  const schema = z.object({
    serviceId: z.string().uuid(),
    memberId: z.string().uuid(),
    customAmount: z.number().positive().nullable(),
  });
  const parsed = schema.safeParse({ serviceId, memberId, customAmount });
  if (!parsed.success) return { success: false, error: "Datos inválidos" };

  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("service_members")
    .update({ custom_amount: parsed.data.customAmount })
    .eq("service_id", parsed.data.serviceId)
    .eq("member_id", parsed.data.memberId)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidateServiceMembers();
  return { success: true };
}

export async function deleteService(
  serviceId: string,
): Promise<{ success: boolean; error?: string }> {
  const parsed = z.string().uuid().safeParse(serviceId);
  if (!parsed.success) return { success: false, error: "ID inválido" };

  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", parsed.data)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidateServices();
  return { success: true };
}
