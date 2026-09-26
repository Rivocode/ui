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
  /** O nome do carrossel, obrigatorio: o leitor de tela o anuncia ao entrar na fileira. */
  label: string;
  items: Item[];
  renderItem: (item: Item, index: number) => ReactNode;
  keyExtractor?: (item: Item, index: number) => string;
  /** O slide da frente, contando de zero. Controlado, como tudo no nativo. */
  index: number;
  /** Chamado pelos botoes, pelos pontos e pelo arrasto, quando a rolagem assenta. */
  onIndexChange: (index: number) => void;
  /**
   * Quantos slides cabem lado a lado. Com um, a fileira pagina pela largura
   * inteira (`pagingEnabled`); com mais, assenta de slide em slide.
   */
  slidesPerView?: number;
  /** O vao entre os slides, em pontos: 0, 8, 12 ou 16. */
  gap?: "none" | "sm" | "md" | "lg";
  /** Os botoes anterior e proximo, embaixo da fileira. Ligados por padrao. */
  controls?: boolean;
  /** Um ponto por posicao no lugar do contador "2 de 5". Desligados por padrao. */
  indicators?: boolean;
  /** Do ultimo, o proximo volta ao primeiro, e vice-versa. */
  loop?: boolean;
  labels?: Partial<CarouselLabels>;
  className?: string;
  /**
   * Classe por parte: `viewport` (a janela que rola), `slide`, `footer` (a
   * fileira embaixo), `previous`, `next`, `indicators` e `indicator` (cada
   * ponto tocavel).
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
      <View className="absolute h-0 w-0 overflow-hidden">
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
