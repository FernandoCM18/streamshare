import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-neutral-950 vertical-lines flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
