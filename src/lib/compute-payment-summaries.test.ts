import { describe, it, expect } from "vitest";
import {
  computePaymentSummaries,
  memberTotalDebt,
  serviceTotalPending,
  serviceTotalCollected,
  type PaymentInput,
} from "./compute-payment-summaries";

const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000)
  .toISOString()
  .split("T")[0];
const PAST = "2020-01-01";

function makePayment(
  id: string,
  memberId: string,
  serviceId: string,
  period: string,
  options: Partial<PaymentInput> = {},
): PaymentInput {
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
    ...options,
  };
}

// ── computePaymentSummaries ───────────────────────────────────────

describe("computePaymentSummaries", () => {
  it("array vacío retorna Map vacío", () => {
    expect(computePaymentSummaries([])).toEqual(new Map());
  });

  it("un pago pending sin pagar → totalDebt = amount_due", () => {
    const p = makePayment("p1", "m1", "s1", "2024-06-01");
    const map = computePaymentSummaries([p]);
    const summary = map.get("m1:s1")!;
    expect(summary.totalDebt).toBe(100);
    expect(summary.status).toBe("pending");
    expect(summary.totalCollected).toBe(0);
  });

  it("pago confirmed → totalDebt = 0", () => {
    const p = makePayment("p1", "m1", "s1", "2024-06-01", {
      amount_paid: 100,
      requires_confirmation: false,
    });
    const map = computePaymentSummaries([p]);
    expect(map.get("m1:s1")!.totalDebt).toBe(0);
    expect(map.get("m1:s1")!.status).toBe("confirmed");
  });

  it("totalDebt suma TODOS los ciclos abiertos", () => {
    // Ciclo anterior vencido + ciclo actual pending
    const p1 = makePayment("p1", "m1", "s1", "2024-05-01", {
      accumulated_debt: 0,
      amount_due: 100,
      due_date: PAST,
    }); // overdue
    const p2 = makePayment("p2", "m1", "s1", "2024-06-01", {
      amount_due: 100,
    }); // pending
    const map = computePaymentSummaries([p1, p2]);
    expect(map.get("m1:s1")!.totalDebt).toBe(200);
  });

  it("totalCollected viene solo del ciclo más reciente", () => {
    const p1 = makePayment("p1", "m1", "s1", "2024-05-01", {
      amount_due: 100,
      amount_paid: 100,
    }); // confirmed (older)
    const p2 = makePayment("p2", "m1", "s1", "2024-06-01", {
      amount_due: 100,
      amount_paid: 60,
    }); // partial (latest)
    const map = computePaymentSummaries([p1, p2]);
    const summary = map.get("m1:s1")!;
    // Collected = paid on latest cycle = 60
    expect(summary.totalCollected).toBe(60);
  });

  it("status = peor estado entre ciclos (overdue escalates)", () => {
    const p1 = makePayment("p1", "m1", "s1", "2024-05-01", {
      due_date: PAST,
    }); // overdue
    const p2 = makePayment("p2", "m1", "s1", "2024-06-01"); // pending
    const map = computePaymentSummaries([p1, p2]);
    expect(map.get("m1:s1")!.status).toBe("overdue");
  });

  it("latestPayment es el del período más reciente", () => {
    const p1 = makePayment("p1", "m1", "s1", "2024-05-01");
    const p2 = makePayment("p2", "m1", "s1", "2024-06-01");
    const map = computePaymentSummaries([p1, p2]);
    expect(map.get("m1:s1")!.latestPayment.id).toBe("p2");
  });

  it("pares distintos (m1:s1, m1:s2) no se mezclan", () => {
    const p1 = makePayment("p1", "m1", "s1", "2024-06-01", {
      amount_due: 100,
    });
    const p2 = makePayment("p2", "m1", "s2", "2024-06-01", {
      amount_due: 200,
    });
    const map = computePaymentSummaries([p1, p2]);
    expect(map.get("m1:s1")!.totalDebt).toBe(100);
    expect(map.get("m1:s2")!.totalDebt).toBe(200);
  });

  it("crédito aplicado reduce totalDebt", () => {
    const p = makePayment("p1", "m1", "s1", "2024-06-01", {
      amount_due: 100,
      credit_amount_used: 100,
      requires_confirmation: false,
    });
    const map = computePaymentSummaries([p]);
    expect(map.get("m1:s1")!.totalDebt).toBe(0);
    expect(map.get("m1:s1")!.status).toBe("confirmed");
  });

  it("deuda acumulada en un pago se incluye en totalDebt", () => {
    const p = makePayment("p1", "m1", "s1", "2024-06-01", {
      amount_due: 100,
      accumulated_debt: 50,
      amount_paid: 0,
    });
    const map = computePaymentSummaries([p]);
    expect(map.get("m1:s1")!.totalDebt).toBe(150);
  });

  it("dos miembros distintos en mismo servicio son pares independientes", () => {
    const p1 = makePayment("p1", "m1", "s1", "2024-06-01", {
      amount_due: 100,
    });
    const p2 = makePayment("p2", "m2", "s1", "2024-06-01", {
      amount_due: 200,
    });
    const map = computePaymentSummaries([p1, p2]);
    expect(map.size).toBe(2);
    expect(map.get("m1:s1")!.totalDebt).toBe(100);
    expect(map.get("m2:s1")!.totalDebt).toBe(200);
  });

  it("orden de entrada no afecta el resultado", () => {
    const p1 = makePayment("p1", "m1", "s1", "2024-06-01"); // más reciente
    const p2 = makePayment("p2", "m1", "s1", "2024-05-01"); // más antiguo

    const map1 = computePaymentSummaries([p1, p2]);
    const map2 = computePaymentSummaries([p2, p1]);

    expect(map1.get("m1:s1")!.latestPayment.id).toBe("p1");
    expect(map2.get("m1:s1")!.latestPayment.id).toBe("p1");
    expect(map1.get("m1:s1")!.totalDebt).toBe(map2.get("m1:s1")!.totalDebt);
  });
});

