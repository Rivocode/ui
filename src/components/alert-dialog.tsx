"use client";

import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";

export const AlertDialog = BaseAlertDialog.Root;
export const AlertDialogTrigger = BaseAlertDialog.Trigger;
export const AlertDialogClose = BaseAlertDialog.Close;

export type AlertDialogContentProps = ComponentProps<typeof BaseAlertDialog.Popup> & {
  children: ReactNode;
};

/**
 * A confirmacao de coisa que nao volta atras: excluir, cancelar nota, sair sem
 * salvar.
 *
 * Parece o `Dialog` e nao e: este nao fecha com Esc nem com clique fora, e o
 * foco comeca no botao de cancelar. Quem esta prestes a apagar algo tem que
 * dizer que sim de proposito, e nao esbarrar num clique.
 */
export function AlertDialogContent({ className, children, ...props }: AlertDialogContentProps) {
  const { portalContainer } = useRivoContext();

  return (
    <BaseAlertDialog.Portal container={portalContainer ?? undefined}>
      <BaseAlertDialog.Backdrop
        className={cn(
          "fixed inset-0 z-[var(--rc-z-overlay)] bg-overlay",
          "transition-opacity duration-[var(--rc-duration-base)] ease-rc",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        )}
      />
      <BaseAlertDialog.Popup
        {...props}
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--rc-z-dialog)] w-[min(28rem,calc(100vw-2rem))]",
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
      </BaseAlertDialog.Popup>
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
      className={cn("font-display text-xl leading-[var(--rc-leading-tight)] tracking-display text-fg", className)}
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
        // No celular os botoes empilham e ficam de largura cheia: alvo grande e
        // ordem clara valem mais do que a linha bonita.
        "max-sm:flex-col-reverse max-sm:[&>*]:w-full",
        className,
      )}
    />
  );
}
