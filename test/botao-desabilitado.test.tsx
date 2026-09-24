import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Button } from "../src/components/button";
import { IconButton } from "../src/components/icon-button";

const CONTORNADAS = ["primary", "secondary", "outline", "destructive"] as const;

for (const variant of CONTORNADAS) {
  test(`o ${variant} desabilitado desenha o contorno de inativo, e nao some sobre a superficie`, () => {
    render(
      <Button variant={variant} disabled>
        Travado
      </Button>,
    );
    const classes = screen.getByRole("button").className.split(" ");
    expect(classes).toContain("not-data-loading:disabled:border-border-disabled");
    expect(classes).not.toContain("not-data-loading:disabled:border-transparent");
    expect(classes.some((name) => name === "border" || name === "border-2")).toBe(true);
    expect(classes).toContain("not-data-loading:disabled:text-fg-disabled");
  });
}

test("o primario e o destrutivo guardam a borda transparente viva, e o tamanho nao pula ao desabilitar", () => {
  for (const variant of ["primary", "destructive"] as const) {
    const { unmount } = render(<Button variant={variant}>Emitir</Button>);
    const classes = screen.getByRole("button").className.split(" ");
    expect(classes).toContain("border");
    expect(classes).toContain("border-transparent");
    unmount();
  }
});

test("o fantasma desabilitado continua sem contorno, porque vivo ele nunca teve", () => {
  render(
    <Button variant="ghost" disabled>
      Voltar
    </Button>,
  );
  const classes = screen.getByRole("button").className.split(" ");
  expect(classes).not.toContain("border");
  expect(classes).not.toContain("border-2");
});

test("o IconButton desabilitado herda o contorno de inativo", () => {
  render(
    <IconButton label="Diminuir o zoom" variant="secondary" disabled>
      <svg />
    </IconButton>,
  );
  const classes = screen.getByRole("button", { name: "Diminuir o zoom" }).className.split(" ");
  expect(classes).toContain("not-data-loading:disabled:border-border-disabled");
  expect(classes).toContain("border");
});

test("carregando, o contorno segue o da variante, e nao o de inativo", () => {
  render(
    <Button variant="secondary" loading>
      Emitindo
    </Button>,
  );
  const classes = screen.getByRole("button").className.split(" ");
  expect(classes).toContain("border-border-strong");
  expect(classes.filter((name) => name.startsWith("disabled:border-"))).toEqual([]);
});
