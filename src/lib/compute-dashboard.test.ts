import { describe, it, expect } from "vitest";
import { computeDashboardFromPayments } from "./compute-dashboard";
import type { PaymentInput } from "./compute-payment-summaries";

const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000)
  .toISOString()
  .split("T")[0];
const PAST = "2020-01-01";

function makePayment(
  id: string,
  memberId: string,
  serviceId: string,
  period: string,
  options: Partial<PaymentInput> & {
    memberName?: string;
    serviceName?: string;
  } = {},
): PaymentInput {
  const { memberName = "Ana", serviceName = "Netflix", ...rest } = options;
  return {
    id,
    member_id: memberId,
    service_id: serviceId,
    amount_due: 100,
    amount_paid: 0,
    accumulated_debt: 0,
    status: "pending",
    requires_confirmation: false,
    due_date: FUTURE,
    billing_cycles: { period_start: period },
    members: { name: memberName },
    services: { name: serviceName },
    ...rest,
  };
}

const activeServiceIds = new Set(["s1", "s2"]);
const activePairs = new Set(["m1:s1", "m2:s1", "m1:s2"]);
const ownerId = "owner-123";

describe("computeDashboardFromPayments", () => {
  it("sin pagos activos retorna totales en 0", () => {
    const { dashboard } = computeDashboardFromPayments(
      [],
      activeServiceIds,
      activePairs,
      ownerId,
    );
    expect(dashboard.total_month_receivable).toBe(0);
    expect(dashboard.total_month_collected).toBe(0);
    expect(dashboard.overdue_count).toBe(0);
    expect(dashboard.owner_id).toBe(ownerId);
  });

  it("ignora pagos de servicios inactivos", () => {
    const p = makePayment("p1", "m1", "s99", "2024-06-01"); // s99 no está activo
    const { dashboard } = computeDashboardFromPayments(
      [p],
      activeServiceIds,
      activePairs,
      ownerId,
    );
    expect(dashboard.total_month_receivable).toBe(0);
  });

  it("ignora pagos de pares inactivos", () => {
    const p = makePayment("p1", "m3", "s1", "2024-06-01"); // m3:s1 no está en activePairs
    const { dashboard } = computeDashboardFromPayments(
      [p],
      activeServiceIds,
      activePairs,
      ownerId,
    );
    expect(dashboard.total_month_receivable).toBe(0);
  });

  it("total_services y total_members cuentan únicos de pagos activos", () => {
    const payments = [
      makePayment("p1", "m1", "s1", "2024-06-01"),
      makePayment("p2", "m2", "s1", "2024-06-01"),
    ];
    const { dashboard } = computeDashboardFromPayments(
      payments,
      activeServiceIds,
      activePairs,
      ownerId,
    );
    expect(dashboard.total_services).toBe(1); // solo s1
    expect(dashboard.total_members).toBeGreaterThanOrEqual(2); // m1 y m2
  });

  it("overdue_count cuenta pagos vencidos", () => {
    const payments = [
      makePayment("p1", "m1", "s1", "2024-06-01", { due_date: PAST }), // overdue
      makePayment("p2", "m2", "s1", "2024-06-01"), // pending
    ];
    const { dashboard } = computeDashboardFromPayments(
      payments,
      activeServiceIds,
      activePairs,
      ownerId,
    );
    expect(dashboard.overdue_count).toBe(1);
  });

  it("total_accumulated_debt suma deuda acumulada de todos los pagos", () => {
    const payments = [
      makePayment("p1", "m1", "s1", "2024-06-01", { accumulated_debt: 50 }),
      makePayment("p2", "m2", "s1", "2024-06-01", { accumulated_debt: 30 }),
    ];
    const { dashboard } = computeDashboardFromPayments(
      payments,
      activeServiceIds,
      activePairs,
      ownerId,
    );
    expect(dashboard.total_accumulated_debt).toBe(80);
  });

  it("pendingDebtors incluye solo miembros con deuda > 0", () => {
    const payments = [
      makePayment("p1", "m1", "s1", "2024-06-01", {
        memberName: "Ana",
        serviceName: "Netflix",
      }), // pending
      makePayment("p2", "m2", "s1", "2024-06-01", {
        amount_paid: 100,
        requires_confirmation: false,
        memberName: "Bob",
        serviceName: "Netflix",
      }), // confirmed, no deuda
    ];
    const { pendingDebtors } = computeDashboardFromPayments(
      payments,
      activeServiceIds,
      activePairs,
      ownerId,
    );
    expect(pendingDebtors).toHaveLength(1);
    expect(pendingDebtors[0].name).toBe("Ana");
  });

  it("pendingDebtors ordena overdue antes que pending", () => {
    const payments = [
      makePayment("p1", "m1", "s1", "2024-06-01", { memberName: "Ana" }), // pending
      makePayment("p2", "m2", "s1", "2024-06-01", {
        due_date: PAST,
        memberName: "Bob",
      }), // overdue
    ];
    const { pendingDebtors } = computeDashboardFromPayments(
      payments,
      activeServiceIds,
      activePairs,
      ownerId,
    );
    expect(pendingDebtors[0].status).toBe("overdue");
    expect(pendingDebtors[0].name).toBe("Bob");
  });

  it("pendingDebtors tiene máximo 10 entradas", () => {
    const payments = Array.from({ length: 15 }, (_, i) =>
      makePayment(`p${i}`, `m${i}`, "s1", "2024-06-01", {
        memberName: `User${i}`,
      }),
    );
    const allPairs = new Set(payments.map((p) => `${p.member_id}:s1`));
    const { pendingDebtors } = computeDashboardFromPayments(
      payments,
      activeServiceIds,
      allPairs,
      ownerId,
    );
    expect(pendingDebtors.length).toBeLessThanOrEqual(10);
  });

  it("total_month_collected refleja cobrado en ciclo actual", () => {
    const p = makePayment("p1", "m1", "s1", "2024-06-01", {
      amount_due: 100,
      amount_paid: 75,
    });
    const { dashboard } = computeDashboardFromPayments(
      [p],
      activeServiceIds,
      activePairs,
      ownerId,
    );
    expect(dashboard.total_month_collected).toBe(75);
  });

  it("total_month_receivable usa obligation del ciclo más reciente por par", () => {
    // Dos ciclos abiertos: el gauge debe mostrar el más reciente (100), no ambos sumados
    const p1 = makePayment("p1", "m1", "s1", "2024-05-01", {
      amount_due: 100,
    });
    const p2 = makePayment("p2", "m1", "s1", "2024-06-01", {
      amount_due: 100,
    });
    const { dashboard } = computeDashboardFromPayments(
      [p1, p2],
      activeServiceIds,
      activePairs,
      ownerId,
    );
    // Gauge usa latestPayment por par → obligation = 100 (no 200)
    expect(dashboard.total_month_receivable).toBe(100);
  });
});
