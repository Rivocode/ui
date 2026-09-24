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
  /** Identifica a notificacao nos callbacks. */
  id: string;
  /** A frase que diz o que aconteceu. Vai em negrito enquanto nao foi lida. */
  title: ReactNode;
  /** O detalhe, embaixo do titulo, em ate duas linhas. */
  description?: ReactNode;
  /** Quando aconteceu. Sai como `RelativeTime`: "ha 5 minutos", com a data exata no `title`. */
  time: Date | string | number;
  /** Ja foi lida. A nao lida ganha o ponto, o negrito e o "Nao lida" para o leitor de tela. */
  read: boolean;
  /** Para onde a notificacao leva. Com ele, a linha e um link. */
  href?: string;
  /** O simbolo a esquerda. Sem ele, o sino. Sai `aria-hidden`. */
  icon?: ReactNode;
  /** Pinta o simbolo no tom de estado. Padrao `neutral`. */
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
  /** As notificacoes ja carregadas, da mais nova para a mais antiga. A peca nao busca nada. */
  items: NotificationItem[];
  /**
   * Quantas nao lidas existem, quando o servidor sabe mais do que a pagina
   * carregada. Sem ele, conta as nao lidas de `items`. E o numero do sininho.
   */
  unreadCount?: number;
  /** O painel aberto, controlado. Use com `onOpenChange`. */
  open?: boolean;
  /** O painel aberto ao montar, quando ninguem controla. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Chamado quando a pessoa escolhe uma notificacao. Abrir conta como ler:
   * se ela nao estava lida, `onMarkRead` e chamado junto. O painel fecha.
   */
  onItemClick?: (item: NotificationItem) => void;
  /** Liga o botao de marcar como lida em cada nao lida. Quem guarda o `read` e quem chamou. */
  onMarkRead?: (id: string) => void;
  /** Liga o "Marcar todas como lidas" no topo do painel. */
  onMarkAllRead?: () => void;
  /** O filtro, controlado: `all` ou `unread`. Use com `onFilterChange`. */
  filter?: NotificationFilter;
  /** O filtro ao montar, quando ninguem controla. Padrao `all`. */
  defaultFilter?: NotificationFilter;
  /**
   * Chamado quando a pessoa troca o filtro. A peca ja filtra `items` sozinha;
   * o callback serve a quem quer buscar as nao lidas no servidor.
   */
  onFilterChange?: (filter: NotificationFilter) => void;
  /** Ha mais para carregar: liga o "Carregar mais" no fim da lista. */
  hasMore?: boolean;
  /** Chamado pelo "Carregar mais". Quem busca e acrescenta em `items` e quem chamou. */
  onLoadMore?: () => void;
  /** A proxima pagina esta chegando: o botao gira e nao aceita clique. */
  isLoadingMore?: boolean;
  /** A primeira carga ainda nao voltou: a lista vira marca de lugar, e o leitor ouve "Carregando". */
  isLoading?: boolean;
  /** O teto do numero no sininho: acima dele sai "99+". */
  max?: number;
  /** O agora das datas relativas, para teste e para renderizacao no servidor. */
  now?: Date;
  /** De que lado do sininho o painel se alinha, na mesa. Padrao `end`. */
  align?: "start" | "end";
  /** Os textos da peca, para trocar o idioma ou o termo. */
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
              <span className={cn("min-w-0 flex-1 text-sm text-fg", !item.read && "font-medium")}>
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
              <p id={titleId} className="font-display text-base text-fg">
                {text.title}
              </p>
              {onMarkAllRead && (
                <Button
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

          <LoadingAnnouncement loading={isLoading} />

          <div
            ref={listRef}
            className="max-h-[min(28rem,60dvh)] overflow-y-auto overscroll-contain"
          >
            {list}
          </div>

          {hasMore && onLoadMore && !isLoading && (
            <div className={cn("border-t border-border p-2", classNames?.footer)}>
              <Button
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
