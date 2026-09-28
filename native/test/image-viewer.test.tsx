import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { useState } from "react";
import { Image } from "react-native";

import { ImageViewer, type ImageViewerImage, type ImageViewerProps } from "../src";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

const PHOTOS: ImageViewerImage[] = Array.from({ length: 8 }, (_, position) => ({
  src: `https://exemplo.com.br/fotos/sala-${position + 1}.jpg`,
  alt: `Sala comercial, foto ${position + 1}`,
  caption: position === 2 ? "Recepção com vista para a avenida" : undefined,
}));

type Responder = {
  onPanResponderGrant: (event: unknown, gesture: unknown) => void;
  onPanResponderMove: (event: unknown, gesture: unknown) => void;
};

const { panResponders } = (await import("react-native")) as unknown as {
  panResponders: Responder[];
};

const prefetched: string[] = [];
beforeEach(() => {
  prefetched.length = 0;
  (Image as unknown as { prefetch: (uri: string) => void }).prefetch = (uri) => {
    prefetched.push(uri);
  };
});
afterEach(() => {
  delete (Image as unknown as { prefetch?: unknown }).prefetch;
});

function Controlled(props: Partial<ImageViewerProps> & { start?: number | null }) {
  const [index, setIndex] = useState<number | null>(props.start ?? null);
  return (
    <ImageViewer
      images={PHOTOS}
      index={index}
      {...props}
      onIndexChange={(next) => {
        props.onIndexChange?.(next);
        setIndex(next);
      }}
    />
  );
}

const big = (screen: ReturnType<typeof render>, position: number) =>
  byType(screen, "Image").find(
    (node) => node.props.accessibilityLabel === PHOTOS[position]!.alt && node.props.accessible,
  )!;

const scaleOf = (screen: ReturnType<typeof render>, position: number) => {
  const transform = big(screen, position).props.style.transform as Array<{ scale?: number }>;
  return transform.find((part) => part.scale !== undefined)!.scale;
};

const load = (screen: ReturnType<typeof render>, position: number) =>
  act(() => big(screen, position).props.onLoad());

const press = (screen: ReturnType<typeof render>, label: string) =>
  act(() => byLabel(screen, label)[0]!.props.onPress());

test("the grid names each thumbnail by its alt, and a tap opens the image", () => {
  const onIndexChange = mock<(index: number | null) => void>(() => {});
  const screen = render(<Controlled onIndexChange={onIndexChange} />);
  expect(byType(screen, "Modal")).toHaveLength(0);

  const [third] = byLabel(screen, "Sala comercial, foto 3");
  expect(third!.props.accessibilityRole).toBe("imagebutton");
  act(() => third!.props.onPress());

  expect(onIndexChange).toHaveBeenLastCalledWith(2);
  expect(byType(screen, "Modal")).toHaveLength(1);
  expect(textOf(screen)).toContain("3 de 8");
  expect(byLabel(screen, "3 de 8: Sala comercial, foto 3")[0]!.props.accessibilityLiveRegion).toBe(
    "polite",
  );
  expect(textOf(screen)).toContain("Recepção com vista para a avenida");
});

test("previous and next navigate and stop at the ends; with loop they wrap around", () => {
  const screen = render(<Controlled start={0} />);
  expect(byLabel(screen, "Imagem anterior")[0]!.props.accessibilityState.disabled).toBe(true);
  press(screen, "Próxima imagem");
  expect(textOf(screen)).toContain("2 de 8");

  const looped = render(<Controlled start={7} loop />);
  press(looped, "Próxima imagem");
  expect(textOf(looped)).toContain("1 de 8");
});

test("the x and the system back close with null", () => {
  const onIndexChange = mock<(index: number | null) => void>(() => {});
  const screen = render(<Controlled start={1} onIndexChange={onIndexChange} />);
  press(screen, "Fechar");
  expect(onIndexChange).toHaveBeenLastCalledWith(null);
  expect(byType(screen, "Modal")).toHaveLength(0);

  const again = render(<Controlled start={1} onIndexChange={onIndexChange} />);
  act(() => byType(again, "Modal")[0]!.props.onRequestClose());
  expect(onIndexChange).toHaveBeenLastCalledWith(null);
});

test("while loading, the spinner says what it waits for and zoom does not turn on; if it fails, it says so", () => {
  const screen = render(<Controlled start={0} />);
  expect(byLabel(screen, "Carregando a imagem")).toHaveLength(1);
  expect(byLabel(screen, "Aumentar o zoom")[0]!.props.accessibilityState.disabled).toBe(true);

  load(screen, 0);
  expect(byLabel(screen, "Carregando a imagem")).toHaveLength(0);
  expect(byLabel(screen, "Aumentar o zoom")[0]!.props.accessibilityState.disabled).toBe(false);

  const broken = render(<Controlled start={0} />);
  act(() => big(broken, 0).props.onError());
  expect(byRole(broken, "alert")[0]!.props.children).toBe("Não foi possível carregar a imagem.");
});

