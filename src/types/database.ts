// ============================================================
// STREAMSHARE - TypeScript Types
// Generado desde: streamshare_schema_v2.sql
// Uso: copiar a /types/database.ts en tu proyecto Next.js
// ============================================================

// ============================================================
// ENUMS
// ============================================================

export type ServiceStatus = "active" | "pending" | "overdue";

export type PaymentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "confirmed"
  | "overdue";

export type SplitType = "equal" | "custom";

export type CreditStatus = "available" | "applied" | "cancelled";

// ============================================================
// TABLAS — Row types (lo que viene de la DB)
// ============================================================

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  owner_id: string;
  name: string;
  icon_url: string | null;
  color: string;
  monthly_cost: number;
  billing_day: number;
  split_type: SplitType;
  status: ServiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  owner_id: string;
  profile_id: string | null; // null si no tiene cuenta en StreamShare
  name: string;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  notes: string | null;
  link_attempted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceMember {
  id: string;
  service_id: string;
  member_id: string;
  owner_id: string;
  custom_amount: number | null;
  joined_at: string;
  is_active: boolean;
}

export interface BillingCycle {
  id: string;
  service_id: string;
  owner_id: string;
  period_start: string; // date: 'YYYY-MM-DD'
  period_end: string; // date: 'YYYY-MM-DD'
  total_amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  cycle_id: string;
  service_id: string;
  member_id: string;
  owner_id: string;
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number; // deuda de meses anteriores sin pagar
  status: PaymentStatus;
  due_date: string; // date: 'YYYY-MM-DD'
  requires_confirmation: boolean;
  paid_at: string | null; // miembro marcó como pagado
  confirmed_at: string | null; // dueño confirmó
  credit_applied_id: string | null;
  credit_amount_used: number;
  created_at: string;
  updated_at: string;
}

export interface MemberCredit {
  id: string;
  member_id: string;
  service_id: string;
  owner_id: string;
  source_payment_id: string | null;
  amount: number;
  amount_remaining: number;
  status: CreditStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentNote {
  id: string;
  payment_id: string;
  author_id: string;
  owner_id: string;
  content: string;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  owner_id: string;
  entity_type: "payment" | "service" | "member" | "credit" | "invitation";
  entity_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  notify_before_days: number;
  notify_overdue: boolean;
  default_currency: string;
  auto_generate_cycles: boolean;
  updated_at: string;
}

// ============================================================
// VISTAS — View types
// ============================================================

export interface ServiceMemberInfo {
  member_id: string;
  custom_amount: number | null;
  is_active: boolean;
  name: string;
  email: string | null;
  avatar_url: string | null;
}

export interface ServiceSummary {
  id: string;
  owner_id: string;
  name: string;
  icon_url: string | null;
  color: string;
  monthly_cost: number;
  billing_day: number;
  split_type: SplitType;
  status: ServiceStatus;
  member_count: number;
  members: ServiceMemberInfo[];
  pending_amount: number; // por cobrar este mes
  collected_amount: number; // cobrado este mes
}

export interface DashboardSummary {
  owner_id: string;
  total_services: number;
  total_members: number;
  total_month_receivable: number;
  total_month_collected: number;
  overdue_count: number;
  total_accumulated_debt: number;
}

export interface DebtByMonth {
  cycle_id: string;
  period: string; // 'Feb 2026'
  amount_due: number;
  amount_paid: number;
  status: PaymentStatus;
  due_date: string;
}

export interface MemberDebtSummary {
  member_id: string;
  service_id: string;
  owner_id: string;
  member_name: string;
  service_name: string;
  service_color: string;
  debt_by_month: DebtByMonth[];
  total_debt: number;
  available_credit: number;
}

export interface MyPayment {
  id: string;
  status: PaymentStatus;
  amount_due: number;
  amount_paid: number;
  accumulated_debt: number;
  due_date: string;
  paid_at: string | null;
  confirmed_at: string | null;
  requires_confirmation: boolean;
  credit_amount_used: number;
  service_id: string;
  service_name: string;
  service_color: string;
  service_icon: string | null;
  owner_name: string;
  cycle_id: string;
  period_start: string;
  period_end: string;
}

// ============================================================
// INSERT types — Para crear registros nuevos
// ============================================================

export type InsertProfile = Omit<Profile, "created_at" | "updated_at">;

export type InsertService = Omit<
  Service,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  status?: ServiceStatus;
};

export type InsertMember = Omit<
  Member,
  "id" | "created_at" | "updated_at" | "link_attempted"
> & {
  id?: string;
  link_attempted?: boolean;
};

export type InsertServiceMember = Omit<ServiceMember, "id" | "joined_at"> & {
  id?: string;
};

export type InsertPaymentNote = Omit<
  PaymentNote,
  "id" | "is_edited" | "edited_at" | "created_at"
> & {
  id?: string;
};

// ============================================================
// UPDATE types — Para actualizar registros
// ============================================================

export type UpdateService = Partial<
  Pick<
    Service,
    | "name"
    | "icon_url"
    | "color"
    | "monthly_cost"
    | "billing_day"
    | "split_type"
    | "status"
    | "notes"
  >
>;

export type UpdateMember = Partial<
  Pick<
    Member,
    "name" | "email" | "avatar_url" | "phone" | "notes" | "profile_id"
  >
