import { expect, spyOn, test } from "bun:test";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { render } from "@testing-library/react";
import { Area, AreaChart, Bar, BarChart, Line, LineChart } from "recharts";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  ChartContainer,
  seriesColors,
  unknownSeriesComplaint,
  type ChartConfig,
} from "../src/chart/chart";

const CONFIG: ChartConfig = {
  emitidas: { label: "Emitidas" },
  pagas: { label: "Pagas" },
};

function marks(node: ReactNode): ReactElement[] {
  const found: ReactElement[] = [];

  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;
    found.push(child);
    found.push(...marks((child.props as { children?: ReactNode }).children));
  });

  return found;
}

const paint = (chart: ReactElement, dataKey: string) => {
  const inside = seriesColors(chart, CONFIG).chart.props as { children?: ReactNode };
  const mark = marks(inside.children).find(
    (child) => (child.props as { dataKey?: string }).dataKey === dataKey,
  );
  return mark!.props as { fill?: string; stroke?: string };
};

test("a bar without color inherits the series variable, and does not come out black", () => {
  const painted = paint(
    <BarChart data={[{ emitidas: 1 }]}>
      <Bar dataKey="emitidas" />
    </BarChart>,
    "emitidas",
  );

  expect(painted.fill).toBe("var(--color-emitidas)");
});

test("a line inherits on the stroke, and an area inherits on both", () => {
  const stroked = paint(
    <LineChart data={[{ pagas: 1 }]}>
      <Line dataKey="pagas" />
    </LineChart>,
    "pagas",
  );
  expect(stroked.stroke).toBe("var(--color-pagas)");
  expect(stroked.fill).toBeUndefined();

  const area = paint(
    <AreaChart data={[{ pagas: 1 }]}>
      <Area dataKey="pagas" />
    </AreaChart>,
    "pagas",
  );
  expect(area.fill).toBe("var(--color-pagas)");
  expect(area.stroke).toBe("var(--color-pagas)");
});

test("a mark that already chose a color stays as it is", () => {
  const written = paint(
    <BarChart data={[{ emitidas: 1 }]}>
      <Bar dataKey="emitidas" fill="url(#gradiente)" />
    </BarChart>,
    "emitidas",
  );

  expect(written.fill).toBe("url(#gradiente)");
  expect(written.stroke).toBeUndefined();
});

test("a mark inside another node is also reached", () => {
  const nested = paint(
    <BarChart data={[{ emitidas: 1 }]}>
      <>
        <Bar dataKey="emitidas" />
      </>
    </BarChart>,
    "emitidas",
  );

  expect(nested.fill).toBe("var(--color-emitidas)");
});

test("a key the config does not know gets no color, and comes back in the list", () => {
  const { chart, unknown } = seriesColors(
    <BarChart data={[{ canceladas: 1 }]}>
      <Bar dataKey="canceladas" />
    </BarChart>,
    CONFIG,
  );

  expect(unknown).toEqual(["canceladas"]);
  const inside = chart.props as { children?: ReactNode };
  expect((marks(inside.children)[0]!.props as { fill?: string }).fill).toBeUndefined();
});

test("the complaint names the missing key and lists the existing ones", () => {
  const wording = unknownSeriesComplaint("canceladas", ["emitidas", "pagas"]);

  expect(wording).toContain('"canceladas"');
  expect(wording).toContain("emitidas, pagas");
  expect(wording).toContain("does not know that series");
});

test("the container reports on the console the series the config lacks", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  try {
    render(
      <RivoProvider scope="local">
        <ChartContainer config={CONFIG} className="h-40">
          <BarChart data={[{ canceladas: 1 }]}>
            <Bar dataKey="canceladas" />
          </BarChart>
        </ChartContainer>
      </RivoProvider>,
    );

    const said = warn.mock.calls.flat().join("\n");
    expect(said).toContain('"canceladas"');
    expect(said).toContain("emitidas, pagas");
  } finally {
    warn.mockRestore();
  }
});

test("a series the config knows does not become a complaint", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  try {
    render(
      <RivoProvider scope="local">
        <ChartContainer config={CONFIG} className="h-40">
          <BarChart data={[{ emitidas: 1 }]}>
            <Bar dataKey="emitidas" />
          </BarChart>
        </ChartContainer>
      </RivoProvider>,
    );

    expect(warn.mock.calls.flat().join("\n")).not.toContain("does not know that series");
  } finally {
    warn.mockRestore();
  }
});

test('a bar with `stroke="none"` still inherits the color on `fill`', () => {
  const painted = paint(
    <BarChart data={[{ emitidas: 1 }]}>
      <Bar dataKey="emitidas" stroke="none" />
    </BarChart>,
    "emitidas",
  );

  expect(painted.fill).toBe("var(--color-emitidas)");
  expect(painted.stroke).toBe("none");
});

test('a line with `fill="none"` still inherits the color on `stroke`', () => {
  const strokeOnly = paint(
    <LineChart data={[{ pagas: 1 }]}>
      <Line dataKey="pagas" fill="none" />
    </LineChart>,
    "pagas",
  );

  expect(strokeOnly.stroke).toBe("var(--color-pagas)");
  expect(strokeOnly.fill).toBe("none");
});

test('`stroke="none"` does not turn off the warning for a series the config does not know', () => {
  const { chart, unknown } = seriesColors(
    <BarChart data={[{ canceladas: 1 }]}>
      <Bar dataKey="canceladas" stroke="none" />
    </BarChart>,
    CONFIG,
  );

  expect(unknown).toEqual(["canceladas"]);
  const inside = chart.props as { children?: ReactNode };
  expect((marks(inside.children)[0]!.props as { fill?: string }).fill).toBeUndefined();
});

test('the container reports on the console even with `stroke="none"` on the bar', () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  try {
    render(
      <RivoProvider scope="local">
        <ChartContainer config={CONFIG} className="h-40">
          <BarChart data={[{ canceladas: 1 }]}>
            <Bar dataKey="canceladas" stroke="none" />
          </BarChart>
        </ChartContainer>
      </RivoProvider>,
    );

    const said = warn.mock.calls.flat().join("\n");
    expect(said).toContain('"canceladas"');
    expect(said).toContain("emitidas, pagas");
  } finally {
    warn.mockRestore();
  }
});

test("an area with a gradient on `fill` gets the stroke, and the gradient stays", () => {
  const area = paint(
    <AreaChart data={[{ pagas: 1 }]}>
      <Area dataKey="pagas" fill="url(#gradiente)" />
    </AreaChart>,
    "pagas",
  );

  expect(area.fill).toBe("url(#gradiente)");
  expect(area.stroke).toBe("var(--color-pagas)");
});

test("a mark with all its roles written does not become a complaint", () => {
  const { unknown } = seriesColors(
    <BarChart data={[{ canceladas: 1 }]}>
      <Bar dataKey="canceladas" fill="url(#gradiente)" />
    </BarChart>,
    CONFIG,
  );

  expect(unknown).toEqual([]);
});
