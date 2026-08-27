import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Progress } from "../src/components/progress";
import { Meter } from "../src/components/meter";
import { formatters } from "../src/lib/format";

/*
 * `format` significava tres coisas na mesma biblioteca: opcoes do Intl no
 * Meter, no Progress, no Slider e no NumberField; nome ou funcao no eixo do
 * grafico; e so funcao no ChartDonut.
 *
 * O caminho que dava erro de tipo era o menos ruim. O que nao dava era pior:
 * { style: "percent" } num medidor de 0 a 100 imprime 8.200% ao lado de uma
 * barra em 82%, e nada reclama.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("o nome do formatador vale no medidor, como vale no eixo", () => {
  withTheme(<Meter value={82} aria-label="Cota" showValue format="percent" />);

  expect(screen.getByText("82%")).toBeDefined();
});

test("a funcao propria tambem vale, sem passar por Intl", () => {
  withTheme(
    <Progress value={3} aria-label="Notas" showValue format={(value) => `${value} de 10 notas`} />,
  );

  expect(screen.getByText("3 de 10 notas")).toBeDefined();
});

test("quem quer as opcoes do Intl pede pelo nome delas", () => {
  // O contrato antigo nao some, muda de nome: numberFormat diz o que e, e
  // deixa de disputar a palavra `format` com o vocabulario do grafico.
  withTheme(
    <Meter value={0.82} aria-label="Cota" showValue numberFormat={{ style: "percent" }} max={1} />,
  );

  expect(screen.getByText("82%")).toBeDefined();
});

test("os formatadores sao um so, e o grafico nao e dono deles", async () => {
  // Eles moravam em chart/, entao formatar dinheiro numa tabela obrigava a
  // importar do subcaminho do grafico.
  const fromChart = await import("../src/chart/format");

  expect(formatters.currencyShort(2480)).toBe("R$ 2,5K");
  expect(fromChart.formatters.currencyShort).toBe(formatters.currencyShort);
});