// ── memberTotalDebt ───────────────────────────────────────────────

describe("memberTotalDebt", () => {
  it("suma deuda de todos los servicios del miembro", () => {
    const payments = [
      makePayment("p1", "m1", "s1", "2024-06-01", { amount_due: 100 }),
      makePayment("p2", "m1", "s2", "2024-06-01", { amount_due: 200 }),
      makePayment("p3", "m2", "s1", "2024-06-01", { amount_due: 300 }),
    ];
    const map = computePaymentSummaries(payments);
    expect(memberTotalDebt(map, "m1")).toBe(300);
    expect(memberTotalDebt(map, "m2")).toBe(300);
  });

  it("miembro sin deuda retorna 0", () => {
    const p = makePayment("p1", "m1", "s1", "2024-06-01", {
      amount_due: 100,
      amount_paid: 100,
      requires_confirmation: false,
    });
    const map = computePaymentSummaries([p]);
    expect(memberTotalDebt(map, "m1")).toBe(0);
  });

  it("miembro no encontrado retorna 0", () => {
    const map = computePaymentSummaries([]);
    expect(memberTotalDebt(map, "inexistente")).toBe(0);
  });
});

// ── serviceTotalPending / serviceTotalCollected ───────────────────

describe("serviceTotalPending", () => {
  it("suma deuda de todos los miembros del servicio", () => {
    const payments = [
      makePayment("p1", "m1", "s1", "2024-06-01", { amount_due: 100 }),
      makePayment("p2", "m2", "s1", "2024-06-01", { amount_due: 200 }),
      makePayment("p3", "m1", "s2", "2024-06-01", { amount_due: 50 }),
    ];
    const map = computePaymentSummaries(payments);
    expect(serviceTotalPending(map, "s1")).toBe(300);
    expect(serviceTotalPending(map, "s2")).toBe(50);
  });
});

describe("serviceTotalCollected", () => {
  it("suma lo cobrado del ciclo más reciente por servicio", () => {
    const payments = [
      makePayment("p1", "m1", "s1", "2024-06-01", {
        amount_due: 100,
        amount_paid: 80,
      }),
      makePayment("p2", "m2", "s1", "2024-06-01", {
        amount_due: 200,
        amount_paid: 200,
        requires_confirmation: false,
      }),
    ];
    const map = computePaymentSummaries(payments);
    // m1 collected 80, m2 collected 200 → total 280
    expect(serviceTotalCollected(map, "s1")).toBe(280);
  });

  it("servicio sin cobros retorna 0", () => {
    const p = makePayment("p1", "m1", "s1", "2024-06-01");
    const map = computePaymentSummaries([p]);
    expect(serviceTotalCollected(map, "s1")).toBe(0);
  });
});
