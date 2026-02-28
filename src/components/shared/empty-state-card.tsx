import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  iconContainerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function EmptyStateCard({
  icon,
  title,
  description,
  className,
  iconContainerClassName,
  titleClassName,
  descriptionClassName,
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/20 p-12 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-500/10",
          iconContainerClassName,
        )}
      >
        {icon}
      </div>
      <h3 className={cn("mb-1 text-sm font-medium text-white", titleClassName)}>
        {title}
      </h3>
      <p
        className={cn(
          "mx-auto max-w-xs text-xs text-neutral-500",
          descriptionClassName,
        )}
      >
        {description}
      </p>
    </div>
  );
}
