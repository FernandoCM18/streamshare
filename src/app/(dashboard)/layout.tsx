import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { BottomDock } from "@/components/dashboard/bottom-dock";
import type { DashboardSummary } from "@/types/database";
import type { PendingDebtor } from "@/components/dashboard/gauge-card";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: profile },
    { data: dashboardRows },
    { data: pendingPayments },
    { data: linkedPersona },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("dashboard_summary").select("*").eq("owner_id", user.id),
    supabase
      .from("payments")
      .select(
        "id, amount_due, amount_paid, accumulated_debt, status, persona_id, service_id, personas(name), services(name)",
      )
      .eq("owner_id", user.id)
      .in("status", ["pending", "partial", "overdue"])
      .order("status", { ascending: true })
      .limit(10),
    supabase
      .from("personas")
      .select("id")
      .eq("profile_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const displayName =
    profile?.display_name ??
    user.user_metadata?.display_name ??
    user.email?.split("@")[0] ??
    "Usuario";
  const avatarUrl =
    profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;
  const email = user.email ?? "";

  const dashboard: DashboardSummary = dashboardRows?.[0]
    ? {
        owner_id: (dashboardRows[0] as Record<string, unknown>)
          .owner_id as string,
        total_services: Number(
          (dashboardRows[0] as Record<string, unknown>).total_services ?? 0,
        ),
        total_personas: Number(
          (dashboardRows[0] as Record<string, unknown>).total_personas ?? 0,
        ),
        total_month_receivable: Number(
          (dashboardRows[0] as Record<string, unknown>)
            .total_month_receivable ?? 0,
        ),
        total_month_collected: Number(
          (dashboardRows[0] as Record<string, unknown>).total_month_collected ??
            0,
        ),
        overdue_count: Number(
          (dashboardRows[0] as Record<string, unknown>).overdue_count ?? 0,
        ),
        total_accumulated_debt: Number(
          (dashboardRows[0] as Record<string, unknown>)
            .total_accumulated_debt ?? 0,
        ),
      }
    : {
        owner_id: user.id,
        total_services: 0,
        total_personas: 0,
        total_month_receivable: 0,
        total_month_collected: 0,
        overdue_count: 0,
        total_accumulated_debt: 0,
      };

  const pendingDebtors: PendingDebtor[] = (pendingPayments ?? []).map(
    (p: Record<string, unknown>) => ({
      id: p.id as string,
      name:
        ((p.personas as Record<string, unknown>)?.name as string) ??
        "Sin nombre",
      initials: getInitials(
        ((p.personas as Record<string, unknown>)?.name as string) ?? "??",
      ),
      status: (p.status === "overdue" ? "overdue" : "pending") as
        | "overdue"
        | "pending",
      amount:
        Number(p.amount_due ?? 0) -
        Number(p.amount_paid ?? 0) +
        Number(p.accumulated_debt ?? 0),
      serviceName:
        ((p.services as Record<string, unknown>)?.name as string) ?? "",
    }),
  );

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-[1600px] h-[92vh] rounded-[2.5rem] border border-neutral-800/60 bg-neutral-950/95 vertical-lines overflow-hidden flex flex-col">
        <Header displayName={displayName} avatarUrl={avatarUrl} email={email} />
        <div className="flex-1 flex flex-col overflow-hidden lg:grid lg:grid-cols-12">
          <aside className="col-span-12 lg:col-span-3 border-b border-neutral-800/30 p-4 lg:border-b-0 lg:border-r lg:overflow-y-auto lg:p-6">
            <Sidebar dashboard={dashboard} pendingDebtors={pendingDebtors} />
          </aside>
          <main className="col-span-12 lg:col-span-9 flex-1 overflow-y-auto p-6 pb-24 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      <BottomDock hasLinkedPersona={!!linkedPersona} />
    </div>
  );
}
