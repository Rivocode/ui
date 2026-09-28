import { expect, test } from "bun:test";
import { render } from "@testing-library/react";

import { ChartAreaGradient, areaGradient } from "../src/chart/chart-gradient";

/*
 * O nome do gradiente e do quem chama, e nao nosso. A primeira versao disto
 * tirava um id unico do contexto do `ChartContainer`, o que parecia mais seguro
 * e escondia uma armadilha: o `fill` de `<Area>` e avaliado no render do
 * componente de fora, onde aquele contexto ainda nao existe.
 */

test("o `fill` aponta para o gradiente declarado, sem precisar de contexto", () => {
  const { container } = render(<ChartAreaGradient id="faturamento" series={["billed"]} />);
  const gradiente = container.querySelector("linearGradient")!;

  expect(areaGradient("faturamento", "billed")).toBe(`url(#${gradiente.id})`);
});

test("a cor sai da variavel da serie, entao ela acompanha o tema", () => {
  const { container } = render(<ChartAreaGradient id="x" series={["billed"]} />);
  const paradas = [...container.querySelectorAll("stop")];

  expect(paradas.map((p) => p.getAttribute("stop-color"))).toEqual([
    "var(--color-billed)",
    "var(--color-billed)",
  ]);
});

test("nomes diferentes dao gradientes diferentes, que e o que separa dois graficos", () => {
  expect(areaGradient("faturamento", "billed")).not.toBe(areaGradient("emissao", "billed"));
});
