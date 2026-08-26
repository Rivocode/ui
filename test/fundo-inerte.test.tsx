import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from "../src/components/alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "../src/components/dialog";
import { Sheet, SheetContent, SheetTitle } from "../src/components/sheet";

/* ---------------------------------------------------------------------------
 * O fundo escondido do leitor tem que sair tambem do alcance do teclado
 *
 * Medido no navegador com o dialogo aberto: o `#root` recebia `aria-hidden` e
 * nao recebia `inert`. Metade da barreira de pe e pior do que nenhuma: na
 * segunda volta do Tab o foco alcancava controle real da pagina de tras - o
 * botao de busca da barra lateral, um link de navegacao - e esse controle
 * estava `aria-hidden`, entao o leitor de tela se recusava a anuncia-lo. A
 * pessoa dava Tab, o foco ia para algum lugar, e nada era dito. Foco no nada.
 * O Firefox passava; Chromium e WebKit falhavam, que e diferenca de como cada
 * motor trata foco em subarvore com `aria-hidden`.
 *
 * Quem esconde e a Base UI, no `markOthers` do gerenciador de foco: ela sabe
 * aplicar `inert`, mas o `FloatingFocusManager` so pede `ariaHidden`. Nao ha
 * prop para pedir os dois, entao a barreira e completada aqui.
 *
 * O que estes testes nao alcancam: o happy-dom nao tem foco de navegador nem
 * respeita `inert` na ordem do Tab. Aqui se prova que o atributo esta no
 * elemento certo, no momento certo, e sai quando o painel fecha - nao que o
 * Tab pare de alcancar o fundo, que e coisa de motor de navegador.
 * ------------------------------------------------------------------------- */

/**
 * Espera o tique em que a barreira se completa.
 *
 * A Base UI so esconde o fundo alguns commits depois do painel montar, e quem
 * espelha isso responde num microtask. Sem esta espera o teste mede o instante
 * anterior ao conserto, e nao o conserto.
 */
async function settle() {
  await Promise.resolve();
}

/**
 * O fundo da pagina: o irmao do container de portal que a Base UI escondeu do
 * leitor de tela ao abrir o painel.
 */
function background() {
  return document.querySelector<HTMLElement>('body > div[aria-hidden="true"]');
}

test("com o dialogo aberto o fundo sai do alcance do teclado", async () => {
  render(
    <RivoProvider scope="local">
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Excluir projeto</DialogTitle>
        </DialogContent>
      </Dialog>
    </RivoProvider>,
  );

  await settle();

  const page = background();
  expect(page).not.toBeNull();
  expect(page!.hasAttribute("inert")).toBe(true);
});

test("com a confirmacao aberta o fundo sai do alcance do teclado", async () => {
  render(
    <RivoProvider scope="local">
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Cancelar a nota?</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    </RivoProvider>,
  );

  await settle();

  const page = background();
  expect(page).not.toBeNull();
  expect(page!.hasAttribute("inert")).toBe(true);
});

test("com a folha aberta o fundo sai do alcance do teclado", async () => {
  render(
    <RivoProvider scope="local">
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Navegacao</SheetTitle>
        </SheetContent>
      </Sheet>
    </RivoProvider>,
  );

  await settle();

  const page = background();
  expect(page).not.toBeNull();
  expect(page!.hasAttribute("inert")).toBe(true);
});

test("fechado o dialogo, a pagina volta inteira", async () => {
  render(
    <RivoProvider scope="local">
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Excluir projeto</DialogTitle>
          <DialogClose>Fechar</DialogClose>
        </DialogContent>
      </Dialog>
    </RivoProvider>,
  );

  await settle();
  expect(background()!.hasAttribute("inert")).toBe(true);

  fireEvent.click(screen.getByText("Fechar"));

  // Uma barreira que nao se desfaz e pior do que a que nunca existiu: a pagina
  // ficaria viva na tela e morta para o teclado.
  expect(document.querySelector("[inert]")).toBeNull();
});
