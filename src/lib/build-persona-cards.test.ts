import { describe, it, expect } from "vitest";
import { buildPersonaCards } from "./build-persona-cards";
import type { PaymentInput } from "./compute-payment-summaries";

const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000)
  .toISOString()
  .split("T")[0];

function makeBaseData(overrides: {
  payments?: PaymentInput[];
  credits?: { member_id: string; service_id: string; amount_remaining: number }[];
} = {}) {
  return {
    members: [
      {
        id: "m1",
        name: "Ana Ruiz",
        email: "ana@example.com",
        phone: null,
        avatar_url: null,
        profile_id: "profile-1",
      },
    ],
    serviceMembers: [
      {
        member_id: "m1",
        service_id: "s1",
        custom_amount: null as number | null,
        is_active: true,
      },
    ],
    payments: overrides.payments ?? [],
    services: [
      {
        id: "s1",
        name: "Netflix",
        color: "#e50914",
        icon_url: null,
        monthly_cost: 200,
      },
    ],
    credits: overrides.credits ?? [],
  };
}

describe("buildPersonaCards", () => {
  it("array vacío de miembros retorna array vacío", () => {
    const result = buildPersonaCards({
      members: [],
      serviceMembers: [],
      payments: [],
      services: [],
      credits: [],
    });
    expect(result).toEqual([]);
  });

  it("construye campos base de la persona", () => {
    const [card] = buildPersonaCards(makeBaseData());
    expect(card.id).toBe("m1");
    expect(card.name).toBe("Ana Ruiz");
    expect(card.email).toBe("ana@example.com");
    expect(card.profile_id).toBe("profile-1");
  });

  it("amount_due con split equitativo (monthly_cost / memberCount+1)", () => {
    // 1 miembro en el servicio → monthly_cost / (1+1) = 100
    const [card] = buildPersonaCards(makeBaseData());
    expect(card.services[0].amount_due).toBe(100);
  });

  it("custom_amount tiene prioridad sobre split equitativo", () => {
    const data = makeBaseData();
    data.serviceMembers[0].custom_amount = 75;
    const [card] = buildPersonaCards(data);
    expect(card.services[0].amount_due).toBe(75);
  });

  it("total_debt = 0 cuando no hay pagos", () => {
    const [card] = buildPersonaCards(makeBaseData());
    expect(card.total_debt).toBe(0);
  });

  it("total_debt refleja deuda pendiente del miembro", () => {
    const payments: PaymentInput[] = [
      {
        id: "pay1",
        member_id: "m1",
        service_id: "s1",
        amount_due: 100,
        amount_paid: 0,
        accumulated_debt: 0,
        status: "pending",
        due_date: FUTURE,
        billing_cycles: { period_start: "2024-06-01" },
      },
    ];
    const [card] = buildPersonaCards(makeBaseData({ payments }));
    expect(card.total_debt).toBe(100);
  });

  it("total_debt = 0 cuando el pago está confirmado", () => {
    const payments: PaymentInput[] = [
      {
        id: "pay1",
        member_id: "m1",
        service_id: "s1",
        amount_due: 100,
        amount_paid: 100,
        accumulated_debt: 0,
        status: "confirmed",
        requires_confirmation: false,
        due_date: FUTURE,
        billing_cycles: { period_start: "2024-06-01" },
      },
    ];
    const [card] = buildPersonaCards(makeBaseData({ payments }));
    expect(card.total_debt).toBe(0);
  });

  it("available_credit se agrega por servicio del miembro", () => {
    const credits = [
      { member_id: "m1", service_id: "s1", amount_remaining: 50 },
      { member_id: "m1", service_id: "s1", amount_remaining: 30 }, // segundo crédito en mismo servicio
    ];
    const [card] = buildPersonaCards(makeBaseData({ credits }));
    expect(card.available_credit).toBe(80);
    expect(card.services[0].available_credit).toBe(80);
  });

  it("crédito de otro servicio no se mezcla", () => {
    const credits = [
      { member_id: "m1", service_id: "s99", amount_remaining: 200 }, // servicio inexistente
    ];
    const [card] = buildPersonaCards(makeBaseData({ credits }));
    expect(card.available_credit).toBe(0);
    expect(card.services[0].available_credit).toBe(0);
  });

  it("monthly_amount = suma de amount_due de todos los servicios del miembro", () => {
    // solo 1 servicio con amount_due = 100 (split equitativo con 1 miembro)
    const [card] = buildPersonaCards(makeBaseData());
    expect(card.monthly_amount).toBe(100);
  });

  it("status del servicio viene de computePaymentSummaries", () => {
    const payments: PaymentInput[] = [
      {
        id: "pay1",
        member_id: "m1",
        service_id: "s1",
        amount_due: 100,
        amount_paid: 0,
        accumulated_debt: 0,
        status: "overdue",
        due_date: "2020-01-01",
        billing_cycles: { period_start: "2024-06-01" },
      },
    ];
    const [card] = buildPersonaCards(makeBaseData({ payments }));
    expect(card.services[0].status).toBe("overdue");
  });

  it("status null cuando no hay pagos para el servicio", () => {
    const [card] = buildPersonaCards(makeBaseData({ payments: [] }));
    expect(card.services[0].status).toBeNull();
  });

  it("múltiples miembros generan cards independientes", () => {
    const data = {
      members: [
        {
          id: "m1",
          name: "Ana",
          email: null,
          phone: null,
          avatar_url: null,
          profile_id: null,
        },
        {
          id: "m2",
          name: "Bob",
          email: null,
          phone: null,
          avatar_url: null,
          profile_id: null,
        },
      ],
      serviceMembers: [
        {
          member_id: "m1",
          service_id: "s1",
          custom_amount: null,
          is_active: true,
        },
        {
          member_id: "m2",
          service_id: "s1",
          custom_amount: null,
          is_active: true,
        },
      ],
      payments: [] as PaymentInput[],
      services: [
        {
          id: "s1",
          name: "Netflix",
          color: "#e50914",
          icon_url: null,
          monthly_cost: 300,
        },
      ],
      credits: [],
    };
    const cards = buildPersonaCards(data);
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.name)).toEqual(["Ana", "Bob"]);
    // Con 2 miembros el split equitativo es 300 / (2+1) = 100
    expect(cards[0].services[0].amount_due).toBe(100);
  });
});