>;

export type UpdatePaymentNote = Pick<PaymentNote, "content"> & {
  is_edited: true;
  edited_at: string;
};

// ============================================================
// FUNCIÓN RETURNS — Lo que devuelven las funciones de Supabase
// ============================================================

export interface RegisterPaymentResult {
  cycles_paid: Array<{
    payment_id: string;
    amount: number;
  }>;
  credit_generated: boolean;
  credit_amount: number;
}

// ============================================================
// UI TYPES — Shared across components
// ============================================================

export interface ServiceInfo {
  service_id: string;
  service_name: string;
  service_color: string;
  service_icon: string | null;
  amount_due: number;
  status: PaymentStatus | null;
}

export interface PersonaCardData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  profile_id: string | null;
  services: ServiceInfo[];
  total_debt: number;
  monthly_amount: number;
}

export interface PendingDebtor {
  id: string;
  name: string;
  initials: string;
  status: "overdue" | "pending";
  amount: number;
  serviceName: string;
}

export interface StatusBadgeConfig {
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotColor: string | null;
  animate: boolean;
}

// ============================================================
// TIPOS COMPUESTOS — Para el UI (joins frecuentes)
// ============================================================

// Payment con datos de miembro y servicio (para listas)
export interface PaymentWithRelations extends Payment {
  member: Member;
  service: Pick<Service, "id" | "name" | "color" | "icon_url">;
  billing_cycle: Pick<BillingCycle, "id" | "period_start" | "period_end">;
  notes: PaymentNote[];
}

// Servicio con sus miembros (para detalle de servicio)
export interface ServiceWithMembers extends Service {
  members: Array<
    ServiceMember & {
      member: Member;
      current_payment: Payment | null;
      available_credit: number;
    }
  >;
}

// Miembro con todos sus servicios y deuda total (para lista de personas)
export interface MemberWithDebt extends Member {
  services: Array<{
    service: Pick<Service, "id" | "name" | "color" | "icon_url">;
    current_payment: Payment | null;
    available_credit: number;
    total_debt: number;
  }>;
  total_debt: number;
  total_credit: number;
}

// Nota con datos del autor (para mostrar en UI)
export interface PaymentNoteWithAuthor extends PaymentNote {
  author: Pick<Profile, "id" | "display_name" | "avatar_url">;
  is_own: boolean; // true si auth.uid() === author_id
}

// ============================================================
// SUPABASE DATABASE TYPE — Para el cliente tipado
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: InsertProfile;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      services: {
        Row: Service;
        Insert: InsertService;
        Update: UpdateService;
      };
      members: {
        Row: Member;
        Insert: InsertMember;
        Update: UpdateMember;
      };
      service_members: {
        Row: ServiceMember;
        Insert: InsertServiceMember;
        Update: Partial<InsertServiceMember>;
      };
      billing_cycles: {
        Row: BillingCycle;
        Insert: Omit<BillingCycle, "id" | "created_at">;
        Update: never;
      };
      payments: {
        Row: Payment;
        Insert: never; // solo se crean via generate_billing_cycle()
        Update: Partial<
          Pick<Payment, "status" | "amount_paid" | "paid_at" | "confirmed_at">
        >;
      };
      member_credits: {
        Row: MemberCredit;
        Insert: never; // solo se crean via register_payment()
        Update: Partial<Pick<MemberCredit, "status" | "notes">>;
      };
      payment_notes: {
        Row: PaymentNote;
        Insert: InsertPaymentNote;
        Update: UpdatePaymentNote;
      };
      activity_log: {
        Row: ActivityLog;
        Insert: never; // solo se crean via funciones internas
        Update: never;
      };
      user_settings: {
        Row: UserSettings;
        Insert: Omit<UserSettings, "updated_at">;
        Update: Partial<Omit<UserSettings, "id" | "updated_at">>;
      };
    };
    Views: {
      service_summary: {
        Row: ServiceSummary;
      };
      dashboard_summary: {
        Row: DashboardSummary;
      };
      member_debt_summary: {
        Row: MemberDebtSummary;
      };
      my_payments: {
        Row: MyPayment;
      };
    };
    Functions: {
      generate_billing_cycle: {
        Args: { p_service_id: string };
        Returns: string; // uuid del ciclo creado
      };
      register_payment: {
        Args: {
          p_payment_id: string;
          p_amount_paid: number;
          p_note?: string;
          p_cycle_ids?: string[];
        };
        Returns: RegisterPaymentResult;
      };
      claim_payment: {
        Args: { p_payment_id: string; p_claimed_amount: number };
        Returns: void;
      };
      confirm_payment: {
        Args: { p_payment_id: string };
        Returns: void;
      };
      calculate_member_amount: {
        Args: { p_service_id: string; p_member_id: string };
        Returns: number;
      };
      add_member_to_active_cycles: {
        Args: { p_service_id: string; p_member_id: string };
        Returns: void;
      };
      reject_payment_claim: {
        Args: { p_payment_id: string };
        Returns: void;
      };
    };
    Enums: {
      service_status: ServiceStatus;
      payment_status: PaymentStatus;
      split_type: SplitType;
      credit_status: CreditStatus;
    };
  };
}