test("a neighbor that finishes loading later does not bring the spinner back over the open photo", () => {
  const screen = render(<Controlled start={0} />);
  load(screen, 0);
  load(screen, 1);
  expect(byLabel(screen, "Carregando a imagem")).toHaveLength(0);
  expect(byLabel(screen, "Aumentar o zoom")[0]!.props.accessibilityState.disabled).toBe(false);

  act(() => big(screen, 2).props.onError());
  expect(byRole(screen, "alert")).toHaveLength(0);
  expect(byLabel(screen, "Carregando a imagem")).toHaveLength(0);
});

test("plus and minus change the zoom, and minus stops at the size that fits", () => {
  const screen = render(<Controlled start={0} />);
  load(screen, 0);
  expect(byLabel(screen, "Diminuir o zoom")[0]!.props.accessibilityState.disabled).toBe(true);
  press(screen, "Aumentar o zoom");
  expect(scaleOf(screen, 0)).toBe(1.5);
  press(screen, "Diminuir o zoom");
  expect(scaleOf(screen, 0)).toBe(1);
});

test("a double tap doubles the zoom, and the second one reverts", () => {
  const screen = render(<Controlled start={0} />);
  load(screen, 0);
  const tapper = () => byType(screen, "Pressable").find((node) => node.props.accessible === false)!;
  act(() => tapper().props.onPress());
  act(() => tapper().props.onPress());
  expect(scaleOf(screen, 0)).toBe(2);
  act(() => tapper().props.onPress());
  act(() => tapper().props.onPress());
  expect(scaleOf(screen, 0)).toBe(1);
});

test("a two-finger pinch zooms in, and stops at maxZoom", () => {
  const screen = render(<Controlled start={0} maxZoom={3} />);
  load(screen, 0);
  const responder = panResponders.at(-1)!;
  const touches = (distance: number) => ({
    nativeEvent: {
      touches: [
        { pageX: 0, pageY: 0 },
        { pageX: distance, pageY: 0 },
      ],
    },
  });
  act(() => responder.onPanResponderGrant(touches(100), { dx: 0, dy: 0 }));
  act(() => responder.onPanResponderMove(touches(200), { dx: 0, dy: 0 }));
  expect(scaleOf(screen, 0)).toBe(2);
  act(() => responder.onPanResponderMove(touches(500), { dx: 0, dy: 0 }));
  expect(scaleOf(screen, 0)).toBe(3);
});

test("with zoom the row does not scroll, so the finger drags the photo and does not change photo", () => {
  const screen = render(<Controlled start={0} />);
  load(screen, 0);
  const list = () => byType(screen, "FlatList")[0]!;
  expect(list().props.scrollEnabled).toBe(true);
  press(screen, "Aumentar o zoom");
  expect(list().props.scrollEnabled).toBe(false);
});

test("swiping pages, and the page that settles becomes the open image", () => {
  const onIndexChange = mock<(index: number | null) => void>(() => {});
  const screen = render(<Controlled start={0} onIndexChange={onIndexChange} />);
  const stage = screen.root.findAll(
    (node) =>
      typeof node.type === "string" &&
      typeof node.props.onLayout === "function" &&
      node.props.className === "flex-1",
  )[0]!;
  act(() => stage.props.onLayout({ nativeEvent: { layout: { width: 390, height: 600 } } }));
  const list = byType(screen, "FlatList")[0]!;
  expect(list.props.pagingEnabled).toBe(true);
  act(() => list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 780 } } }));
  expect(onIndexChange).toHaveBeenLastCalledWith(2);
});

test("preloads the two neighbors", () => {
  render(<Controlled start={3} />);
  expect(prefetched).toContain(PHOTOS[2]!.src);
  expect(prefetched).toContain(PHOTOS[4]!.src);
});

test("without images, draws nothing; without a grid, only index opens", () => {
  const empty = render(<Controlled images={[]} start={0} />);
  expect(byType(empty, "Modal")).toHaveLength(0);
  expect(byType(empty, "Image")).toHaveLength(0);

  const bare = render(<Controlled thumbnails={false} />);
  expect(byRole(bare, "imagebutton")).toHaveLength(0);
});

test("the type refuses an image without alt", () => {
  // @ts-expect-error alt is required
  const missing: ImageViewerImage = { src: "https://exemplo.com.br/sala.jpg" };
  expect(missing).toBeDefined();
});
