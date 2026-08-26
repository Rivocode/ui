import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/table";

/*
 * Quem monta a Table a mao escrevia o titulo numa <p> acima dela. Nada quebra,
 * e o leitor de tela anuncia "tabela, 3 colunas, 2 linhas" e mais nada: texto
 * vizinho nao nomeia elemento nenhum, e numa tela com duas tabelas as duas
 * chegam sem nome.
 *
 * O que estes testes guardam e o nome: que a legenda sai num <caption> dentro
 * da mesma <table>, e que e dali que o nome acessivel dela vem - inclusive
 * quando a legenda esta escondida da tela.
 */

const LEGENDA = "Pagamentos recebidos em junho de 2025";

function tabela(caption: ReactNode = <TableCaption>{LEGENDA}</TableCaption>) {
  return render(
    <Table>
      {caption}
      <TableHeader>
        <TableRow>
          <TableHead>Identificador</TableHead>
          <TableHead>Meio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>PIX-9021</TableCell>
          <TableCell>Pix</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
}

test("a legenda sai como <caption> dentro da mesma <table>", () => {
  const { container } = tabela();

  const caption = container.querySelector("caption");
  expect(caption).not.toBeNull();
  expect(caption!.textContent).toBe(LEGENDA);
  // Dentro da <table>, e nao na <div> de rolagem que o Table desenha em volta:
  // e o parentesco que faz dela o nome, e nao um paragrafo qualquer.
  expect(caption!.parentElement).toBe(container.querySelector("table"));
});

test("a legenda e o nome acessivel da tabela", () => {
  tabela();

  expect(screen.getByRole("table", { name: LEGENDA })).toBeDefined();
});

test("sem legenda a tabela chega sem nome, que e o caso que a peca conserta", () => {
  tabela(null);

  expect(screen.queryByRole("table", { name: LEGENDA })).toBeNull();
  expect(screen.getByRole("table").getAttribute("aria-label")).toBeNull();
});

test("um titulo acima da tabela nao nomeia a tabela", () => {
  render(
    <>
      <h3>{LEGENDA}</h3>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>PIX-9021</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>,
  );

  expect(screen.getByRole("heading", { name: LEGENDA })).toBeDefined();
  expect(screen.queryByRole("table", { name: LEGENDA })).toBeNull();
});

test("escondida da tela, a legenda continua nomeando", () => {
  const { container } = tabela(<TableCaption className="sr-only">{LEGENDA}</TableCaption>);

  expect(container.querySelector("caption")!.className).toContain("sr-only");
  expect(screen.getByRole("table", { name: LEGENDA })).toBeDefined();
});

test("a legenda nao entra na contagem de linhas da tabela", () => {
  tabela();

  // O <caption> nao e <tr>: se ele virasse linha, toda tabela com legenda
  // passaria a anunciar uma linha a mais do que tem.
  expect(screen.getAllByRole("row")).toHaveLength(2);
});

test("a legenda alinha a esquerda, e nao no centro que o navegador da", () => {
  const { container } = tabela();

  expect(container.querySelector("caption")!.className).toContain("text-left");
});

test("a classe de quem usa vence a do TableCaption", () => {
  const { container } = tabela(<TableCaption className="caption-bottom">{LEGENDA}</TableCaption>);

  const caption = container.querySelector("caption")!;
  expect(caption.className).toContain("caption-bottom");
  expect(caption.className).not.toContain("caption-top");
});

test("a legenda sai pelo indice publico do pacote", async () => {
  const index = await import("../src/index");

  expect(index.TableCaption).toBe(TableCaption);
});
