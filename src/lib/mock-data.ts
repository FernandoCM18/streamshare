import type {
  DashboardSummary,
  ServiceSummary,
  ServiceMemberInfo,
  Member,
  Profile,
  UserSettings,
  PaymentStatus,
} from "@/types/database";

// ============================================================
// MOCK USER
// ============================================================

export const MOCK_USER_ID = "mock-user-001";

export const mockProfile: Profile = {
  id: MOCK_USER_ID,
  display_name: "Fernando Méndez",
  email: "fernando@streamshare.app",
  avatar_url: null,
  currency: "MXN",
  created_at: "2025-06-01T00:00:00Z",
  updated_at: "2026-02-20T00:00:00Z",
};

export const mockUserSettings: UserSettings = {
  id: MOCK_USER_ID,
  notify_before_days: 3,
  notify_overdue: true,
  default_currency: "MXN",
  auto_generate_cycles: true,
  updated_at: "2026-02-20T00:00:00Z",
};

// ============================================================
// PERSONAS
// ============================================================

export const mockPersonas: Member[] = [
  {
    id: "persona-001",
    owner_id: MOCK_USER_ID,
    profile_id: "profile-maria",
    name: "María González",
    email: "maria@email.com",
    avatar_url: null,
    phone: "+52 55 1234 5678",
    notes: null,
    link_attempted: false,
    created_at: "2025-07-01T00:00:00Z",
    updated_at: "2025-07-01T00:00:00Z",
  },
  {
    id: "persona-002",
    owner_id: MOCK_USER_ID,
    profile_id: null,
    name: "Carlos Ruiz",
    email: "carlos@email.com",
    avatar_url: null,
    phone: "+52 55 9876 5432",
    notes: "Paga siempre puntual",
    link_attempted: false,
    created_at: "2025-07-15T00:00:00Z",
    updated_at: "2025-07-15T00:00:00Z",
  },
  {
    id: "persona-003",
    owner_id: MOCK_USER_ID,
    profile_id: "profile-ana",
    name: "Ana Torres",
    email: "ana@email.com",
    avatar_url: null,
    phone: null,
    notes: null,
    link_attempted: false,
    created_at: "2025-08-01T00:00:00Z",
    updated_at: "2025-08-01T00:00:00Z",
  },
  {
    id: "persona-004",
    owner_id: MOCK_USER_ID,
    profile_id: null,
    name: "Diego Herrera",
    email: "diego@email.com",
    avatar_url: null,
    phone: "+52 33 5555 1234",
    notes: null,
    link_attempted: false,
    created_at: "2025-08-15T00:00:00Z",
    updated_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "persona-005",
    owner_id: MOCK_USER_ID,
    profile_id: "profile-lucia",
    name: "Lucía Fernández",
    email: "lucia@email.com",
    avatar_url: null,
    phone: "+52 81 4444 5678",
    notes: "A veces se atrasa 1-2 días",
    link_attempted: false,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "persona-006",
    owner_id: MOCK_USER_ID,
    profile_id: null,
    name: "Roberto Sánchez",
    email: "roberto@email.com",
    avatar_url: null,
    phone: null,
    notes: null,
    link_attempted: false,
    created_at: "2025-10-01T00:00:00Z",
    updated_at: "2025-10-01T00:00:00Z",
  },
];

// ============================================================
// SERVICES (ServiceSummary for lists)
// ============================================================

function buildMembers(personaIds: string[]): ServiceMemberInfo[] {
  return personaIds.map((id) => {
    const p = mockPersonas.find((p) => p.id === id)!;
    return {
      member_id: id,
      custom_amount: null,
      is_active: true,
      name: p.name,
      email: p.email,
      avatar_url: p.avatar_url,
    };
  });
}

