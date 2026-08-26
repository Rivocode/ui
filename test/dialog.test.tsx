import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "../src/components/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogFooter } from "../src/components/alert-dialog";
import { RivoProvider } from "../src/provider/rivo-provider";

function Example() {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Excluir projeto</DialogTitle>
        <DialogDescription>Esta acao nao pode ser desfeita.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

test("o dialogo aberto mostra titulo e descricao", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getByText("Excluir projeto")).toBeDefined();
  expect(screen.getByText("Esta acao nao pode ser desfeita.")).toBeDefined();
});

test("no modo escopado o dialogo renderiza dentro do container que carrega o tema", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Example />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container).not.toBeNull();
  expect(container!.contains(screen.getByText("Excluir projeto"))).toBe(true);
});

test("o empilhamento vem da escala, nunca de um numero cravado", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  const popup = screen.getByRole("dialog");
  expect(popup.className).toContain("--rc-z-dialog");
  expect(popup.className).not.toMatch(/z-\d+/);
});

test("o dialogo exige o Provider e diz isso claramente", () => {
  expect(() => render(<Example />)).toThrow(/RivoProvider/);
});

/** A classe da tarja, achada pelo marcador que a peca deixou passar. */
function backdrop(marker: string) {
  return document.querySelector(`.${marker}`)!.className;
}

test("a tarja do dialogo entra e sai animada, como a da confirmacao", () => {
  // O `transition-opacity` sozinho nao anima nada: sem os dois estados a
  // transicao nao tem de onde sair nem para onde ir, e o escurecimento entrava
  // e saia de estalo. A confirmacao e a folha ja tinham os dois, e o dialogo
  // era o unico que piscava - com a classe de transicao no lugar, escondendo
  // a falta.
  render(
    <RivoProvider scope="local">
      <Dialog open>
        <DialogContent classNames={{ backdrop: "tarja-dg" }}>Corpo</DialogContent>
      </Dialog>
      <AlertDialog open>
        <AlertDialogContent classNames={{ backdrop: "tarja-ad" }}>Corpo</AlertDialogContent>
      </AlertDialog>
    </RivoProvider>,
  );

  for (const marker of ["tarja-dg", "tarja-ad"]) {
    expect(`${marker}: ${backdrop(marker).includes("data-[starting-style]:opacity-0")}`).toBe(
      `${marker}: true`,
    );
    expect(`${marker}: ${backdrop(marker).includes("data-[ending-style]:opacity-0")}`).toBe(
      `${marker}: true`,
    );
  }
});

test("os dois rodapes empilham no celular, e nao so o da confirmacao", () => {
  // O painel dos dois ja encosta embaixo no celular; o que mudava era o
  // rodape, e duas acoes lado a lado num painel dessa largura saem estreitas
  // demais. `flex-col-reverse` sobe a ultima da marcacao - a que confirma -
  // para o alto da pilha, e deixa a saida rente ao polegar.
  const { container } = render(
    <RivoProvider scope="local">
      <DialogFooter data-testid="rodape-dg">Acoes</DialogFooter>
      <AlertDialogFooter data-testid="rodape-ad">Acoes</AlertDialogFooter>
    </RivoProvider>,
  );

  for (const id of ["rodape-dg", "rodape-ad"]) {
    const footer = container.ownerDocument.querySelector(`[data-testid="${id}"]`)!;
    expect(`${id}: ${footer.className.includes("max-sm:flex-col-reverse")}`).toBe(`${id}: true`);
    expect(`${id}: ${footer.className.includes("max-sm:[&>*]:w-full")}`).toBe(`${id}: true`);
  }
});
