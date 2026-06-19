import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  paymentObligation,
  paymentRemaining,
  derivePaymentStatus,
  isActionablePayment,
  isAwaitingConfirmation,
  isSettled,
  countByDerivedStatus,
  sortPaymentsForHistory,
} from "./payment-utils";

// ── paymentObligation ─────────────────────────────────────────────

describe("paymentObligation", () => {
  it("suma amount_due + accumulated_debt", () => {
    expect(paymentObligation({ amount_due: 100, accumulated_debt: 50 })).toBe(
      150,
    );
  });

  it("sin deuda acumulada retorna solo amount_due", () => {
    expect(paymentObligation({ amount_due: 99.67, accumulated_debt: 0 })).toBe(
      99.67,
    );
  });

  it("convierte strings numéricos correctamente", () => {
    expect(
      paymentObligation({
        amount_due: "120" as unknown as number,
        accumulated_debt: "30" as unknown as number,
      }),
    ).toBe(150);
  });
});

// ── paymentRemaining ──────────────────────────────────────────────

describe("paymentRemaining", () => {
  const base = {
    amount_due: 100,
    accumulated_debt: 0,
    amount_paid: 0,
  };

  it("sin pagos retorna obligation completa", () => {
    expect(paymentRemaining(base)).toBe(100);
  });

  it("pago parcial retorna diferencia", () => {
    expect(paymentRemaining({ ...base, amount_paid: 60 })).toBe(40);
  });

  it("pago completo retorna 0", () => {
    expect(paymentRemaining({ ...base, amount_paid: 100 })).toBe(0);
  });

  it("crédito aplicado reduce remaining", () => {
    expect(
      paymentRemaining({ ...base, amount_paid: 0, credit_amount_used: 100 }),
    ).toBe(0);
  });

  it("crédito parcial reduce remaining", () => {
    expect(
      paymentRemaining({ ...base, amount_paid: 50, credit_amount_used: 30 }),
    ).toBe(20);
  });

  it("nunca retorna negativo (sobrepago)", () => {
    expect(paymentRemaining({ ...base, amount_paid: 150 })).toBe(0);
  });

  it("incluye accumulated_debt en el cálculo", () => {
    expect(
      paymentRemaining({ ...base, accumulated_debt: 50, amount_paid: 80 }),
    ).toBe(70);
  });

  it("deuda acumulada cubierta por crédito", () => {
    expect(
      paymentRemaining({
        amount_due: 100,
        accumulated_debt: 50,
        amount_paid: 0,
        credit_amount_used: 150,
      }),
    ).toBe(0);
  });

  it("redondeo a 2 decimales", () => {
    expect(
      paymentRemaining({
        amount_due: 99.67,
        accumulated_debt: 0,
        amount_paid: 33.33,
      }),
    ).toBe(66.34);
  });
});

// ── derivePaymentStatus ───────────────────────────────────────────

