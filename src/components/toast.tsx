"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { useEffect, useMemo, useRef, type ComponentProps, type RefObject } from "react";

import { cn } from "../lib/cn";
import { focusIsLost } from "../lib/focus";

type Manager = ReturnType<typeof BaseToast.useToastManager>;

export type ToastApi = {
  add: Manager["add"];
  update: Manager["update"];
  close: Manager["close"];
  promise: Manager["promise"];
};

export function useToast(): ToastApi {
  const manager = BaseToast.useToastManager();
  const current = useRef(manager);
  current.current = manager;

  return useMemo<ToastApi>(
    () => ({
      add: (options) => current.current.add(options),
      update: (id, options) => current.current.update(id, options),
      close: (id) => current.current.close(id),
      promise: (promessa, estados) => current.current.promise(promessa, estados),
    }),
    [],
  );
}

function XisIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

const ANCHOR: Record<ToastPosition, string> = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
};

const ENTER: Record<ToastPosition, string> = {
  "top-left": "data-[starting-style]:-translate-x-4 data-[ending-style]:-translate-x-4",
  "top-center": "data-[starting-style]:-translate-y-4 data-[ending-style]:-translate-y-4",
  "top-right": "data-[starting-style]:translate-x-4 data-[ending-style]:translate-x-4",
  "bottom-left": "data-[starting-style]:-translate-x-4 data-[ending-style]:-translate-x-4",
  "bottom-center": "data-[starting-style]:translate-y-4 data-[ending-style]:translate-y-4",
  "bottom-right": "data-[starting-style]:translate-x-4 data-[ending-style]:translate-x-4",
};

const TOM: Record<string, string> = {
  info: "bg-info-subtle text-info-text",
  success: "bg-success-subtle text-success-text",
  warning: "bg-warning-subtle text-warning-text",
  danger: "bg-danger-subtle text-danger-text",
  error: "bg-danger-subtle text-danger-text",
};

const NEUTRO = "bg-surface-raised text-fg";

function List({
  position,
  viewport,
  cameFrom,
  dismiss,
}: {
  position: ToastPosition;
  viewport: RefObject<HTMLDivElement | null>;
  cameFrom: RefObject<Element | null>;
  dismiss: string;
}) {
  const { toasts } = BaseToast.useToastManager();
  const closing = useRef<string | null>(null);

  useEffect(() => {
    const id = closing.current;
    if (id === null || toasts.some((toast) => toast.id === id)) return;
    closing.current = null;
    if (!focusIsLost(document.activeElement)) return;

    const neighbor = viewport.current?.querySelector<HTMLElement>(
      ":not([data-limited]) > [data-rc-toast-close]",
    );
    const back = cameFrom.current;
    if (neighbor) neighbor.focus();
    else if (back instanceof HTMLElement && !focusIsLost(back)) back.focus();
    else viewport.current?.focus();
  }, [toasts, viewport, cameFrom]);

  return toasts.map((toast) => (
    <BaseToast.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "relative flex items-start gap-3 rounded-lg border border-border",
        "p-4 shadow-3 font-sans",
        TOM[toast.type ?? ""] ?? NEUTRO,
        "transition-[opacity,translate] duration-[var(--rc-duration-base)]",
        "ease-[var(--rc-ease)]",
        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        "data-[limited]:hidden",
        ENTER[position],
      )}
    >
      <BaseToast.Content className="flex min-w-0 flex-col gap-1">
        <BaseToast.Title className="text-base font-rc-medium" />
        <BaseToast.Description className="text-sm text-fg-muted" />
      </BaseToast.Content>
      <BaseToast.Close
        aria-label={dismiss}
        data-rc-toast-close=""
        onClick={(event) => {
          if (event.currentTarget === document.activeElement) closing.current = toast.id;
        }}
        className={cn(
          "relative ml-auto shrink-0 rounded-sm p-1 text-fg-subtle outline-none",
          "after:absolute after:-inset-1",
          "transition-colors duration-[var(--rc-duration-fast)] ease-rc-effects",
          "hover:text-fg focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <XisIcon />
      </BaseToast.Close>
    </BaseToast.Root>
  ));
}

export type ToastViewportProps = ComponentProps<typeof BaseToast.Viewport> & {
  /** Onde o portal ancora. O RivoProvider passa o container que leva o tema. */
  container: HTMLElement | null;
  /**
   * Onde os avisos aparecem. Padrao `bottom-right`, que e o canto que menos
   * disputa com o conteudo: cabecalho, titulo e acao principal moram em cima.
   *
   * Vale mudar quando o aviso responde a uma acao que acontece longe dali, ou
   * quando o proprio canto ja esta ocupado por outra coisa fixa.
   */
  position?: ToastPosition;
  /**
   * Os textos da peca, para trocar o idioma: `dismiss` e o nome do xis de cada
   * aviso, "Fechar aviso" sem ele. Pelo `RivoProvider`, e o `toastLabels`.
   */
  labels?: Partial<ToastLabels>;
};

export type ToastLabels = {
  dismiss: string;
};

export function ToastViewport({
  className,
  container,
  position = "bottom-right",
  labels,
  onFocus,
  ...props
}: ToastViewportProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const cameFrom = useRef<Element | null>(null);

  return (
    <BaseToast.Portal container={container ?? undefined}>
      <BaseToast.Viewport
        {...props}
        ref={viewport}
        onFocus={(event) => {
          onFocus?.(event);
          const from = event.relatedTarget;
          if (from instanceof Element && !event.currentTarget.contains(from))
            cameFrom.current = from;
        }}
        className={cn(
          "fixed z-[var(--rc-z-toast)]",
          ANCHOR[position],
          "flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 outline-none",
          className,
        )}
      >
        <List
          position={position}
          viewport={viewport}
          cameFrom={cameFrom}
          dismiss={labels?.dismiss ?? "Fechar aviso"}
        />
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}

export const ToastProvider = BaseToast.Provider;
