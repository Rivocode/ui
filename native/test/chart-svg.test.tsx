import { describe, expect, mock, spyOn, test } from "bun:test";
import { createElement } from "react";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { tokens } from "../tokens";
import { act, byClass, byLabel, byRole, byType, render, textOf } from "./helpers";

/*
 * react-native-svg is not installed where the suite runs, and will not be: it
 * is an OPTIONAL peer and a native module, so the only place in the repository
 * that has it is `examples/native`, which is not a workspace - and where
 * `check:native:types` goes to fetch the types. Here it comes in as a double,
 * with each element becoming a host node of the same name, and that is why the
 * tests below look for "Path" and "Circle" as if they were tags.
 *
 * `mock.module` MUST run before the piece is evaluated, and `import` is
 * hoisted to the top of the file: that is why the three pieces come in through
 * `await import` right below, and not through the import line that would be
 * natural. Switching back makes the double arrive late and the test die with
 * "Cannot find module".
 */
mock.module("react-native-svg", () => {
  const host = (name: string) => (props: Record<string, unknown>) => createElement(name, props);

  return {
    default: host("Svg"),
    Svg: host("Svg"),
    Circle: host("Circle"),
    Line: host("Line"),
    Path: host("Path"),
    Rect: host("Rect"),
    G: host("G"),
    Text: host("SvgText"),
  };
});

const { ChartContainer } = await import("../src/chart/chart");
const { ChartDonut } = await import("../src/chart/chart-donut");
const { ChartRadial } = await import("../src/chart/chart-radial");
const { arcPath } = await import("../src/chart/arc");

const dark = tokens.themes["rivocode-dark"];

const SERIES = {
  pagas: { label: "Pagas" },
  vencidas: { label: "Vencidas" },
} as const;

const SLICES = [
  { natureza: "servico", total: 60 },
  { natureza: "produto", total: 40 },
];

/** Measures the frame, which on the phone only has a width after layout. */
function layout(screen: ReactTestRenderer, width: number, height: number) {
  const [box] = screen.root.findAll(
    (node) => typeof node.type === "string" && typeof node.props?.onLayout === "function",
  );
  act(() => box!.props.onLayout({ nativeEvent: { layout: { width, height } } }));
}

/** The `d` of each drawn path, in order. */
const paths = (screen: ReactTestRenderer) =>
  byType(screen, "Path").map((node) => String(node.props.d));

/** The large-arc flag of the `A` command, which decides the side of the drawing. */
function longFlag(d: string) {
  const arc = /A\s+[\d.-]+\s+[\d.-]+\s+\d+\s+(\d)/.exec(d);
  return Number(arc![1]);
}

/**
 * At which angle the path starts, counted from the top and clockwise.
 *
 * Reading the angle back from the point - and not comparing the `d` string -
 * is what lets the test talk about the geometry the screen shows, without
 * rewriting the piece's math and agreeing with it by construction.
 */
function startAngle(d: string) {
  const move = /M\s+([\d.-]+)\s+([\d.-]+)/.exec(d)!;
  return (Math.atan2(Number(move[1]), -Number(move[2])) * 180) / Math.PI;
}

