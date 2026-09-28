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

test("the row carries the label's name and draws one slide per item", () => {
  const { screen } = carousel();
  const [name] = byType(screen, "Text").filter((node) => node.props.children === "Planos");
  expect(name).toBeDefined();
  let above = name!.parent;
  while (above) {
    if (typeof above.type === "string") {
      expect(above.props.accessible).not.toBe(true);
      expect(above.props.accessibilityElementsHidden).not.toBe(true);
      expect(above.props.importantForAccessibility).not.toBe("no-hide-descendants");
    }
    above = above.parent;
  }
  let box = name!.parent;
  while (box && typeof box.type !== "string") box = box.parent;
  const tokens = String(box?.props.className).split(" ");
  expect(tokens).not.toContain("h-0");
  expect(tokens).not.toContain("w-0");
  expect(textOf(screen)).toContain("Profissional");
  expect(byType(screen, "FlatList")[0]!.props.horizontal).toBe(true);
});

test("one at a time pages by the full width", () => {
  const { screen } = carousel();
  const list = byType(screen, "FlatList")[0]!;
  expect(list.props.pagingEnabled).toBe(true);
  expect(list.props.snapToInterval).toBeUndefined();
});

test("several at a time snap slide by slide, with the gap", () => {
  const { screen } = carousel({ slidesPerView: 2, gap: "md" });
  layout(screen, 312);
  const list = byType(screen, "FlatList")[0]!;
  expect(list.props.pagingEnabled).toBe(false);
  expect(list.props.snapToInterval).toBe(162);
});

test("next asks for the following slide, and previous starts disabled", () => {
  const { screen, onIndexChange } = carousel();
  const [previous] = byLabel(screen, "Slide anterior");
  expect(previous!.props.accessibilityState.disabled).toBe(true);
  act(() => byLabel(screen, "Próximo slide")[0]!.props.onPress());
  expect(onIndexChange).toHaveBeenLastCalledWith(1);
});

test("on the last one, next disables; with loop, it goes back to the first", () => {
  const first = carousel({ index: 4 });
  expect(byLabel(first.screen, "Próximo slide")[0]!.props.accessibilityState.disabled).toBe(true);

  const looped = carousel({ index: 4, loop: true });
  const [next] = byLabel(looped.screen, "Próximo slide");
  expect(next!.props.accessibilityState.disabled).toBe(false);
  act(() => next!.props.onPress());
  expect(looped.onIndexChange).toHaveBeenLastCalledWith(0);
});

test("without dots, the counter says the position in a live region", () => {
  const { screen } = carousel({ index: 1 });
  const [counter] = byLabel(screen, "Slide 2 de 5");
  expect(counter!.props.accessibilityLiveRegion).toBe("polite");
  expect(textOf(screen)).toContain("2 de 5");
});

test("the dots are one per position, mark the current one and take you to it", () => {
  const { screen, onIndexChange } = carousel({ indicators: true, slidesPerView: 3 });
  const dots = byRole(screen, "button").filter((node) =>
    String(node.props.accessibilityLabel).startsWith("Ir para o slide"),
  );
  expect(dots).toHaveLength(3);
  expect(dots[0]!.props.accessibilityState.selected).toBe(true);
  act(() => dots[2]!.props.onPress());
  expect(onIndexChange).toHaveBeenLastCalledWith(2);
});

test("a drag that settles tells the controller the new slide", () => {
  const { screen, onIndexChange } = carousel();
  layout(screen, 300);
  const list = byType(screen, "FlatList")[0]!;
  act(() => list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 600 } } }));
  expect(onIndexChange).toHaveBeenLastCalledWith(2);
});

test("the controlled slide scrolls the row, without animating when the system asks", () => {
  const { screen } = carousel({ index: 2 });
  layout(screen, 300);
  expect(flatListScrolls.at(-1)).toEqual({ offset: 600, animated: true });

  flatListScrolls.length = 0;
  reduceMotion(true);
  const still = carousel({ index: 1 });
  layout(still.screen, 300);
  expect(flatListScrolls.at(-1)).toEqual({ offset: 300, animated: false });
});

test("with a single slide, there are no controls at all", () => {
  const { screen } = carousel({ items: ["Básico"], indicators: true });
  expect(byRole(screen, "button")).toHaveLength(0);
});
