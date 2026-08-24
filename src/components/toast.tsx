"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { useMemo, useRef } from "react";

import { cn } from "../lib/cn";

type Gerenciador = ReturnType<typeof BaseToast.useToastManager>;

export type ToastApi = {
  add: Gerenciador["add"];
  update: Gerenciador["update"];
  close: Gerenciador["close"];
  promise: Gerenciador["promise"];
};

/**
 * Cria e fecha avisos. O provedor, o portal e a area de exibicao ja vivem
 * dentro do RivoProvider, entao usar isto e a unica coisa que o app faz.
 *
 * O objeto devolvido tem identidade estavel de proposito. O gerenciador da
 * Base UI devolve um objeto novo a cada renderizacao, e um `useEffect` que
 * dependa dele entra em laco infinito. Absorver isso e trabalho da biblioteca,
 * nao de quem a usa.
 */
export function useToast(): ToastApi {
  const gerenciador = BaseToast.useToastManager();
  const atual = useRef(gerenciador);
  atual.current = gerenciador;

  return useMemo<ToastApi>(
    () => ({
      add: (options) => atual.current.add(options),
      update: (id, options) => atual.current.update(id, options),
      close: (id) => atual.current.close(id),
      promise: (promessa, estados) => atual.current.promise(promessa, estados),
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

function Lista() {
  const { toasts } = BaseToast.useToastManager();

  return toasts.map((toast) => (
    <BaseToast.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "relative flex items-start gap-3 rounded-lg border border-border",
        "bg-surface-raised p-4 shadow-3 font-sans",
        "transition-[opacity,transform] duration-[var(--rc-duration-base)]",
        "ease-[var(--rc-ease)]",
        "data-[starting-style]:translate-x-4 data-[starting-style]:opacity-0",
        "data-[ending-style]:translate-x-4 data-[ending-style]:opacity-0",
      )}
    >
      <BaseToast.Content className="flex min-w-0 flex-col gap-1">
        <BaseToast.Title className="text-base font-medium text-fg" />
        <BaseToast.Description className="text-sm text-fg-muted" />
      </BaseToast.Content>
      <BaseToast.Close
        aria-label="Fechar aviso"
        className={cn(
          "ml-auto shrink-0 rounded-sm p-1 text-fg-subtle outline-none",
          "transition-colors duration-[var(--rc-duration-fast)]",
          "hover:text-fg focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <XisIcon />
      </BaseToast.Close>
    </BaseToast.Root>
  ));
}

export type ToastViewportProps = {
  container: HTMLElement | null;
};

/** Montado pelo RivoProvider. Nao precisa ser usado direto. */
export function ToastViewport({ container }: ToastViewportProps) {
  return (
    <BaseToast.Portal container={container ?? undefined}>
      <BaseToast.Viewport
        className={cn(
          "fixed right-4 bottom-4 z-[var(--rc-z-toast)]",
          "flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 outline-none",
        )}
      >
        <Lista />
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}

export const ToastProvider = BaseToast.Provider;
