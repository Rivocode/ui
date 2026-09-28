import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Badge } from "../src/components/badge";

test("the default tone is neutral", () => {
  render(<Badge>Rascunho</Badge>);
  expect(screen.getByText("Rascunho").className).toContain("text-fg-muted");
});

const TONES = [
  ["success", "text-success"],
  ["warning", "text-warning"],
  ["danger", "text-danger"],
  ["info", "text-info"],
] as const;

for (const [tone, expected] of TONES) {
  test(`the ${tone} tone uses the status token`, () => {
    render(<Badge tone={tone}>{tone}</Badge>);
    expect(screen.getByText(tone).className).toContain(expected);
  });
}

test("no tone carries a literal color", () => {
  render(<Badge tone="danger">Erro</Badge>);
  expect(screen.getByText("Erro").className).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i);
});

test("the badge is always a pill, because a badge is not a button", () => {
  render(<Badge>Ativo</Badge>);
  expect(screen.getByText("Ativo").className).toContain("rounded-pill");
});
