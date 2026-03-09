import { PageTransition } from "@/components/dashboard/page-transition";

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
