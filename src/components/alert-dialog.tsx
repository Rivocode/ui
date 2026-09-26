"use client";

import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { InertBackground } from "../lib/inert-background";
import {
  layerLevel,
  layerStyle,
  LayerProvider,
  useLayerChain,
  useParentLayer,
} from "../lib/layer";
import type { Slots } from "../lib/slots";
import { useRivoContext } from "../provider/rivo-provider";

export const AlertDialog = BaseAlertDialog.Root;
export const AlertDialogTrigger = BaseAlertDialog.Trigger;
export const AlertDialogClose = BaseAlertDialog.Close;

export type AlertDialogContentProps = ComponentProps<typeof BaseAlertDialog.Popup> & {
  children: ReactNode;
  /**
   * Classe por parte: `backdrop`. A tarja e irma do painel dentro do portal,
   * entao nem `className` nem variante de descendente alcancam ela.
   */
  classNames?: Slots<"backdrop">;
};

export function AlertDialogContent({
  className,
  children,
  classNames,
  style,
  ...props
}: AlertDialogContentProps) {
  const { portalContainer } = useRivoContext();
  const parent = useParentLayer();
  const chain = useLayerChain();
  const level = layerLevel("dialog", parent, 2);

  return (
    <BaseAlertDialog.Portal container={portalContainer ?? undefined}>
      <BaseAlertDialog.Backdrop
        style={layerStyle("overlay", parent)}
        className={cn(
          "fixed inset-0 z-[var(--rc-z-overlay)] bg-overlay",
          "transition-opacity duration-[var(--rc-duration-base)] ease-rc",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          classNames?.backdrop,
        )}
      />
      <BaseAlertDialog.Popup
        {...props}
        data-rc-layer={level}
        style={layerStyle("dialog", parent, 2, style)}
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--rc-z-dialog)] w-[min(28rem,calc(100vw-2rem))]",
          "-translate-x-1/2 -translate-y-1/2",
          "flex max-h-[85dvh] flex-col overflow-y-auto overscroll-contain",
          "rounded-xl border border-border bg-surface p-[var(--rc-pad-panel)] shadow-3",
          "font-sans text-fg outline-none",
          "transition-[opacity,scale] duration-[var(--rc-duration-base)] ease-rc",
          "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
          "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
          "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full",
          "max-sm:translate-x-0 max-sm:translate-y-0",
          "max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0",
          className,
        )}
      >
        <LayerProvider level={level}>{children}</LayerProvider>
      </BaseAlertDialog.Popup>

      <InertBackground container={portalContainer} below={chain} />
    </BaseAlertDialog.Portal>
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: ComponentProps<typeof BaseAlertDialog.Title>) {
  return (
    <BaseAlertDialog.Title
      {...props}
      className={cn(
        "font-display font-rc-display text-xl leading-[var(--rc-leading-tight)] tracking-display text-fg",
        className,
      )}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof BaseAlertDialog.Description>) {
  return (
    <BaseAlertDialog.Description
      {...props}
      className={cn("mt-2 text-base text-fg-muted", className)}
    />
  );
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
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
