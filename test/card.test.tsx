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

test("the card uses the theme surface and border", () => {
  render(<Card data-testid="cartao">conteudo</Card>);
  const classes = screen.getByTestId("cartao").className;
  expect(classes.split(" ")).toContain("bg-surface");
  expect(classes.split(" ")).toContain("border-border");
  expect(classes).toContain("rounded-lg");
});

test("the raised elevation swaps the surface and gains a shadow", () => {
  render(
    <Card data-testid="cartao" elevation="raised">
      conteudo
    </Card>,
  );
  const classes = screen.getByTestId("cartao").className;
  expect(classes).toContain("bg-surface-raised");
  expect(classes).toContain("shadow-2");
});

test("the title renders as a real heading, not as a styled div", () => {
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

test("the class passed by the consumer overrides the component's", () => {
  render(<Card data-testid="cartao" className="rounded-xl" />);
  const classes = screen.getByTestId("cartao").className;
  expect(classes).toContain("rounded-xl");
  expect(classes).not.toContain("rounded-lg");
});
