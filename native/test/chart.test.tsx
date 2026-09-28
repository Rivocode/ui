import { describe, expect, test } from "bun:test";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { tokens } from "../tokens";
import { RivoProvider } from "../src";
import { Sparkline } from "../src/sparkline";
import { Stat } from "../src/stat";
import { Tracker } from "../src/tracker";
import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

const dark = tokens.themes["rivocode-dark"];

/**
 * The drawing's marks are the only nodes with an inline color in the tree: the
 * color comes from the token as a VALUE, not as a class, so looking for
 * backgroundColor finds exactly the bars or the segments - and checks the
 * color as a bonus.
 */
function marks(screen: ReactTestRenderer): ReactTestInstance[] {
  return screen.root.findAll(
    (node) =>
      typeof node.type === "string" &&
      typeof (node.props?.style as { backgroundColor?: unknown } | undefined)?.backgroundColor ===
        "string",
  );
}

/** The native workaround for the web: on the phone the width only exists after layout. */
function layout(screen: ReactTestRenderer, width: number) {
  const [box] = screen.root.findAll(
    (node) => typeof node.type === "string" && typeof node.props?.onLayout === "function",
  );
  act(() => box.props.onLayout({ nativeEvent: { layout: { width, height: 32 } } }));
}

describe("Sparkline", () => {
  test("the bar draws one mark per point, without needing to measure", () => {
    const screen = render(<Sparkline variant="bar" data={[3, 1, 4, 1, 5]} />);
    expect(marks(screen)).toHaveLength(5);
  });

  test("the line only draws after measuring, with one segment fewer than the points", () => {
    const screen = render(<Sparkline data={[3, 1, 4, 1, 5]} />);
    // Before onLayout there is no width, and half a drawing flickers crooked on screen.
    expect(marks(screen)).toHaveLength(0);
    layout(screen, 96);
    expect(marks(screen)).toHaveLength(4);
  });

  test("it is hidden from the screen reader, because the number beside it was already read", () => {
    const silent = render(<Sparkline variant="bar" data={[1, 2, 3]} />);
    const [box] = silent.root.findAll(
      (node) => typeof node.type === "string" && node.props?.accessibilityElementsHidden === true,
    );
    expect(box.props.importantForAccessibility).toBe("no-hide-descendants");

    // With a label it becomes the information, and has to be read as an image.
    const spoken = render(<Sparkline variant="bar" data={[1, 2, 3]} label="Vendas subindo" />);
    const [labelled] = byLabel(spoken, "Vendas subindo");
    expect(labelled.props.accessibilityRole).toBe("image");
    expect(labelled.props.accessibilityElementsHidden).toBeUndefined();
  });

  test("with a label it is a single element for the screen reader, and without data it does not announce an empty drawing", () => {
    for (const variant of ["line", "bar"] as const) {
      const spoken = render(<Sparkline variant={variant} data={[1, 2, 3]} label="Vendas" />);
      expect(byLabel(spoken, "Vendas")[0]!.props.accessible).toBe(true);

      const empty = render(<Sparkline variant={variant} data={[]} label="Vendas" />);
      expect(byLabel(empty, "Vendas")).toHaveLength(0);
      expect(
        empty.root.findAll(
          (node) =>
            typeof node.type === "string" && node.props?.accessibilityElementsHidden === true,
        ).length,
      ).toBe(1);
    }
  });

  test("trend auto paints success on the rise and danger on the fall", () => {
    const rising = render(<Sparkline variant="bar" trend="auto" data={[1, 9]} />);
    expect(marks(rising)[0].props.style.backgroundColor).toBe(dark["success-text"]);

    const falling = render(<Sparkline variant="bar" trend="auto" data={[9, 1]} />);
    expect(marks(falling)[0].props.style.backgroundColor).toBe(dark["danger-text"]);
  });

  test("without trend it uses the accent, and a requested token role wins", () => {
    const byDefault = render(<Sparkline variant="bar" data={[1, 9]} />);
    expect(byDefault.root && marks(byDefault)[0].props.style.backgroundColor).toBe(
      dark["accent-text"],
    );

    const requested = render(
      <Sparkline variant="bar" trend="auto" color="chart-3" data={[9, 1]} />,
    );
    expect(marks(requested)[0].props.style.backgroundColor).toBe(dark["chart-3"]);
  });

  test("an empty or flat series neither breaks nor divides by zero", () => {
    expect(marks(render(<Sparkline variant="bar" data={[]} />))).toHaveLength(0);

    const singlePoint = render(<Sparkline data={[7]} />);
    layout(singlePoint, 96);
    // A single point is not a trend: there is no segment to draw.
    expect(marks(singlePoint)).toHaveLength(0);

    const flat = render(<Sparkline data={[4, 4, 4]} />);
    layout(flat, 96);
    const tops = marks(flat).map((node) => node.props.style.top);
    expect(tops.every((value: number) => Number.isFinite(value))).toBe(true);
  });

  test("the segments meet: the end of one is the start of the next", () => {
    const screen = render(<Sparkline data={[3, 1, 4, 1, 5]} height={32} />);
    layout(screen, 96);

    // Rotating a View is drawing by hand: if the pivot or the angle is wrong,
    // the polyline opens gaps between the points and nobody sees it in a count
    // test. Here the tip of each segment has to land on the next one.
    const parts = marks(screen).map((node) => {
      const style = node.props.style as {
        left: number;
        top: number;
        width: number;
        transform: [{ rotate: string }];
      };
      const radians = (parseFloat(style.transform[0].rotate) * Math.PI) / 180;
      return {
        start: { x: style.left, y: style.top + 1 },
        end: {
          x: style.left + style.width * Math.cos(radians),
          y: style.top + 1 + style.width * Math.sin(radians),
        },
      };
    });

    expect(parts).toHaveLength(4);
    // The math above only holds if the rotation pivot is the left edge at half
    // the height; with the pivot at the center each segment shifts half a
    // length and the polyline falls apart without the test arithmetic noticing.
    marks(screen).forEach((node) => {
      expect(node.props.style.transformOrigin).toEqual([0, 1, 0]);
    });
    parts.slice(1).forEach((part, index) => {
      expect(part.start.x).toBeCloseTo(parts[index]!.end.x, 6);
      expect(part.start.y).toBeCloseTo(parts[index]!.end.y, 6);
    });

    // And the axis points where it should: a rising value rises on screen,
    // that is, it lowers `top`, which on native grows downward.
    const rising = render(<Sparkline data={[1, 9]} height={32} />);
    layout(rising, 96);
    const [only] = marks(rising);
    expect(only!.props.style.top).toBeGreaterThan(0);
    expect(parseFloat(only!.props.style.transform[0].rotate)).toBeLessThan(0);
  });

  test("fills the Stat's `chart` slot without stealing the reading of the number", () => {
    const screen = render(
      <Stat
        label="Faturamento"
        value="R$ 82,4 mil"
        delta={12}
        chart={<Sparkline variant="bar" data={[12, 15, 14, 19, 22, 28]} trend="auto" />}
      />,
    );

    // The reason the piece exists: the slot was empty, waiting for it.
    expect(marks(screen)).toHaveLength(6);
    expect(textOf(screen)).toContain("R$ 82,4 mil");

    // And the drawing stays silent: whoever reads the screen hears the number, not the bar.
    const hidden = screen.root.findAll(
      (node) => typeof node.type === "string" && node.props?.accessibilityElementsHidden === true,
    );
    expect(hidden).toHaveLength(1);
  });
});

