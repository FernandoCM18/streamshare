import { getRequiredUser } from "@/lib/auth/user";
import { getCachedMyPayments } from "@/lib/queries";
import { MisPagosClient } from "./mis-pagos-client";

export default async function MisPagosPage() {
  const user = await getRequiredUser();
  const payments = await getCachedMyPayments(user.id);

  return <MisPagosClient payments={payments} />;
}
