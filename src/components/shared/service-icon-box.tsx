import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "w-10 h-10 rounded-xl", icon: 18, text: "text-lg" },
  md: { box: "w-12 h-12 rounded-xl", icon: 24, text: "text-xl" },
  lg: { box: "w-[52px] h-[52px] rounded-2xl", icon: 26, text: "text-2xl" },
} as const;

interface ServiceIconBoxProps {
  iconUrl: string | null;
  color: string;
  size?: keyof typeof sizes;
  inactive?: boolean;
  className?: string;
}

export function ServiceIconBox({
  iconUrl,
  color,
  size = "md",
  inactive = false,
  className,
}: ServiceIconBoxProps) {
  const s = sizes[size];

  return (
    <div
      className={cn(
        s.box,
        "border flex items-center justify-center shadow-lg shrink-0",
        inactive
          ? "bg-neutral-900 border-neutral-800 grayscale group-hover:grayscale-0"
          : "bg-black border-neutral-800",
        className,
      )}
      style={{
        boxShadow: inactive
          ? undefined
          : `0 4px ${size === "lg" ? "20px" : "14px"} ${color}${size === "lg" ? "26" : "1a"}${size === "lg" ? `, 0 0 0 1px ${color}10` : ""}`,
      }}
    >
      {iconUrl ? (
        iconUrl.includes(":") ? (
          <Icon
            icon={iconUrl}
            width={s.icon}
            style={{ color: inactive ? undefined : color }}
            className={cn(inactive && "text-neutral-500")}
          />
        ) : (
          <span className={cn(s.text, "leading-none")}>{iconUrl}</span>
        )
      ) : (
        <Icon
          icon="solar:tv-bold"
          width={s.icon}
          style={{ color: inactive ? undefined : color }}
          className={cn(inactive && "text-neutral-500")}
        />
      )}
    </div>
  );
}
