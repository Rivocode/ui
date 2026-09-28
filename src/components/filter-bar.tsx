"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { X } from "lucide-react";
import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { useArrivals } from "../lib/arrivals";
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

function usable(nodes: (HTMLButtonElement | null)[]): HTMLButtonElement | null {
  return nodes.find((node) => node !== null && !node.disabled) ?? null;
}

export type FilterChipProps = ComponentPropsWithoutRef<"span"> & {
  /** The filtered field: "Cliente", "Vencimento". Rendered in normal weight, on the left. */
  label: string;
  /**
   * What was chosen in that field. Rendered in medium weight, and truncated with an ellipsis past
   * 10rem.
   */
  value?: ReactNode;
  /**
   * What happens on the x. Without it there is no x: that is how a filter the app locks is shown.
   */
  onRemove?: () => void;
  /** Locks the x and dims the chip, so the refetching query does not accept a second tap. */
  disabled?: boolean;
  /** The same two heights as `Badge`. */
  size?: "sm" | "md";
  /**
   * What the screen reader hears on the x. `remove` receives "Cliente: Acme" when the value is
   * text, and only "Cliente" when it is not.
   */
  labels?: { remove?: (filter: string) => string };
  /** Class per part: `label`, `value`, `remove`. */
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
      data-disabled={disabled ? "" : undefined}
      className={cn(
        badgeVariants({ size }),
        "max-w-full gap-1",
        onRemove && (size === "sm" ? "pe-1" : "pe-1.5"),
        disabled && "border-border-disabled text-fg-disabled",
        className,
      )}
    >
      <span className={cn("shrink-0", classNames?.label)}>{label}</span>

      {hasValue && (
        <span
          title={typeof value === "string" ? value : undefined}
          className={cn("min-w-0 max-w-40 truncate font-rc-medium text-fg", classNames?.value)}
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
  /** The filter's stable key, and what identifies the chip in the row. */
  id: string;
  /** The filtered field: "Cliente". */
  label: string;
  /** What was chosen: "Acme", "01/08 a 31/08". */
  value?: ReactNode;
  /**
   * `false` removes the x from this chip: the filter shows, and leaving it is not the reader's
   * choice.
   */
  removable?: boolean;
};

export type FilterBarProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /**
   * The current filters. The piece keeps no list of its own and does not know the query: it shows
   * this one.
   */
  filters: AppliedFilter[];
  /** The filter that left, with the whole object, when its x is pressed. */
  onRemove?: (filter: AppliedFilter) => void;
  /** Called when "limpar" is pressed, before `onFiltersChange`. */
  onClear?: () => void;
  /** Receives what is left, both on the x and on clear. On its own it is enough. */
  onFiltersChange?: (filters: AppliedFilter[]) => void;
  /**
   * The row's name for the screen reader. The same text names the scrolling stretch when it becomes
   * a tab stop, so an `aria-label` written from outside changes both at once.
   */
  label?: string;
  /**
   * Keeps the row's height when there is no filter at all, so the screen does not jump when the
   * first one comes in. `false` removes the row and keeps only the notice.
   */
  reserve?: boolean;
  /**
   * From how many removable filters "limpar" appears; a locked one neither counts nor leaves. With
   * `1` it is always there, and with `Infinity` never.
   */
  clearFrom?: number;
  /** The height of the chips. */
  size?: "sm" | "md";
  /** Locks every x and clear, so the refetching query does not accept a second tap. */
  disabled?: boolean;
  /**
   * The texts the piece writes: `remove` on the x, `clear` on the clear button, `status` in the
   * live region, `empty` on the kept row and `scroll` on the scrolling stretch, when it becomes a
   * tab stop.
   */
  labels?: {
    remove?: (filter: string) => string;
    clear?: (total: number) => string;
    status?: (total: number) => string;
    scroll?: (name: string) => string;
    empty?: ReactNode;
  };
  /** Class per part: `list`, `item`, `chip`, `clear`, `empty`. */
  classNames?: Slots<"list" | "item" | "chip" | "clear" | "empty">;
};

export function FilterBar({
  filters,
  onRemove,
  onClear,
  onFiltersChange,
  label = "Filtros aplicados",
  "aria-label": ariaLabel,
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
  const locked = filters.filter((filter) => filter.removable === false);
  const clearable = total - locked.length;
  const status = labels.status ?? applied;
  const clear = labels.clear ?? ((count: number) => `Limpar ${counted(count)}`);
  const scroll = labels.scroll ?? ((name: string) => `${name}: role para ver todos`);
  const name = ariaLabel ?? label;
  const empty = labels.empty ?? applied(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const leaving = useRef<{ id: string; index: number } | "all" | null>(null);
  const rtl = useDirection() === "rtl";
  const [more, setMore] = useState({ before: false, after: false });
  const arrived = useArrivals(filters.map((filter) => filter.id));

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

  useEffect(() => {
    const gone = leaving.current;
    leaving.current = null;
    if (!gone) return;

    if (gone === "all") {
      const root = rootRef.current;
      if (!root) return;
      if (!root.hasAttribute("tabindex")) {
        root.setAttribute("tabindex", "-1");
        root.addEventListener("blur", () => root.removeAttribute("tabindex"), { once: true });
      }
      root.focus();
      return;
    }

    if (filters.some((filter) => filter.id === gone.id)) return;

    const crosses = [...(listRef.current?.querySelectorAll("li") ?? [])].map((item) =>
      item.querySelector("button"),
    );
    const ahead = usable(crosses.slice(gone.index));
    const behind = usable(crosses.slice(0, gone.index).reverse());
    const landing = ahead ?? usable([clearRef.current]) ?? behind;

    if (landing) {
      landing.focus();
      return;
    }

    const row = listRef.current ?? rootRef.current;
    if (!row) return;

    if (!row.hasAttribute("tabindex")) {
      row.setAttribute("tabindex", "-1");
      row.addEventListener("blur", () => row.removeAttribute("tabindex"), { once: true });
    }
    row.focus();
  }, [filters]);

  const canRemove = Boolean(onRemove ?? onFiltersChange);
  const canClear = Boolean(onClear ?? onFiltersChange);
  const reachable = !disabled && canRemove && filters.some((filter) => filter.removable !== false);
  const scrollable = !reachable && (more.before || more.after);

  return (
    <div
      {...props}
      ref={rootRef}
      role="group"
      aria-label={name}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? "" : undefined}
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
          tabIndex={scrollable ? 0 : undefined}
          aria-label={scrollable ? scroll(name) : undefined}
          className={cn(
            "-my-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scroll-px-6 py-1",
            more.before && "mask-l-from-[calc(100%-1.5rem)] mask-l-to-100%",
            more.after && "mask-r-from-[calc(100%-1.5rem)] mask-r-to-100%",
            scrollable &&
              "rounded-md outline-none focus-visible:mask-none focus-visible:ring-2 focus-visible:ring-ring",
            classNames?.list,
          )}
        >
          {filters.map((filter, index) => (
            <li
              key={filter.id}
              className={cn("shrink-0", arrived(filter.id) && "animate-pop", classNames?.item)}
            >
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
                        const focused = document.activeElement;
                        leaving.current =
                          focused && listRef.current?.contains(focused)
                            ? { id: filter.id, index }
                            : null;
                        onRemove?.(filter);
                        onFiltersChange?.(filters.filter((other) => other.id !== filter.id));
                      }
                }
              />
            </li>
          ))}
        </ul>
      )}

      {clearable > 0 && clearable >= clearFrom && canClear && (
        <Button
          ref={clearRef}
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => {
            const focused = document.activeElement;
            leaving.current = focused && rootRef.current?.contains(focused) ? "all" : null;
            onClear?.();
            onFiltersChange?.(locked);
          }}
          className={cn("shrink-0", classNames?.clear)}
        >
          {clear(clearable)}
        </Button>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {status(total)}
      </div>
    </div>
  );
}
