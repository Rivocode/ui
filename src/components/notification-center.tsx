"use client";

import { Bell, BellOff, Check, CheckCheck } from "lucide-react";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import type { Slots } from "../lib/slots";
import {
  NOTIFICATION_LABELS,
  unreadOf,
  type NotificationCenterLabels,
  type NotificationFilter,
  type NotificationTone,
} from "../shared/notification";
import { Button } from "./button";
import { CalendarPanel } from "./calendar-panel";
import { EmptyState } from "./empty-state";
import { IconButton } from "./icon-button";
import { Indicator } from "./indicator";
import { RelativeTime } from "./relative-time";
import { Skeleton } from "./skeleton";
import { Toggle, ToggleGroup } from "./toggle";

export type { NotificationCenterLabels, NotificationFilter, NotificationTone };

export type NotificationItem = {
  /** Identifies the notification in the callbacks. */
  id: string;
  /** The sentence that says what happened. Bold while it has not been read. */
  title: ReactNode;
  /** The detail, below the title, in up to two lines. */
  description?: ReactNode;
  /**
   * When it happened. Rendered as `RelativeTime`: "ha 5 minutos", with the exact date in `title`.
   */
  time: Date | string | number;
  /** Already read. An unread one gets the dot, the bold and "Nao lida" for the screen reader. */
  read: boolean;
  /** Where the notification leads. With it, the row is a link. */
  href?: string;
  /** The symbol on the left. Without it, the bell. Rendered `aria-hidden`. */
  icon?: ReactNode;
  /** Paints the symbol in the status tone. Default `neutral`. */
  tone?: NotificationTone;
};

const TONE_TEXT: Record<NotificationTone, string> = {
  neutral: "text-fg-muted",
  info: "text-info-text",
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text",
};

export type NotificationCenterProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** The notifications already loaded, from newest to oldest. The piece fetches nothing. */
  items: NotificationItem[];
  /**
   * How many unread ones exist, when the server knows more than the loaded
   * page. Without it, counts the unread ones in `items`. It is the bell's number.
   */
  unreadCount?: number;
  /** The panel open, controlled. Use with `onOpenChange`. */
  open?: boolean;
  /** The panel open on mount, when nobody controls it. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Called when the person picks a notification. Opening counts as reading:
   * if it was unread, `onMarkRead` is called along with it. The panel closes.
   */
  onItemClick?: (item: NotificationItem) => void;
  /** Turns on the mark-as-read button on each unread one. Whoever called it keeps `read`. */
  onMarkRead?: (id: string) => void;
  /** Turns on "Marcar todas como lidas" at the top of the panel. */
  onMarkAllRead?: () => void;
  /** The filter, controlled: `all` or `unread`. Use with `onFilterChange`. */
  filter?: NotificationFilter;
  /** The filter on mount, when nobody controls it. Default `all`. */
  defaultFilter?: NotificationFilter;
  /**
   * Called when the person changes the filter. The piece already filters `items` by itself;
   * the callback serves those who want to fetch the unread ones from the server.
   */
  onFilterChange?: (filter: NotificationFilter) => void;
  /** There is more to load: turns on "Carregar mais" at the end of the list. */
  hasMore?: boolean;
  /** Called by "Carregar mais". Whoever called it fetches and appends to `items`. */
  onLoadMore?: () => void;
  /** The next page is arriving: the button spins and does not accept clicks. */
  isLoadingMore?: boolean;
  /**
   * The first load has not come back yet: the list becomes placeholders, and the reader hears
   * "Carregando".
   */
  isLoading?: boolean;
  /** The cap of the bell's number: above it "99+" is shown. */
  max?: number;
  /** The "now" of the relative dates, for tests and for server rendering. */
  now?: Date;
  /** Which side of the bell the panel aligns to, on desktop. Default `end`. */
  align?: "start" | "end";
  /** The piece's texts, to change the language or the term. */
  labels?: Partial<NotificationCenterLabels>;
  classNames?: Slots<
    "trigger" | "panel" | "header" | "filters" | "list" | "item" | "footer" | "empty"
  >;
};