describe("Tracker", () => {
  const DATA = [
    { tone: "success" as const, label: "10/08 · sem falha" },
    { tone: "danger" as const, label: "11/08 · 3 falhas" },
    { tone: "warning" as const, label: "12/08 · 1 falha" },
  ];

  test("the per-square tooltip does not port: there is no portal, nor a Pressable per period", () => {
    const screen = render(<Tracker data={DATA} label="Emissões dos últimos 3 dias" />);

    // No touch target per square - a 4px target would be a promise the finger
    // cannot keep. The target is the whole strip, and it is adjustable.
    expect(screen.root.findAll((node) => node.props?.accessibilityRole === "button").length).toBe(
      0,
    );
    expect(byRole(screen, "adjustable").length).toBe(1);

    expect(byClass(screen, /bg-success/).length).toBe(1);
    expect(byClass(screen, /bg-danger/).length).toBe(1);
    expect(byClass(screen, /bg-warning/).length).toBe(1);
  });

  test("the bottom line starts at the most recent period, and the space is already reserved", () => {
    const screen = render(<Tracker data={DATA} label="Emissões" />);
    expect(textOf(screen)).toContain("12/08 · 1 falha");
  });

  test("the strip is a single stop, and the screen reader moves period by period", () => {
    const screen = render(<Tracker data={DATA} label="Emissões" />);

    const [faixa] = byRole(screen, "adjustable");
    expect(faixa.props.accessible).toBe(true);
    expect(faixa.props.accessibilityLabel).toBe("Emissões");
    expect(faixa.props.accessibilityValue.text).toBe("3 de 3: 12/08 · 1 falha");

    act(() => faixa.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
    expect(byRole(screen, "adjustable")[0].props.accessibilityValue.text).toBe(
      "2 de 3: 11/08 · 3 falhas",
    );
    expect(textOf(screen)).toContain("11/08 · 3 falhas");

    // The end holds: there is no period before the first.
    act(() => faixa.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
    act(() => faixa.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
    expect(byRole(screen, "adjustable")[0].props.accessibilityValue.text).toBe(
      "1 de 3: 10/08 · sem falha",
    );

    // And the bottom text is not read twice: the strip already announces it.
    const [linha] = byClass(screen, /text-xs text-fg-muted/);
    expect(linha.props.accessibilityElementsHidden).toBe(true);
  });

  test("the mark of the read period only appears after the strip is measured", () => {
    const screen = render(<Tracker data={DATA} label="Emissões" />);
    expect(byClass(screen, /w-0\.5/).length).toBe(0);

    const [faixa] = byRole(screen, "adjustable");
    act(() => faixa.props.onLayout({ nativeEvent: { layout: { width: 300, height: 44 } } }));

    const [marca] = byClass(screen, /w-0\.5/);
    // Third of three in a 300 strip: middle of the last third, minus the line.
    expect(marca.props.style.left).toBe(2 * 100 + 50 - 1);
  });

  test("the cells and the needle do not take the touch, so locationX belongs to the strip", () => {
    const screen = render(<Tracker data={DATA} label="Emissões" />);
    const [faixa] = byRole(screen, "adjustable");
    act(() => faixa!.props.onLayout({ nativeEvent: { layout: { width: 300, height: 44 } } }));
    const inside = byRole(screen, "adjustable")[0]!.findAll(
      (node) => typeof node.type === "string" && node !== byRole(screen, "adjustable")[0],
    );
    expect(inside.length).toBeGreaterThanOrEqual(4);
    for (const node of inside) expect(node.props.pointerEvents).toBe("none");
  });

  test("data that arrives after mounting opens at the most recent period", () => {
    const screen = render(<Tracker data={[]} label="Emissões" />);
    act(() =>
      screen.update(
        <RivoProvider>
          <Tracker data={DATA} label="Emissões" />
        </RivoProvider>,
      ),
    );
    expect(byRole(screen, "adjustable")[0]!.props.accessibilityValue.text).toBe(
      "3 de 3: 12/08 · 1 falha",
    );
  });

  test("without data it draws no strip at all", () => {
    expect(textOf(render(<Tracker data={[]} label="Emissões" />)).trim()).toBe("");
  });
});