export const mockServices: ServiceSummary[] = [
  {
    id: "svc-netflix",
    owner_id: MOCK_USER_ID,
    name: "Netflix",
    icon_url: "simple-icons:netflix",
    color: "#E50914",
    monthly_cost: 299,
    billing_day: 15,
    split_type: "equal",
    status: "active",
    member_count: 3,
    members: buildMembers(["persona-001", "persona-002", "persona-003"]),
    pending_amount: 99.67,
    collected_amount: 199.33,
  },
  {
    id: "svc-spotify",
    owner_id: MOCK_USER_ID,
    name: "Spotify Family",
    icon_url: "simple-icons:spotify",
    color: "#1DB954",
    monthly_cost: 179,
    billing_day: 1,
    split_type: "equal",
    status: "active",
    member_count: 4,
    members: buildMembers([
      "persona-001",
      "persona-003",
      "persona-004",
      "persona-005",
    ]),
    pending_amount: 89.5,
    collected_amount: 89.5,
  },
  {
    id: "svc-disney",
    owner_id: MOCK_USER_ID,
    name: "Disney+",
    icon_url: "simple-icons:disneyplus",
    color: "#113CCF",
    monthly_cost: 219,
    billing_day: 10,
    split_type: "equal",
    status: "active",
    member_count: 2,
    members: buildMembers(["persona-002", "persona-006"]),
    pending_amount: 219,
    collected_amount: 0,
  },
  {
    id: "svc-hbo",
    owner_id: MOCK_USER_ID,
    name: "Max (HBO)",
    icon_url: "simple-icons:hbo",
    color: "#B014E5",
    monthly_cost: 199,
    billing_day: 20,
    split_type: "custom",
    status: "active",
    member_count: 2,
    members: buildMembers(["persona-001", "persona-005"]),
    pending_amount: 0,
    collected_amount: 199,
  },
  {
    id: "svc-youtube",
    owner_id: MOCK_USER_ID,
    name: "YouTube Premium",
    icon_url: "simple-icons:youtube",
    color: "#FF0000",
    monthly_cost: 179,
    billing_day: 5,
    split_type: "equal",
    status: "pending",
    member_count: 3,
    members: buildMembers(["persona-003", "persona-004", "persona-006"]),
    pending_amount: 0,
    collected_amount: 0,
  },
];

// ============================================================
// DASHBOARD SUMMARY
// ============================================================

export const mockDashboardData: DashboardSummary = {
  owner_id: MOCK_USER_ID,
  total_services: mockServices.filter((s) => s.status === "active").length,
  total_members: mockPersonas.length,
  total_month_receivable: 896,
  total_month_collected: 487.83,
  overdue_count: 2,
  total_accumulated_debt: 182.5,
};

// ============================================================
// PAYMENTS (for dashboard cards and service detail)
// ============================================================

export interface MockMemberPayment {
  id: string;
  cycle_id: string;
  service_id: string;
  member_id: string;
  owner_id: string;
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number;
  status: PaymentStatus;
  due_date: string;
  requires_confirmation: boolean;
  paid_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  credit_applied_id: string | null;
  credit_amount_used: number;
  // Joined relations for UI
  members: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    profile_id: string | null;
  };
  billing_cycles: {
    period_start: string;
    period_end: string;
  };
  payment_notes: Array<{
    id: string;
    content: string;
    author_id: string;
    created_at: string;
  }>;
}

function member(id: string) {
  const p = mockPersonas.find((p) => p.id === id)!;
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    avatar_url: p.avatar_url,
    profile_id: p.profile_id,
  };
}

