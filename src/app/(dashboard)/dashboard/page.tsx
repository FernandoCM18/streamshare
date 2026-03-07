import type { Metadata } from "next";
import { getRequiredUser } from "@/lib/auth/user";

export const metadata: Metadata = {
  title: "Dashboard",
};
import {
  getCachedServices,
  getCachedPayments,
  getCachedProfile,
} from "@/lib/queries";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getRequiredUser();

  const [services, payments, profile] = await Promise.all([
    getCachedServices(user.id),
    getCachedPayments(user.id),
    getCachedProfile(user.id),
  ]);

  const displayName = profile?.display_name ?? "Usuario";

  return (
    <DashboardClient
      services={services}
      payments={payments}
      displayName={displayName}
    />
  );
}
