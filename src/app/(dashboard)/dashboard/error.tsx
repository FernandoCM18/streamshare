"use client";

import { SectionError } from "@/components/shared/section-error";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError
      reset={reset}
      message="No pudimos cargar el dashboard. Intenta de nuevo."
    />
  );
}
