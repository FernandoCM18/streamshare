import { getRequiredUser } from "@/lib/auth/user";
import { getCachedServices, getCachedPersonasData } from "@/lib/queries";
import { ServiciosClient } from "./servicios-client";

export default async function ServiciosPage() {
  const user = await getRequiredUser();

  const [services, personasData] = await Promise.all([
    getCachedServices(user.id),
    getCachedPersonasData(user.id),
  ]);

  const members = personasData.members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
  }));

  return <ServiciosClient services={services} members={members} />;
}
