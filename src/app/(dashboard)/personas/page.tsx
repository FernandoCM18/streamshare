import { getRequiredUser } from "@/lib/auth/user";
import { getCachedPersonasData } from "@/lib/queries";
import { PersonasClient } from "./personas-client";
import { buildPersonaCards } from "@/lib/build-persona-cards";

export default async function PersonasPage() {
  const user = await getRequiredUser();
  const personasData = await getCachedPersonasData(user.id);

  const personas = buildPersonaCards(personasData);

  return <PersonasClient personas={personas} />;
}
