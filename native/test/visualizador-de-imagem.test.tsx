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

test("a grade nomeia cada miniatura pelo alt, e o toque abre a imagem", () => {
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

test("anterior e proximo navegam e travam nas pontas; com loop dao a volta", () => {
  const screen = render(<Controlled start={0} />);
  expect(byLabel(screen, "Imagem anterior")[0]!.props.accessibilityState.disabled).toBe(true);
  press(screen, "Próxima imagem");
  expect(textOf(screen)).toContain("2 de 8");

  const looped = render(<Controlled start={7} loop />);
  press(looped, "Próxima imagem");
  expect(textOf(looped)).toContain("1 de 8");
});

test("o xis e o voltar do sistema fecham com null", () => {
  const onIndexChange = mock<(index: number | null) => void>(() => {});
  const screen = render(<Controlled start={1} onIndexChange={onIndexChange} />);
  press(screen, "Fechar");
  expect(onIndexChange).toHaveBeenLastCalledWith(null);
  expect(byType(screen, "Modal")).toHaveLength(0);

  const again = render(<Controlled start={1} onIndexChange={onIndexChange} />);
  act(() => byType(again, "Modal")[0]!.props.onRequestClose());
  expect(onIndexChange).toHaveBeenLastCalledWith(null);
});

test("enquanto carrega, o giro diz o que espera e o zoom nao liga; se falha, diz isso", () => {
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

test("mais e menos mexem no zoom, e o menos trava no tamanho que cabe", () => {
  const screen = render(<Controlled start={0} />);
  load(screen, 0);
  expect(byLabel(screen, "Diminuir o zoom")[0]!.props.accessibilityState.disabled).toBe(true);
  press(screen, "Aumentar o zoom");
  expect(scaleOf(screen, 0)).toBe(1.5);
  press(screen, "Diminuir o zoom");
  expect(scaleOf(screen, 0)).toBe(1);
});

test("o toque duplo dobra o zoom, e o segundo volta", () => {
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

test("a pinca de dois dedos aproxima, e para no maxZoom", () => {
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

test("com zoom a fileira nao rola, para o dedo arrastar a foto e nao trocar de foto", () => {
  const screen = render(<Controlled start={0} />);
  load(screen, 0);
  const list = () => byType(screen, "FlatList")[0]!;
  expect(list().props.scrollEnabled).toBe(true);
  press(screen, "Aumentar o zoom");
  expect(list().props.scrollEnabled).toBe(false);
});

test("deslizar pagina, e a pagina que assenta vira a imagem aberta", () => {
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

test("carrega antes as duas vizinhas", () => {
  render(<Controlled start={3} />);
  expect(prefetched).toContain(PHOTOS[2]!.src);
  expect(prefetched).toContain(PHOTOS[4]!.src);
});

test("sem imagens, nao desenha nada; sem grade, so o index abre", () => {
  const empty = render(<Controlled images={[]} start={0} />);
  expect(byType(empty, "Modal")).toHaveLength(0);
  expect(byType(empty, "Image")).toHaveLength(0);

  const bare = render(<Controlled thumbnails={false} />);
  expect(byRole(bare, "imagebutton")).toHaveLength(0);
});

test("o tipo recusa imagem sem alt", () => {
  // @ts-expect-error alt e obrigatorio
  const missing: ImageViewerImage = { src: "https://exemplo.com.br/sala.jpg" };
  expect(missing).toBeDefined();
});
