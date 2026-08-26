import { afterAll, beforeAll, expect, test } from "bun:test";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { DataTable, type Column } from "../src/components/data-table";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * Os invariantes velhos (erro vence carregando, vazio so depois da consulta,
 * guard do clique na linha) vivem em onda-c.test.tsx e continuam valendo sem
 * uma linha editada: e a prova de que o motor novo nao quebrou a API.
 * Aqui entram so as capacidades novas.
 */

type Invoice = { id: string; number: string; customer: string; amount: number };

const INVOICES: Invoice[] = [
  { id: "1", number: "4813", customer: "Clinica Sao Lucas", amount: 2480 },
  { id: "2", number: "4814", customer: "Transportes Cabo Branco", amount: 940 },
  { id: "3", number: "4815", customer: "Padaria Aurora", amount: 1620 },
  { id: "4", number: "4816", customer: "Otica Central", amount: 310 },
  { id: "5", number: "4817", customer: "Acougue do Ze", amount: 75 },
];

const COLUMNS: Column<Invoice>[] = [
  { key: "number", header: "Numero", sortable: true },
  { key: "customer", header: "Cliente" },
  { key: "amount", header: "Valor", align: "right", sortable: true },
];

function table(props: Partial<React.ComponentProps<typeof DataTable<Invoice>>> = {}) {
  return render(
    <RivoProvider scope="local">
      <DataTable
        data={INVOICES}
        columns={props.columns ?? COLUMNS}
        rowKey={(nota) => nota.id}
        {...props}
      />
    </RivoProvider>,
  );
}

/** Os textos da primeira celula de cada linha do corpo, na ordem visivel. */
function firstColumn(container: HTMLElement) {
  return [...container.querySelectorAll("tbody tr")].map(
    (row) => row.querySelector("td")?.textContent ?? "",
  );
}

test("clicar no cabecalho ordena, clicar de novo inverte, e a terceira vez desfaz", () => {
  const { container } = table();
  const header = screen.getByRole("button", { name: /valor/i });

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual(["4817", "4816", "4814", "4815", "4813"]);

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual(["4813", "4815", "4814", "4816", "4817"]);

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual(["4813", "4814", "4815", "4816", "4817"]);
});

test("o th anuncia a direcao com aria-sort", () => {
  table();
  const th = screen.getByRole("columnheader", { name: /valor/i });
  expect(th.getAttribute("aria-sort")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(th.getAttribute("aria-sort")).toBe("ascending");

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(th.getAttribute("aria-sort")).toBe("descending");
});

test("coluna sem sortable nao vira botao", () => {
  table();
  expect(screen.queryByRole("button", { name: /cliente/i })).toBeNull();
});

test("a coluna com cell usa value para ordenar", () => {
  const columns: Column<Invoice>[] = [
    { key: "number", header: "Numero" },
    {
      key: "amount",
      header: "Valor",
      sortable: true,
      value: (nota) => nota.amount,
      cell: (nota) => <span>{`R$ ${nota.amount}`}</span>,
    },
  ];
  const { container } = table({ columns: columns });

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(firstColumn(container)).toEqual(["4817", "4816", "4814", "4815", "4813"]);
});

test("o filtro acha sem acento e sem caixa", () => {
  const { container } = table({ filter: "ótica" });
  expect(firstColumn(container)).toEqual(["4816"]);
});

test("o filtro sem resultado explica, sem roubar o EmptyState da consulta vazia", () => {
  table({
    filter: "zzz",
    empty: { title: "Nenhuma nota", description: "Emita a primeira." },
  });
  expect(screen.getByText(/nenhum resultado/i)).toBeDefined();
  expect(screen.queryByText("Nenhuma nota")).toBeNull();
});

test("pageSize corta a lista e o rodape conta o todo", () => {
  const { container } = table({ pageSize: 2 });
  expect(firstColumn(container)).toEqual(["4813", "4814"]);
  expect(screen.getByText(/1–2 de 5/)).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: /próxima página/i }));
  expect(firstColumn(container)).toEqual(["4815", "4816"]);
  expect(screen.getByText(/3–4 de 5/)).toBeDefined();
});

test("sem pageSize nao ha rodape", () => {
  table();
  expect(screen.queryByRole("navigation")).toBeNull();
});

test("filtrar volta para a primeira pagina", async () => {
  const { container, rerender } = table({ pageSize: 2 });
  fireEvent.click(screen.getByRole("button", { name: /próxima página/i }));
  expect(firstColumn(container)).toEqual(["4815", "4816"]);

  rerender(
    <RivoProvider scope="local">
      <DataTable
        data={INVOICES}
        columns={COLUMNS}
        rowKey={(nota) => nota.id}
        pageSize={2}
        filter="48"
      />
    </RivoProvider>,
  );
  // O reset de pagina do motor sai numa microtask; na app ele ja aconteceu
  // antes de qualquer olho ver, aqui o teste espera a fila esvaziar.
  await act(async () => {});
  expect(firstColumn(container)).toEqual(["4813", "4814"]);
});

test("selecionar uma linha devolve a chave do rowKey", () => {
  let selecionadas: string[] = [];
  table({ selectable: true, onValueChange: (keys) => (selecionadas = keys) });

  const row = screen.getByText("Padaria Aurora").closest("tr")!;
  fireEvent.click(within(row).getByRole("checkbox"));
  expect(selecionadas).toEqual(["3"]);
});

test("o checkbox do cabecalho seleciona a pagina visivel, nao o mundo", () => {
  let selecionadas: string[] = [];
  table({
    selectable: true,
    pageSize: 2,
    onValueChange: (keys) => (selecionadas = keys),
  });

  fireEvent.click(screen.getByRole("checkbox", { name: /selecionar todas/i }));
  expect(selecionadas.toSorted()).toEqual(["1", "2"]);
});

