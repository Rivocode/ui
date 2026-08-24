import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../src/components/card";

test("o cartao usa a superficie e a borda do tema", () => {
  render(<Card data-testid="cartao">conteudo</Card>);
  const classes = screen.getByTestId("cartao").className;
  expect(classes).toContain("bg-surface");
  expect(classes).toContain("border-border");
  expect(classes).toContain("rounded-lg");
});

test("a elevacao levantada troca a superficie e ganha sombra", () => {
  render(
    <Card data-testid="cartao" elevation="raised">
      conteudo
    </Card>,
  );
  const classes = screen.getByTestId("cartao").className;
  expect(classes).toContain("bg-surface-raised");
  expect(classes).toContain("shadow-2");
});

test("o titulo sai como cabecalho de verdade, nao como div estilizada", () => {
  render(
    <Card>
      <CardHeader>
        <CardTitle>Resumo do mes</CardTitle>
        <CardDescription>Agosto de 2026</CardDescription>
      </CardHeader>
      <CardContent>corpo</CardContent>
      <CardFooter>rodape</CardFooter>
    </Card>,
  );
  expect(screen.getByRole("heading", { name: "Resumo do mes" }).tagName).toBe("H3");
  expect(screen.getByText("Agosto de 2026").className).toContain("text-fg-muted");
});

test("a classe passada por quem usa sobrescreve a do componente", () => {
  render(<Card data-testid="cartao" className="rounded-xl" />);
  const classes = screen.getByTestId("cartao").className;
  expect(classes).toContain("rounded-xl");
  expect(classes).not.toContain("rounded-lg");
});
