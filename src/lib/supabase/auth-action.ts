import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

interface AuthResult {
  supabase: SupabaseClient;
  user: User;
}

/**
 * Get an authenticated Supabase client and user.
 * Returns the client/user pair or throws a descriptive error string.
 * Use in server actions with try/catch or the `withAuth` pattern.
 */
export async function getAuthenticatedClient(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}
