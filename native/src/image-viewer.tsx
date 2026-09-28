import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { useAnnounce } from "./announce";
import { cn, type Slots } from "./cn";
import { ChevronGlyph, CrossGlyph, PlusGlyph } from "./glyph";
import { Grid } from "./grid";
import { IconButton } from "./icon-button";
import { useReducedMotion } from "./motion";
import { tokens } from "../tokens";
import { ZOOM_REST, ZOOM_STEP, clampZoom, zoomAround, type ZoomView } from "./shared/zoom";
import { Text } from "./text";

const DOUBLE_TAP = 300;

const MEDIA = tokens.media;

const CONTROL = {
  backgroundColor: MEDIA["media-control"],
  borderColor: MEDIA["media-border"],
} as const;

export type ImageViewerImage = {
  src: string;
  alt: string;
  caption?: string;
  thumbnail?: string;
};

export type ImageViewerLabels = {
  counter: (position: number, total: number) => string;
  previous: string;
  next: string;
  close: string;
  zoomIn: string;
  zoomOut: string;
  loading: string;
  error: string;
};

const LABELS: ImageViewerLabels = {
  counter: (position, total) => `${position} de ${total}`,
  previous: "Imagem anterior",
  next: "Próxima imagem",
  close: "Fechar",
  zoomIn: "Aumentar o zoom",
  zoomOut: "Diminuir o zoom",
  loading: "Carregando a imagem",
  error: "Não foi possível carregar a imagem.",
};

export type ImageViewerProps = {
  /**
   * The images, in navigation order. `alt` is required on each one: it is the
   * thumbnail's name and what the screen reader hears on switching images.
   */
  images: ImageViewerImage[];
  /** The open image, counting from zero, or `null` with the viewer closed. */
  index: number | null;
  /** Called on opening from the thumbnail, on navigating and with `null` on closing. */
  onIndexChange: (index: number | null) => void;
  /** Draws the thumbnail grid that opens the viewer. On by default. */
  thumbnails?: boolean;
  /** From the last one, next goes back to the first, and vice versa. */
  loop?: boolean;
  /** The maximum zoom, in multiples of the size that fits the screen. Without it, 4. */
  maxZoom?: number;
  labels?: Partial<ImageViewerLabels>;
  /** Styles the thumbnail grid, the same element as `classNames.thumbnails`. */
  className?: string;
  /**
   * Class per part: `thumbnails` (the grid), `thumbnail` (each tappable
   * thumbnail), `viewer` (the full screen), `toolbar`, `counter`, `stage` (the
   * image area), `image` and `caption`.
   */
  classNames?: Slots<
    "thumbnails" | "thumbnail" | "viewer" | "toolbar" | "counter" | "stage" | "image" | "caption"
  >;
};

const distanceOf = (event: GestureResponderEvent) => {
  const [a, b] = event.nativeEvent.touches;
  if (!a || !b) return 0;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
};

