"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export type DialogContentProps = ComponentProps<typeof BaseDialog.Popup> & {
  children: ReactNode;
};

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { portalContainer } = useRivoContext();

  return (
    // A Portal da Base UI trata `container={null}` como "nao renderize nada" e
    // `undefined` como "renderize no body". O container do Provider so existe
    // depois do primeiro efeito, entao sem o `?? undefined` o dialogo sumiria
    // na primeira renderizacao.
    <BaseDialog.Portal container={portalContainer ?? undefined}>
      <BaseDialog.Backdrop
        className={cn(
          "fixed inset-0 z-[var(--rc-z-overlay)] bg-overlay",
          "transition-opacity duration-[var(--rc-duration-base)] ease-[var(--rc-ease)]",
        )}
      />
      <BaseDialog.Popup
        {...props}
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--rc-z-dialog)] w-[min(32rem,calc(100vw-2rem))]",
          "-translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-border bg-surface p-6 shadow-3",
          "font-sans text-fg outline-none",
          // No celular ele encosta embaixo e ocupa a largura toda, que e onde
          // o polegar alcanca. Centralizado, sobra tarja de fundo dos dois
          // lados e o conteudo fica espremido no meio da tela.
          "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full",
          "max-sm:translate-x-0 max-sm:translate-y-0",
          "max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0",
          className,
        )}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      {...props}
      className={cn("font-display text-xl leading-[var(--rc-leading-tight)] text-fg", className)}
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
  return <div {...props} className={cn("mt-6 flex items-center justify-end gap-3", className)} />;
}
