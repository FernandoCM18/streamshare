import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  badgeClass: string;
  label: string;
  icon?: string;
  dotClass?: string;
  className?: string;
}

export function StatusBadge({
  badgeClass,
  label,
  icon,
  dotClass,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 border",
        badgeClass,
        className,
      )}
    >
      {dotClass && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
      )}
      {icon && !dotClass && <Icon icon={icon} width={10} />}
      {label}
    </span>
  );
}
