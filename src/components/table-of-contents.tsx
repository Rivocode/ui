"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
} from "react";

import { useLatest } from "../hooks/common/latest";
import { useReducedMotion } from "../hooks/environment";
import { cn } from "../lib/cn";
import { focusLandmark } from "../lib/focus";
import type { Slots } from "../lib/slots";

export type TableOfContentsItem = {
  /** The heading's `id` on the page, without the `#`. */
  id: string;
  /** The row's text in the table of contents. */
  label: ReactNode;
  /**
   * The heading's level: 2 for `h2`, 3 for `h3`. The smallest level in the list is the outer
   * margin.
   */
  level?: number;
};

export type TableOfContentsProps = Omit<ComponentPropsWithoutRef<"nav">, "children"> & {
  /**
   * The ready-made list. With it the piece does not read the page; without it, it reads the
   * headings that
   * match `selector` inside `container`.
   */
  items?: TableOfContentsItem[];
  /**
   * Which headings come in, when the list is not ready-made. The level comes from the tag, `h2` to
   * `h6`.
   */
  selector?: string;
  /**
   * Where to look for the headings. Without it, the whole document. Content that arrives
   * later (an example loaded on demand, a section mounted late) comes in by itself.
   */
  container?: HTMLElement | null;
  /** The scrolling box, when it is not the window. It is where the visible section is measured. */
  root?: HTMLElement | null;
  /**
   * The height of what sticks to the top (a fixed header), in pixels. The heading stops
   * below it on click, and a section only counts as visible below it.
   */
  offset?: number;
  /** The navigation region's name, which also appears as the table of contents' title. */
  label?: string;
  /** Hides the visible title. `label` still names the navigation for the screen reader. */
  hideLabel?: boolean;
  /**
   * Writes the `#id` into the address bar on click, with `history.replaceState`,
   * without pushing history. Off by default, so as not to fight the router.
   */
  updateHash?: boolean;
  /**
   * Called when the marked section changes: on scroll or on click. `null` before the first heading.
   */
  onActiveChange?: (id: string | null) => void;
  /**
   * Called on a row click, before scrolling. `event.preventDefault()`
   * cancels the smooth scroll and lets the browser follow the link.
   */
  onItemClick?: (item: TableOfContentsItem, event: MouseEvent<HTMLAnchorElement>) => void;
  classNames?: Slots<"label" | "list" | "item" | "link">;
};

type Entry = { id: string; label: ReactNode; level: number };
type Branch = { entry: Entry; depth: number; children: Branch[] };

const DEPTH = ["ps-3", "ps-6", "ps-9", "ps-12"] as const;
const LINE = 0.3;
const RELEASE = ["wheel", "touchstart", "keydown", "mousedown"] as const;

function levelOf(node: Element) {
  const tag = /^H([1-6])$/.exec(node.tagName);
  if (tag) return Number(tag[1]);
  const aria = Number(node.getAttribute("aria-level"));
  return Number.isFinite(aria) && aria > 0 ? aria : 2;
}

