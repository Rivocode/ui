import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Badge } from "../src/primitives/badge";

test("o tom padrao e neutro", () => {
  render(<Badge>Rascunho</Badge>);
  expect(screen.getByText("Rascunho").className).toContain("text-fg-muted");
});

const TONS = [
  ["success", "text-success"],
  ["warning", "text-warning"],
  ["danger", "text-danger"],
  ["info", "text-info"],
] as const;

for (const [tom, esperado] of TONS) {
  test(`o tom ${tom} usa o token de estado`, () => {
    render(<Badge tone={tom}>{tom}</Badge>);
    expect(screen.getByText(tom).className).toContain(esperado);
  });
}

test("nenhum tom carrega cor literal", () => {
  render(<Badge tone="danger">Erro</Badge>);
  expect(screen.getByText("Erro").className).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i);
});

test("o selo e sempre pilula, porque selo nao e botao", () => {
  render(<Badge>Ativo</Badge>);
  expect(screen.getByText("Ativo").className).toContain("rounded-pill");
});
