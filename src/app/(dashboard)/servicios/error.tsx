"use client";

import { SectionError } from "@/components/shared/section-error";

export default function ServiciosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError
      reset={reset}
      message="No pudimos cargar los servicios. Intenta de nuevo."
    />
  );
}
