import { expect, test } from "bun:test";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { DataTable, type Column } from "../src/components/data-table";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * Os invariantes velhos (erro vence carregando, vazio so depois da consulta,
 * guard do clique na linha) vivem em onda-c.test.tsx e continuam valendo sem
 * uma linha editada: e a prova de que o motor novo nao quebrou a API.
 * Aqui entram so as capacidades novas.
 */

type Nota = { id: string; number: string; customer: string; amount: number };

const NOTAS: Nota[] = [
  { id: "1", number: "4813", customer: "Clinica Sao Lucas", amount: 2480 },
  { id: "2", number: "4814", customer: "Transportes Cabo Branco", amount: 940 },
  { id: "3", number: "4815", customer: "Padaria Aurora", amount: 1620 },
  { id: "4", number: "4816", customer: "Otica Central", amount: 310 },
  { id: "5", number: "4817", customer: "Acougue do Ze", amount: 75 },
];

const COLUNAS: Column<Nota>[] = [
  { key: "number", header: "Numero", sortable: true },
  { key: "customer", header: "Cliente" },
  { key: "amount", header: "Valor", align: "right", sortable: true },
];

function tabela(props: Partial<React.ComponentProps<typeof DataTable<Nota>>> = {}) {
  return render(
    <RivoProvider scope="local">
      <DataTable
        data={NOTAS}
        columns={props.columns ?? COLUNAS}
        rowKey={(nota) => nota.id}
        {...props}
      />
    </RivoProvider>,
  );
}

/** Os textos da primeira celula de cada linha do corpo, na ordem visivel. */
function primeiraColuna(container: HTMLElement) {
  return [...container.querySelectorAll("tbody tr")].map(
    (linha) => linha.querySelector("td")?.textContent ?? "",
  );
}

test("clicar no cabecalho ordena, clicar de novo inverte, e a terceira vez desfaz", () => {
  const { container } = tabela();
  const header = screen.getByRole("button", { name: /valor/i });

  fireEvent.click(header);
  expect(primeiraColuna(container)).toEqual(["4817", "4816", "4814", "4815", "4813"]);

  fireEvent.click(header);
  expect(primeiraColuna(container)).toEqual(["4813", "4815", "4814", "4816", "4817"]);

  fireEvent.click(header);
  expect(primeiraColuna(container)).toEqual(["4813", "4814", "4815", "4816", "4817"]);
});

test("o th anuncia a direcao com aria-sort", () => {
  tabela();
  const th = screen.getByRole("columnheader", { name: /valor/i });
  expect(th.getAttribute("aria-sort")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(th.getAttribute("aria-sort")).toBe("ascending");

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(th.getAttribute("aria-sort")).toBe("descending");
});

test("coluna sem sortable nao vira botao", () => {
  tabela();
  expect(screen.queryByRole("button", { name: /cliente/i })).toBeNull();
});

test("a coluna com cell usa value para ordenar", () => {
  const colunas: Column<Nota>[] = [
    { key: "number", header: "Numero" },
    {
      key: "amount",
      header: "Valor",
      sortable: true,
      value: (nota) => nota.amount,
      cell: (nota) => <span>{`R$ ${nota.amount}`}</span>,
    },
  ];
  const { container } = tabela({ columns: colunas });

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(primeiraColuna(container)).toEqual(["4817", "4816", "4814", "4815", "4813"]);
});

test("o filtro acha sem acento e sem caixa", () => {
  const { container } = tabela({ filter: "ótica" });
  expect(primeiraColuna(container)).toEqual(["4816"]);
});

test("o filtro sem resultado explica, sem roubar o EmptyState da consulta vazia", () => {
  tabela({
    filter: "zzz",
    empty: { title: "Nenhuma nota", description: "Emita a primeira." },
  });
  expect(screen.getByText(/nenhum resultado/i)).toBeDefined();
  expect(screen.queryByText("Nenhuma nota")).toBeNull();
});

test("pageSize corta a lista e o rodape conta o todo", () => {
  const { container } = tabela({ pageSize: 2 });
  expect(primeiraColuna(container)).toEqual(["4813", "4814"]);
  expect(screen.getByText(/1–2 de 5/)).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: /próxima página/i }));
  expect(primeiraColuna(container)).toEqual(["4815", "4816"]);
  expect(screen.getByText(/3–4 de 5/)).toBeDefined();
});

test("sem pageSize nao ha rodape", () => {
  tabela();
  expect(screen.queryByRole("navigation")).toBeNull();
});

test("filtrar volta para a primeira pagina", async () => {
  const { container, rerender } = tabela({ pageSize: 2 });
  fireEvent.click(screen.getByRole("button", { name: /próxima página/i }));
  expect(primeiraColuna(container)).toEqual(["4815", "4816"]);

  rerender(
    <RivoProvider scope="local">
      <DataTable
        data={NOTAS}
        columns={COLUNAS}
        rowKey={(nota) => nota.id}
        pageSize={2}
        filter="48"
      />
    </RivoProvider>,
  );
  // O reset de pagina do motor sai numa microtask; na app ele ja aconteceu
  // antes de qualquer olho ver, aqui o teste espera a fila esvaziar.
  await act(async () => {});
  expect(primeiraColuna(container)).toEqual(["4813", "4814"]);
});

test("selecionar uma linha devolve a chave do rowKey", () => {
  let selecionadas: string[] = [];
  tabela({ selectable: true, onSelectedChange: (keys) => (selecionadas = keys) });

  const linha = screen.getByText("Padaria Aurora").closest("tr")!;
  fireEvent.click(within(linha).getByRole("checkbox"));
  expect(selecionadas).toEqual(["3"]);
});

test("o checkbox do cabecalho seleciona a pagina visivel, nao o mundo", () => {
  let selecionadas: string[] = [];
  tabela({
    selectable: true,
    pageSize: 2,
    onSelectedChange: (keys) => (selecionadas = keys),
  });

  fireEvent.click(screen.getByRole("checkbox", { name: /selecionar todas/i }));
  expect(selecionadas.toSorted()).toEqual(["1", "2"]);
});

test("selecao controlada obedece a prop", () => {
  tabela({ selectable: true, selected: ["2"] });

  const linha = screen.getByText("Transportes Cabo Branco").closest("tr")!;
  const checkbox = within(linha).getByRole("checkbox");
  expect(checkbox.getAttribute("aria-checked")).toBe("true");
});

test("linha clicavel e selecao convivem: o clique no checkbox nao abre a linha", () => {
  let aberta: Nota | undefined;
  tabela({ selectable: true, onRowClick: (nota) => (aberta = nota) });

  const linha = screen.getByText("Padaria Aurora").closest("tr")!;
  fireEvent.click(within(linha).getByRole("checkbox"));
  expect(aberta).toBeUndefined();

  fireEvent.click(screen.getByText("Padaria Aurora"));
  expect(aberta?.id).toBe("3");
});

test("a coluna que ordena sai na mesma caixa da que nao ordena", () => {
  // O th ja pede uppercase, e a folha do navegador zera text-transform em
  // controle de formulario: a coluna com sortable renderiza um button dentro,
  // e a linha saia com caixa misturada - "Numero" ao lado de "CLIENTE".
  const { container } = tabela();

  const cabecalho = container.querySelector("th") as HTMLElement;
  const botao = container.querySelector("th button") as HTMLElement;

  expect(cabecalho.className).toContain("uppercase");
  expect(botao.className).toContain("uppercase");
});
