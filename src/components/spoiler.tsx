"use client";

import { ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { revealsFocus, SPOILER_HEIGHT, SPOILER_LESS, SPOILER_MORE } from "../shared/spoiler";

function waitOf(node: HTMLElement) {
  const parts = getComputedStyle(node).transitionDuration.split(",");
  const times = parts
    .map((part) => Number.parseFloat(part) * (part.trim().endsWith("ms") ? 1 : 1000))
    .filter(Number.isFinite);
  return Math.max(0, ...times);
}

function fadeOf(node: HTMLElement) {
  const style = getComputedStyle(node);
  const line = Number.parseFloat(style.lineHeight);
  if (Number.isFinite(line)) return line * 2;
  const font = Number.parseFloat(style.fontSize);
  return (Number.isFinite(font) ? font : 16) * 1.2 * 2;
}

export type SpoilerProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** The long content: running text, a list, whatever fits in a block. */
  children: ReactNode;
  /**
   * The collapsed height, in pixels. Below it the button does not even appear; above it,
   * the content is cut here, with the last two lines fading out in a gradient.
   */
  maxHeight?: number;
  /** Open, for whoever controls it. Goes together with `onOpenChange`. */
  open?: boolean;
  /** Open on the first paint, uncontrolled. */
  defaultOpen?: boolean;
  /** Receives the new state on each "Ler mais" and "Ler menos". */
  onOpenChange?: (open: boolean) => void;
  /** The button's texts. Default: "Ler mais" and "Ler menos". */
  labels?: { more?: string; less?: string };
  /** Class per part: `content` (the box that clips) and `trigger` (the button). */
  classNames?: Slots<"content" | "trigger">;
};

export function Spoiler({
  children,
  maxHeight = SPOILER_HEIGHT,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  labels = {},
  className,
  classNames,
  ...props
}: SpoilerProps) {
  const contentId = useId();
  const [own, setOwn] = useState(defaultOpen);
  const open = openProp ?? own;
  const [full, setFull] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const reveal = useRef<Element | null>(null);

  useLayoutEffect(() => {
    const node = inner.current;
    if (!node) return;
    const measure = () => setFull(node.scrollHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const box = viewport.current;
    const target = reveal.current;
    if (!open || !box || !target) return;
    const timer = setTimeout(() => {
      reveal.current = null;
      target.scrollIntoView?.({ block: "nearest" });
    }, waitOf(box));
    return () => clearTimeout(timer);
  }, [open]);

  const overflowing = full > maxHeight + 1;
  const clipped = overflowing && !open;

  function change(next: boolean) {
    if (openProp === undefined) setOwn(next);
    onOpenChange?.(next);
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    const box = viewport.current;
    if (!clipped || !box || !inner.current) return;
    const bottom =
      event.target.getBoundingClientRect().bottom - inner.current.getBoundingClientRect().top;
    if (!revealsFocus({ bottom, scrollTop: box.scrollTop, maxHeight, fade: fadeOf(box) })) return;
    box.scrollTop = 0;
    reveal.current = event.target;
    change(true);
  }

  return (
    <div {...props} className={cn("flex flex-col items-start gap-1", className)}>
      <div
        ref={viewport}
        id={contentId}
        data-clipped={clipped || undefined}
        onFocus={handleFocus}
        style={overflowing ? { maxHeight: open ? full : maxHeight } : undefined}
        className={cn(
          "w-full overflow-hidden",
          "transition-[max-height] duration-[var(--rc-duration-base)] ease-rc",
          clipped && "mask-b-from-[calc(100%-2lh)] mask-b-to-100%",
          classNames?.content,
        )}
      >
        <div ref={inner}>{children}</div>
      </div>

      {overflowing && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => change(!open)}
          className={cn(
            "-mx-1 inline-flex min-h-6 items-center gap-1 rounded-sm px-1 font-sans text-sm font-rc-medium",
            "text-accent-text underline-offset-4 hover:underline",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            classNames?.trigger,
          )}
        >
          {open ? (labels.less ?? SPOILER_LESS) : (labels.more ?? SPOILER_MORE)}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={cn(
              "shrink-0 transition-transform duration-[var(--rc-duration-fast)] ease-rc",
              open && "rotate-180",
            )}
          />
        </button>
      )}
    </div>
  );
}
