import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  DashboardSummary,
  ServiceSummary,
  MyPayment,
  Profile,
  UserSettings,
} from "@/types/database";
import type { MemberPayment } from "@/components/dashboard/service-card-utils";
import type { PendingDebtor } from "@/components/dashboard/gauge-card";
import type { CommandPersona } from "@/components/shared/command-palette";
import { getInitials } from "@/lib/utils";

// React.cache() deduplicates calls within the same request.
// Layout + page share the same request, so identical queries run only once.

// --- Cleanup orphaned payments (pending payments for inactive members) ---

export const cleanupOrphanedPayments = cache(async (userId: string) => {
  const supabase = await createClient();

  // 1. Cancel pending payments for inactive service members
  const { data: inactiveMembers } = await supabase
    .from("service_members")
    .select("member_id, service_id")
    .eq("owner_id", userId)
    .eq("is_active", false);

  if (inactiveMembers && inactiveMembers.length > 0) {
    for (const im of inactiveMembers) {
      await supabase
        .from("payments")
        .update({ status: "cancelled" })
        .eq("owner_id", userId)
        .eq("service_id", im.service_id)
        .eq("member_id", im.member_id)
        .in("status", ["pending", "partial"]);
    }
  }

  // 2. Cancel duplicate payments within the same billing cycle
  //    (caused by re-adding members that triggered add_member_to_active_cycles again)
  const { data: pendingPayments } = await supabase
    .from("payments")
    .select("id, member_id, service_id, billing_cycle_id, created_at")
    .eq("owner_id", userId)
    .in("status", ["pending", "partial", "overdue"])
    .order("created_at", { ascending: true });

  if (pendingPayments && pendingPayments.length > 0) {
    const seen = new Map<string, string>(); // key -> first payment id
    const duplicateIds: string[] = [];

    for (const p of pendingPayments) {
      const key = `${p.member_id}:${p.service_id}:${p.billing_cycle_id}`;
      if (seen.has(key)) {
        // This is a duplicate — cancel it
        duplicateIds.push(p.id);
      } else {
        seen.set(key, p.id);
      }
    }

    if (duplicateIds.length > 0) {
      await supabase
        .from("payments")
        .update({ status: "cancelled" })
        .in("id", duplicateIds);
    }
  }

  // 3. Fix amount_due on pending payments for custom-split services
  //    (when split_type changed to 'custom' after payments were generated)
  const { data: customServices } = await supabase
    .from("services")
    .select("id")
    .eq("owner_id", userId)
    .eq("split_type", "custom");

  if (customServices && customServices.length > 0) {
    const serviceIds = customServices.map((s) => s.id);

    // Get active members with custom amounts for these services
    const { data: customMembers } = await supabase
      .from("service_members")
      .select("member_id, service_id, custom_amount")
      .eq("owner_id", userId)
      .eq("is_active", true)
      .in("service_id", serviceIds)
      .not("custom_amount", "is", null);

    if (customMembers && customMembers.length > 0) {
      // Get pending payments for these services
      const { data: paymentsToFix } = await supabase
        .from("payments")
        .select("id, member_id, service_id, amount_due")
        .eq("owner_id", userId)
        .in("service_id", serviceIds)
        .in("status", ["pending", "partial", "overdue"]);

      if (paymentsToFix && paymentsToFix.length > 0) {
        // Build lookup: member_id:service_id -> custom_amount
        const customAmountMap = new Map(
          customMembers.map((cm) => [
            `${cm.member_id}:${cm.service_id}`,
            cm.custom_amount as number,
          ]),
        );

        for (const payment of paymentsToFix) {
          const key = `${payment.member_id}:${payment.service_id}`;
          const correctAmount = customAmountMap.get(key);
          if (
            correctAmount !== undefined &&
            payment.amount_due !== correctAmount
          ) {
            await supabase
              .from("payments")
              .update({ amount_due: correctAmount })
              .eq("id", payment.id);
          }
        }
      }
    }
  }
});

// --- Profile ---

export const getCachedProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as Profile | null;
});

// --- Dashboard Summary ---

export const getCachedDashboardSummary = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dashboard_summary")
    .select("*")
    .eq("owner_id", userId)
    .single();

  const dashboard: DashboardSummary = data ?? {
    owner_id: userId,
    total_services: 0,
    total_members: 0,
    total_month_receivable: 0,
    total_month_collected: 0,
    overdue_count: 0,
    total_accumulated_debt: 0,
  };
  return dashboard;
});

// --- Pending Debtors (for gauge card) ---