export const mockMemberPayments: MockMemberPayment[] = [
  // Netflix — Feb 2026
  {
    id: "pay-nf-maria-feb",
    cycle_id: "cycle-nf-feb",
    service_id: "svc-netflix",
    member_id: "persona-001",

    owner_id: MOCK_USER_ID,
    amount_due: 99.67,
    amount_paid: 99.67,
    accumulated_debt: 0,
    status: "confirmed",
    due_date: "2026-02-15",
    requires_confirmation: true,
    paid_at: "2026-02-14T10:30:00Z",
    confirmed_at: "2026-02-14T12:00:00Z",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-14T12:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-001"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [],
  },
  {
    id: "pay-nf-carlos-feb",
    cycle_id: "cycle-nf-feb",
    service_id: "svc-netflix",
    member_id: "persona-002",

    owner_id: MOCK_USER_ID,
    amount_due: 99.67,
    amount_paid: 99.67,
    accumulated_debt: 0,
    status: "confirmed",
    due_date: "2026-02-15",
    requires_confirmation: false,
    paid_at: null,
    confirmed_at: "2026-02-13T08:00:00Z",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-13T08:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-002"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [],
  },
  {
    id: "pay-nf-ana-feb",
    cycle_id: "cycle-nf-feb",
    service_id: "svc-netflix",
    member_id: "persona-003",

    owner_id: MOCK_USER_ID,
    amount_due: 99.67,
    amount_paid: 0,
    accumulated_debt: 0,
    status: "pending",
    due_date: "2026-02-15",
    requires_confirmation: true,
    paid_at: null,
    confirmed_at: null,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-003"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [],
  },
  // Spotify — Feb 2026
  {
    id: "pay-sp-maria-feb",
    cycle_id: "cycle-sp-feb",
    service_id: "svc-spotify",
    member_id: "persona-001",

    owner_id: MOCK_USER_ID,
    amount_due: 44.75,
    amount_paid: 44.75,
    accumulated_debt: 0,
    status: "paid",
    due_date: "2026-02-01",
    requires_confirmation: true,
    paid_at: "2026-02-01T09:00:00Z",
    confirmed_at: null,
    created_at: "2026-01-25T00:00:00Z",
    updated_at: "2026-02-01T09:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-001"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [
      {
        id: "note-sp-maria",
        content: "Transferí por SPEI, referencia 84721",
        author_id: "profile-maria",
        created_at: "2026-02-01T09:01:00Z",
      },
    ],
  },
  {
    id: "pay-sp-ana-feb",
    cycle_id: "cycle-sp-feb",
    service_id: "svc-spotify",
    member_id: "persona-003",

    owner_id: MOCK_USER_ID,
    amount_due: 44.75,
    amount_paid: 44.75,
    accumulated_debt: 0,
    status: "confirmed",
    due_date: "2026-02-01",
    requires_confirmation: true,
    paid_at: "2026-01-30T15:00:00Z",
    confirmed_at: "2026-01-31T10:00:00Z",
    created_at: "2026-01-25T00:00:00Z",
    updated_at: "2026-01-31T10:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-003"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [],
  },
  {
    id: "pay-sp-diego-feb",
    cycle_id: "cycle-sp-feb",
    service_id: "svc-spotify",
    member_id: "persona-004",

    owner_id: MOCK_USER_ID,
    amount_due: 44.75,
    amount_paid: 20,
    accumulated_debt: 0,
    status: "partial",
    due_date: "2026-02-01",
    requires_confirmation: false,
    paid_at: null,
    confirmed_at: null,
    created_at: "2026-01-25T00:00:00Z",
    updated_at: "2026-02-10T00:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-004"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [],
  },
  {
    id: "pay-sp-lucia-feb",
    cycle_id: "cycle-sp-feb",
    service_id: "svc-spotify",
    member_id: "persona-005",

    owner_id: MOCK_USER_ID,
    amount_due: 44.75,
    amount_paid: 0,
    accumulated_debt: 44.75,
    status: "overdue",
    due_date: "2026-02-01",
    requires_confirmation: true,
    paid_at: null,
    confirmed_at: null,
    created_at: "2026-01-25T00:00:00Z",
    updated_at: "2026-01-25T00:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-005"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [],
  },
  // Disney+ — Feb 2026
  {
    id: "pay-dis-carlos-feb",
    cycle_id: "cycle-dis-feb",
    service_id: "svc-disney",
    member_id: "persona-002",

    owner_id: MOCK_USER_ID,
    amount_due: 109.5,
    amount_paid: 0,
    accumulated_debt: 0,
    status: "pending",
    due_date: "2026-02-10",
    requires_confirmation: false,
    paid_at: null,
    confirmed_at: null,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-002"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [],
  },
  {
    id: "pay-dis-roberto-feb",
    cycle_id: "cycle-dis-feb",
    service_id: "svc-disney",
    member_id: "persona-006",

    owner_id: MOCK_USER_ID,
    amount_due: 109.5,
    amount_paid: 0,
    accumulated_debt: 109.5,
    status: "overdue",
    due_date: "2026-02-10",
    requires_confirmation: false,
    paid_at: null,
    confirmed_at: null,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-006"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [],
  },
  // HBO Max — Feb 2026
  {
    id: "pay-hbo-maria-feb",
    cycle_id: "cycle-hbo-feb",
    service_id: "svc-hbo",
    member_id: "persona-001",

    owner_id: MOCK_USER_ID,
    amount_due: 120,
    amount_paid: 120,
    accumulated_debt: 0,
    status: "confirmed",
    due_date: "2026-02-20",
    requires_confirmation: true,
    paid_at: "2026-02-18T14:00:00Z",
    confirmed_at: "2026-02-18T16:00:00Z",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-18T16:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-001"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [],
  },
  {
    id: "pay-hbo-lucia-feb",
    cycle_id: "cycle-hbo-feb",
    service_id: "svc-hbo",
    member_id: "persona-005",

    owner_id: MOCK_USER_ID,
    amount_due: 79,
    amount_paid: 79,
    accumulated_debt: 0,
    status: "confirmed",
    due_date: "2026-02-20",
    requires_confirmation: true,
    paid_at: "2026-02-19T10:00:00Z",
    confirmed_at: "2026-02-19T11:00:00Z",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-19T11:00:00Z",
    credit_applied_id: null,
    credit_amount_used: 0,
    members: member("persona-005"),
    billing_cycles: { period_start: "2026-02-01", period_end: "2026-02-28" },
    payment_notes: [],
  },
];