export function NotificationCenter({
  items,
  unreadCount,
  open,
  defaultOpen = false,
  onOpenChange,
  onItemClick,
  onMarkRead,
  onMarkAllRead,
  filter,
  defaultFilter = "all",
  onFilterChange,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  isLoading = false,
  max = 99,
  now,
  align = "end",
  labels,
  className,
  classNames,
  ...props
}: NotificationCenterProps) {
  const text = { ...NOTIFICATION_LABELS, ...labels };
  const titleId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalFilter, setInternalFilter] = useState<NotificationFilter>(defaultFilter);
  const isOpen = open ?? internalOpen;
  const active = filter ?? internalFilter;
  const unread = unreadOf(items, unreadCount);
  const visible = active === "unread" ? items.filter((item) => !item.read) : items;
  const triggerLabel = unread > 0 ? text.unreadCount(unread) : text.trigger;

  function changeOpen(next: boolean) {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }

  function changeFilter(next: NotificationFilter) {
    if (next === active) return;
    if (filter === undefined) setInternalFilter(next);
    onFilterChange?.(next);
  }

  const listRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const markAllRef = useRef<HTMLButtonElement>(null);

  function focusFilter() {
    const group = filtersRef.current;
    const toggle =
      group?.querySelector<HTMLElement>("[aria-pressed='true']") ??
      group?.querySelector<HTMLElement>("button");
    toggle?.focus();
  }

  function markRead(item: NotificationItem) {
    const rows = new Map(
      [...(listRef.current?.querySelectorAll<HTMLElement>("[data-notification]") ?? [])].map(
        (row) => [row.dataset.notification, row],
      ),
    );
    const order = visible.map((entry) => entry.id);
    const index = order.indexOf(item.id);
    const stays = active === "all";
    const own = stays
      ? rows.get(item.id)?.querySelector<HTMLElement>("[data-notification-body]")
      : null;
    const neighbors = [...order.slice(index + 1), ...order.slice(0, index).reverse()];
    const next =
      own ??
      neighbors
        .map((id) => rows.get(id)?.querySelector<HTMLElement>("[data-notification-mark]"))
        .find(Boolean);
    if (next) next.focus();
    else focusFilter();
    onMarkRead?.(item.id);
  }

  const markAllOff = unread === 0 || isLoading;
  useLayoutEffect(() => {
    const node = markAllRef.current;
    if (markAllOff && node && node === document.activeElement) focusFilter();
  }, [markAllOff]);

  function choose(item: NotificationItem) {
    onItemClick?.(item);
    if (!item.read) onMarkRead?.(item.id);
    changeOpen(false);
  }

  const trigger = (
    <IconButton
      type="button"
      label={triggerLabel}
      variant="ghost"
      className={cn("relative", classNames?.trigger)}
    >
      <Indicator count={unread} max={max} className="absolute inset-0 items-center justify-center">
        <Bell />
      </Indicator>
    </IconButton>
  );

  const list = isLoading ? (
    <ul aria-busy="true" className="flex flex-col">
      {Array.from({ length: 3 }, (_, index) => (
        <li key={index} className="flex gap-3 px-4 py-3">
          <Skeleton className="size-8 shrink-0 rounded-pill" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  ) : visible.length === 0 ? (
    <EmptyState
      icon={<BellOff />}
      title={active === "unread" ? text.emptyUnreadTitle : text.emptyTitle}
      description={active === "unread" ? text.emptyUnreadDescription : text.emptyDescription}
      className={cn("px-4 py-10", classNames?.empty)}
    />
  ) : (
    <ul aria-labelledby={titleId} className={cn("flex flex-col", classNames?.list)}>
      {visible.map((item) => {
        const tone = item.tone ?? "neutral";
        const body = (
          <>
            <span className="flex items-start gap-2">
              <span
                className={cn("min-w-0 flex-1 text-sm text-fg", !item.read && "font-rc-medium")}
              >
                {!item.read && <span className="sr-only">{text.unreadItem}: </span>}
                {item.title}
              </span>
              {!item.read && (
                <span
                  aria-hidden="true"
                  data-unread=""
                  className="mt-1.5 size-2 shrink-0 rounded-pill bg-accent-text"
                />
              )}
            </span>
            {item.description && (
              <span className="line-clamp-2 text-sm text-fg-muted">{item.description}</span>
            )}
            <RelativeTime value={item.time} now={now} className="text-xs text-fg-subtle" />
          </>
        );
        const bodyClass = cn(
          "flex min-w-0 flex-1 flex-col gap-0.5 rounded-sm text-left outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
        );
        return (
          <li
            key={item.id}
            data-notification={item.id}
            data-read={item.read ? "" : undefined}
            className={cn(
              "flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0",
              classNames?.item,
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-pill",
                "border border-border [&_svg]:size-4",
                TONE_TEXT[tone],
              )}
            >
              {item.icon ?? <Bell />}
            </span>

            {item.href !== undefined ? (
              <a
                href={item.href}
                data-notification-body=""
                onClick={() => choose(item)}
                className={bodyClass}
              >
                {body}
              </a>
            ) : onItemClick ? (
              <button
                type="button"
                data-notification-body=""
                onClick={() => choose(item)}
                className={bodyClass}
              >
                {body}
              </button>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">{body}</div>
            )}

            {!item.read && onMarkRead && (
              <IconButton
                type="button"
                label={text.markRead}
                variant="ghost"
                size="sm"
                tooltip
                tooltipSide="left"
                data-notification-mark=""
                onClick={() => markRead(item)}
                className="-mt-1 -mr-2"
              >
                <Check />
              </IconButton>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <span {...props} className={cn("inline-flex", className)}>
      <CalendarPanel
        open={isOpen}
        onOpenChange={changeOpen}
        trigger={trigger}
        title={text.title}
        align={align}
        className={cn("px-0 pt-3 sm:w-[24rem] sm:p-0", classNames?.panel)}
      >
        <div className="flex w-full min-w-0 flex-col">
          <div
            className={cn(
              "flex flex-col gap-3 border-b border-border px-4 pt-3 pb-3",
              classNames?.header,
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p id={titleId} className="font-display font-rc-display text-base text-fg">
                {text.title}
              </p>
              {onMarkAllRead && (
                <Button
                  type="button"
                  ref={markAllRef}
                  variant="ghost"
                  size="sm"
                  disabled={markAllOff}
                  onClick={onMarkAllRead}
                  className={cn(
                    "-mr-2 h-auto min-h-[var(--rc-control-sm)] min-w-0 shrink py-1",
                    "text-left whitespace-normal",
                  )}
                >
                  <CheckCheck aria-hidden="true" />
                  {text.markAllRead}
                </Button>
              )}
            </div>
            <ToggleGroup
              ref={filtersRef}
              aria-label={text.filter}
              value={[active]}
              onValueChange={(value: unknown[]) => {
                const next = value[0];
                if (next === "all" || next === "unread") changeFilter(next);
              }}
              className={cn("self-start", classNames?.filters)}
            >
              <Toggle value="all">{text.all}</Toggle>
              <Toggle value="unread">
                {text.unread}
                {unread > 0 && <span className="font-mono text-xs">{unread}</span>}
              </Toggle>
            </ToggleGroup>
          </div>

          <LoadingAnnouncement loading={isLoading} labels={text} />

          <div
            ref={listRef}
            className="max-h-[min(28rem,60dvh)] overflow-y-auto overscroll-contain"
          >
            {list}
          </div>

          {hasMore && onLoadMore && !isLoading && (
            <div className={cn("border-t border-border p-2", classNames?.footer)}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={isLoadingMore}
                onClick={onLoadMore}
                className="w-full"
              >
                {text.loadMore}
              </Button>
            </div>
          )}
        </div>
      </CalendarPanel>

      <span role="status" aria-live="polite" className="sr-only">
        {text.unreadCount(unread)}
      </span>
    </span>
  );
}