describe("derivePaymentStatus", () => {
  const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];
  const PAST = "2020-01-01";

  const pendingBase = {
    amount_due: 100,
    amount_paid: 0,
    accumulated_debt: 0,
    requires_confirmation: false,
    due_date: FUTURE,
  };

  it("pending cuando nada está pagado y no vencido", () => {
    expect(derivePaymentStatus(pendingBase)).toBe("pending");
  });

  it("partial cuando hay pago pero no completo", () => {
    expect(derivePaymentStatus({ ...pendingBase, amount_paid: 50 })).toBe(
      "partial",
    );
  });

  it("overdue cuando vence y no está pagado", () => {
    expect(derivePaymentStatus({ ...pendingBase, due_date: PAST })).toBe(
      "overdue",
    );
  });

  it("paid cuando está cubierto y requires_confirmation=true sin confirmed_at", () => {
    expect(
      derivePaymentStatus({
        ...pendingBase,
        amount_paid: 100,
        requires_confirmation: true,
        confirmed_at: null,
      }),
    ).toBe("paid");
  });

  it("confirmed cuando está cubierto y requires_confirmation=false", () => {
    expect(
      derivePaymentStatus({
        ...pendingBase,
        amount_paid: 100,
        requires_confirmation: false,
      }),
    ).toBe("confirmed");
  });

  it("confirmed cuando está cubierto y tiene confirmed_at", () => {
    expect(
      derivePaymentStatus({
        ...pendingBase,
        amount_paid: 100,
        requires_confirmation: true,
        confirmed_at: "2024-06-01T00:00:00Z",
      }),
    ).toBe("confirmed");
  });

  it("confirmed cuando crédito cubre el monto completo y no requires_confirmation", () => {
    expect(
      derivePaymentStatus({
        amount_due: 100,
        amount_paid: 0,
        accumulated_debt: 0,
        credit_amount_used: 100,
        requires_confirmation: false,
        due_date: FUTURE,
      }),
    ).toBe("confirmed");
  });

  it("paid cuando crédito cubre y requires_confirmation=true", () => {
    expect(
      derivePaymentStatus({
        amount_due: 100,
        amount_paid: 0,
        accumulated_debt: 0,
        credit_amount_used: 100,
        requires_confirmation: true,
        confirmed_at: null,
        due_date: FUTURE,
      }),
    ).toBe("paid");
  });

  it("overdue tiene prioridad sobre partial cuando hay deuda y venció", () => {
    // Vencido con pago parcial → overdue (porque remaining > 0 y due_date en pasado)
    expect(
      derivePaymentStatus({
        ...pendingBase,
        amount_paid: 50,
        due_date: PAST,
      }),
    ).toBe("overdue");
  });

  it("confirmed aunque vencido cuando ya se pagó todo", () => {
    expect(
      derivePaymentStatus({
        ...pendingBase,
        amount_paid: 100,
        due_date: PAST,
        requires_confirmation: false,
      }),
    ).toBe("confirmed");
  });

  it("deuda acumulada sí cuenta en remaining", () => {
    // amount_paid cubre amount_due pero no la deuda acumulada → partial
    expect(
      derivePaymentStatus({
        amount_due: 100,
        amount_paid: 100,
        accumulated_debt: 50,
        requires_confirmation: false,
        due_date: FUTURE,
      }),
    ).toBe("partial");
  });
});

// ── Helpers de estado ─────────────────────────────────────────────

describe("isActionablePayment", () => {
  const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];
  const PAST = "2020-01-01";

  it("pending → true", () => {
    expect(
      isActionablePayment({
        amount_due: 100,
        amount_paid: 0,
        accumulated_debt: 0,
        due_date: FUTURE,
      }),
    ).toBe(true);
  });

  it("partial → true", () => {
    expect(
      isActionablePayment({
        amount_due: 100,
        amount_paid: 50,
        accumulated_debt: 0,
        due_date: FUTURE,
      }),
    ).toBe(true);
  });

  it("overdue → true", () => {
    expect(
      isActionablePayment({
        amount_due: 100,
        amount_paid: 0,
        accumulated_debt: 0,
        due_date: PAST,
      }),
    ).toBe(true);
  });

  it("paid → false", () => {
    expect(
      isActionablePayment({
        amount_due: 100,
        amount_paid: 100,
        accumulated_debt: 0,
        requires_confirmation: true,
        confirmed_at: null,
        due_date: FUTURE,
      }),
    ).toBe(false);
  });

  it("confirmed → false", () => {
    expect(
      isActionablePayment({
        amount_due: 100,
        amount_paid: 100,
        accumulated_debt: 0,
        requires_confirmation: false,
        due_date: FUTURE,
      }),
    ).toBe(false);
  });
});

describe("isAwaitingConfirmation", () => {
  const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];

  it("true solo cuando status=paid", () => {
    expect(
      isAwaitingConfirmation({
        amount_due: 100,
        amount_paid: 100,
        accumulated_debt: 0,
        requires_confirmation: true,
        confirmed_at: null,
        due_date: FUTURE,
      }),
    ).toBe(true);
  });

  it("false cuando ya confirmado", () => {
    expect(
      isAwaitingConfirmation({
        amount_due: 100,
        amount_paid: 100,
        accumulated_debt: 0,
        requires_confirmation: false,
        due_date: FUTURE,
      }),
    ).toBe(false);
  });
});

