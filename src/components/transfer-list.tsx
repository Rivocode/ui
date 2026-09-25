"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";
import { focusIsLost } from "../lib/focus";
import type { Slots } from "../lib/slots";
import { matchesSearch } from "../shared/highlight";
import {
  OTHER_SIDE,
  TRANSFER_EMPTY,
  TRANSFER_NO_RESULTS,
  TRANSFER_SEARCH,
  TRANSFER_TITLES,
  moveAllLabel,
  moveSelectedLabel,
  searchInLabel,
  transferCount,
  transferMove,
  transferMoved,
  transferSides,
  type TransferListItem,
  type TransferSide,
} from "../shared/transfer";
import { IconButton } from "./icon-button";
import { SearchInput } from "./search-input";

export type { TransferListItem } from "../shared/transfer";

export type TransferListLabels = {
  /** O titulo da lista de onde se escolhe. Padrao: "Disponíveis". */
  available?: string;
  /** O titulo da lista do que foi escolhido. Padrao: "Escolhidos". */
  chosen?: string;
  /** O que aparece na lista sem item nenhum. Padrao: "Nenhum item". */
  empty?: string;
  /** O que aparece quando a busca nao acha nada. Padrao: "Nada encontrado". */
  noResults?: string;
  /** O texto de espera dentro da busca. Padrao: "Buscar". */
  search?: string;
  /** A contagem do cabecalho: "10 itens", ou "3 de 10 selecionados" com marcados. */
  count?: (selected: number, total: number) => string;
  /** O que se ouve depois de mover: "3 itens movidos para Escolhidos". */
  moved?: (count: number, to: string) => string;
};

export type TransferListProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "defaultValue" | "onChange"
> & {
  /** Todos os itens, dos dois lados. A ordem daqui e a da lista de disponiveis. */
  items: TransferListItem[];
  /**
   * Os `value` dos escolhidos, na ordem em que aparecem na lista da direita.
   * Quem move acrescenta no fim, na ordem de `items`.
   */
  value: string[];
  /** Recebe o `value` novo a cada movimento. A peca nao guarda o escolhido. */
  onValueChange: (value: string[]) => void;
  /** Liga a busca no topo de cada lista, sem acento importar. Padrao: ligada. */
  searchable?: boolean;
  /** Desliga as duas listas, as buscas e os botoes de mover. */
  disabled?: boolean;
  /** Os textos da peca, para trocar o nome das listas ou o anuncio. */
  labels?: TransferListLabels;
  /**
   * Classe por parte: `panel` (cada lista com a moldura), `header`, `search`,
   * `list` (a caixa que rola), `option`, `actions` (a coluna dos botoes) e
   * `empty`.
   */
  classNames?: Slots<"panel" | "header" | "search" | "list" | "option" | "actions" | "empty">;
};

type Cursor = { value: string | null; index: number };

