import type { DashboardSummary } from "@/types/database";

export const mockDashboardData: DashboardSummary = {
  owner_id: "mock-owner",
  total_services: 4,
  total_personas: 6,
  total_month_receivable: 1650,
  total_month_collected: 1200,
  overdue_count: 1,
  total_accumulated_debt: 150,
};

export interface PendingDebtor {
  id: string;
  name: string;
  initials: string;
  status: "overdue" | "pending";
  amount: number;
}

export const mockPendingDebtors: PendingDebtor[] = [
  {
    id: "1",
    name: "María González",
    initials: "MG",
    status: "overdue",
    amount: 150,
  },
  {
    id: "2",
    name: "Carlos Ruiz",
    initials: "CR",
    status: "pending",
    amount: 180,
  },
  {
    id: "3",
    name: "Ana Torres",
    initials: "AT",
    status: "pending",
    amount: 120,
  },
];
