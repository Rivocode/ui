"use client";

import type { ComponentProps, ReactElement, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useMobile } from "../lib/screen";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Sheet, SheetContent, SheetHandle, SheetTrigger } from "./sheet";

export type CalendarPanelProps = Omit<ComponentProps<"div">, "title" | "children"> & {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** The element that opens it. The same in both formats. */
  trigger: ReactElement;
  /** Title read on the phone, where the panel becomes a sheet and loses its context. */
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  align?: "start" | "end";
  /**
   * Dresses the shell, whichever one the breakpoint is showing: the sheet on the
   * phone and the anchored panel on desktop. It is one shell at a time, so the
   * same class does not leak into the other.
   */
  className?: string;
};

export function CalendarPanel({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  footer,
  align = "start",
  className,
  ...rest
}: CalendarPanelProps) {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <Sheet side="bottom" open={open} onOpenChange={onOpenChange}>
        <SheetTrigger render={trigger} />
        <SheetContent className={cn("p-4", className)} aria-label={title} {...rest}>
          <SheetHandle />
          <div className="flex justify-center">{children}</div>
          {footer && <div className="mt-4 border-t border-border pt-4">{footer}</div>}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        align={align}
        className={cn("w-auto min-w-0 p-3", className)}
        aria-label={title}
        {...rest}
      >
        {children}
        {footer && <div className="mt-3 border-t border-border pt-3">{footer}</div>}
      </PopoverContent>
    </Popover>
  );
}

export function CalendarPanelFooter({
  className,
  ...props
}: { className?: string } & { children: ReactNode }) {
  return <div {...props} className={cn("flex items-center justify-between gap-3", className)} />;
}
