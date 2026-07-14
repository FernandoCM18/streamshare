"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

// Vaul bundles its own @radix-ui/react-dialog instance, so Radix Dialog
// subcomponents (Title/Close) crash inside a Vaul drawer. This context lets
// the Responsive* subcomponents pick the matching primitive. Default true
// keeps them working inside a plain Dialog (e.g. ModalHeader outside the wrapper).
const ResponsiveModalContext = createContext<boolean | null>(null);

function useIsDesktopModal() {
  return useContext(ResponsiveModalContext) ?? true;
}

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  children,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  return (
    <ResponsiveModalContext.Provider value={isDesktop}>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      ) : (
        <DrawerPrimitive.Root
          open={open}
          onOpenChange={onOpenChange}
          shouldScaleBackground={false}
          repositionInputs
        >
          {children}
        </DrawerPrimitive.Root>
      )}
    </ResponsiveModalContext.Provider>
  );
}

interface ResponsiveModalContentProps {
  className?: string;
  /** Desktop-only classes, e.g. "sm:max-w-2xl" */
  dialogClassName?: string;
  children: ReactNode;
}

const sharedContentClasses =
  "bg-neutral-950 border border-neutral-800/80 p-0 gap-0 flex flex-col overflow-hidden text-sm";

export function ResponsiveModalContent({
  className,
  dialogClassName,
  children,
}: ResponsiveModalContentProps) {
  const isDesktop = useIsDesktopModal();

  if (isDesktop) {
    return (
      <DialogContent
        showCloseButton={false}
        className={cn(
          sharedContentClasses,
          "shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90dvh] data-closed:slide-out-to-bottom-4 data-open:slide-in-from-bottom-4 duration-200",
          className,
          dialogClassName,
        )}
      >
        {children}
      </DialogContent>
    );
  }

  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 supports-backdrop-filter:backdrop-blur-md" />
      <DrawerPrimitive.Content
        className={cn(
          sharedContentClasses,
          "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl max-h-[calc(100dvh-2.5rem)] pb-safe outline-none",
          className,
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-neutral-700" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}

export function ResponsiveModalTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const isDesktop = useIsDesktopModal();
  if (isDesktop) return <DialogTitle className={className} {...props} />;
  return <DrawerPrimitive.Title className={className} {...props} />;
}

export function ResponsiveModalDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const isDesktop = useIsDesktopModal();
  if (isDesktop) return <DialogDescription className={className} {...props} />;
  return <DrawerPrimitive.Description className={className} {...props} />;
}

export function ResponsiveModalClose({
  className,
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  const isDesktop = useIsDesktopModal();
  if (isDesktop) return <DialogClose className={className} {...props} />;
  return <DrawerPrimitive.Close className={className} {...props} />;
}
