import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, FlatList, Pressable, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { EmptyState } from "./empty-state";
import { IconButton } from "./icon-button";
import { Indicator } from "./indicator";
import { useRivo } from "./provider";
import { RelativeTime } from "./relative-time";
import {
  NOTIFICATION_LABELS,
  unreadOf,
  type NotificationCenterLabels,
  type NotificationFilter,
  type NotificationTone,
} from "./shared/notification";
import { Sheet } from "./sheet";
import { Skeleton } from "./skeleton";
import { Text } from "./text";
import { ToggleGroup } from "./toggle";

export type { NotificationCenterLabels, NotificationFilter, NotificationTone };

type Glyph = ReactNode | ((glyph: { color: string; size: number }) => ReactNode);

export type NotificationItem = {
  /** Identifica a notificacao nos callbacks. */
  id: string;
  /** A frase que diz o que aconteceu. Vai em negrito enquanto nao foi lida. */
  title: string;
  /** O detalhe, embaixo do titulo, em ate duas linhas. */
  description?: string;
  /** Quando aconteceu. Sai como `RelativeTime`: "ha 5 minutos". */
  time: Date | string | number;
  /** Ja foi lida. A nao lida ganha o ponto, o negrito e o "Nao lida" para o leitor de tela. */
  read: boolean;
  /** O simbolo a esquerda, escondido do leitor. A funcao recebe a cor do tom. */
  icon?: Glyph;
  /** Pinta o simbolo no tom de estado. Padrao `neutral`. */
  tone?: NotificationTone;
};

const TONE_ROLE = {
  neutral: "fg-muted",
  info: "info-text",
  success: "success-text",
  warning: "warning-text",
  danger: "danger-text",
} as const;

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export type NotificationCenterProps = {
  /** As notificacoes ja carregadas, da mais nova para a mais antiga. A peca nao busca nada. */
  items: NotificationItem[];
  /** Quantas nao lidas existem, quando o servidor sabe mais do que a pagina carregada. */
  unreadCount?: number;
  /** A folha aberta. Controlada, como em todo o pacote nativo. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * O sino do botao. O pacote nao traz icone: a forma que pinta na cor certa e
   * a funcao, `icon={({ color, size }) => <Bell color={color} size={size} />}`.
   */
  icon: Glyph;
  /** Chamado ao tocar numa notificacao. Abrir conta como ler, e a folha fecha. */
  onItemPress?: (item: NotificationItem) => void;
  /** Liga o botao de marcar como lida em cada nao lida. */
  onMarkRead?: (id: string) => void;
  /** Liga o "Marcar todas como lidas" no topo da folha. */
  onMarkAllRead?: () => void;
  /** O filtro, controlado. Sem ele, a peca guarda sozinha, a partir de `all`. */
  filter?: NotificationFilter;
  onFilterChange?: (filter: NotificationFilter) => void;
  /** Ha mais para carregar: liga o "Carregar mais" no fim da lista. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** A proxima pagina esta chegando: o botao gira e nao aceita toque. */
  isLoadingMore?: boolean;
  /** A primeira carga ainda nao voltou: a lista vira marca de lugar. */
  isLoading?: boolean;
  /** O teto do numero no sino: acima dele sai "99+". */
  max?: number;
  /** O agora das datas relativas, para teste e tela congelada. */
  now?: Date;
  /** Os textos da peca, para trocar o idioma ou o termo. */
  labels?: Partial<NotificationCenterLabels>;
  /** Veste o botao do sino. */
  className?: string;
};

