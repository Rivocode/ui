import { expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { Button } from "../src/components/button";
import { useToast } from "../src/components/toast";
import { RivoProvider } from "../src/provider/rivo-provider";

function Disparo() {
  const toast = useToast();
  return (
    <Button onClick={() => toast.add({ title: "Nota emitida", description: "Numero 4816." })}>
      Emitir
    </Button>
  );
}

test("o aviso aparece depois da acao, sem o app montar portal nenhum", () => {
  render(
    <RivoProvider>
      <Disparo />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  expect(screen.getByText("Nota emitida")).toBeDefined();
  expect(screen.getByText("Numero 4816.")).toBeDefined();
});

test("o aviso aparece dentro do container que carrega o tema", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Disparo />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Nota emitida");
});

test("usar o aviso fora do Provider da erro, e nao silencio", () => {
  function Solto() {
    useToast();
    return null;
  }
  expect(() => render(<Solto />)).toThrow();
});

test("o gerenciador tem identidade estavel, senao um useEffect entra em laco", () => {
  const vistos: unknown[] = [];
  function Spy() {
    vistos.push(useToast());
    return null;
  }
  const { rerender } = render(
    <RivoProvider>
      <Spy />
    </RivoProvider>,
  );
  rerender(
    <RivoProvider>
      <Spy />
    </RivoProvider>,
  );
  expect(vistos.length).toBeGreaterThan(1);
  expect(vistos.every((v) => v === vistos[0])).toBe(true);
});

test("o canto do aviso e escolhido no provider, e nao no CSS de quem usa", () => {
  render(
    <RivoProvider scope="local" toastPosition="top-left">
      <Disparo />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));

  const area = document.querySelector('[class*="fixed"][class*="top-4"]');
  expect(area).not.toBeNull();
  expect(area!.className).toContain("left-4");
  // O padrao nao pode sobrar junto: os dois cantos ao mesmo tempo deixariam a
  // area presa no de baixo, e a escolha seria silenciosamente ignorada.
  expect(area!.className).not.toContain("bottom-4");
});

test("o aviso entra pela borda mais proxima, e nao atravessa a tela", () => {
  render(
    <RivoProvider scope="local" toastPosition="top-left">
      <Disparo />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));

  const alert = screen.getByText("Nota emitida").closest("[class*='rounded-lg']");
  expect(alert).not.toBeNull();
  // Ancorado a esquerda, ele desliza da esquerda.
  expect(alert!.className).toContain("data-[starting-style]:-translate-x-4");
});

function DisparoComTom({ type }: { type?: string }) {
  const toast = useToast();
  return (
    <Button onClick={() => toast.add({ title: "Emissao", description: "Detalhe.", type })}>
      Emitir
    </Button>
  );
}

/** O balao do aviso na tela, que e quem carrega o tom. */
function balao() {
  return document.querySelector('[class*="shadow-3"]') as HTMLElement;
}

test("o aviso de erro nao sai igual ao de sucesso", () => {
  // O tom que a Base UI carrega no objeto nao era lido, e Alert e Badge
  // separam esses tres com cuidado no mesmo sistema: aviso de sucesso, de erro
  // e de atencao saiam visualmente identicos.
  const { rerender } = render(
    <RivoProvider>
      <DisparoComTom type="success" />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  expect(balao().className).toContain("bg-success-subtle");

  rerender(
    <RivoProvider>
      <DisparoComTom type="error" />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  const tons = [...document.querySelectorAll('[class*="shadow-3"]')].map((no) => no.className);
  expect(tons.some((classe) => classe.includes("bg-danger-subtle"))).toBe(true);
});

test("o aviso sem tom continua neutro, que e o padrao", () => {
  render(
    <RivoProvider>
      <DisparoComTom />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));

  expect(balao().className).toContain("bg-surface-raised");
  expect(balao().className).not.toContain("subtle");
});

function closeButtons(count: number) {
  const found = [...document.querySelectorAll<HTMLElement>('[aria-label="Fechar aviso"]')];
  expect(found.length).toBe(count);
  return found;
}

function TwoNotices() {
  const toast = useToast();
  return (
    <Button
      onClick={() => {
        toast.add({ title: "Nota 4816 emitida", timeout: 0 });
        toast.add({ title: "Nota 4817 emitida", timeout: 0 });
      }}
    >
      Emitir duas
    </Button>
  );
}

test("fechar o aviso leva o foco para o aviso vizinho, e o ultimo devolve o foco a quem estava antes", async () => {
  render(
    <RivoProvider>
      <TwoNotices />
    </RivoProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Emitir duas" });
  fireEvent.click(trigger);
  trigger.focus();

  const closers = await waitFor(() => closeButtons(2));
  closers[0]!.focus();
  fireEvent.click(closers[0]!);

  const [last] = await waitFor(() => closeButtons(1));
  await waitFor(() => expect(last!.closest("[role=dialog]")!.contains(document.activeElement)).toBe(true));

  last!.focus();
  fireEvent.click(last!);
  await waitFor(() => closeButtons(0));
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test("o xis do aviso estica o alvo por fora do desenho", () => {
  render(
    <RivoProvider>
      <Disparo />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  const [closer] = closeButtons(1);
  expect(closer!.getAttribute("aria-label")).toBe("Fechar aviso");
  const tokens = closer!.className.split(" ");
  expect(tokens).toContain("relative");
  expect(tokens).toContain("after:absolute");
  expect(tokens).toContain("after:-inset-1");
});
