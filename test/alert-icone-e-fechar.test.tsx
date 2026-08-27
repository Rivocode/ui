import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { CircleX, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "../src/components/alert";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * "Cor nunca e o unico sinal" e regra da casa, e o Alert era a peca que mais
 * dependia dela: quatro caixas identicas de forma, separadas so pelo tom. O
 * icone ja entrava - como filho, no meio do titulo e da descricao, sem coluna
 * propria e num lugar diferente a cada tela -, que e exatamente o que a regra
 * existe para evitar.
 */

function alert(props: React.ComponentProps<typeof Alert> = {}) {
  return render(
    <RivoProvider scope="local">
      <Alert {...props}>
        <AlertTitle>Certificado vence em 8 dias</AlertTitle>
        <AlertDescription>Renove antes de 01/09.</AlertDescription>
      </Alert>
    </RivoProvider>,
  );
}

test("o icone entra num slot proprio, antes do texto e sempre no mesmo lugar", () => {
  const { container } = alert({ tone: "warning", icon: <TriangleAlert /> });

  const root = screen.getByRole("alert");
  const first = root.firstElementChild!;

  expect(first.querySelector("svg")).not.toBeNull();
  // Antes do texto na ordem do DOM, e nao perdido entre titulo e descricao.
  expect(first.nextElementSibling!.textContent).toContain("Certificado vence");
  expect(container.querySelectorAll("svg")).toHaveLength(1);
});

test("o icone e mudo para o leitor de tela: o texto ao lado ja diz o que ele desenha", () => {
  alert({ tone: "danger", icon: <CircleX /> });

  const icon = screen.getByRole("alert").firstElementChild!;
  expect(icon.getAttribute("aria-hidden")).toBe("true");
});

test("sem icone, o texto continua sendo o primeiro filho", () => {
  alert({ tone: "info" });

  const root = screen.getByRole("status");
  expect(root.firstElementChild!.textContent).toContain("Certificado vence");
});

test("o titulo e a descricao continuam empilhados, com ou sem icone", () => {
  alert({ tone: "info", icon: <TriangleAlert /> });

  const column = screen.getByText("Certificado vence em 8 dias").parentElement!;
  expect(column.className.split(" ")).toContain("flex-col");
});

test("onDismiss liga o xis, e quem some com o aviso e quem chamou", () => {
  const onDismiss = mock(() => {});
  alert({ tone: "info", onDismiss });

  const close = screen.getByRole("button", { name: "Fechar aviso" });
  fireEvent.click(close);

  expect(onDismiss).toHaveBeenCalledTimes(1);
  // A peca nao guarda estado: o aviso continua na tela ate quem chamou tira-lo.
  expect(screen.getByRole("status")).toBeDefined();
});

test("sem onDismiss nao ha botao, que continua sendo o padrao", () => {
  alert({ tone: "info" });
  expect(screen.queryByRole("button")).toBeNull();
});

test("o nome do botao de fechar se traduz", () => {
  alert({ tone: "info", onDismiss: () => {}, dismissLabel: "Dispensar" });

  expect(screen.getByRole("button", { name: "Dispensar" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Fechar aviso" })).toBeNull();
});

test("o xis tem foco visivel, e nao so um outline apagado", () => {
  alert({ tone: "info", onDismiss: () => {} });

  const close = screen.getByRole("button", { name: "Fechar aviso" });
  expect(close.className).toContain("focus-visible:ring-2");
  expect(close.className).toContain("focus-visible:ring-ring");
});

test("o tom continua decidindo a urgencia do anuncio", () => {
  alert({ tone: "danger", icon: <CircleX />, onDismiss: () => {} });
  expect(screen.getByRole("alert")).toBeDefined();
});

test("a classe de quem usa continua vencendo na raiz", () => {
  alert({ tone: "info", className: "rounded-xl", icon: <TriangleAlert /> });

  const root = screen.getByRole("status");
  expect(root.className).toContain("rounded-xl");
  expect(root.className).not.toContain("rounded-lg");
});
