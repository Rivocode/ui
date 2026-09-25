import { describe, expect, mock, test } from "bun:test";
import { createElement } from "react";
import type { ReactTestRenderer } from "react-test-renderer";

import { tokens } from "../tokens";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

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

const { ChartGauge } = await import("../src/chart/chart-gauge");
const { ChartHeatmap } = await import("../src/chart/chart-heatmap");
const { ChartFunnel } = await import("../src/chart/chart-funnel");
const { ChartTreemap } = await import("../src/chart/chart-treemap");
const { HEAT_ALPHAS, TREEMAP_TINT } = await import("../src/shared/chart-layout");

const light = tokens.themes["rivocode-light"];
const dark = tokens.themes["rivocode-dark"];

type Responder = { onPanResponderGrant: (event: unknown, gesture: unknown) => void };
const { panResponders } = (await import("react-native")) as unknown as {
  panResponders: Responder[];
};

function layout(screen: ReactTestRenderer, width: number, height: number, which = 0) {
  const boxes = screen.root.findAll(
    (node) => typeof node.type === "string" && typeof node.props?.onLayout === "function",
  );
  act(() => boxes[which]!.props.onLayout({ nativeEvent: { layout: { width, height } } }));
}

const BANDS = [
  { until: 60, tone: "success", label: "Bom" },
  { until: 85, tone: "warning", label: "Atenção" },
  { until: 100, tone: "danger", label: "Crítico" },
] as const;

describe("ChartGauge", () => {
  test("o nome carrega valor, faixa e a regua das faixas, porque o toque nao tem dica", () => {
    const screen = render(<ChartGauge value={72} bands={BANDS} />);
    const [figure] = byRole(screen, "image");

    expect(figure!.props.accessibilityLabel).toBe(
      "72 de 100, Atenção. Bom de 0 a 60; Atenção de 60 a 85; Crítico de 85 a 100",
    );
    expect(textOf(screen)).toContain("Atenção");
  });

  test("o arco e as faixas pintam os papeis -text, que sao os medidos sobre o trilho", () => {
    const screen = render(<ChartGauge value={95} bands={BANDS} />, { theme: "rivocode-dark" });
    const strokes = byType(screen, "Path").map((node) => node.props.stroke);

    expect(dark["danger-text"]).not.toBe(dark.danger);
    expect(strokes).toContain(dark["danger-text"]);
    expect(strokes).toContain(dark["success-text"]);
    expect(strokes).not.toContain(dark.danger);
  });

  test("sem faixas, arco de acento e nenhum ponteiro", () => {
    const screen = render(<ChartGauge value={30} />, { theme: "rivocode-light" });
    const strokes = byType(screen, "Path").map((node) => node.props.stroke);

    expect(strokes).toEqual([light.skeleton, light["accent-text"]]);
    expect(byLabel(screen, "30 de 100")).toHaveLength(1);
  });
});

const EMISSIONS = [
  { dia: "Seg", hora: "8h", total: 0 },
  { dia: "Seg", hora: "9h", total: 12 },
  { dia: "Ter", hora: "8h", total: 4 },
];

describe("ChartHeatmap", () => {
  test("uma parada ajustavel so, que anda celula a celula e diz o valor", () => {
    const screen = render(
      <ChartHeatmap
        data={EMISSIONS}
        rowKey="dia"
        columnKey="hora"
        valueKey="total"
        label="Emissões por dia e hora"
      />,
    );
    const [grid] = byRole(screen, "adjustable");

    expect(grid!.props.accessibilityLabel).toBe("Emissões por dia e hora");
    expect(grid!.props.accessibilityValue.text).toBe("Seg, 8h: 0");

    act(() => grid!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
    act(() => grid!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
    act(() => grid!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));

    expect(byRole(screen, "adjustable")[0]!.props.accessibilityValue.text).toBe(
      "Ter, 9h: Sem dado",
    );
  });

  test("zero pinta o primeiro degrau; a celula sem dado leva borda tracejada e nenhuma tinta", () => {
    const screen = render(
      <ChartHeatmap
        data={EMISSIONS}
        rowKey="dia"
        columnKey="hora"
        valueKey="total"
        label="Emissões"
        legend={false}
      />,
    );
    const tints = byType(screen, "View")
      .map((node) => node.props.style)
      .filter((style) => style && typeof style.opacity === "number")
      .map((style) => style.opacity);
    expect(tints).toEqual([HEAT_ALPHAS[0], HEAT_ALPHAS[4], HEAT_ALPHAS[1]]);

    const dashed = byType(screen, "View").filter(
      (node) => node.props.style?.borderStyle === "dashed",
    );
    expect(dashed).toHaveLength(1);
  });

  test("o toque escolhe a celula debaixo do dedo", () => {
    const screen = render(
      <ChartHeatmap
        data={EMISSIONS}
        rowKey="dia"
        columnKey="hora"
        valueKey="total"
        label="Emissões"
      />,
    );
    const responder = panResponders.at(-1)!;
    const [grid] = byRole(screen, "adjustable");
    act(() => grid!.props.onLayout({ nativeEvent: { layout: { width: 200, height: 52 } } }));
    act(() =>
      responder.onPanResponderGrant({ nativeEvent: { locationX: 150, locationY: 10 } }, {}),
    );
    expect(byRole(screen, "adjustable")[0]!.props.accessibilityValue.text).toBe("Seg, 9h: 12");
  });
});

describe("ChartFunnel", () => {
  const STAGES = [
    { etapa: "Visitas", total: 1000 },
    { etapa: "Cadastros", total: 400 },
    { etapa: "Primeira nota", total: 100 },
  ];

  test("cada etapa e uma parada com nome, valor e a taxa sobre a anterior", () => {
    const screen = render(<ChartFunnel data={STAGES} valueKey="total" nameKey="etapa" />);

    expect(byLabel(screen, "Visitas: 1000")).toHaveLength(1);
    expect(byLabel(screen, "Cadastros: 400, 40% da etapa anterior")).toHaveLength(1);
    expect(byLabel(screen, "Primeira nota: 100, 25% da etapa anterior")).toHaveLength(1);
    expect(textOf(screen)).toContain("10% do início ao fim");
  });
});

describe("ChartTreemap", () => {
  const NATURES = [
    { natureza: "Serviços", total: 900 },
    { natureza: "Retenções de ISS", total: 6 },
  ];

  test("cada categoria e um botao com nome, valor e fatia; o rotulo so aparece onde cabe", () => {
    const screen = render(<ChartTreemap data={NATURES} valueKey="total" nameKey="natureza" />);
    expect(byRole(screen, "button")).toHaveLength(0);

    layout(screen, 400, 200);

    const buttons = byRole(screen, "button");
    expect(buttons.map((node) => node.props.accessibilityLabel)).toEqual([
      "Serviços: 900 (99,3%)",
      "Retenções de ISS: 6 (0,7%)",
    ]);
    expect(textOf(screen)).toContain("Serviços");
    expect(textOf(screen)).not.toContain("Retenções de ISS");
  });

  test("a tinta da categoria e o alfa medido", () => {
    const screen = render(<ChartTreemap data={NATURES} valueKey="total" nameKey="natureza" />, {
      theme: "rivocode-light",
    });
    layout(screen, 400, 200);

    const tint = byType(screen, "View").find((node) => node.props.style?.opacity === TREEMAP_TINT);
    expect(tint!.props.style.backgroundColor).toBe(light["chart-1"]);
  });
});