// ============================================================
// BILLING CYCLES (for service detail page)
// ============================================================

export interface MockCycle {
  id: string;
  service_id: string;
  owner_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  created_at: string;
  payments: Array<
    MockMemberPayment & {
      member: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        avatar_url: string | null;
        profile_id: string | null;
      };
    }
  >;
}

export function getMockCyclesForService(serviceId: string): MockCycle[] {
  const servicePayments = mockMemberPayments.filter(
    (p) => p.service_id === serviceId,
  );

  // Group by cycle_id
  const cycleMap = new Map<string, MockMemberPayment[]>();
  for (const p of servicePayments) {
    const list = cycleMap.get(p.cycle_id) ?? [];
    list.push(p);
    cycleMap.set(p.cycle_id, list);
  }

  const svc = mockServices.find((s) => s.id === serviceId);

  return Array.from(cycleMap.entries()).map(([cycleId, payments]) => ({
    id: cycleId,
    service_id: serviceId,
    owner_id: MOCK_USER_ID,
    period_start: payments[0].billing_cycles.period_start,
    period_end: payments[0].billing_cycles.period_end,
    total_amount: svc?.monthly_cost ?? 0,
    created_at: payments[0].created_at,
    payments: payments.map((p) => ({
      ...p,
      member: {
        id: p.members.id,
        name: p.members.name,
        email: p.members.email,
        phone: p.members.phone,
        avatar_url: p.members.avatar_url,
        profile_id: p.members.profile_id,
      },
    })),
  }));
}

export const mockPayments = mockMemberPayments;

// ============================================================
// PENDING DEBTORS (for sidebar gauge)
// ============================================================

