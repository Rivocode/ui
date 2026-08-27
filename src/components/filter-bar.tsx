"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { badgeVariants } from "./badge";
import { Button } from "./button";

function describe(label: string, value: ReactNode): string {
  return typeof value === "string" || typeof value === "number" ? `${label}: ${value}` : label;
}

function counted(total: number): string {
  return total === 1 ? "1 filtro" : `${total} filtros`;
}

function applied(total: number): string {
  return total === 0
    ? "Nenhum filtro aplicado"
    : `${counted(total)} aplicado${total === 1 ? "" : "s"}`;
}

export type FilterChipProps = ComponentPropsWithoutRef<"span"> & {
  /** O campo filtrado: "Cliente", "Vencimento". Sai em peso normal, a esquerda. */
  label: string;
  /** O que foi escolhido nesse campo. Sai em peso medio, e corta com reticencias quando passa de 10rem. */
  value?: ReactNode;
  /** O que acontece no xis. Sem ele nao ha xis: e assim que se mostra filtro que o app trava. */
  onRemove?: () => void;
  /** Trava o xis e apaga a ficha, para a consulta que refaz nao aceitar um segundo toque. */
  disabled?: boolean;
  /** As mesmas duas alturas do `Badge`. */
  size?: "sm" | "md";
  /** O que o leitor de tela ouve no xis. `remove` recebe "Cliente: Acme" quando o valor e texto, e so "Cliente" quando nao e. */
  labels?: { remove?: (filter: string) => string };
  /** Classe por parte: `label`, `value`, `remove`. */
  classNames?: Slots<"label" | "value" | "remove">;
};

