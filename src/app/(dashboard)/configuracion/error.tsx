"use client";

import { SectionError } from "@/components/shared/section-error";

export default function ConfiguracionError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError
      reset={reset}
      message="No pudimos cargar la configuracion. Intenta de nuevo."
    />
  );
}