test("selecao controlada obedece a prop", () => {
  table({ selectable: true, value: ["2"] });

  const row = screen.getByText("Transportes Cabo Branco").closest("tr")!;
  const checkbox = within(row).getByRole("checkbox");
  expect(checkbox.getAttribute("aria-checked")).toBe("true");
});

test("linha clicavel e selecao convivem: o clique no checkbox nao abre a linha", () => {
  let aberta: Invoice | undefined;
  table({ selectable: true, onRowClick: (nota) => (aberta = nota) });

  const row = screen.getByText("Padaria Aurora").closest("tr")!;
  fireEvent.click(within(row).getByRole("checkbox"));
  expect(aberta).toBeUndefined();

  fireEvent.click(screen.getByText("Padaria Aurora"));
  expect(aberta?.id).toBe("3");
});

test("a coluna que ordena sai na mesma caixa da que nao ordena", () => {
  // O th ja pede uppercase, e a folha do navegador zera text-transform em
  // controle de formulario: a coluna com sortable renderiza um button dentro,
  // e a linha saia com caixa misturada - "Numero" ao lado de "CLIENTE".
  const { container } = table();

  const header = container.querySelector("th") as HTMLElement;
  const botao = container.querySelector("th button") as HTMLElement;

  expect(header.className).toContain("uppercase");
  expect(botao.className).toContain("uppercase");
});

/* ------------------------------------------------------------------------ *
 * O caminho do meio: muita linha, sem mandar a pessoa para o servidor
 * ------------------------------------------------------------------------ */

/*
 * O happy-dom nao faz layout, entao toda medida sai zero e o virtualizador
 * concluiria que nao cabe linha nenhuma. O duble abaixo da altura a moldura e
 * a linha - e so isso: quem decide quantas linhas entram continua sendo o
 * @tanstack/react-virtual.
 */
const VIEWPORT_HEIGHT = 400;
const ROW_HEIGHT = 40;
beforeAll(() => {
  // O virtualizador mede a moldura pelo `offsetHeight`, que no happy-dom e
  // sempre zero: sem o duble ele conclui que nao cabe linha nenhuma.
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.tagName === "TR" ? ROW_HEIGHT : VIEWPORT_HEIGHT;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 800,
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "offsetHeight");
  Reflect.deleteProperty(HTMLElement.prototype, "offsetWidth");
});

const LOG: Invoice[] = Array.from({ length: 500 }, (_, index) => ({
  id: String(index),
  number: String(9000 + index),
  customer: `Cliente ${index}`,
  amount: index,
}));

const bodyRows = (container: HTMLElement) =>
  [...container.querySelectorAll("tbody tr")].filter((row) => !row.hasAttribute("aria-hidden"));

test("sem pedir nada, quinhentas linhas continuam saindo inteiras", () => {
  const { container } = table({ data: LOG });
  expect(bodyRows(container).length).toBe(500);
  expect(container.querySelector("[data-rc-viewport]")).toBeNull();
});

test("com virtual, so um punhado de linhas vai para o DOM", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  const rendered = bodyRows(container).length;
  expect(rendered).toBeGreaterThan(0);
  expect(rendered).toBeLessThan(60);
});

test("virtualizada, ela continua sendo uma <table> de verdade", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  expect(container.querySelectorAll("table").length).toBe(1);
  const body = container.querySelector("tbody")!;
  expect([...body.children].every((child) => child.tagName === "TR")).toBe(true);
  for (const row of bodyRows(container)) {
    expect(row.querySelector("td")).toBeTruthy();
  }
});

test("a tabela virtualizada diz quantas linhas existem, e onde cada uma esta", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  // 500 linhas de dado mais a de cabecalho.
  expect(container.querySelector("table")!.getAttribute("aria-rowcount")).toBe("501");
  expect(bodyRows(container)[0]!.getAttribute("aria-rowindex")).toBe("2");
});

test("os espacadores nao se passam por linha de dado", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  const spacers = [...container.querySelectorAll("tbody tr[aria-hidden='true']")];
  expect(spacers.length).toBeGreaterThan(0);
  for (const spacer of spacers) expect(spacer.textContent).toBe("");
});

test("o cabecalho gruda no topo da moldura que rola", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  const head = container.querySelector("thead")!;
  expect(head.className).toContain("sticky");
  expect(head.className).toContain("z-[var(--rc-z-sticky)]");
});

test("a moldura ganha altura e rolagem propria", () => {
  const { container } = table({ data: LOG, maxHeight: 320 });

  const viewport = container.querySelector("[data-rc-viewport]") as HTMLElement;
  expect(viewport).toBeTruthy();
  expect(viewport.style.maxHeight).toBe("320px");
  // Sem `virtual`, a rolagem e so rolagem: as linhas continuam todas la.
  expect(bodyRows(container).length).toBe(500);
});

test("virtualizada, ordenar continua valendo - que e o motivo de ela existir", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  expect(bodyRows(container)[0]!.querySelector("td")!.textContent).toBe("9000");

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  fireEvent.click(screen.getByRole("button", { name: /valor/i }));

  expect(bodyRows(container)[0]!.querySelector("td")!.textContent).toBe("9499");
});

test("virtualizada, filtrar continua valendo e a contagem acompanha", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT, filter: "9007" });

  expect(container.querySelector("table")!.getAttribute("aria-rowcount")).toBe("2");
  expect(bodyRows(container)[0]!.querySelector("td")!.textContent).toBe("9007");
});
