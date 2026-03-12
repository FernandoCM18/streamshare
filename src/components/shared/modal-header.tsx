import type { ReactNode } from "react";
import { Icon } from "@iconify/react";
import { DialogClose, DialogTitle } from "@/components/ui/dialog";
import { ServiceIconBox } from "./service-icon-box";

interface ModalHeaderProps {
  color: string;
  iconUrl: string | null;
  title: string;
  badge?: ReactNode;
  subtitle?: ReactNode;
  onClose?: () => void;
}

export function ModalHeader({
  color,
  iconUrl,
  title,
  badge,
  subtitle,
}: ModalHeaderProps) {
  return (
    <div className="relative shrink-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, transparent 60%)`,
        }}
      />
      <div className="relative sm:px-6 flex bg-neutral-950/60 border-neutral-800/80 border-b pt-3 pr-5 pb-4 pl-5 sm:pt-5 backdrop-blur-xl items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <ServiceIconBox
            iconUrl={iconUrl}
            color={color}
            size="lg"
            className="bg-black/80 border-neutral-700/50"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-lg font-bold text-white tracking-tight">
                {title}
              </DialogTitle>
              {badge}
            </div>
            {subtitle && (
              <div className="mt-1.5 flex items-center gap-2 text-[13px] text-neutral-400">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <DialogClose className="w-8 h-8 flex items-center justify-center rounded-xl bg-neutral-800/60 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-700/60 hover:border-neutral-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70 shrink-0 mt-0.5">
          <Icon icon="solar:close-square-linear" width={15} />
        </DialogClose>
      </div>
    </div>
  );
}
