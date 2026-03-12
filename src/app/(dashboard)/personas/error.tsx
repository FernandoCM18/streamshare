"use client";

import { SectionError } from "@/components/shared/section-error";

export default function PersonasError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError
      reset={reset}
      message="No pudimos cargar las personas. Intenta de nuevo."
    />
  );
}
