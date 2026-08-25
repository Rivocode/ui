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
  const current = useRef(gerenciador);
  current.current = gerenciador;

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

/** Onde a area de avisos encosta na janela. */
const ANCHOR: Record<ToastPosition, string> = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
};

/**
 * De onde o aviso entra, e para onde sai.
 *
 * Sempre pela borda mais proxima. Um aviso ancorado a esquerda que desliza da
 * direita atravessa a tela inteira para chegar ao lugar, e o olho segue o
 * movimento errado ate perceber que o texto ja estava la.
 */
const ENTER: Record<ToastPosition, string> = {
  "top-left": "data-[starting-style]:-translate-x-4 data-[ending-style]:-translate-x-4",
  "top-center": "data-[starting-style]:-translate-y-4 data-[ending-style]:-translate-y-4",
  "top-right": "data-[starting-style]:translate-x-4 data-[ending-style]:translate-x-4",
  "bottom-left": "data-[starting-style]:-translate-x-4 data-[ending-style]:-translate-x-4",
  "bottom-center": "data-[starting-style]:translate-y-4 data-[ending-style]:translate-y-4",
  "bottom-right": "data-[starting-style]:translate-x-4 data-[ending-style]:translate-x-4",
};

function List({ position }: { position: ToastPosition }) {
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
        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        ENTER[position],
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
  /**
   * Onde os avisos aparecem. Padrao `bottom-right`, que e o canto que menos
   * disputa com o conteudo: cabecalho, titulo e acao principal moram em cima.
   *
   * Vale mudar quando o aviso responde a uma acao que acontece longe dali, ou
   * quando o proprio canto ja esta ocupado por outra coisa fixa.
   */
  position?: ToastPosition;
};

/**
 * A area onde os avisos aparecem.
 *
 * Montada pelo RivoProvider, entao raramente e usada direto. Para escolher o
 * canto, passe `toastPosition` ao provider.
 */
export function ToastViewport({ container, position = "bottom-right" }: ToastViewportProps) {
  return (
    <BaseToast.Portal container={container ?? undefined}>
      <BaseToast.Viewport
        className={cn(
          "fixed z-[var(--rc-z-toast)]",
          ANCHOR[position],
          "flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 outline-none",
        )}
      >
        <List position={position} />
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}

export const ToastProvider = BaseToast.Provider;