export interface PendingDebtor {
  id: string;
  name: string;
  initials: string;
  status: "overdue" | "pending";
  amount: number;
  serviceName: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const mockPendingDebtors: PendingDebtor[] = mockMemberPayments
  .filter((p) => ["pending", "partial", "overdue"].includes(p.status))
  .map((p) => {
    const svc = mockServices.find((s) => s.id === p.service_id);
    return {
      id: p.id,
      name: p.members.name,
      initials: getInitials(p.members.name),
      status: (p.status === "overdue" ? "overdue" : "pending") as
        | "overdue"
        | "pending",
      amount: p.amount_due - p.amount_paid + p.accumulated_debt,
      serviceName: svc?.name ?? "",
    };
  });

// ============================================================
// MEMBER CARD DATA (for members page)
// ============================================================

export interface MockPersonaCardService {
  service_id: string;
  service_name: string;
  service_color: string;
  service_icon: string | null;
  amount_due: number;
  status: PaymentStatus | null;
}

export interface MockMemberCardService {
  service_id: string;
  service_name: string;
  service_color: string;
  service_icon: string | null;
  amount_due: number;
  status: PaymentStatus | null;
}
export interface MockMemberCard {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  profile_id: string | null;
  services: MockMemberCardService[];
  total_debt: number;
  monthly_amount: number;
}

export function getMockMemberCards(): MockMemberCard[] {
  return mockPersonas.map((p) => {
    // Find services this persona belongs to
    const memberOf = mockServices.filter((s) =>
      s.members.some((m) => m.member_id === p.id),
    );

    const services: MockMemberCardService[] = memberOf.map((svc) => {
      const latestPayment = mockMemberPayments.find(
        (pay) => pay.member_id === p.id && pay.service_id === svc.id,
      );
      return {
        service_id: svc.id,
        service_name: svc.name,
        service_color: svc.color,
        service_icon: svc.icon_url,
        amount_due: svc.monthly_cost / svc.member_count,
        status: (latestPayment?.status as PaymentStatus) ?? null,
      };
    });

    const monthlyAmount = services.reduce((sum, s) => sum + s.amount_due, 0);

    // Calculate debt
    const memberPayments = mockMemberPayments.filter(
      (pay) =>
        pay.member_id === p.id &&
        ["pending", "overdue", "partial"].includes(pay.status),
    );
    const totalDebt = memberPayments.reduce(
      (sum, pay) => sum + (pay.amount_due - pay.amount_paid),
      0,
    );

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      avatar_url: p.avatar_url,
      profile_id: p.profile_id,
      services,
      total_debt: totalDebt,
      monthly_amount: monthlyAmount,
    };
  });
}

// ============================================================
// SERVICE DETAIL DATA
// ============================================================

export function getMockServiceDetail(serviceId: string) {
  const service = mockServices.find((s) => s.id === serviceId);
  if (!service) return null;

  const fullService = {
    ...service,
    notes:
      serviceId === "svc-netflix"
        ? "Cuenta principal, plan Premium 4K"
        : serviceId === "svc-hbo"
          ? "Plan con anuncios"
          : null,
    created_at: "2025-07-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
  };

  return fullService;
}

// ============================================================
// MIS PAGOS (guest view mock — payments where user is a member)
// ============================================================

export interface MockMyPayment {
  id: string;
  service_id: string;
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number;
  status: PaymentStatus;
  due_date: string;
  services: {
    id: string;
    name: string;
    color: string;
    icon_url: string | null;
  };
  ownerName: string;
}

export const mockMyPayments: MockMyPayment[] = [
  {
    id: "my-pay-001",
    service_id: "ext-svc-001",
    amount_due: 75,
    amount_paid: 0,
    accumulated_debt: 0,
    status: "pending",
    due_date: "2026-03-01",
    services: {
      id: "ext-svc-001",
      name: "Crunchyroll",
      color: "#F47521",
      icon_url: "simple-icons:crunchyroll",
    },
    ownerName: "Pablo Ríos",
  },
  {
    id: "my-pay-002",
    service_id: "ext-svc-002",
    amount_due: 55,
    amount_paid: 55,
    accumulated_debt: 0,
    status: "paid",
    due_date: "2026-02-20",
    services: {
      id: "ext-svc-002",
      name: "iCloud+",
      color: "#3693F5",
      icon_url: "simple-icons:icloud",
    },
    ownerName: "Sandra López",
  },
];
