import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Alert, AlertDescription, AlertTitle } from "../src/components/alert";
import { EmptyState } from "../src/components/empty-state";
import { Skeleton } from "../src/components/skeleton";

test("o aviso de erro se anuncia ao leitor de tela sem esperar foco", () => {
  render(
    <Alert tone="danger">
      <AlertTitle>Nao foi possivel carregar</AlertTitle>
      <AlertDescription>Tente de novo em alguns segundos.</AlertDescription>
    </Alert>,
  );
  const alert = screen.getByRole("alert");
  expect(alert.className).toContain("text-danger-text");
});

test("o aviso informativo nao interrompe o leitor de tela", () => {
  render(
    <Alert tone="info">
      <AlertTitle>Prazo alterado</AlertTitle>
    </Alert>,
  );
  expect(screen.getByRole("status")).toBeDefined();
});

test("o esqueleto some quando a pessoa pede menos movimento", () => {
  render(<Skeleton className="h-4 w-40" data-testid="osso" />);
  const bone = screen.getByTestId("osso");
  expect(bone.className).toContain("animate-pulse");
  expect(bone.className).toContain("motion-reduce:animate-none");
});

test("o esqueleto se esconde do leitor de tela, porque nao tem o que ler", () => {
  render(<Skeleton data-testid="osso" />);
  expect(screen.getByTestId("osso").getAttribute("aria-hidden")).toBe("true");
});

test('o estado vazio sempre oferece uma saida, nunca so "sem dados"', () => {
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

test("o icone do estado vazio sai do caminho do leitor de tela, como o do aviso", () => {
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

test("o estado vazio funciona sem acao, mas continua explicando o motivo", () => {
  render(<EmptyState title="Nada encontrado" description="Nenhum resultado para esse filtro." />);
  expect(screen.getByText("Nenhum resultado para esse filtro.")).toBeDefined();
});

test("o esqueleto usa token proprio, nao superficie, senao some no tema claro", () => {
  render(<Skeleton data-testid="osso" />);
  const classes = screen.getByTestId("osso").className;
  expect(classes).toContain("bg-skeleton");
  expect(classes).not.toContain("bg-surface");
});
