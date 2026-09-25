"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";
import { focusIsLost } from "../lib/focus";
import type { Slots } from "../lib/slots";
import {
  BATCH_ACTIONS,
  CLEAR_SELECTION,
  SELECTION_CLEARED,
  selectedLabel,
} from "../shared/selection";
import { Button } from "./button";

const POSITION = {
  sticky: "sticky bottom-4",
  fixed:
    "pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] px-4",
} as const;

export type ActionBarProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /**
   * Quantos itens estao selecionados. Acima de zero a barra entra e diz o
   * numero; em zero ela sai. E o `length` do `value` do `DataTable`.
   */
  count: number;
  /**
   * As acoes do lote, depois da contagem. Use `Button` `size="sm"`, e deixe a
   * destrutiva por ultimo.
   */
  children?: ReactNode;
  /**
   * Liga o "Limpar seleção" no fim da barra. Quem zera a selecao e quem
   * chamou: a barra nao guarda estado nenhum.
   */
  onClear?: () => void;
  /**
   * `sticky` gruda no pe da area que a contem e ocupa lugar embaixo dela
   * enquanto esta aberta; `fixed` gruda no pe da janela, acima da area segura
   * do celular, e nao ocupa lugar nenhum.
   */
  position?: "sticky" | "fixed";
  /**
   * Para onde o foco vai quando a barra sai com ele dentro - depois do
   * "Limpar seleção", ou de uma acao que zera a selecao. Sem ele, o foco volta
   * para onde estava antes de entrar na barra (o checkbox da ultima linha
   * marcada, quase sempre) e, se aquilo sumiu, fica na raiz da barra.
   */
  finalFocus?: RefObject<HTMLElement | null>;
  /**
   * Os textos da barra. `selected` recebe a contagem e devolve a frase, para
   * quem quer nomear o item: `(n) => n === 1 ? "1 nota selecionada" : ...`.
   * `region` e o nome da regiao, `clear` o do botao e `cleared` o que se
   * ouve quando a selecao zera.
   */
  labels?: {
    selected?: (count: number) => string;
    clear?: string;
    region?: string;
    cleared?: string;
  };
  /** Classe por parte: `bar` (o painel), `count`, `actions` e `clear`. */
  classNames?: Slots<"bar" | "count" | "actions" | "clear">;
};

export function ActionBar({
  count,
  children,
  onClear,
  position = "sticky",
  finalFocus,
  labels = {},
  className,
  classNames,
  ...props
}: ActionBarProps) {
  const open = count > 0;
  const say = labels.selected ?? selectedLabel;

  const [lastCount, setLastCount] = useState(count);
  const [wasOpen, setWasOpen] = useState(open);
  if (open && count !== lastCount) setLastCount(count);
  if (open && !wasOpen) setWasOpen(true);

  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (open) return;
    const active = document.activeElement;
    if (!active || !bar.current?.contains(active)) return;
    const back = origin.current && !focusIsLost(origin.current) ? origin.current : null;
    (finalFocus?.current ?? back ?? root.current)?.focus({ preventScroll: true });
  }, [open, finalFocus]);

  const announcement = open ? say(count) : wasOpen ? (labels.cleared ?? SELECTION_CLEARED) : "";

  return (
    <div
      {...props}
      ref={root}
      tabIndex={-1}
      data-open={open || undefined}
      data-position={position}
      className={cn(
        POSITION[position],
        "z-[var(--rc-z-sticky)] grid font-sans",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "transition-[grid-template-rows]",
        open
          ? "grid-rows-[1fr] duration-[var(--rc-duration-base)] ease-rc-enter"
          : "grid-rows-[0fr] duration-[var(--rc-duration-fast)] ease-rc-exit",
        className,
      )}
    >
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="min-h-0">
        <div
          ref={bar}
          role="region"
          aria-label={labels.region ?? BATCH_ACTIONS}
          inert={!open}
          onFocus={(event) => {
            const from = event.relatedTarget;
            if (from instanceof HTMLElement && !bar.current?.contains(from)) origin.current = from;
          }}
          className={cn(
            "pointer-events-auto mx-auto flex w-full flex-wrap items-center gap-x-3 gap-y-2",
            "rounded-lg border border-border bg-surface-raised text-fg shadow-3",
            "px-3 py-2 sm:w-fit sm:max-w-[calc(100%-2rem)]",
            "transition-[opacity,translate,visibility]",
            open
              ? "visible translate-y-0 opacity-100 duration-[var(--rc-duration-base)] ease-rc-enter"
              : "invisible translate-y-2 opacity-0 duration-[var(--rc-duration-fast)] ease-rc-exit",
            classNames?.bar,
          )}
        >
          <span
            className={cn(
              "shrink-0 px-1 text-sm font-rc-medium whitespace-nowrap tabular-nums",
              classNames?.count,
            )}
          >
            {say(open ? count : lastCount)}
          </span>

          {children !== undefined && children !== null && (
            <div
              className={cn(
                "flex min-w-0 flex-wrap items-center gap-2 border-border max-sm:order-last max-sm:w-full sm:border-l sm:pl-3",
                "[&>button]:h-auto [&>button]:min-h-[var(--rc-control-sm)] [&>button]:max-w-full",
                "[&>button]:shrink [&>button]:py-1 [&>button]:whitespace-normal",
                classNames?.actions,
              )}
            >
              {children}
            </div>
          )}

          {onClear && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClear}
              className={cn(
                "ml-auto h-auto min-h-[var(--rc-control-sm)] max-w-full shrink py-1 whitespace-normal",
                classNames?.clear,
              )}
            >
              {labels.clear ?? CLEAR_SELECTION}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