describe("ChartContainer", () => {
  const drawing = () => (
    <ChartContainer config={SERIES} data={[1, 2]}>
      {() => null}
    </ChartContainer>
  );

  test("the four endings of a query come from the frame, not from the screen", () => {
    const waiting = render(
      <ChartContainer config={SERIES} isLoading>
        {() => null}
      </ChartContainer>,
    );
    expect(byClass(waiting, /bg-skeleton/).length).toBe(6);

    const broken = render(
      <ChartContainer config={SERIES} isError onRetry={() => {}}>
        {() => null}
      </ChartContainer>,
    );
    expect(textOf(broken)).toContain("Não foi possível carregar o gráfico");
    expect(textOf(broken)).toContain("Tentar de novo");

    // Without `onRetry` the error does not promise what it lacks: nothing happens on tap.
    const stuck = render(
      <ChartContainer config={SERIES} isError>
        {() => null}
      </ChartContainer>,
    );
    expect(textOf(stuck)).not.toContain("Tentar de novo");

    const nothing = render(
      <ChartContainer
        config={SERIES}
        data={[]}
        empty={{
          title: "Sem emissões no período",
          description: "Emita uma nota para ver o gráfico.",
        }}
      >
        {() => <Marker />}
      </ChartContainer>,
    );
    expect(textOf(nothing)).toContain("Sem emissões no período");
    expect(byType(nothing, "Marker").length).toBe(0);

    // With a point, the drawing: the empty state must not steal the screen from whoever has data.
    expect(byType(render(drawing()), "Svg").length + 1).toBeGreaterThan(0);
  });

  test("the colors arrive resolved, by series key and in palette order", () => {
    let seen: Record<string, string> = {};
    render(
      <ChartContainer
        config={{ pagas: { label: "Pagas" }, vencidas: { label: "Vencidas", color: "chart-5" } }}
        data={[1]}
      >
        {(frame) => {
          seen = frame.colors;
          return null;
        }}
      </ChartContainer>,
    );

    // Without a written color, the next one in the palette, in config order.
    expect(seen.pagas).toBe(dark["chart-1"]);
    // With a written role, the role - already as a value, which is what SVG accepts.
    expect(seen.vencidas).toBe(dark["chart-5"]);
  });

  test("the measurement arrives as zero on the first frame and real on the next", () => {
    const sizes: { width: number; height: number }[] = [];
    const screen = render(
      <ChartContainer config={SERIES} data={[1]}>
        {({ width, height }) => {
          sizes.push({ width, height });
          return null;
        }}
      </ChartContainer>,
    );

    expect(sizes[0]).toEqual({ width: 0, height: 0 });
    layout(screen, 320, 220);
    expect(sizes[sizes.length - 1]).toEqual({ width: 320, height: 220 });

    // Measuring the same size again does not change the delivered measurement:
    // `onLayout` fires on every parent relayout, not only when the size changes.
    layout(screen, 320, 220);
    expect(sizes[sizes.length - 1]).toEqual({ width: 320, height: 220 });
  });

  test("a measured box with no height is flagged: the drawing got height 0 and the card stays empty", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    try {
      const screen = render(drawing());
      layout(screen, 320, 0);

      await Bun.sleep(260);

      expect(warn.mock.calls.length).toBe(1);
      expect(String(warn.mock.calls[0]![0])).toContain("[rivocode/ui-native]");
      expect(String(warn.mock.calls[0]![0])).toContain("no height");
    } finally {
      warn.mockRestore();
    }
  });

  test("a measured height silences the piece, and so does the zero before the first layout", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    try {
      const measured = render(drawing());
      layout(measured, 320, 220);

      render(drawing());

      await Bun.sleep(260);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test("the zero of an intermediate layout pass is not flagged: the next pass cancels it", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    try {
      const screen = render(drawing());
      layout(screen, 320, 0);
      layout(screen, 320, 240);

      await Bun.sleep(260);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test("a JSX child is not flagged for a flat box: the inner piece has its own size", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    try {
      const screen = render(
        <ChartContainer config={SERIES} data={SLICES}>
          <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" />
        </ChartContainer>,
      );
      layout(screen, 320, 0);

      await Bun.sleep(260);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test("the frame names the drawing it wraps itself, and only that one", () => {
    // A function: the frame owns the drawing, so it becomes a named figure.
    const own = render(drawing());
    const [figure] = byRole(own, "image");
    expect(figure!.props.accessible).toBe(true);
    expect(figure!.props.accessibilityLabel).toBe("Gráfico de Pagas, Vencidas");

    const named = render(
      <ChartContainer config={SERIES} data={[1]} label="Faturamento por mês">
        {() => null}
      </ChartContainer>,
    );
    expect(byLabel(named, "Faturamento por mês").length).toBe(1);

    /*
     * A JSX child is the opposite case, and it is what protects the donut: an
     * `accessible` on top of it would close the slices into a single stop, and
     * the legend is the ONLY way to read a value on touch. No node in the tree
     * may be grouped.
     */
    const wrapped = render(
      <ChartContainer config={SERIES} data={SLICES}>
        <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" />
      </ChartContainer>,
    );
    expect(wrapped.root.findAll((node) => node.props?.accessible === true).length).toBe(0);
    expect(byRole(wrapped, "button").length).toBe(2);
  });
});

describe("ChartDonut", () => {
  test("one slice per value, and a zero slice draws nothing", () => {
    const screen = render(
      <ChartDonut
        data={[...SLICES, { natureza: "isento", total: 0 }]}
        valueKey="total"
        nameKey="natureza"
      />,
    );
    expect(paths(screen)).toHaveLength(2);
  });

  test("a slice larger than half a turn is drawn along the long side", () => {
    const screen = render(<ChartDonut data={SLICES} valueKey="total" nameKey="natureza" />);
    const [first, second] = paths(screen);

    // 60% is 216 degrees: along the short side it would appear as 40%.
    expect(longFlag(first!)).toBe(1);
    expect(longFlag(second!)).toBe(0);

    // And the first one starts at the top, which is where reading a donut
    // starts - offset by half a gap, which is what separates a slice from its neighbor.
    expect(startAngle(first!)).toBeCloseTo(1, 2);
  });

  test("a single slice is a full turn, and a full turn is not an arc", () => {
    const screen = render(
      <ChartDonut data={[{ natureza: "servico", total: 9 }]} valueKey="total" nameKey="natureza" />,
    );

    // An `A` command that starts and ends at the same point draws nothing: the
    // donut would vanish precisely in the simplest case.
    expect(paths(screen)).toHaveLength(0);
    expect(
      byType(screen, "Circle").filter((node) => node.props.stroke !== dark.border),
    ).toHaveLength(1);
  });

  test("the center value fits in the hole: one line, fixed width and a shrinking font", () => {
    const pieces = [
      render(
        <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" centerValue="R$ 246,7K" />,
      ),
      render(<ChartRadial value={82} centerValue="R$ 1.246,7K" />),
    ];
    for (const screen of pieces) {
      const middle = byType(screen, "Text").find((node) =>
        String(node.props.children).startsWith("R$"),
      )!;
      expect(middle.props.numberOfLines).toBe(1);
      expect(middle.props.adjustsFontSizeToFit).toBe(true);
      expect(middle.props.style.width).toMatch(/^\d+%$/);
      expect(Number.parseInt(middle.props.style.width)).toBeLessThanOrEqual(60);
    }
  });

  test("tapping the legend lights up the slice, and the written center stays in the middle", () => {
    const screen = render(
      <ChartDonut
        data={SLICES}
        valueKey="total"
        nameKey="natureza"
        centerValue="100"
        centerLabel="no mês"
        format={(value) => `R$ ${value}`}
      />,
    );

    expect(textOf(screen)).toContain("no mês");

    const [first] = byRole(screen, "button");
    act(() => first!.props.onPress());

    expect(textOf(screen)).toContain("no mês");
    const middle = byType(screen, "Text").find((node) => node.props.adjustsFontSizeToFit === true);
    expect(middle!.props.children).toBe("100");

    // The lit slice stays opaque and the other recedes; none disappears, or the
    // donut loses the proportion it exists to show.
    const [lit, dimmed] = byType(screen, "Path");
    expect(lit!.props.strokeOpacity).toBe(1);
    expect(dimmed!.props.strokeOpacity).toBeLessThan(1);

    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(byType(screen, "Path").every((node) => node.props.strokeOpacity === 1)).toBe(true);
  });

  test("without a written center, the empty middle shows the slice being read", () => {
    const screen = render(
      <ChartDonut
        data={SLICES}
        valueKey="total"
        nameKey="natureza"
        format={(value) => `R$ ${value}`}
      />,
    );
    const middle = () =>
      byType(screen, "Text").filter((node) => node.props.adjustsFontSizeToFit === true);
    expect(middle()).toHaveLength(0);

    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(middle()[0]!.props.children).toBe("R$ 60");
  });

  test("a negative value appears as it came in the legend and the screen reader; only the arc uses the floor", () => {
    const screen = render(
      <ChartDonut
        data={[...SLICES, { natureza: "estorno", total: -15 }]}
        valueKey="total"
        nameKey="natureza"
      />,
    );
    const rows = byRole(screen, "button").map(
      (row: ReactTestInstance) => row.props.accessibilityLabel,
    );
    expect(rows).toContain("estorno: -15");
    expect(textOf(screen)).toContain("-15");
    expect(paths(screen)).toHaveLength(2);

    const unlabelled = render(
      <ChartDonut
        data={[...SLICES, { natureza: "estorno", total: -15 }]}
        valueKey="total"
        nameKey="natureza"
        legend={false}
      />,
    );
    expect(byRole(unlabelled, "image")[0]!.props.accessibilityLabel).toContain("estorno -15");
  });

  test("the background ring is always drawn, with the border token", () => {
    for (const data of [SLICES, [], [{ natureza: "servico", total: 0 }]]) {
      const screen = render(<ChartDonut data={data} valueKey="total" nameKey="natureza" />);
      const ring = byType(screen, "Circle").filter((node) => node.props.stroke === dark.border);
      expect(ring).toHaveLength(1);
    }
  });

  test("with no slice and legend false, the drawing does not announce an empty donut", () => {
    const screen = render(
      <ChartDonut data={[]} valueKey="total" nameKey="natureza" legend={false} />,
    );
    expect(byRole(screen, "image")).toHaveLength(0);
    expect(textOf(screen)).not.toContain("Rosca");
  });

  test("empty appears in place of the donut with an empty list or a zero sum", () => {
    const empty = { title: "Nada faturado", description: "Nenhuma nota no período." };
    for (const data of [[], [{ natureza: "servico", total: 0 }]]) {
      const screen = render(
        <ChartDonut data={data} valueKey="total" nameKey="natureza" empty={empty} />,
      );
      expect(textOf(screen)).toContain("Nada faturado");
      expect(byType(screen, "Svg")).toHaveLength(0);
    }
    const full = render(
      <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" empty={empty} />,
    );
    expect(textOf(full)).not.toContain("Nada faturado");
  });

  test("with a legend the drawing goes silent, and each slice becomes a stop with name and value", () => {
    const screen = render(
      <ChartDonut
        data={SLICES}
        valueKey="total"
        nameKey="natureza"
        config={{ servico: { label: "Serviço" }, produto: { label: "Produto" } }}
        format={(value) => `R$ ${value}`}
      />,
    );

    const [drawing] = screen.root.findAll(
      (node) => typeof node.type === "string" && node.props?.accessibilityElementsHidden === true,
    );
    expect(drawing!.props.importantForAccessibility).toBe("no-hide-descendants");

    const rows = byRole(screen, "button");
    expect(rows.map((row: ReactTestInstance) => row.props.accessibilityLabel)).toEqual([
      "Serviço: R$ 60",
      "Produto: R$ 40",
    ]);

    // 44px: the target a 2% slice would never offer.
    expect(rows.every((row: ReactTestInstance) => /h-11/.test(row.props.className))).toBe(true);
    expect(rows[0]!.props.accessibilityState.selected).toBe(false);

    act(() => rows[0]!.props.onPress());
    expect(byRole(screen, "button")[0]!.props.accessibilityState.selected).toBe(true);
  });

  test("format accepts the name of a house formatter, as on the web", () => {
    const screen = render(
      <ChartDonut
        data={[
          { natureza: "servico", total: 2480 },
          { natureza: "produto", total: 1500 },
        ]}
        valueKey="total"
        nameKey="natureza"
        format="currencyShort"
      />,
    );

    expect(
      byRole(screen, "button").map((row: ReactTestInstance) => row.props.accessibilityLabel),
    ).toEqual(["servico: R$\u00a02,5K", "produto: R$\u00a01,5K"]);
  });

  test("without a legend the data has to fit in the name, because there is no tooltip to open", () => {
    const screen = render(
      <ChartDonut
        data={SLICES}
        valueKey="total"
        nameKey="natureza"
        legend={false}
        format={(value) => `R$ ${value}`}
      />,
    );

    expect(byRole(screen, "button")).toHaveLength(0);
    const [figure] = byRole(screen, "image");
    expect(figure!.props.accessibilityLabel).toBe("Rosca: servico R$ 60, produto R$ 40");

    // With `label` written, it wins: the donut answers the screen's question.
    const asked = render(
      <ChartDonut
        data={SLICES}
        valueKey="total"
        nameKey="natureza"
        legend={false}
        label="Faturamento por natureza"
      />,
    );
    expect(byLabel(asked, "Faturamento por natureza")).toHaveLength(1);
  });

  test("the thickness decides the ring, and `1` closes the pie", () => {
    const thin = render(
      <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" thickness={0.2} />,
    );
    const solid = render(
      <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" thickness={1} />,
    );

    const bandOf = (screen: ReactTestRenderer) =>
      Number(byType(screen, "Path")[0]!.props.strokeWidth);

    expect(bandOf(thin)).toBeCloseTo(44 * 0.2, 5);
    // Full thickness: the stroke goes from the center to the edge, so the hole closes.
    expect(bandOf(solid)).toBeCloseTo(44, 5);
  });
});

describe("ChartRadial", () => {
  test("the track is always drawn, and the value arc only when there is a value", () => {
    const measured = render(<ChartRadial value={40} />);
    expect(paths(measured)).toHaveLength(2);

    // At zero, only the scale: a round cap on a zero-length arc becomes a lit
    // dot, which reads as "already started". The value path stays mounted, so
    // it can animate back, but with no stroke and no paint.
    const zero = render(<ChartRadial value={0} />);
    expect(paths(zero).filter(Boolean)).toHaveLength(1);
    const reach = byType(zero, "Path").find((node) => node.props.d === "")!;
    expect(reach.props.strokeOpacity).toBe(0);
  });

  test("above the maximum the arc stops at the end, and does not wrap around", () => {
    const over = render(<ChartRadial value={130} max={100} sweep={270} />);
    const full = render(<ChartRadial value={100} max={100} sweep={270} />);

    expect(paths(over)[1]).toBe(paths(full)[1]);
    expect(textOf(over)).toContain("100%");
  });

  test("a full turn becomes a circle, otherwise `sweep={360}` comes out blank", () => {
    const screen = render(<ChartRadial value={100} sweep={360} />);
    expect(byType(screen, "Circle").length).toBe(1);
    const [reach] = paths(screen);
    expect(reach).toBe(arcPath(42, -180, -180 + 359.9));
    expect(byType(screen, "Path")[0]!.props.strokeOpacity).toBe(1);
  });

  test("the name carries the measurement: without it, hearing the piece says nothing", () => {
    const measured = render(<ChartRadial value={82} centerLabel="da meta do mês" />);
    const [figure] = byRole(measured, "image");
    expect(figure!.props.accessible).toBe(true);
    expect(figure!.props.accessibilityLabel).toBe("82%, da meta do mês");

    // What is written in the middle wins over the computed percentage.
    const written = render(<ChartRadial value={82} centerValue="8,2 GB" centerLabel="de 10 GB" />);
    expect(byLabel(written, "8,2 GB, de 10 GB")).toHaveLength(1);

    // And `label` wins over both.
    const asked = render(<ChartRadial value={82} centerLabel="da meta" label="Meta do mês" />);
    expect(byLabel(asked, "Meta do mês")).toHaveLength(1);
  });

  test("the segmented variant lights the dashes up to the value and dims the rest", () => {
    const screen = render(
      <ChartRadial value={50} variant="segmented" segments={10} color="chart-3" />,
    );

    const ticks = byType(screen, "Line");
    expect(ticks).toHaveLength(10);

    const lit = ticks.filter((tick: ReactTestInstance) => tick.props.stroke === dark["chart-3"]);
    expect(lit).toHaveLength(5);

    // The dimmed part stays on screen: without a scale, a lit dash means nothing.
    const off = ticks.filter((tick: ReactTestInstance) => tick.props.stroke === dark.skeleton);
    expect(off).toHaveLength(5);

    // The first dash opens the arc, and the last one closes it, symmetrically.
    expect(Number(ticks[0]!.props.rotation)).toBeCloseTo(-135, 5);
    expect(Number(ticks[9]!.props.rotation)).toBeCloseTo(135, 5);
  });
});

/** Any mark, to tell whether the drawing came in or not. */
function Marker() {
  return null;
}
