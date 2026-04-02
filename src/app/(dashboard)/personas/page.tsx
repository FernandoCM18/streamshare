import type { Metadata } from "next";
import { getRequiredUser } from "@/lib/auth/user";

export const metadata: Metadata = {
  title: "Personas",
};
import { getCachedPersonasData } from "@/lib/queries";
import { PersonasClient } from "./personas-client";
import { buildPersonaCards } from "@/lib/build-persona-cards";
import type { PersonaPayment } from "@/types/database";

export default async function PersonasPage() {
  const user = await getRequiredUser();
  const personasData = await getCachedPersonasData(user.id);

  const personas = buildPersonaCards(personasData);

  return (
    <PersonasClient
      personas={personas}
      payments={personasData.payments as unknown as PersonaPayment[]}
    />
  );
}
