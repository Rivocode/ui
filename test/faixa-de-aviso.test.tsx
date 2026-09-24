import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Wrench } from "lucide-react";

import { Banner, type BannerProps } from "../src/components/banner";
import { Button } from "../src/components/button";
import { RivoProvider } from "../src/provider/rivo-provider";

function banner(props: Partial<BannerProps> = {}) {
  return render(
    <RivoProvider scope="local">
      <Banner description="O sistema fica fora do ar domingo, das 2h às 4h." {...props} />
    </RivoProvider>,
  );
}

test("info e success esperam a frase terminar: role status", () => {
  for (const tone of ["info", "success"] as const) {
    const { unmount } = banner({ tone });
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
    unmount();
  }
});

test("warning e danger interrompem: role alert", () => {
  for (const tone of ["warning", "danger"] as const) {
    const { unmount } = banner({ tone });
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
  }
});

test("sem tom, nasce info", () => {
  banner();
  const root = screen.getByRole("status");
  expect(root.getAttribute("data-tone")).toBe("info");
  expect(root.className.split(" ")).toContain("bg-info-subtle");
});

test("ocupa a largura toda e pinta o fundo do tom, sem cantos de cartao", () => {
  banner({ tone: "warning" });
  const tokens = screen.getByRole("alert").className.split(" ");
  expect(tokens).toContain("w-full");
  expect(tokens).toContain("bg-warning-subtle");
  expect(tokens).toContain("border-b");
  expect(tokens.some((token) => token.startsWith("rounded"))).toBe(false);
});

test("o titulo nomeia a faixa e fica antes da descricao", () => {
  banner({ tone: "danger", title: "Conta em atraso" });
  const root = screen.getByRole("alert", { name: "Conta em atraso" });
  const title = screen.getByText("Conta em atraso");
  const description = screen.getByText(/fora do ar/);
  expect(root.contains(title)).toBe(true);
  expect(title.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});

test("sem titulo, a faixa nao aponta para nome nenhum", () => {
  banner();
  expect(screen.getByRole("status").getAttribute("aria-labelledby")).toBeNull();
});

test("o icone do tom aparece sozinho e mudo", () => {
  const { container } = banner({ tone: "warning" });
  const icon = container.querySelector("svg")!;
  expect(icon).not.toBeNull();
  expect(icon.closest("[aria-hidden='true']")).not.toBeNull();
});

test("icon troca o simbolo, e null tira", () => {
  const { unmount } = banner({ icon: <Wrench data-testid="chave" /> });
  expect(screen.getByTestId("chave")).toBeDefined();
  unmount();

  const second = banner({ icon: null });
  expect(second.container.querySelector("svg")).toBeNull();
});

test("as acoes entram na faixa, e sem elas nao ha botao nenhum", () => {
  const { unmount } = banner();
  expect(screen.queryByRole("button")).toBeNull();
  unmount();

  banner({
    tone: "danger",
    actions: (
      <Button size="sm" variant="secondary">
        Pagar agora
      </Button>
    ),
  });
  expect(screen.getByRole("button", { name: "Pagar agora" })).toBeDefined();
});

test("onDismiss liga o xis com nome em portugues, e quem some e quem chamou", () => {
  const onDismiss = mock(() => {});
  banner({ onDismiss });

  const close = screen.getByRole("button", { name: "Fechar aviso" });
  fireEvent.click(close);

  expect(onDismiss).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toBeDefined();
});

test("o nome do xis se troca", () => {
  banner({ onDismiss: () => {}, dismissLabel: "Dispensar aviso de manutenção" });
  expect(screen.getByRole("button", { name: "Dispensar aviso de manutenção" })).toBeDefined();
});

test("classNames alcanca cada parte pelo nome", () => {
  banner({
    title: "Modo de teste",
    actions: <Button size="sm">Sair</Button>,
    onDismiss: () => {},
    classNames: {
      icon: "parte-icone",
      content: "parte-conteudo",
      title: "parte-titulo",
      description: "parte-descricao",
      actions: "parte-acoes",
      dismiss: "parte-fechar",
    },
  });

  for (const part of [
    "parte-icone",
    "parte-conteudo",
    "parte-titulo",
    "parte-descricao",
    "parte-acoes",
    "parte-fechar",
  ]) {
    expect(document.querySelectorAll(`.${part}`)).toHaveLength(1);
  }
});

test("rotulo longo quebra dentro do botao da acao, e a faixa nao alarga a pagina a 320px", () => {
  banner({ actions: <Button size="sm">Reagendar a manutenção para outro domingo</Button> });

  const action = screen.getByRole("button", { name: /Reagendar/ });
  const actions = (action.parentElement!.getAttribute("class") ?? "").split(" ");
  for (const token of [
    "min-w-0",
    "[&>button]:h-auto",
    "[&>button]:min-h-[var(--rc-control-sm)]",
    "[&>button]:max-w-full",
    "[&>button]:shrink",
    "[&>button]:whitespace-normal",
  ]) {
    expect(actions).toContain(token);
  }
  expect(actions).not.toContain("shrink-0");
});
