import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FlatList,
  Pressable,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { useAnnounce } from "./announce";
import { cn, type Slots } from "./cn";
import { ChevronGlyph } from "./glyph";
import { IconButton } from "./icon-button";
import { useReducedMotion } from "./motion";
import { Text } from "./text";

const GAP = { none: 0, sm: 8, md: 12, lg: 16 } as const;

export type CarouselLabels = {
  slide: (position: number, total: number) => string;
  indicator: (position: number, total: number) => string;
  previous: string;
  next: string;
};

const LABELS: CarouselLabels = {
  slide: (position, total) => `Slide ${position} de ${total}`,
  indicator: (position, total) => `Ir para o slide ${position} de ${total}`,
  previous: "Slide anterior",
  next: "Próximo slide",
};

export type CarouselProps<Item> = {
  /** The carousel name, required: the screen reader announces it on entering the row. */
  label: string;
  items: Item[];
  renderItem: (item: Item, index: number) => ReactNode;
  keyExtractor?: (item: Item, index: number) => string;
  /** The front slide, counting from zero. Controlled, like everything in native. */
  index: number;
  /** Called by the buttons, the dots and the drag, when scrolling settles. */
  onIndexChange: (index: number) => void;
  /**
   * How many slides fit side by side. With one, the row pages by the full width
   * (`pagingEnabled`); with more, it snaps slide by slide.
   */
  slidesPerView?: number;
  /** The gap between slides, in points: 0, 8, 12 or 16. */
  gap?: "none" | "sm" | "md" | "lg";
  /** The previous and next buttons, below the row. On by default. */
  controls?: boolean;
  /** One dot per position instead of the "2 de 5" counter. Off by default. */
  indicators?: boolean;
  /** From the last one, next goes back to the first, and vice versa. */
  loop?: boolean;
  labels?: Partial<CarouselLabels>;
  className?: string;
  /**
   * Class per part: `viewport` (the scrolling window), `slide`, `footer` (the
   * row below), `previous`, `next`, `indicators` and `indicator` (each tappable
   * dot).
   */
  classNames?: Slots<
    "viewport" | "slide" | "footer" | "previous" | "next" | "indicators" | "indicator"
  >;
};

export function Carousel<Item>({
  label,
  items,
  renderItem,
  keyExtractor,
  index,
  onIndexChange,
  slidesPerView = 1,
  gap = "md",
  controls = true,
  indicators = false,
  loop = false,
  labels,
  className,
  classNames,
}: CarouselProps<Item>) {
  const text = { ...LABELS, ...labels };
  const reduced = useReducedMotion();
  const listRef = useRef<FlatList<Item>>(null);
  const [width, setWidth] = useState(0);

  const total = items.length;
  const perView = Math.max(1, Math.floor(slidesPerView));
  const space = perView === 1 ? 0 : GAP[gap];
  const slideWidth = width > 0 ? (width - space * (perView - 1)) / perView : 0;
  const interval = slideWidth + space;
  const last = Math.max(0, total - perView);
  const current = Math.min(Math.max(index, 0), last);

  useEffect(() => {
    if (!listRef.current || interval <= 0) return;
    listRef.current.scrollToOffset({ offset: current * interval, animated: !reduced });
  }, [current, interval, reduced]);

  const go = (target: number) => {
    let next = target;
    if (next > last) next = loop ? 0 : last;
    if (next < 0) next = loop ? last : 0;
    if (next !== current) onIndexChange(next);
  };

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (interval <= 0) return;
    const settled = Math.round(event.nativeEvent.contentOffset.x / interval);
    const next = Math.min(Math.max(settled, 0), last);
    if (next !== current) onIndexChange(next);
  };

  const measure = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const navigable = total > perView;
  const positions = Array.from({ length: last + 1 }, (_, position) => position);
  const slide = text.slide(current + 1, total);
  useAnnounce(navigable && !indicators ? slide : null, { liveRegion: true, fromSilence: false });

  return (
    <View className={cn("gap-3", className)}>
      <View className="absolute h-px w-px overflow-hidden">
        <Text numberOfLines={1}>{label}</Text>
      </View>
      <View onLayout={measure} className={classNames?.viewport}>
        <FlatList
          ref={listRef}
          horizontal
          data={items}
          keyExtractor={(item, position) => keyExtractor?.(item, position) ?? String(position)}
          showsHorizontalScrollIndicator={false}
          pagingEnabled={perView === 1}
          snapToInterval={perView === 1 || interval <= 0 ? undefined : interval}
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={settle}
          getItemLayout={(_, position) => ({
            length: interval,
            offset: interval * position,
            index: position,
          })}
          initialScrollIndex={width > 0 && current > 0 ? current : undefined}
          renderItem={({ item, index: position }) => (
            <View
              style={{
                width: slideWidth || undefined,
                marginRight: position < total - 1 ? space : 0,
              }}
              className={classNames?.slide}
            >
              {renderItem(item, position)}
            </View>
          )}
        />
      </View>

      {navigable && (
        <View className={cn("flex-row items-center justify-center gap-2", classNames?.footer)}>
          {controls && (
            <IconButton
              label={text.previous}
              variant="secondary"
              size="sm"
              disabled={!loop && current <= 0}
              onPress={() => go(current - 1)}
              className={classNames?.previous}
            >
              <ChevronGlyph direction="left" />
            </IconButton>
          )}

          {indicators ? (
            <View
              className={cn("flex-row flex-wrap items-center justify-center", classNames?.indicators)}
            >
              {positions.map((position) => {
                const active = position === current;
                return (
                  <Pressable
                    key={position}
                    accessibilityRole="button"
                    accessibilityLabel={text.indicator(position + 1, total)}
                    accessibilityState={{ selected: active }}
                    hitSlop={10}
                    onPress={() => go(position)}
                    className={cn("size-6 items-center justify-center", classNames?.indicator)}
                  >
                    <View
                      className={cn(
                        "h-2 rounded-pill",
                        active ? "w-4 bg-accent-text" : "w-2 bg-border-strong",
                      )}
                    />
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityLabel={slide}
              className="min-w-12 text-center text-sm text-fg-muted"
            >
              {current + 1} de {total}
            </Text>
          )}

          {controls && (
            <IconButton
              label={text.next}
              variant="secondary"
              size="sm"
              disabled={!loop && current >= last}
              onPress={() => go(current + 1)}
              className={classNames?.next}
            >
              <ChevronGlyph direction="right" />
            </IconButton>
          )}
        </View>
      )}
    </View>
  );
}
