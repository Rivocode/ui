import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Alert, AlertDescription, AlertTitle } from "../src/components/alert";
import { EmptyState } from "../src/components/empty-state";
import { Skeleton } from "../src/components/skeleton";

test("the error alert announces itself to the screen reader without waiting for focus", () => {
  render(
    <Alert tone="danger">
      <AlertTitle>Nao foi possivel carregar</AlertTitle>
      <AlertDescription>Tente de novo em alguns segundos.</AlertDescription>
    </Alert>,
  );
  const alert = screen.getByRole("alert");
  expect(alert.className).toContain("text-danger-text");
});

test("the informative alert does not interrupt the screen reader", () => {
  render(
    <Alert tone="info">
      <AlertTitle>Prazo alterado</AlertTitle>
    </Alert>,
  );
  expect(screen.getByRole("status")).toBeDefined();
});

test("the skeleton disappears when the person asks for reduced motion", () => {
  render(<Skeleton className="h-4 w-40" data-testid="osso" />);
  const bone = screen.getByTestId("osso");
  expect(bone.className).toContain("animate-pulse");
  expect(bone.className).toContain("motion-reduce:animate-none");
});

test("the skeleton hides from the screen reader, because there is nothing to read", () => {
  render(<Skeleton data-testid="osso" />);
  expect(screen.getByTestId("osso").getAttribute("aria-hidden")).toBe("true");
});

test('the empty state always offers a way out, never just "sem dados"', () => {
  render(
    <EmptyState
      title="Nenhuma nota por aqui"
      description="Quando voce emitir a primeira, ela aparece nesta lista."
      action={<button type="button">Emitir nota</button>}
    />,
  );
  expect(screen.getByText("Nenhuma nota por aqui")).toBeDefined();
  expect(screen.getByRole("button", { name: "Emitir nota" })).toBeDefined();
});

test("the empty state icon gets out of the screen reader's way, like the alert's", () => {
  render(
    <EmptyState
      icon={<img src="/vazio.svg" alt="Uma caixa aberta" data-testid="ilustracao" />}
      title="Nenhuma nota por aqui"
      description="Quando voce emitir a primeira, ela aparece nesta lista."
    />,
  );

  const wrapper = screen.getByTestId("ilustracao").parentElement;
  expect(wrapper?.getAttribute("aria-hidden")).toBe("true");
  expect(screen.queryByRole("img", { name: "Uma caixa aberta" })).toBeNull();
});

test("the illustration does not inherit the icon's forced 32px, and leaves the screen reader", () => {
  render(
    <EmptyState
      illustration={<svg data-testid="desenho" viewBox="0 0 120 80" />}
      title="Nenhuma nota por aqui"
      description="Quando voce emitir a primeira, ela aparece nesta lista."
    />,
  );

  const wrapper = screen.getByTestId("desenho").parentElement!;
  const tokens = wrapper.className.split(" ");
  expect(wrapper.getAttribute("aria-hidden")).toBe("true");
  expect(tokens).toContain("text-fg-subtle");
  expect(tokens).not.toContain("[&_svg]:size-8");
});

test("the icon keeps the forced 32px", () => {
  render(
    <EmptyState
      icon={<svg data-testid="simbolo" />}
      title="Nada encontrado"
      description="Nenhum resultado para esse filtro."
    />,
  );

  const tokens = screen.getByTestId("simbolo").parentElement!.className.split(" ");
  expect(tokens).toContain("[&_svg]:size-8");
  expect(tokens).toContain("text-fg-subtle");
});

test("with illustration and icon, the illustration takes the icon's place", () => {
  render(
    <EmptyState
      icon={<svg data-testid="simbolo" />}
      illustration={<svg data-testid="desenho" />}
      title="Nenhuma nota por aqui"
      description="Quando voce emitir a primeira, ela aparece nesta lista."
    />,
  );

  expect(screen.getByTestId("desenho")).toBeDefined();
  expect(screen.queryByTestId("simbolo")).toBeNull();
});

test("the empty state works without an action, but still explains why", () => {
  render(<EmptyState title="Nada encontrado" description="Nenhum resultado para esse filtro." />);
  expect(screen.getByText("Nenhum resultado para esse filtro.")).toBeDefined();
});

test("the skeleton uses its own token, not surface, otherwise it disappears in the light theme", () => {
  render(<Skeleton data-testid="osso" />);
  const classes = screen.getByTestId("osso").className;
  expect(classes).toContain("bg-skeleton");
  expect(classes).not.toContain("bg-surface");
});
