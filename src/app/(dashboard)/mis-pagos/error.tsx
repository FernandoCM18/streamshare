"use client";

import { SectionError } from "@/components/shared/section-error";

export default function MisPagosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError
      reset={reset}
      message="No pudimos cargar tus pagos. Intenta de nuevo."
    />
  );
}