export function ImageViewer({
  images,
  index,
  onIndexChange,
  thumbnails = true,
  loop = false,
  maxZoom = 4,
  labels,
  className,
  classNames,
}: ImageViewerProps) {
  const text = { ...LABELS, ...labels };
  const reduced = useReducedMotion();
  const total = images.length;
  const current = index !== null && index >= 0 && index < total ? index : null;
  const image = current === null ? undefined : images[current];

  const listRef = useRef<FlatList<ImageViewerImage>>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<ZoomView>(ZOOM_REST);
  const viewRef = useRef(view);
  viewRef.current = view;
  const [settled, setSettled] = useState<Record<string, "ready" | "error">>({});
  const status = (image && settled[image.src]) || "loading";
  const lastTap = useRef(0);

  const clamp = (next: ZoomView) => clampZoom(next, maxZoom, size.width, size.height);
  const around = (from: ZoomView, target: number) =>
    zoomAround(from, target, 0, 0, maxZoom, size.width, size.height);
  const clampRef = useRef(clamp);
  clampRef.current = clamp;
  const aroundRef = useRef(around);
  aroundRef.current = around;

  useEffect(() => {
    setView(ZOOM_REST);
  }, [current]);

  useEffect(() => {
    if (current === null) return;
    for (const position of [current - 1, current + 1]) {
      const neighbor = images[loop ? (position + total) % total : position];
      if (neighbor && neighbor !== image) Image.prefetch?.(neighbor.src);
    }
  }, [current, image, images, loop, total]);

  useEffect(() => {
    if (current === null || size.width === 0 || !listRef.current) return;
    listRef.current.scrollToOffset({ offset: current * size.width, animated: !reduced });
  }, [current, size.width, reduced]);

  const responder = useMemo(() => {
    let start = { view: ZOOM_REST, distance: 0, x: 0, y: 0 };
    return PanResponder.create({
      onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (event) =>
        event.nativeEvent.touches.length >= 2 || viewRef.current.zoom > 1,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event, gesture) => {
        start = {
          view: viewRef.current,
          distance: distanceOf(event),
          x: gesture.dx,
          y: gesture.dy,
        };
      },
      onPanResponderMove: (event, gesture) => {
        const distance = distanceOf(event);
        if (distance > 0) {
          if (start.distance === 0) start = { ...start, view: viewRef.current, distance };
          setView(aroundRef.current(start.view, start.view.zoom * (distance / start.distance)));
          return;
        }
        if (start.distance > 0) {
          start = { view: viewRef.current, distance: 0, x: gesture.dx, y: gesture.dy };
          return;
        }
        setView(
          clampRef.current({
            zoom: start.view.zoom,
            x: start.view.x + gesture.dx - start.x,
            y: start.view.y + gesture.dy - start.y,
          }),
        );
      },
    });
  }, []);

  const change = (next: number | null) => {
    if (next !== current) onIndexChange(next);
  };

  const step = (delta: number) => {
    if (current === null) return;
    let next = current + delta;
    if (next >= total) next = loop ? 0 : total - 1;
    if (next < 0) next = loop ? total - 1 : 0;
    change(next);
  };

  const tap = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP) {
      lastTap.current = 0;
      setView(viewRef.current.zoom > 1 ? ZOOM_REST : around(ZOOM_REST, 2));
      return;
    }
    lastTap.current = now;
  };

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (size.width === 0) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / size.width);
    if (next >= 0 && next < total) change(next);
  };

  const measure = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  const counter = current === null ? "" : text.counter(current + 1, total);
  const spoken = image ? `${counter}: ${image.alt}` : counter;
  useAnnounce(current === null ? null : spoken, { liveRegion: true, fromSilence: false });

  if (total === 0) return null;

  const atStart = !loop && current === 0;
  const atEnd = !loop && current === total - 1;

  return (
    <>
      {thumbnails && (
        <View className={cn(className, classNames?.thumbnails)}>
          <Grid minItemWidth={96} gap="sm">
            {images.map((item, position) => (
              <Pressable
                key={`${item.src}-${position}`}
                accessibilityRole="imagebutton"
                accessibilityLabel={item.alt}
                onPress={() => change(position)}
                className={cn(
                  "aspect-square overflow-hidden rounded-md border border-border bg-surface active:opacity-80",
                  classNames?.thumbnail,
                )}
              >
                <Image
                  source={{ uri: item.thumbnail ?? item.src }}
                  resizeMode="cover"
                  className="size-full"
                />
              </Pressable>
            ))}
          </Grid>
        </View>
      )}

      <Modal
        visible={current !== null}
        animationType={reduced ? "none" : "fade"}
        onRequestClose={() => change(null)}
        supportedOrientations={["portrait", "landscape"]}
      >
        <View
          accessibilityViewIsModal
          style={{ backgroundColor: MEDIA["media-stage"] }}
          className={cn("flex-1 pt-12 pb-8", classNames?.viewer)}
        >
          <View className={cn("flex-row items-center gap-2 px-4 pb-3", classNames?.toolbar)}>
            <Text
              accessibilityLiveRegion="polite"
              accessibilityLabel={spoken}
              style={{ color: MEDIA["media-fg-muted"] }}
              className={cn("text-sm", classNames?.counter)}
            >
              {counter}
            </Text>
            <View className="ml-auto flex-row items-center gap-2">
              <IconButton
                label={text.zoomOut}
                variant="secondary"
                style={CONTROL}
                disabled={view.zoom <= 1}
                onPress={() => setView(around(view, view.zoom / ZOOM_STEP))}
              >
                <PlusGlyph minus color={MEDIA["media-fg"]} />
              </IconButton>
              <IconButton
                label={text.zoomIn}
                variant="secondary"
                style={CONTROL}
                disabled={view.zoom >= maxZoom || status !== "ready"}
                onPress={() => setView(around(view, view.zoom * ZOOM_STEP))}
              >
                <PlusGlyph color={MEDIA["media-fg"]} />
              </IconButton>
              <IconButton
                label={text.close}
                variant="secondary"
                style={CONTROL}
                onPress={() => change(null)}
              >
                <CrossGlyph color={MEDIA["media-fg"]} />
              </IconButton>
            </View>
          </View>

          <View className={cn("flex-1", classNames?.stage)} onLayout={measure}>
            <FlatList
              ref={listRef}
              horizontal
              pagingEnabled
              data={images}
              keyExtractor={(item, position) => `${item.src}-${position}`}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={view.zoom === 1}
              onMomentumScrollEnd={settle}
              initialScrollIndex={current !== null && size.width > 0 ? current : undefined}
              getItemLayout={(_, position) => ({
                length: size.width,
                offset: size.width * position,
                index: position,
              })}
              renderItem={({ item, index: position }) => {
                const active = position === current;
                const shown = active ? view : ZOOM_REST;
                return (
                  <View
                    style={{ width: size.width || undefined, height: size.height || undefined }}
                    className="items-center justify-center overflow-hidden"
                    {...(active ? responder.panHandlers : {})}
                  >
                    <Pressable
                      accessible={false}
                      onPress={active ? tap : undefined}
                      className="size-full items-center justify-center"
                    >
                      <Image
                        accessible
                        accessibilityLabel={item.alt}
                        source={{ uri: item.src }}
                        resizeMode="contain"
                        onLoad={() => setSettled((all) => ({ ...all, [item.src]: "ready" }))}
                        onError={() => setSettled((all) => ({ ...all, [item.src]: "error" }))}
                        className={classNames?.image}
                        style={{
                          width: size.width || undefined,
                          height: size.height || undefined,
                          transform: [
                            { translateX: shown.x },
                            { translateY: shown.y },
                            { scale: shown.zoom },
                          ],
                        }}
                      />
                    </Pressable>
                  </View>
                );
              }}
            />

            {status === "loading" && (
              <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
                <ActivityIndicator
                  accessibilityLabel={text.loading}
                  size="large"
                  color={MEDIA["media-fg-muted"]}
                />
              </View>
            )}

            {status === "error" && (
              <View
                pointerEvents="none"
                className="absolute inset-0 items-center justify-center p-6"
              >
                <Text
                  accessibilityRole="alert"
                  style={{ color: MEDIA["media-fg-muted"] }}
                  className="text-center text-sm"
                >
                  {text.error}
                </Text>
              </View>
            )}
          </View>

          <View className="gap-3 px-4 pt-3">
            {image?.caption ? (
              <Text
                style={{ color: MEDIA["media-fg"] }}
                className={cn("text-center text-sm", classNames?.caption)}
              >
                {image.caption}
              </Text>
            ) : null}
            {total > 1 && (
              <View className="flex-row items-center justify-center gap-3">
                <IconButton
                  label={text.previous}
                  variant="secondary"
                  style={CONTROL}
                  disabled={atStart}
                  onPress={() => step(-1)}
                >
                  <ChevronGlyph direction="left" color={MEDIA["media-fg"]} />
                </IconButton>
                <IconButton
                  label={text.next}
                  variant="secondary"
                  style={CONTROL}
                  disabled={atEnd}
                  onPress={() => step(1)}
                >
                  <ChevronGlyph direction="right" color={MEDIA["media-fg"]} />
                </IconButton>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