export function FilterChip({
  label,
  value,
  onRemove,
  disabled,
  size = "md",
  labels = {},
  className,
  classNames,
  ...props
}: FilterChipProps) {
  const remove = labels.remove ?? ((filter: string) => `Remover filtro ${filter}`);
  const hasValue = value !== undefined && value !== null && value !== false;

  return (
    <span
      {...props}
      className={cn(
        badgeVariants({ size }),
        "max-w-full gap-1",
        onRemove && (size === "sm" ? "pe-1" : "pe-1.5"),
        disabled && "opacity-60",
        className,
      )}
    >
      <span className={cn("shrink-0", classNames?.label)}>{label}</span>

      {hasValue && (
        <span
          title={typeof value === "string" ? value : undefined}
          className={cn("min-w-0 max-w-40 truncate font-medium text-fg", classNames?.value)}
        >
          {value}
        </span>
      )}

      {onRemove && (
        <button
          type="button"
          aria-label={remove(describe(label, value))}
          disabled={disabled}
          onClick={onRemove}
          className={cn(
            "relative shrink-0 rounded-pill text-fg-subtle",
            "transition-colors duration-[var(--rc-duration-fast)] ease-rc hover:text-fg",
            "after:absolute after:-inset-1.5",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:text-fg-disabled",
            classNames?.remove,
          )}
        >
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

export type AppliedFilter = {
  /** Chave estavel do filtro, e o que identifica a ficha na fileira. */
  id: string;
  /** O campo filtrado: "Cliente". */
  label: string;
  /** O que foi escolhido: "Acme", "01/08 a 31/08". */
  value?: ReactNode;
  /** `false` tira o xis desta ficha: o filtro aparece, e sair dele nao e escolha de quem le. */
  removable?: boolean;
};

export type FilterBarProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** Os filtros de agora. A peca nao guarda lista propria nem conhece a consulta: ela mostra esta. */
  filters: AppliedFilter[];
  /** O filtro que saiu, com o objeto inteiro, quando o xis dele e apertado. */
  onRemove?: (filter: AppliedFilter) => void;
  /** Chamado quando o "limpar" e apertado, antes do `onFiltersChange`. */
  onClear?: () => void;
  /** Recebe o que sobrou, tanto no xis quanto no limpar. Sozinho ele ja basta. */
  onFiltersChange?: (filters: AppliedFilter[]) => void;
  /** O nome da fileira para o leitor de tela. */
  label?: string;
  /** Guarda a altura da linha quando nao ha filtro nenhum, para a tela nao pular quando o primeiro entra. `false` some com a linha e mantem so o aviso. */
  reserve?: boolean;
  /** A partir de quantos filtros o "limpar" aparece. Com `1` ele fica sempre, e com `Infinity` nunca. */
  clearFrom?: number;
  /** A altura das fichas. */
  size?: "sm" | "md";
  /** Trava todos os xis e o limpar, para a consulta que refaz nao aceitar um segundo toque. */
  disabled?: boolean;
  /** Os textos que a peca escreve: `remove` no xis, `clear` no botao de limpar, `status` na regiao viva e `empty` na linha guardada. */
  labels?: {
    remove?: (filter: string) => string;
    clear?: (total: number) => string;
    status?: (total: number) => string;
    empty?: ReactNode;
  };
  /** Classe por parte: `list`, `item`, `chip`, `clear`, `empty`. */
  classNames?: Slots<"list" | "item" | "chip" | "clear" | "empty">;
};

export function FilterBar({
  filters,
  onRemove,
  onClear,
  onFiltersChange,
  label = "Filtros aplicados",
  reserve = true,
  clearFrom = 2,
  size = "md",
  disabled,
  labels = {},
  className,
  classNames,
  ...props
}: FilterBarProps) {
  const total = filters.length;
  const status = labels.status ?? applied;
  const clear = labels.clear ?? ((count: number) => `Limpar ${counted(count)}`);
  const empty = labels.empty ?? applied(0);

  const listRef = useRef<HTMLUListElement>(null);
  const rtl = useDirection() === "rtl";
  const [more, setMore] = useState({ before: false, after: false });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const hidden = list.scrollWidth - list.clientWidth;
      const before = rtl ? hidden + list.scrollLeft : list.scrollLeft;
      const next = { before: before > 1, after: hidden - before > 1 };

      setMore((current) =>
        current.before === next.before && current.after === next.after ? current : next,
      );
    };

    measure();
    list.addEventListener("scroll", measure, { passive: true });

    const watcher = new ResizeObserver(measure);
    watcher.observe(list);
    for (const item of list.querySelectorAll("li")) watcher.observe(item);

    return () => {
      list.removeEventListener("scroll", measure);
      watcher.disconnect();
    };
  }, [filters, rtl]);

  const canRemove = Boolean(onRemove ?? onFiltersChange);
  const canClear = Boolean(onClear ?? onFiltersChange);
  const reachable = !disabled && canRemove && filters.some((filter) => filter.removable !== false);

  return (
    <div
      {...props}
      role="group"
      aria-label={label}
      className={cn(
        "flex w-full items-center gap-2 font-sans",
        (total > 0 || reserve) && "min-h-[var(--rc-control-sm)]",
        className,
      )}
    >
      {total === 0 ? (
        reserve && (
          <p aria-hidden="true" className={cn("text-sm text-fg-subtle", classNames?.empty)}>
            {empty}
          </p>
        )
      ) : (
        <ul
          ref={listRef}
          role="list"
          tabIndex={reachable ? undefined : 0}
          className={cn(
            "-my-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scroll-px-6 py-1",
            more.before && "mask-l-from-[calc(100%-1.5rem)] mask-l-to-100%",
            more.after && "mask-r-from-[calc(100%-1.5rem)] mask-r-to-100%",
            !reachable &&
              "rounded-md outline-none focus-visible:mask-none focus-visible:ring-2 focus-visible:ring-ring",
            classNames?.list,
          )}
        >
          {filters.map((filter) => (
            <li key={filter.id} className={cn("shrink-0", classNames?.item)}>
              <FilterChip
                label={filter.label}
                value={filter.value}
                size={size}
                disabled={disabled}
                labels={labels}
                className={classNames?.chip}
                onRemove={
                  filter.removable === false || !canRemove
                    ? undefined
                    : () => {
                        onRemove?.(filter);
                        onFiltersChange?.(filters.filter((other) => other.id !== filter.id));
                      }
                }
              />
            </li>
          ))}
        </ul>
      )}

      {total >= clearFrom && canClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => {
            onClear?.();
            onFiltersChange?.([]);
          }}
          className={cn("shrink-0", classNames?.clear)}
        >
          {clear(total)}
        </Button>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {status(total)}
      </div>
    </div>
  );
}
