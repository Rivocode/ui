import { useCallback, useRef, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export function indicatorWidthComplaint(width: number): string | undefined {
  const widest = 48;
  if (!(width > widest)) return undefined;

  return (
    `[rivocode/ui] <Indicator>: the child is ${Math.round(width)}px wide, and the ` +
    `pill sits on top of it without reserving space - above ${widest}px it covers ` +
    "content. The component marks a small target: the bell button, the bar item, the avatar. " +
    "To mark a whole row, put the count beside it, with a `Badge`."
  );
}

export type IndicatorProps = ComponentProps<"span"> & {
  /** What receives the mark: the bell button, the sidebar item, the avatar. */
  children: ReactNode;
  /**
   * How many. Zero draws nothing - a pill with "0" draws attention to
   * say there is nothing, which is the opposite of its job.
   */
  count?: number;
  /** The cap: above it "99+" is shown, instead of the pill stretching. */
  max?: number;
  /**
   * What the screen reader hears. Without this it reads only the bare number, and "7" does not
   * say what the seven are.
   */
  label?: string;
  /** No count: just the dot, for "there is something new here". */
  dot?: boolean;
  /** Class per part: `badge`. */
  classNames?: Slots<"badge">;
};

export function Indicator({
  children,
  count,
  max = 99,
  label,
  dot,
  className,
  classNames,
  ref,
  ...props
}: IndicatorProps) {
  const show = dot || (count !== undefined && count > 0);
  const written = count !== undefined && count > max ? `${max}+` : String(count ?? "");
  const complained = useRef(false);

  const hold = useCallback(
    (node: HTMLSpanElement | null): void | (() => void) => {
      if (node && !complained.current && process.env.NODE_ENV !== "production") {
        const complaint = indicatorWidthComplaint(node.offsetWidth);
        if (complaint) {
          complained.current = true;
          console.warn(complaint);
        }
      }

      if (typeof ref === "function") return ref(node) as void | (() => void);
      if (ref) (ref as { current: HTMLSpanElement | null }).current = node;
    },
    [ref],
  );

  return (
    <span {...props} ref={hold} className={cn("relative inline-flex", className)}>
      {children}

      {show && (
        <span
          aria-hidden={label ? "true" : undefined}
          className={cn(
            "pointer-events-none absolute -top-1 -right-1 z-[var(--rc-z-base)]",
            "flex animate-pop items-center justify-center rounded-pill bg-danger text-danger-fg",
            "ring-2 ring-bg",
            dot ? "size-2.5" : "h-4 min-w-4 px-1 font-mono text-[0.65rem] leading-none",
            classNames?.badge,
          )}
        >
          {dot ? null : written}
        </span>
      )}

      {show && label && <span className="sr-only">{label}</span>}
    </span>
  );
}