function slugOf(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureId(node: HTMLElement, text: string) {
  if (node.id) return node.id;
  const base = slugOf(text) || "secao";
  let candidate = base;
  for (let index = 2; node.ownerDocument.getElementById(candidate); index += 1) {
    candidate = `${base}-${index}`;
  }
  node.id = candidate;
  return candidate;
}

function nest(entries: Entry[]): Branch[] {
  const top: Branch[] = [];
  const stack: Branch[] = [];
  for (const entry of entries) {
    while (stack.length > 0 && stack[stack.length - 1]!.entry.level >= entry.level) stack.pop();
    const branch: Branch = { entry, depth: stack.length, children: [] };
    (stack[stack.length - 1]?.children ?? top).push(branch);
    stack.push(branch);
  }
  return top;
}

const sameEntries = (a: Entry[], b: Entry[]) =>
  a.length === b.length &&
  a.every((entry, index) => {
    const other = b[index]!;
    return entry.id === other.id && entry.level === other.level && entry.label === other.label;
  });

export function TableOfContents({
  items,
  selector = "h2, h3",
  container,
  root,
  offset = 0,
  label = "Nesta página",
  hideLabel = false,
  updateHash = false,
  onActiveChange,
  onItemClick,
  className,
  classNames,
  ...props
}: TableOfContentsProps) {
  const reduced = useReducedMotion();
  const nav = useRef<HTMLElement>(null);
  const titleId = useId();
  const [read, setRead] = useState<Entry[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const held = useRef<string | null>(null);
  const announce = useLatest(onActiveChange);
  const reported = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (items || typeof document === "undefined") return;
    const scope: ParentNode = container ?? document;

    const collect = () => {
      const nodes = Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(
        (node) => !nav.current?.contains(node),
      );
      const next = nodes.map((node) => {
        const text = (node.textContent ?? "").trim();
        return { id: ensureId(node, text), label: text, level: levelOf(node) };
      });
      setRead((current) => (sameEntries(current, next) ? current : next));
    };

    collect();
    if (typeof MutationObserver === "undefined") return;
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(collect);
    });
    observer.observe(container ?? document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [items, container, selector]);

  const entries: Entry[] = items
    ? items.map((item) => ({ id: item.id, label: item.label, level: item.level ?? 0 }))
    : read;
  const floor = entries.reduce((min, entry) => Math.min(min, entry.level), Infinity);
  const ids = entries.map((entry) => entry.id).join("\n");

  useEffect(() => {
    if (!ids || typeof document === "undefined") return;
    const doc = nav.current?.ownerDocument ?? document;
    const targets = ids
      .split("\n")
      .map((id) => doc.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    if (targets.length === 0) return;

    const atEnd = () => {
      if (root) {
        const room = root.scrollHeight - root.clientHeight;
        return room > 0 && root.scrollTop >= room - 1;
      }
      const room = doc.documentElement.scrollHeight - window.innerHeight;
      return room > 0 && window.scrollY >= room - 1;
    };

    const measure = () => {
      if (held.current !== null) return;
      const box = root?.getBoundingClientRect();
      const top = box?.top ?? 0;
      const height = box?.height ?? window.innerHeight;
      const line = top + offset + (height - offset) * LINE;
      const bottom = top + height;
      const end = atEnd();
      let current: string | null = null;
      for (const target of targets) {
        const at = target.getBoundingClientRect().top;
        if (at <= line + 1 || (end && at < bottom)) current = target.id;
      }
      setActive(current);
    };

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const release = () => {
      held.current = null;
    };
    const scroller: HTMLElement | Window = root ?? window;

    measure();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    for (const name of RELEASE) window.addEventListener(name, release, { capture: true, passive: true });
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(measure, {
            root: root ?? null,
            rootMargin: `-${offset}px 0px -${Math.round((1 - LINE) * 100)}% 0px`,
            threshold: [0, 1],
          });
    for (const target of targets) observer?.observe(target);
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      for (const name of RELEASE) window.removeEventListener(name, release, { capture: true });
      observer?.disconnect();
    };
  }, [ids, root, offset]);

  useEffect(() => {
    if (reported.current === active) return;
    const first = reported.current === undefined;
    reported.current = active;
    if (!first || active !== null) announce.current?.(active);
  }, [active, announce]);

  if (entries.length === 0) return null;

  function go(entry: Entry, event: MouseEvent<HTMLAnchorElement>) {
    onItemClick?.({ id: entry.id, label: entry.label, level: entry.level }, event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const doc = event.currentTarget.ownerDocument;
    const target = doc.getElementById(entry.id);
    if (!target) return;
    event.preventDefault();

    const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
    const rect = target.getBoundingClientRect();
    if (root) {
      const top = root.scrollTop + rect.top - root.getBoundingClientRect().top - offset;
      root.scrollTo?.({ top, behavior });
    } else {
      window.scrollTo?.({ top: window.scrollY + rect.top - offset, behavior });
    }

    held.current = entry.id;
    setActive(entry.id);
    focusLandmark(target);
    if (updateHash) window.history.replaceState(window.history.state, "", `#${entry.id}`);
  }

  function renderList(branches: Branch[], nested: boolean) {
    return (
      <ul
        className={cn(
          "flex flex-col",
          !nested && "border-s border-border",
          !nested && classNames?.list,
        )}
      >
        {branches.map(({ entry, depth, children }) => {
          const current = entry.id === active;
          return (
            <li key={entry.id} className={classNames?.item}>
              <a
                href={`#${entry.id}`}
                aria-current={current ? "location" : undefined}
                data-active={current ? "" : undefined}
                onClick={(event) => go(entry, event)}
                className={cn(
                  "-ms-px block rounded-e-sm border-s-2 py-1 pe-2 font-sans text-sm wrap-anywhere",
                  "transition-colors duration-fast ease-rc",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  DEPTH[Math.min(depth, DEPTH.length - 1)],
                  current
                    ? "border-accent-text font-rc-medium text-fg"
                    : "border-transparent text-fg-muted hover:text-fg",
                  classNames?.link,
                )}
              >
                {entry.label}
              </a>
              {children.length > 0 && renderList(children, true)}
            </li>
          );
        })}
      </ul>
    );
  }

  const leveled = entries.map((entry) => ({
    ...entry,
    level: Number.isFinite(floor) ? entry.level - floor : 0,
  }));

  return (
    <nav
      {...props}
      ref={nav}
      aria-label={hideLabel ? label : undefined}
      aria-labelledby={hideLabel ? undefined : titleId}
      className={cn("flex flex-col gap-2", className)}
    >
      {!hideLabel && (
        <p
          id={titleId}
          className={cn("font-sans text-sm font-rc-medium text-fg", classNames?.label)}
        >
          {label}
        </p>
      )}
      {renderList(nest(leveled), false)}
    </nav>
  );
}
