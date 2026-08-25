import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

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
