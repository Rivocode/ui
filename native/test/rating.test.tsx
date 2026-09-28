import { expect, mock, test } from "bun:test";

import { I18nManager } from "../../test/react-native-mock";
import { Rating, type RatingProps } from "../src";
import { act, byRole, byType, render } from "./helpers";

function rating(props: Partial<RatingProps> = {}) {
  const onValueChange = mock<(value: number) => void>(() => {});
  const screen = render(<Rating value={0} onValueChange={onValueChange} {...props} />);
  return { screen, onValueChange };
}

const fills = (screen: ReturnType<typeof render>) =>
  screen.root
    .findAll((node) => typeof node.type === "string" && node.props.testID === "rating-fill")
    .map((node) => node.props.style.width as number);

const tap = (screen: ReturnType<typeof render>, index: number, locationX = 30) =>
  act(() => byType(screen, "Pressable")[index]!.props.onPress({ nativeEvent: { locationX } }));

test("the group is a single adjustable control, with the name and the rating spoken in full", () => {
  const { screen } = rating({ value: 3 });
  const [group] = byRole(screen, "adjustable");
  expect(group!.props.accessibilityLabel).toBe("Avaliação");
  expect(group!.props.accessibilityValue).toEqual({ min: 0, max: 5, now: 3, text: "3 estrelas" });
});

test("the stars stay out of the accessibility tree, and each one has a 44pt target", () => {
  const { screen } = rating({ size: "sm" });
  const stars = byType(screen, "Pressable");
  expect(stars).toHaveLength(5);
  for (const star of stars)
    expect(star.props.importantForAccessibility).toBe("no-hide-descendants");

  const boxes = screen.root.findAll(
    (node) => typeof node.type === "string" && node.props.testID === "rating-star",
  );
  expect(boxes.every((box) => box.props.style.width === 44 && box.props.style.height === 44)).toBe(
    true,
  );
});

test("tapping the third star picks 3, and the rating paints up to it", () => {
  const { screen, onValueChange } = rating({ value: 3 });
  expect(fills(screen)).toEqual([44, 44, 44, 0, 0]);

  const other = rating({ value: 0 });
  tap(other.screen, 2);
  expect(other.onValueChange).toHaveBeenCalledWith(3);
  expect(onValueChange).not.toHaveBeenCalled();
});

test("with allowHalf, the left half gives half a star", () => {
  const { screen, onValueChange } = rating({ allowHalf: true, value: 2.5 });
  expect(fills(screen)).toEqual([44, 44, 22, 0, 0]);
  tap(screen, 3, 10);
  expect(onValueChange).toHaveBeenLastCalledWith(3.5);
  tap(screen, 3, 30);
  expect(onValueChange).toHaveBeenLastCalledWith(4);
});

test("the drawing takes no touch: locationX always comes from the star's box, not from the glyph or the fill", () => {
  const { screen } = rating({ allowHalf: true, value: 2.5 });
  const boxes = screen.root.findAll(
    (node) => typeof node.type === "string" && node.props.testID === "rating-star",
  );
  expect(boxes).toHaveLength(5);
  for (const box of boxes) expect(box.props.pointerEvents).toBe("none");
});

test("clearable clears on tapping again; without it, tapping again calls nothing", () => {
  const first = rating({ value: 4 });
  tap(first.screen, 3);
  expect(first.onValueChange).not.toHaveBeenCalled();

  const second = rating({ value: 4, clearable: true });
  tap(second.screen, 3);
  expect(second.onValueChange).toHaveBeenCalledWith(0);
});

test("the screen reader adjust gesture moves one star and stops at the ends", () => {
  const { screen, onValueChange } = rating({ value: 5 });
  const [group] = byRole(screen, "adjustable");
  act(() => group!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
  expect(onValueChange).not.toHaveBeenCalled();
  act(() => group!.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
  expect(onValueChange).toHaveBeenLastCalledWith(4);
});

test("disabled does not pick, announces the state and dims the whole layer", () => {
  const { screen, onValueChange } = rating({ value: 2, disabled: true });
  const [group] = byRole(screen, "adjustable");
  expect(group!.props.accessibilityState).toEqual({ disabled: true });
  expect(group!.props.className.split(" ")).toContain("opacity-50");
  expect(byType(screen, "Pressable")).toHaveLength(0);
  act(() => group!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
  expect(onValueChange).not.toHaveBeenCalled();
});

test("readOnly comes out as an image with the average in Portuguese, and paints the fraction", () => {
  const { screen } = rating({ readOnly: true, value: 4.3, size: "md" });
  const [image] = byRole(screen, "image");
  expect(image!.props.accessibilityLabel).toBe("4,3 de 5");
  expect(byRole(screen, "adjustable")).toHaveLength(0);
  const last = fills(screen)[4]!;
  expect(last).toBeCloseTo(26 * 0.3, 5);
});

test("the icon function receives the theme color, the size and the layer", () => {
  const seen: { filled: boolean; size: number }[] = [];
  rating({
    max: 1,
    value: 1,
    icon: ({ filled, size }) => {
      seen.push({ filled, size });
      return null;
    },
  });
  expect(seen).toEqual([
    { filled: false, size: 26 },
    { filled: true, size: 26 },
  ]);
});

test("the default star paints warning when full and border-strong when empty", () => {
  const { screen } = rating({ value: 1, max: 1 });
  const glyphs = byType(screen, "Text").map((node) => node.props.className.split(" "));
  expect(glyphs[0]).toContain("text-border-strong");
  expect(glyphs[1]).toContain("text-warning");
});

function inRTL<T>(run: () => T): T {
  I18nManager.isRTL = true;
  try {
    return run();
  } finally {
    I18nManager.isRTL = false;
  }
}

test("in rtl, the reading-start half is the right one, and it gives half a star", () => {
  const { screen, onValueChange } = inRTL(() => rating({ allowHalf: true, value: 2.5 }));
  tap(screen, 3, 30);
  expect(onValueChange).toHaveBeenLastCalledWith(3.5);
  tap(screen, 3, 10);
  expect(onValueChange).toHaveBeenLastCalledWith(4);
});

test("the fill is pinned to the reading-start side, not to the physical left", () => {
  const { screen } = inRTL(() => rating({ allowHalf: true, value: 2.5 }));
  const layers = screen.root.findAll(
    (node) => typeof node.type === "string" && node.props.testID === "rating-fill",
  );
  expect(layers).toHaveLength(5);
  for (const layer of layers) {
    expect(layer.props.style.start).toBe(0);
    expect(layer.props.style.left).toBeUndefined();
    expect(layer.props.className.split(" ")).not.toContain("left-0");
  }
  expect(fills(screen)).toEqual([44, 44, 22, 0, 0]);
});

test("in rtl, the screen reader adjustment still raises the rating with increment", () => {
  const { screen, onValueChange } = inRTL(() => rating({ value: 2 }));
  const [group] = byRole(screen, "adjustable");
  act(() => group!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
  expect(onValueChange).toHaveBeenLastCalledWith(3);
  act(() => group!.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
  expect(onValueChange).toHaveBeenLastCalledWith(1);
});