export function NotificationCenter({
  items,
  unreadCount,
  open,
  onOpenChange,
  icon,
  onItemPress,
  onMarkRead,
  onMarkAllRead,
  filter,
  onFilterChange,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  isLoading = false,
  max = 99,
  now,
  labels,
  className,
}: NotificationCenterProps) {
  const { colors } = useRivo();
  const text = { ...NOTIFICATION_LABELS, ...labels };
  const [internalFilter, setInternalFilter] = useState<NotificationFilter>("all");
  const active = filter ?? internalFilter;
  const unread = unreadOf(items, unreadCount);
  const visible = active === "unread" ? items.filter((item) => !item.read) : items;
  const sentence = text.unreadCount(unread);
  const previous = useRef(unread);

  useEffect(() => {
    if (unread !== previous.current) AccessibilityInfo.announceForAccessibility(sentence);
    previous.current = unread;
  }, [unread, sentence]);

  const changeFilter = (next: NotificationFilter) => {
    if (next === active) return;
    if (filter === undefined) setInternalFilter(next);
    onFilterChange?.(next);
  };

  const choose = (item: NotificationItem) => {
    onItemPress?.(item);
    if (!item.read) onMarkRead?.(item.id);
    onOpenChange(false);
  };

  const row = (item: NotificationItem) => {
    const color = colors[TONE_ROLE[item.tone ?? "neutral"]];
    const glyph = typeof item.icon === "function" ? item.icon({ color, size: 16 }) : item.icon;
    const spoken = [
      item.read ? null : text.unreadItem,
      item.title,
      item.description ?? null,
    ].filter(Boolean);

    const body = (
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-start gap-2">
          <Text className={cn("flex-1 text-sm text-fg", !item.read && "font-rc-medium")}>
            {item.title}
          </Text>
          {!item.read && (
            <View
              testID="notification-unread"
              className="mt-1.5 size-2 rounded-pill bg-accent-text"
            />
          )}
        </View>
        {item.description ? (
          <Text numberOfLines={2} className="text-sm text-fg-muted">
            {item.description}
          </Text>
        ) : null}
        <RelativeTime value={item.time} now={now} className="text-xs text-fg-subtle" />
      </View>
    );

    return (
      <View className="flex-row items-start gap-3 border-b border-border py-3">
        <View
          {...HIDDEN}
          className="mt-0.5 size-8 items-center justify-center rounded-pill border border-border"
        >
          {glyph}
        </View>

        {onItemPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={spoken.join(", ")}
            onPress={() => choose(item)}
            className="flex-1"
          >
            {body}
          </Pressable>
        ) : (
          <View accessible accessibilityLabel={spoken.join(", ")} className="flex-1">
            {body}
          </View>
        )}

        {!item.read && onMarkRead ? (
          <IconButton
            accessibilityLabel={text.markRead}
            variant="ghost"
            size="sm"
            onPress={() => onMarkRead(item.id)}
          >
            {({ color: ink }) => (
              <View
                className="h-2 w-3.5 -rotate-45 border-b-2 border-l-2"
                style={{ borderColor: ink }}
              />
            )}
          </IconButton>
        ) : null}
      </View>
    );
  };

  const empty = isLoading ? (
    <View
      accessible
      accessibilityLabel="Carregando…"
      accessibilityState={{ busy: true }}
      className="gap-4 py-3"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} className="flex-row gap-3">
          <Skeleton className="size-8 rounded-pill" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </View>
        </View>
      ))}
    </View>
  ) : (
    <EmptyState
      title={active === "unread" ? text.emptyUnreadTitle : text.emptyTitle}
      description={active === "unread" ? text.emptyUnreadDescription : text.emptyDescription}
    />
  );

  return (
    <>
      <IconButton
        accessibilityLabel={unread > 0 ? sentence : text.trigger}
        variant="ghost"
        onPress={() => onOpenChange(true)}
        className={className}
      >
        {(glyph) => (
          <Indicator count={unread} max={max} label={sentence}>
            {typeof icon === "function" ? icon(glyph) : icon}
          </Indicator>
        )}
      </IconButton>

      <Sheet open={open} onOpenChange={onOpenChange} title={text.title}>
        <View className="shrink gap-3">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <ToggleGroup
              items={[
                { label: text.all, value: "all" },
                { label: unread > 0 ? `${text.unread} ${unread}` : text.unread, value: "unread" },
              ]}
              value={[active]}
              onValueChange={(value) => {
                const next = value[0];
                if (next === "all" || next === "unread") changeFilter(next);
              }}
            />
            {onMarkAllRead ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={unread === 0 || isLoading}
                onPress={onMarkAllRead}
              >
                {text.markAllRead}
              </Button>
            ) : null}
          </View>

          {isLoading || visible.length === 0 ? (
            empty
          ) : (
            <FlatList
              data={visible}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => row(item)}
            />
          )}

          {hasMore && onLoadMore && !isLoading ? (
            <Button variant="ghost" size="sm" loading={isLoadingMore} onPress={onLoadMore}>
              {text.loadMore}
            </Button>
          ) : null}
        </View>
      </Sheet>
    </>
  );
}