export const getCachedPendingDebtors = cache(async (userId: string) => {
  const supabase = await createClient();

  // First get active service_member pairs to filter payments
  const { data: activeMembers } = await supabase
    .from("service_members")
    .select("member_id, service_id")
    .eq("owner_id", userId)
    .eq("is_active", true);

  const activePairs = new Set(
    (activeMembers ?? []).map((m) => `${m.member_id}:${m.service_id}`),
  );

  const { data } = await supabase
    .from("payments")
    .select(
      "id, amount_due, amount_paid, accumulated_debt, status, member_id, service_id, members!inner(name), services!inner(name)",
    )
    .eq("owner_id", userId)
    .in("status", ["pending", "partial", "overdue"])
    .order("status", { ascending: true })
    .limit(30);

  // Filter to only active members and deduplicate by member+service
  const seen = new Set<string>();
  const debtors: PendingDebtor[] = [];

  for (const p of data ?? []) {
    const pairKey = `${p.member_id}:${p.service_id}`;
    // Skip payments for inactive service members
    if (!activePairs.has(pairKey)) continue;
    // Deduplicate: only show one entry per member+service
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payment = p as any;
    debtors.push({
      id: p.id,
      name: payment.members?.name ?? "—",
      initials: getInitials(payment.members?.name ?? "—"),
      status:
        p.status === "overdue" ? ("overdue" as const) : ("pending" as const),
      amount:
        (p.amount_due ?? 0) -
        (p.amount_paid ?? 0) +
        (p.accumulated_debt ?? 0),
      serviceName: payment.services?.name ?? "—",
    });

    if (debtors.length >= 10) break;
  }

  return debtors;
});

// --- Services (service_summary view) ---

export const getCachedServices = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_summary")
    .select("*")
    .eq("owner_id", userId);
  return (data ?? []) as ServiceSummary[];
});

// --- Members for command palette (transformed) ---

export const getCachedCommandPersonas = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("id, name, email, profile_id, service_members(service_id)")
    .eq("owner_id", userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const personas: CommandPersona[] = (data ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    profile_id: m.profile_id,
    status: null,
    serviceCount: Array.isArray(m.service_members)
      ? m.service_members.length
      : 0,
  }));
  return personas;
});

// --- Payments (active, for dashboard) ---

export const getCachedPayments = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select(
      "id, member_id, amount_due, amount_paid, accumulated_debt, status, due_date, paid_at, confirmed_at, requires_confirmation, members!inner(id, name, email, phone, avatar_url, profile_id), billing_cycles!inner(id, period_start, period_end)",
    )
    .eq("owner_id", userId)
    .in("status", ["pending", "partial", "paid", "overdue"]);
  return (data ?? []) as MemberPayment[];
});

// --- My Payments (guest view) ---

export const getCachedMyPayments = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("my_payments")
    .select("*")
    .order("due_date", { ascending: true });
  return (data ?? []) as MyPayment[];
});

// --- Settings ---

export const getCachedSettings = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", userId)
    .single();

  const settings: UserSettings = data ?? {
    id: userId,
    notify_before_days: 3,
    notify_overdue: true,
    default_currency: "MXN",
    auto_generate_cycles: true,
    updated_at: new Date().toISOString(),
  };
  return settings;
});

// --- Personas page data (members + service memberships + payments + services) ---

export const getCachedPersonasData = cache(async (userId: string) => {
  const supabase = await createClient();
  const [membersRes, serviceMembersRes, paymentsRes, servicesRes] =
    await Promise.all([
      supabase
        .from("members")
        .select("id, name, email, phone, avatar_url, profile_id")
        .eq("owner_id", userId),
      supabase
        .from("service_members")
        .select("member_id, service_id, custom_amount, is_active")
        .eq("owner_id", userId)
        .eq("is_active", true),
      supabase
        .from("payments")
        .select(
          "member_id, service_id, amount_due, amount_paid, accumulated_debt, status",
        )
        .eq("owner_id", userId)
        .in("status", ["pending", "partial", "overdue", "paid", "confirmed"])
        .order("created_at", { ascending: false }),
      supabase
        .from("services")
        .select("id, name, color, icon_url, monthly_cost")
        .eq("owner_id", userId),
    ]);

  return {
    members: membersRes.data ?? [],
    serviceMembers: serviceMembersRes.data ?? [],
    payments: paymentsRes.data ?? [],
    services: servicesRes.data ?? [],
  };
});

// --- Simple members list (for servicios page) ---

export const getCachedMembersList = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("id, name, email")
    .eq("owner_id", userId);
  return (data ?? []) as { id: string; name: string; email: string | null }[];
});
