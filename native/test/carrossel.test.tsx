import { afterEach, expect, mock, test } from "bun:test";
import { AccessibilityInfo, Text } from "react-native";

import { Carousel, type CarouselProps } from "../src";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

const PLANS = ["Básico", "Profissional", "Empresa", "Contador", "Franquia"];

const { flatListScrolls } = (await import("react-native")) as unknown as {
  flatListScrolls: Array<{ offset?: number; animated?: boolean }>;
};

const reduceMotion = (enabled: boolean) =>
  act(() =>
    (AccessibilityInfo as unknown as { setReduceMotion: (next: boolean) => void }).setReduceMotion(
      enabled,
    ),
  );

afterEach(() => {
  reduceMotion(false);
  flatListScrolls.length = 0;
});

function carousel(props: Partial<CarouselProps<string>> = {}) {
  const onIndexChange = mock<(index: number) => void>(() => {});
  const screen = render(
    <Carousel
      label="Planos"
      items={PLANS}
      index={0}
      onIndexChange={onIndexChange}
      renderItem={(plan) => <Text>{plan}</Text>}
      {...props}
    />,
  );
  return { screen, onIndexChange };
}

const layout = (screen: ReturnType<typeof render>, width: number) => {
  const measured = screen.root.findAll(
    (node) => typeof node.type === "string" && typeof node.props.onLayout === "function",
  );
  act(() => measured[0]!.props.onLayout({ nativeEvent: { layout: { width, height: 200 } } }));
};

test("a fileira leva o nome do label e desenha um slide por item", () => {
  const { screen } = carousel();
  expect(byLabel(screen, "Planos")).toHaveLength(1);
  expect(textOf(screen)).toContain("Profissional");
  expect(byType(screen, "FlatList")[0]!.props.horizontal).toBe(true);
});

test("um por vez pagina pela largura inteira", () => {
  const { screen } = carousel();
  const list = byType(screen, "FlatList")[0]!;
  expect(list.props.pagingEnabled).toBe(true);
  expect(list.props.snapToInterval).toBeUndefined();
});

test("varios por vez assentam de slide em slide, com o vao", () => {
  const { screen } = carousel({ slidesPerView: 2, gap: "md" });
  layout(screen, 312);
  const list = byType(screen, "FlatList")[0]!;
  expect(list.props.pagingEnabled).toBe(false);
  expect(list.props.snapToInterval).toBe(162);
});

test("proximo pede o slide seguinte, e anterior nasce desabilitado", () => {
  const { screen, onIndexChange } = carousel();
  const [previous] = byLabel(screen, "Slide anterior");
  expect(previous!.props.accessibilityState.disabled).toBe(true);
  act(() => byLabel(screen, "Próximo slide")[0]!.props.onPress());
  expect(onIndexChange).toHaveBeenLastCalledWith(1);
});

test("no ultimo, proximo desabilita; com loop, volta ao primeiro", () => {
  const first = carousel({ index: 4 });
  expect(byLabel(first.screen, "Próximo slide")[0]!.props.accessibilityState.disabled).toBe(true);

  const looped = carousel({ index: 4, loop: true });
  const [next] = byLabel(looped.screen, "Próximo slide");
  expect(next!.props.accessibilityState.disabled).toBe(false);
  act(() => next!.props.onPress());
  expect(looped.onIndexChange).toHaveBeenLastCalledWith(0);
});

test("sem pontos, o contador diz a posicao numa regiao viva", () => {
  const { screen } = carousel({ index: 1 });
  const [counter] = byLabel(screen, "Slide 2 de 5");
  expect(counter!.props.accessibilityLiveRegion).toBe("polite");
  expect(textOf(screen)).toContain("2 de 5");
});

test("os pontos sao um por posicao, marcam o atual e levam ate ela", () => {
  const { screen, onIndexChange } = carousel({ indicators: true, slidesPerView: 3 });
  const dots = byRole(screen, "button").filter((node) =>
    String(node.props.accessibilityLabel).startsWith("Ir para o slide"),
  );
  expect(dots).toHaveLength(3);
  expect(dots[0]!.props.accessibilityState.selected).toBe(true);
  act(() => dots[2]!.props.onPress());
  expect(onIndexChange).toHaveBeenLastCalledWith(2);
});

test("o arrasto que assenta diz o slide novo a quem controla", () => {
  const { screen, onIndexChange } = carousel();
  layout(screen, 300);
  const list = byType(screen, "FlatList")[0]!;
  act(() => list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 600 } } }));
  expect(onIndexChange).toHaveBeenLastCalledWith(2);
});

test("o slide controlado rola a fileira, sem animar quando o sistema pede", () => {
  const { screen } = carousel({ index: 2 });
  layout(screen, 300);
  expect(flatListScrolls.at(-1)).toEqual({ offset: 600, animated: true });

  flatListScrolls.length = 0;
  reduceMotion(true);
  const still = carousel({ index: 1 });
  layout(still.screen, 300);
  expect(flatListScrolls.at(-1)).toEqual({ offset: 300, animated: false });
});

test("com um slide so, nao ha controle nenhum", () => {
  const { screen } = carousel({ items: ["Básico"], indicators: true });
  expect(byRole(screen, "button")).toHaveLength(0);
});
