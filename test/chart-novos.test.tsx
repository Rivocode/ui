import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartDonut } from "../src/chart/chart-donut";
import { ChartLegendContent, useSeriesToggle } from "../src/chart/chart-legend";
import { ChartRadial } from "../src/chart/chart-radial";
import { Sparkline } from "../src/chart/sparkline";
import type { ChartConfig } from "../src/chart/chart";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const SLICES = [
  { natureza: "servico", total: 148_200 },
  { natureza: "produto", total: 62_400 },
];

test("a rosca usa o buraco para o total, que e o numero que a pessoa veio buscar", () => {
  withTheme(
    <ChartDonut
      data={SLICES}
      valueKey="total"
      nameKey="natureza"
      centerValue="R$ 210,6 mil"
      centerLabel="faturado"
    />,
  );

  expect(screen.getByText("R$ 210,6 mil")).toBeDefined();
  expect(screen.getByText("faturado")).toBeDefined();
});

test("a linha miuda se esconde do leitor de tela, porque nao ha o que ler nela", () => {
  const { container } = withTheme(<Sparkline data={[1, 4, 3, 9]} />);
  const box = container.querySelector("[aria-hidden=true]");

  expect(box).not.toBeNull();
  expect(box!.getAttribute("role")).toBeNull();
});

test("com rotulo ela vira imagem, e o leitor de tela passa a ter o que dizer", () => {
  withTheme(<Sparkline data={[1, 4, 3, 9]} label="Emissao subindo desde marco" />);

  expect(screen.getByRole("img", { name: "Emissao subindo desde marco" })).toBeDefined();
});

const CONFIG: ChartConfig = { emitidas: { label: "Emitidas" }, pagas: { label: "Pagas" } };
const PAYLOAD = [
  { dataKey: "emitidas", value: "emitidas", color: "#a" },
  { dataKey: "pagas", value: "pagas", color: "#b" },
];

test("sem `onToggle` a legenda e texto, e nao finge ser clicavel", () => {
  withTheme(<ChartLegendContent payload={PAYLOAD} config={CONFIG} />);

  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByText("Emitidas")).toBeDefined();
});

test("com `onToggle` cada serie vira botao que diz no aria se esta ligada", () => {
  function Chart() {
    const series = useSeriesToggle();
    return <ChartLegendContent payload={PAYLOAD} config={CONFIG} {...series} />;
  }

  withTheme(<Chart />);

  const emitidas = screen.getByRole("button", { name: /Emitidas/ });
  expect(emitidas.getAttribute("aria-pressed")).toBe("true");

  fireEvent.click(emitidas);
  expect(screen.getByRole("button", { name: /Emitidas/ }).getAttribute("aria-pressed")).toBe(
    "false",
  );

  // A outra serie nao foi junto.
  expect(screen.getByRole("button", { name: /Pagas/ }).getAttribute("aria-pressed")).toBe("true");
});

test("o arco prende a escala, e um valor sozinho nao da a volta inteira", () => {
  const { container } = withTheme(<ChartRadial value={30} label="30% da meta" />);

  // O eixo escondido e quem segura isso; sem ele a Recharts normaliza pelo
  // maior valor da serie, que com um ponto so e o proprio ponto.
  expect(screen.getByRole("img", { name: "30% da meta" })).toBeDefined();
  expect(container.textContent).toContain("30%");
});

test("sem valor escrito, o meio mostra a porcentagem", () => {
  const { container } = withTheme(<ChartRadial value={41} max={50} />);
  expect(container.textContent).toContain("82%");
});
