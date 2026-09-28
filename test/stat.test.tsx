import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { currencyShort, percent } from "../src/shared/format";
import { Stat } from "../src/components/stat";
import { RivoProvider } from "../src/provider/rivo-provider";

function stat(props: Partial<React.ComponentProps<typeof Stat>> = {}) {
  return render(
    <RivoProvider scope="local">
      <Stat label="Faturado em agosto" value="R$ 246,7K" {...props} />
    </RivoProvider>,
  );
}

test("mostra o rotulo e o valor", () => {
  stat();
  expect(screen.getByText("Faturado em agosto")).toBeDefined();
  expect(screen.getByText("R$ 246,7K")).toBeDefined();
});

test("delta positivo sobe verde, com o periodo junto", () => {
  const { container } = stat({ delta: 20, deltaLabel: "sobre julho" });
  expect(screen.getByText(/20% sobre julho/)).toBeDefined();
  expect(container.querySelector(".text-success-text")).not.toBeNull();
});

test("delta negativo desce vermelho", () => {
  const { container } = stat({ delta: -8 });
  expect(screen.getByText(/8%/)).toBeDefined();
  expect(container.querySelector(".text-danger-text")).not.toBeNull();
});

test("invert vira o julgamento: subir e ruim em nota vencida", () => {
  const { container } = stat({ delta: 50, invert: true });
  expect(container.querySelector(".text-danger-text")).not.toBeNull();
  expect(container.querySelector(".text-success-text")).toBeNull();
});

test("a direcao e falada, nao so pintada", () => {
  stat({ delta: -8 });
  expect(screen.getByText(/queda de/)).toBeDefined();
});

test("delta zero sai neutro: sem seta, sem cor de julgamento e sem alta de", () => {
  const { container } = stat({ delta: 0, deltaLabel: "sobre julho" });
  const line = screen.getByText(/0% sobre julho/);

  expect(line.querySelector("svg")).toBeNull();
  expect(line.className.split(" ")).toContain("text-fg-muted");
  expect(line.className.split(" ")).not.toContain("text-success-text");
  expect(container.textContent).not.toContain("alta de");
  expect(container.textContent).not.toContain("queda de");
});

test("delta zero em pastilha tambem sai neutro, e com invert continua neutro", () => {
  stat({ delta: 0, deltaVariant: "pill", invert: true });
  const pill = screen.getByText(/0%/);

  expect(pill.className.split(" ")).toContain("text-fg-muted");
  expect(pill.className.split(" ")).not.toContain("text-danger-text");
});

test("delta que arredonda para zero na tela tambem sai neutro, nos dois sinais", () => {
  for (const delta of [0.0001, -0.0001]) {
    const view = stat({ delta, deltaLabel: "sobre julho" });
    const line = screen.getByText(/0% sobre julho/);

    expect(line.querySelector("svg")).toBeNull();
    expect(line.className.split(" ")).toContain("text-fg-muted");
    expect(view.container.textContent).not.toContain("alta de");
    expect(view.container.textContent).not.toContain("queda de");
    view.unmount();
  }
});

test("sem delta nao ha linha de variacao", () => {
  const { container } = stat();
  expect(container.querySelector(".text-success-text")).toBeNull();
  expect(container.querySelector(".text-danger-text")).toBeNull();
});

test("hint vira botao com nome acessivel", () => {
  stat({ hint: "Só o que já caiu na conta." });
  expect(screen.getByRole("button", { name: /sobre faturado em agosto/i })).toBeDefined();
});

test("o slot de grafico renderiza o que vier", () => {
  stat({ chart: <svg data-testid="spark" /> });
  expect(screen.getByTestId("spark")).toBeDefined();
});

/*
 * O `%` era cravado no JSX, e o Stat era a unica peca de numero da casa fora
 * do vocabulario de formatacao que Progress, Meter e Slider ja falam. Um delta
 * em real ou em ponto-base saia com um por-cento que nao era verdade.
 */

test("sem deltaFormat, a variacao continua saindo em porcentagem", () => {
  stat({ delta: 20, deltaLabel: "sobre julho" });
  expect(screen.getByText(/20% sobre julho/)).toBeDefined();
});

test("o delta em reais sai em reais, e nao com um por-cento que mente", () => {
  stat({ delta: 12_400, deltaFormat: "currencyShort" });

  expect(screen.getByText(/R\$ 12,4K/)).toBeDefined();
  expect(screen.queryByText(/%/)).toBeNull();
});

test("o nome do formatador da casa vale aqui como vale no medidor", () => {
  stat({ delta: 1240, deltaFormat: "integer" });
  expect(screen.getByText(/1\.240/)).toBeDefined();
});

test("a funcao propria vale para o que nenhum formatador da casa escreve", () => {
  stat({ delta: 35, deltaFormat: (value: number) => `${value} pontos-base` });
  expect(screen.getByText(/35 pontos-base/)).toBeDefined();
});

test("o formatador recebe o modulo: quem carrega o sinal e a seta e a fala", () => {
  stat({ delta: -8, deltaFormat: (value: number) => `${value}` });

  expect(screen.getByText(/queda de/)).toBeDefined();
  expect(screen.queryByText(/-8/)).toBeNull();
});

test("a casa decimal cabe, passando o percent com digito", () => {
  stat({ delta: 12.5, deltaFormat: (value: number) => percent(value, 1) });
  expect(screen.getByText(/12,5%/)).toBeDefined();
});

test("o formatador do delta e o mesmo do resto da casa", () => {
  // Nao e um segundo Intl escondido no Stat: e o `currencyShort` que o eixo,
  // a tabela e a legenda ja usam.
  stat({ delta: 12_400, deltaFormat: "currencyShort" });
  const written = currencyShort(12_400)
    .replace("$", "\\$")
    .replace(/\u00a0/g, "\\s");
  expect(screen.getByText(new RegExp(written))).toBeDefined();
});