function CheckMark() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3">
      <path
        d="M2.5 6.3 4.8 8.6 9.5 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TransferList({
  items,
  value,
  onValueChange,
  searchable = true,
  disabled = false,
  labels = {},
  className,
  classNames,
  ...props
}: TransferListProps) {
  const id = useId();
  const titles: Record<TransferSide, string> = {
    available: labels.available ?? TRANSFER_TITLES.available,
    chosen: labels.chosen ?? TRANSFER_TITLES.chosen,
  };
  const count = labels.count ?? transferCount;
  const moved = labels.moved ?? transferMoved;

  const [query, setQuery] = useState<Record<TransferSide, string>>({ available: "", chosen: "" });
  const [picked, setPicked] = useState<Record<TransferSide, string[]>>({
    available: [],
    chosen: [],
  });
  const [cursor, setCursor] = useState<Record<TransferSide, Cursor>>({
    available: { value: null, index: 0 },
    chosen: { value: null, index: 0 },
  });
  const [anchor, setAnchor] = useState<Record<TransferSide, string | null>>({
    available: null,
    chosen: null,
  });
  const [spoken, setSpoken] = useState({ text: "", turn: false });

  const lists: Record<TransferSide, RefObject<HTMLUListElement | null>> = {
    available: useRef<HTMLUListElement>(null),
    chosen: useRef<HTMLUListElement>(null),
  };
  const pending = useRef<{ trigger: HTMLElement; target: TransferSide } | null>(null);

  const sides = transferSides(items, value);
  const shown: Record<TransferSide, TransferListItem[]> = {
    available: sides.available.filter((item) => matchesSearch(item.label, query.available)),
    chosen: sides.chosen.filter((item) => matchesSearch(item.label, query.chosen)),
  };
  const marked = (side: TransferSide) => {
    const open = new Set(shown[side].filter((item) => !item.disabled).map((item) => item.value));
    return picked[side].filter((key) => open.has(key));
  };
  const selected: Record<TransferSide, string[]> = {
    available: marked("available"),
    chosen: marked("chosen"),
  };

  useLayoutEffect(() => {
    const waiting = pending.current;
    if (!waiting) return;
    pending.current = null;
    if (focusIsLost(waiting.trigger)) lists[waiting.target].current?.focus();
  });

  function activeIndex(side: TransferSide) {
    const list = shown[side];
    if (list.length === 0) return -1;
    const found = list.findIndex((item) => item.value === cursor[side].value);
    return found === -1 ? Math.min(cursor[side].index, list.length - 1) : found;
  }

  function point(side: TransferSide, index: number) {
    const item = shown[side][index];
    if (!item) return;
    setCursor((current) => ({ ...current, [side]: { value: item.value, index } }));
    const node = document.getElementById(`${id}-${side}-${index}`);
    node?.scrollIntoView?.({ block: "nearest" });
  }

  function mark(side: TransferSide, keys: string[], on: boolean) {
    const open = new Set(movable(side));
    setPicked((current) => {
      const next = new Set(current[side].filter((key) => open.has(key)));
      for (const key of keys) {
        if (on) next.add(key);
        else next.delete(key);
      }
      return { ...current, [side]: [...next] };
    });
  }

  function toggle(side: TransferSide, index: number) {
    const item = shown[side][index];
    if (!item || item.disabled) return;
    mark(side, [item.value], !selected[side].includes(item.value));
    setAnchor((current) => ({ ...current, [side]: item.value }));
  }

  function markRange(side: TransferSide, from: number, to: number) {
    const [low, high] = from < to ? [from, to] : [to, from];
    const keys = shown[side]
      .slice(low, high + 1)
      .filter((item) => !item.disabled)
      .map((item) => item.value);
    mark(side, keys, true);
  }

  function move(from: TransferSide, keys: string[], trigger?: HTMLElement) {
    const movable = items.filter((item) => !item.disabled && keys.includes(item.value));
    if (disabled || movable.length === 0) return;
    const to = OTHER_SIDE[from];
    onValueChange(transferMove(items, value, keys, to));
    setPicked((current) => ({ ...current, [from]: [] }));
    setSpoken((current) => ({ text: moved(movable.length, titles[to]), turn: !current.turn }));
    if (trigger) pending.current = { trigger, target: to };
  }

  function movable(side: TransferSide) {
    return shown[side].filter((item) => !item.disabled).map((item) => item.value);
  }

  function handleKeyDown(side: TransferSide, event: KeyboardEvent<HTMLUListElement>) {
    if (disabled) return;
    const list = shown[side];
    const index = activeIndex(side);
    const last = list.length - 1;
    const go = (target: number) => {
      event.preventDefault();
      if (list.length === 0) return;
      const next = Math.max(0, Math.min(target, last));
      point(side, next);
      if (event.shiftKey) markRange(side, index === -1 ? next : index, next);
    };

    if (event.key === "ArrowDown") go(index + 1);
    else if (event.key === "ArrowUp") go(index - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(last);
    else if (event.key === " ") {
      event.preventDefault();
      if (index !== -1) toggle(side, index);
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      const open = movable(side);
      mark(side, open, selected[side].length < open.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      move(side, selected[side]);
    } else if (event.key === "Escape" && selected[side].length > 0) {
      event.preventDefault();
      mark(side, selected[side], false);
    }
  }

  function handleClick(side: TransferSide, index: number, event: MouseEvent) {
    if (disabled) return;
    const item = shown[side][index];
    if (!item) return;
    setCursor((current) => ({ ...current, [side]: { value: item.value, index } }));
    const from = shown[side].findIndex((entry) => entry.value === anchor[side]);
    if (event.shiftKey && from !== -1) markRange(side, from, index);
    else toggle(side, index);
  }

  function panel(side: TransferSide): ReactNode {
    const list = shown[side];
    const total = sides[side].length;
    const active = activeIndex(side);
    const titleId = `${id}-${side}-title`;
    const countId = `${id}-${side}-count`;
    const emptyId = `${id}-${side}-empty`;
    const listId = `${id}-${side}-list`;
    const searching = query[side].trim().length > 0;

    return (
      <div
        data-side={side}
        className={cn(
          "flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface",
          classNames?.panel,
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border px-3 py-2",
            classNames?.header,
          )}
        >
          <span id={titleId} className="text-sm font-rc-medium text-fg">
            {titles[side]}
          </span>
          <span id={countId} className="text-xs text-fg-muted tabular-nums">
            {count(selected[side].length, total)}
          </span>
        </div>

        {searchable && (
          <div className={cn("border-b border-border p-2", classNames?.search)}>
            <SearchInput
              size="sm"
              aria-label={searchInLabel(titles[side])}
              placeholder={labels.search ?? TRANSFER_SEARCH}
              aria-controls={listId}
              disabled={disabled}
              value={query[side]}
              onChange={(event) => {
                const text = event.currentTarget.value;
                setQuery((current) => ({ ...current, [side]: text }));
              }}
              onClear={() => setQuery((current) => ({ ...current, [side]: "" }))}
              onKeyDown={(event) => {
                if (event.key !== "ArrowDown") return;
                event.preventDefault();
                lists[side].current?.focus();
              }}
            />
          </div>
        )}

        <div className="relative">
          <ul
            ref={lists[side]}
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={titleId}
            aria-describedby={list.length === 0 ? `${countId} ${emptyId}` : countId}
            aria-disabled={disabled || undefined}
            aria-activedescendant={active === -1 ? undefined : `${id}-${side}-${active}`}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(event) => handleKeyDown(side, event)}
            className={cn(
              "group/list flex h-60 flex-col gap-0.5 overflow-y-auto p-1 outline-none",
              list.length === 0 && "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              classNames?.list,
            )}
          >
            {list.map((item, index) => {
              const isSelected = selected[side].includes(item.value);
              const off = disabled || item.disabled;
              return (
                <li
                  key={item.value}
                  id={`${id}-${side}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={off || undefined}
                  data-active={index === active || undefined}
                  onClick={(event) => handleClick(side, index, event)}
                  className={cn(
                    "flex min-h-[var(--rc-control-sm)] items-center gap-2 rounded-md px-2",
                    "py-[var(--rc-item-y)] text-sm text-fg select-none",
                    "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
                    isSelected && "bg-selected",
                    off
                      ? "cursor-not-allowed text-fg-disabled"
                      : "cursor-pointer hover:bg-accent-subtle",
                    "group-focus-visible/list:data-active:bg-accent-subtle",
                    "group-focus-visible/list:data-active:ring-2 group-focus-visible/list:data-active:ring-ring",
                    classNames?.option,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex size-[var(--rc-box)] shrink-0 items-center justify-center rounded-sm border",
                      off
                        ? "border-border-disabled bg-surface-raised text-fg-disabled"
                        : isSelected
                          ? "border-accent-text bg-accent-text text-surface-raised"
                          : "border-border-strong bg-surface",
                    )}
                  >
                    {isSelected && <CheckMark />}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{item.label}</span>
                </li>
              );
            })}
          </ul>

          {list.length === 0 && (
            <p
              id={emptyId}
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-fg-muted",
                classNames?.empty,
              )}
            >
              {searching ? (labels.noResults ?? TRANSFER_NO_RESULTS) : (labels.empty ?? TRANSFER_EMPTY)}
            </p>
          )}
        </div>
      </div>
    );
  }

  const button = (
    from: TransferSide,
    keys: string[],
    label: string,
    icon: ReactNode,
  ) => (
    <IconButton
      size="sm"
      variant="secondary"
      label={label}
      tooltip
      disabled={disabled || keys.length === 0}
      onClick={(event) => move(from, keys, event.currentTarget)}
      className="max-sm:[&_svg]:rotate-90 sm:rtl:[&_svg]:rotate-180"
    >
      {icon}
    </IconButton>
  );

  return (
    <div
      {...props}
      className={cn(
        "grid grid-cols-1 gap-3 font-sans sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
        className,
      )}
    >
      {panel("available")}

      <div
        className={cn(
          "flex flex-row items-center justify-center gap-2 sm:flex-col",
          classNames?.actions,
        )}
      >
        {button("available", selected.available, moveSelectedLabel(titles.chosen), <ChevronRight />)}
        {button("available", movable("available"), moveAllLabel(titles.chosen), <ChevronsRight />)}
        {button("chosen", selected.chosen, moveSelectedLabel(titles.available), <ChevronLeft />)}
        {button("chosen", movable("chosen"), moveAllLabel(titles.available), <ChevronsLeft />)}
      </div>

      {panel("chosen")}

      <div role="status" aria-live="polite" className="sr-only">
        {spoken.text}
        {spoken.turn ? " " : ""}
      </div>
    </div>
  );
}
