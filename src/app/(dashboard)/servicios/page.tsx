import { getRequiredUser } from "@/lib/auth/user";
import { getCachedServices, getCachedMembersList } from "@/lib/queries";
import { ServiciosClient } from "./servicios-client";

export default async function ServiciosPage() {
  const user = await getRequiredUser();

  const [services, members] = await Promise.all([
    getCachedServices(user.id),
    getCachedMembersList(user.id),
  ]);

  return <ServiciosClient services={services} members={members} />;
}
