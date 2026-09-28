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
  fixed: "pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] px-4",
} as const;

export type ActionBarProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /**
   * How many items are selected. Above zero the bar comes in and states the
   * number; at zero it leaves. It is the `length` of the `DataTable`'s `value`.
   */
  count: number;
  /**
   * The batch actions, after the count. Use `Button` `size="sm"`, and put the
   * destructive one last.
   */
  children?: ReactNode;
  /**
   * Turns on "Limpar seleção" at the end of the bar. Whoever called it resets the
   * selection: the bar keeps no state at all.
   */
  onClear?: () => void;
  /**
   * `sticky` sticks to the bottom of the area that contains it and takes up space below it
   * while open; `fixed` sticks to the bottom of the window, above the phone's safe
   * area, and takes up no space at all.
   */
  position?: "sticky" | "fixed";
  /**
   * Where focus goes when the bar leaves with focus inside it - after
   * "Limpar seleção", or an action that resets the selection. Without it, focus returns
   * to where it was before entering the bar (the checkbox of the last checked
   * row, almost always) and, if that is gone, stays on the bar's root.
   */
  finalFocus?: RefObject<HTMLElement | null>;
  /**
   * The bar's texts. `selected` receives the count and returns the sentence, for
   * those who want to name the item: `(n) => n === 1 ? "1 nota selecionada" : ...`.
   * `region` is the region's name, `clear` the button's and `cleared` what is
   * heard when the selection resets.
   */
  labels?: {
    selected?: (count: number) => string;
    clear?: string;
    region?: string;
    cleared?: string;
  };
  /** Class per part: `bar` (the panel), `count`, `actions` and `clear`. */
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
              type="button"
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