describe("isSettled", () => {
  const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];

  it("true cuando confirmed", () => {
    expect(
      isSettled({
        amount_due: 100,
        amount_paid: 100,
        accumulated_debt: 0,
        requires_confirmation: false,
        due_date: FUTURE,
      }),
    ).toBe(true);
  });

  it("false cuando paid pero sin confirmar", () => {
    expect(
      isSettled({
        amount_due: 100,
        amount_paid: 100,
        accumulated_debt: 0,
        requires_confirmation: true,
        confirmed_at: null,
        due_date: FUTURE,
      }),
    ).toBe(false);
  });
});

// ── countByDerivedStatus ──────────────────────────────────────────

describe("countByDerivedStatus", () => {
  const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];
  const PAST = "2020-01-01";

  it("cuenta correctamente por estado derivado", () => {
    const payments = [
      { amount_due: 100, amount_paid: 0, accumulated_debt: 0, due_date: FUTURE }, // pending
      { amount_due: 100, amount_paid: 50, accumulated_debt: 0, due_date: FUTURE }, // partial
      { amount_due: 100, amount_paid: 0, accumulated_debt: 0, due_date: PAST }, // overdue
      {
        amount_due: 100,
        amount_paid: 100,
        accumulated_debt: 0,
        requires_confirmation: true,
        confirmed_at: null,
        due_date: FUTURE,
      }, // paid
      {
        amount_due: 100,
        amount_paid: 100,
        accumulated_debt: 0,
        requires_confirmation: false,
        due_date: FUTURE,
      }, // confirmed
    ];

    const counts = countByDerivedStatus(payments);
    expect(counts.pending).toBe(1);
    expect(counts.partial).toBe(1);
    expect(counts.overdue).toBe(1);
    expect(counts.paid).toBe(1);
    expect(counts.confirmed).toBe(1);
    expect(counts.all).toBe(5);
  });

  it("array vacío retorna all=0", () => {
    const counts = countByDerivedStatus([]);
    expect(counts.all).toBe(0);
  });
});

// ── sortPaymentsForHistory ────────────────────────────────────────

describe("sortPaymentsForHistory", () => {
  function makePayment(
    period: string,
    options: {
      amount_paid?: number;
      confirmed_at?: string;
      paid_at?: string;
      due_date?: string;
      name?: string;
    } = {},
  ) {
    return {
      billing_cycles: { period_start: period },
      amount_paid: options.amount_paid ?? 0,
      credit_amount_used: 0,
      confirmed_at: options.confirmed_at ?? null,
      paid_at: options.paid_at ?? null,
      due_date: options.due_date ?? "2024-12-31",
      members: { name: options.name ?? "Ana" },
    };
  }

  it("ciclo más reciente primero", () => {
    const p1 = makePayment("2024-01-01");
    const p2 = makePayment("2024-06-01");
    const sorted = sortPaymentsForHistory([p1, p2]);
    expect(sorted[0]).toBe(p2);
  });

  it("sin pago aparece antes que con pago dentro del mismo ciclo", () => {
    const sinPago = makePayment("2024-06-01", { amount_paid: 0 });
    const conPago = makePayment("2024-06-01", {
      amount_paid: 100,
      paid_at: "2024-06-15T10:00:00Z",
    });
    const sorted = sortPaymentsForHistory([conPago, sinPago]);
    expect(sorted[0]).toBe(sinPago);
  });

  it("no muta el array original", () => {
    const p1 = makePayment("2024-01-01");
    const p2 = makePayment("2024-06-01");
    const original = [p1, p2];
    sortPaymentsForHistory(original);
    expect(original[0]).toBe(p1);
  });

  it("actividad reciente primero para pagos ya procesados", () => {
    const early = makePayment("2024-06-01", {
      amount_paid: 100,
      paid_at: "2024-06-10T00:00:00Z",
    });
    const late = makePayment("2024-06-01", {
      amount_paid: 100,
      paid_at: "2024-06-20T00:00:00Z",
    });
    const sorted = sortPaymentsForHistory([early, late]);
    expect(sorted[0]).toBe(late);
  });
});
