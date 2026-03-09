"use client";

import { cn } from "@/lib/utils";

// ── Filter Chips ──────────────────────────────────────────────

interface FilterChip {
  label: string;
  value: string;
  icon?: React.ReactNode;
  count?: number;
}

interface FilterChipsProps {
  chips: FilterChip[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterChips({
  chips,
  value,
  onChange,
  className,
}: FilterChipsProps) {
  return (
    <div className="max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div
        className={cn(
          "inline-flex min-w-max items-center gap-1 p-1 rounded-xl bg-neutral-900/40 border border-neutral-800/60",
          className,
        )}
      >
        {chips.map((chip) => {
          const isActive = chip.value === value;
          return (
            <button
              key={chip.value}
              onClick={() => onChange(chip.value)}
              className={cn(
                "relative shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200",
                isActive
                  ? "bg-neutral-800 text-white shadow-sm shadow-black/20"
                  : "text-neutral-500 hover:text-neutral-300",
              )}
            >
              <span className="flex items-center gap-1.5">
                {chip.icon}
                {chip.label}
                {chip.count !== undefined && (
                  <span
                    className={cn(
                      "text-[9px] min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full font-semibold tabular-nums",
                      isActive
                        ? "bg-neutral-700 text-neutral-300"
                        : "bg-neutral-800/80 text-neutral-600",
                    )}
                  >
                    {chip.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
