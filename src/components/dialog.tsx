"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { InertBackground } from "../lib/inert-background";
import type { Slots } from "../lib/slots";
import { useRivoContext } from "../provider/rivo-provider";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export type DialogContentProps = ComponentProps<typeof BaseDialog.Popup> & {
  children: ReactNode;
  /**
   * Classe por parte: `backdrop`. A tarja e irma do painel dentro do portal,
   * entao nem `className` nem variante de descendente alcancam ela.
   */
  classNames?: Slots<"backdrop">;
};

export function DialogContent({ className, children, classNames, ...props }: DialogContentProps) {
  const { portalContainer } = useRivoContext();

  return (
    <BaseDialog.Portal container={portalContainer ?? undefined}>
      <BaseDialog.Backdrop
        className={cn(
          "fixed inset-0 z-[var(--rc-z-overlay)] bg-overlay",
          "transition-opacity duration-[var(--rc-duration-base)] ease-[var(--rc-ease)]",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          classNames?.backdrop,
        )}
      />
      <BaseDialog.Popup
        {...props}
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--rc-z-dialog)] w-[min(32rem,calc(100vw-2rem))]",
          "-translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-border bg-surface p-[var(--rc-pad-panel)] shadow-3",
          "font-sans text-fg outline-none",
          "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full",
          "max-sm:translate-x-0 max-sm:translate-y-0",
          "max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0",
          className,
        )}
      >
        {children}
      </BaseDialog.Popup>

      <InertBackground container={portalContainer} />
    </BaseDialog.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      {...props}
      className={cn(
        "font-display text-xl leading-[var(--rc-leading-tight)] tracking-display text-fg",
        className,
      )}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description {...props} className={cn("mt-2 text-base text-fg-muted", className)} />
  );
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "mt-6 flex items-center justify-end gap-3",
        "max-sm:flex-col-reverse max-sm:[&>*]:w-full",
        className,
      )}
    />
  );
}
