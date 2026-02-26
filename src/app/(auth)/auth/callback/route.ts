import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Upsert profile from auth user data
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? "",
            display_name:
              user.user_metadata?.display_name ??
              user.user_metadata?.full_name ??
              user.email?.split("@")[0] ??
              "Usuario",
            avatar_url: user.user_metadata?.avatar_url ?? null,
            currency: "MXN",
          },
          { onConflict: "id" },
        );

        // Auto-link personas created by owners using this email.
        if (user.email) {
          await supabase
            .from("personas")
            .update({
              profile_id: user.id,
              link_attempted: true,
            })
            .ilike("email", user.email)
            .is("profile_id", null);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
