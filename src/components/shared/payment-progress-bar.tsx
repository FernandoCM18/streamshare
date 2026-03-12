interface PaymentProgressBarProps {
  percent: number;
  color: string;
  label: string;
}

export function PaymentProgressBar({
  percent,
  color,
  label,
}: PaymentProgressBarProps) {
  return (
    <div className="px-4 pt-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
          {percent}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background:
              percent === 100
                ? "linear-gradient(90deg, #34d399, #10b981)"
                : `linear-gradient(90deg, ${color}cc, ${color})`,
          }}
        />
      </div>
    </div>
  );
}
