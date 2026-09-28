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

test("a barra sem cor herda a variavel da serie, e nao sai preta", () => {
  const pintada = paint(
    <BarChart data={[{ emitidas: 1 }]}>
      <Bar dataKey="emitidas" />
    </BarChart>,
    "emitidas",
  );

  expect(pintada.fill).toBe("var(--color-emitidas)");
});

test("a linha herda no traco, e a area herda nos dois", () => {
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

test("a marca que ja escolheu cor fica como esta", () => {
  const escrita = paint(
    <BarChart data={[{ emitidas: 1 }]}>
      <Bar dataKey="emitidas" fill="url(#gradiente)" />
    </BarChart>,
    "emitidas",
  );

  expect(escrita.fill).toBe("url(#gradiente)");
  expect(escrita.stroke).toBeUndefined();
});

test("a marca dentro de outro no tambem e alcancada", () => {
  const dentro = paint(
    <BarChart data={[{ emitidas: 1 }]}>
      <>
        <Bar dataKey="emitidas" />
      </>
    </BarChart>,
    "emitidas",
  );

  expect(dentro.fill).toBe("var(--color-emitidas)");
});

test("a chave que o config nao conhece nao ganha cor, e volta na lista", () => {
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

test("a reclamacao nomeia a chave que falta e lista as que existem", () => {
  const wording = unknownSeriesComplaint("canceladas", ["emitidas", "pagas"]);

  expect(wording).toContain('"canceladas"');
  expect(wording).toContain("emitidas, pagas");
});

test("a moldura acusa no console a serie que o config nao tem", () => {
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

test("a serie que o config conhece nao vira acusacao", () => {
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

    expect(warn.mock.calls.flat().join("\n")).not.toContain("não conhece essa série");
  } finally {
    warn.mockRestore();
  }
});

test('a barra com `stroke="none"` continua herdando a cor no `fill`', () => {
  const pintada = paint(
    <BarChart data={[{ emitidas: 1 }]}>
      <Bar dataKey="emitidas" stroke="none" />
    </BarChart>,
    "emitidas",
  );

  expect(pintada.fill).toBe("var(--color-emitidas)");
  expect(pintada.stroke).toBe("none");
});

test('a linha com `fill="none"` continua herdando a cor no `stroke`', () => {
  const tracada = paint(
    <LineChart data={[{ pagas: 1 }]}>
      <Line dataKey="pagas" fill="none" />
    </LineChart>,
    "pagas",
  );

  expect(tracada.stroke).toBe("var(--color-pagas)");
  expect(tracada.fill).toBe("none");
});

test('o `stroke="none"` nao desliga o aviso da serie que o config nao conhece', () => {
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

test('a moldura acusa no console mesmo com `stroke="none"` na barra', () => {
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

test("a area com gradiente no `fill` ganha o traco, e o gradiente fica", () => {
  const area = paint(
    <AreaChart data={[{ pagas: 1 }]}>
      <Area dataKey="pagas" fill="url(#gradiente)" />
    </AreaChart>,
    "pagas",
  );

  expect(area.fill).toBe("url(#gradiente)");
  expect(area.stroke).toBe("var(--color-pagas)");
});

test("a marca com todos os seus papeis escritos nao vira acusacao", () => {
  const { unknown } = seriesColors(
    <BarChart data={[{ canceladas: 1 }]}>
      <Bar dataKey="canceladas" fill="url(#gradiente)" />
    </BarChart>,
    CONFIG,
  );

  expect(unknown).toEqual([]);
});
