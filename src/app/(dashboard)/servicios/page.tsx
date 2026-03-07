import type { Metadata } from "next";
import { getRequiredUser } from "@/lib/auth/user";

export const metadata: Metadata = {
  title: "Servicios",
};
import {
  getCachedServices,
  getCachedPersonasData,
  getCachedPayments,
} from "@/lib/queries";
import { ServiciosClient } from "./servicios-client";

export default async function ServiciosPage() {
  const user = await getRequiredUser();

  const [services, personasData, payments] = await Promise.all([
    getCachedServices(user.id),
    getCachedPersonasData(user.id),
    getCachedPayments(user.id),
  ]);

  const members = personasData.members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
  }));

  return (
    <ServiciosClient
      services={services}
      members={members}
      payments={payments}
    />
  );
}
