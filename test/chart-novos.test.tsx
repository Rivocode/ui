import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartDonut } from "../src/chart/chart-donut";
import { ChartLegendContent, useSeriesToggle } from "../src/chart/chart-legend";
import { Sparkline } from "../src/chart/sparkline";
import type { ChartConfig } from "../src/chart/chart";

function comTema(no: React.ReactNode) {
  return render(<RivoProvider scope="local">{no}</RivoProvider>);
}

const FATIAS = [
  { natureza: "servico", total: 148_200 },
  { natureza: "produto", total: 62_400 },
];

test("a rosca usa o buraco para o total, que e o numero que a pessoa veio buscar", () => {
  comTema(
    <ChartDonut
      data={FATIAS}
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
  const { container } = comTema(<Sparkline data={[1, 4, 3, 9]} />);
  const caixa = container.querySelector("[aria-hidden=true]");

  expect(caixa).not.toBeNull();
  expect(caixa!.getAttribute("role")).toBeNull();
});

test("com rotulo ela vira imagem, e o leitor de tela passa a ter o que dizer", () => {
  comTema(<Sparkline data={[1, 4, 3, 9]} label="Emissao subindo desde marco" />);

  expect(screen.getByRole("img", { name: "Emissao subindo desde marco" })).toBeDefined();
});

const CONFIG: ChartConfig = { emitidas: { label: "Emitidas" }, pagas: { label: "Pagas" } };
const PAYLOAD = [
  { dataKey: "emitidas", value: "emitidas", color: "#a" },
  { dataKey: "pagas", value: "pagas", color: "#b" },
];

test("sem `onToggle` a legenda e texto, e nao finge ser clicavel", () => {
  comTema(<ChartLegendContent payload={PAYLOAD} config={CONFIG} />);

  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByText("Emitidas")).toBeDefined();
});

test("com `onToggle` cada serie vira botao que diz no aria se esta ligada", () => {
  function Grafico() {
    const series = useSeriesToggle();
    return <ChartLegendContent payload={PAYLOAD} config={CONFIG} {...series} />;
  }

  comTema(<Grafico />);

  const emitidas = screen.getByRole("button", { name: /Emitidas/ });
  expect(emitidas.getAttribute("aria-pressed")).toBe("true");

  fireEvent.click(emitidas);
  expect(screen.getByRole("button", { name: /Emitidas/ }).getAttribute("aria-pressed")).toBe(
    "false",
  );

  // A outra serie nao foi junto.
  expect(screen.getByRole("button", { name: /Pagas/ }).getAttribute("aria-pressed")).toBe("true");
});
