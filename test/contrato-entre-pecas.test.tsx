import { expect, spyOn, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Children, isValidElement, useState, type ReactNode } from "react";
import { Line, LineChart } from "recharts";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartContainer } from "../src/chart/chart";
import { Sparkline } from "../src/chart/sparkline";
import { DataTable, type Column } from "../src/components/data-table";
import { DateRangePicker } from "../src/components/date-range-picker";
import { EmptyState } from "../src/components/empty-state";
import { Tree, type TreeNode } from "../src/components/tree";

/*
 * As cinco divergencias que a auditoria mediu entre as pecas de DADO e as de
 * ESTRUTURA. Nenhuma quebrava nada sozinha: o custo era quem escrevia a tela
 * descobrir, peca a peca, que o mesmo dado tinha nome diferente em cada uma -
 * e, no caso do vazio do grafico, que o estado que ele pediu nunca ia aparecer.
 *
 * Os nomes divergentes responderam por alias durante a 0.6 e sairam na 0.7:
 * cada teste daqui guarda agora o unico nome que restou para cada dado.
 */

const withTheme = (node: React.ReactNode) =>
  render(<RivoProvider scope="local">{node}</RivoProvider>);

const DEPARTMENTS: TreeNode[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    children: [
      { id: "contas-pagar", label: "Contas a pagar" },
      { id: "contas-receber", label: "Contas a receber" },
    ],
  },
];

test("a arvore fala o vocabulario do catalogo: value e onValueChange", () => {
  function Screen() {
    const [ids, setIds] = useState<string[]>([]);
    return (
      <>
        <Tree
          items={DEPARTMENTS}
          value={ids}
          onValueChange={setIds}
          multiple
          expanded={["financeiro"]}
        />
        <p>Escolhidos: {ids.join(",") || "nenhum"}</p>
      </>
    );
  }

  withTheme(<Screen />);
  fireEvent.click(screen.getByText("Contas a pagar"));
  expect(screen.getByText("Escolhidos: contas-pagar")).toBeDefined();
});

test("sem ninguem controlando, a arvore guarda a propria escolha", () => {
  // A escolha era obrigatoria: uma arvore que so precisava abrir e fechar
  // exigia um useState de quem a montava, e o TreeSelect - que a embrulha - ja
  // aceitava a mesma coisa opcional.
  withTheme(
    <Tree items={DEPARTMENTS} defaultValue={["contas-pagar"]} multiple expanded={["financeiro"]} />,
  );

  const leaf = screen.getByText("Contas a pagar").closest("[role=treeitem]")!;
  expect(leaf.getAttribute("aria-selected")).toBe("true");

  fireEvent.click(screen.getByText("Contas a pagar"));
  expect(leaf.getAttribute("aria-selected")).toBe("false");
});

type Invoice = { id: string; customer: string };

const INVOICES: Invoice[] = [
  { id: "1", customer: "Clinica Sao Lucas" },
  { id: "2", customer: "Padaria Aurora" },
];

const COLUMNS: Column<Invoice>[] = [{ key: "customer", header: "Cliente" }];

test("a tabela fala o mesmo vocabulario da arvore", () => {
  let chosen: string[] = [];

  withTheme(
    <DataTable
      data={INVOICES}
      columns={COLUMNS}
      rowKey={(invoice) => invoice.id}
      selectable
      onValueChange={(keys) => (chosen = keys)}
    />,
  );

  const row = screen.getByText("Padaria Aurora").closest("tr")!;
  fireEvent.click(within(row).getByRole("checkbox"));

  expect(chosen).toEqual(["2"]);
});

test("a selecao da tabela obedece o value, como a arvore obedece o dela", () => {
  withTheme(
    <DataTable
      data={INVOICES}
      columns={COLUMNS}
      rowKey={(invoice) => invoice.id}
      selectable
      value={["2"]}
    />,
  );

  const row = screen.getByText("Padaria Aurora").closest("tr")!;
  expect(within(row).getByRole("checkbox").getAttribute("aria-checked")).toBe("true");
});

test("o vazio do grafico oferece a saida, como o da tabela", () => {
  withTheme(
    <ChartContainer
      config={{ pagas: { label: "Pagas" } }}
      data={[]}
      empty={{
        title: "Sem notas no periodo",
        description: "Escolha outro intervalo.",
        action: <button type="button">Emitir nota</button>,
      }}
      className="h-40"
    >
      <LineChart data={[]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );

  expect(screen.getByRole("button", { name: "Emitir nota" })).toBeDefined();
});

test("o vazio do grafico conta os pontos do proprio grafico, sem a prop data", () => {
  // O defeito antigo: a condicao era `empty && data && data.length === 0`, e
  // quem passava o `empty` sem o `data` - que e opcional, e cuja lista ja esta
  // escrita no `<LineChart data={...}>` uma linha abaixo - nunca via o estado
  // vazio, sem erro nenhum. O grafico desenhava eixos sobre o nada.
  withTheme(
    <ChartContainer
      config={{ pagas: { label: "Pagas" } }}
      empty={{ title: "Sem notas no periodo", description: "Escolha outro intervalo." }}
      className="h-40"
    >
      <LineChart data={[]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );

  expect(screen.getByText("Sem notas no periodo")).toBeDefined();
});

test("com pontos, o grafico desenha em vez de mostrar o vazio", () => {
  withTheme(
    <ChartContainer
      config={{ pagas: { label: "Pagas" } }}
      empty={{ title: "Sem notas no periodo", description: "Escolha outro intervalo." }}
      className="h-40"
    >
      <LineChart data={[{ mes: "Mar", pagas: 3 }]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );

  expect(screen.queryByText("Sem notas no periodo")).toBeNull();
});

test("empty sem ponto nenhum para contar avisa em desenvolvimento", () => {
  // Nao falha: derrubar a tela por um estado que talvez nunca ocorra seria
  // pior que o silencio. Mas o silencio era o defeito, entao ela fala.
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  try {
    withTheme(
      <ChartContainer
        config={{ pagas: { label: "Pagas" } }}
        empty={{ title: "Sem notas", description: "Escolha outro intervalo." }}
        className="h-40"
      >
        {/* Nem `data` aqui, nem no filho: e o caso em que a moldura nao tem
            como contar. */}
        <svg />
      </ChartContainer>,
    );

    const said = warn.mock.calls.flat().join(" ");
    expect(said).toContain("[rivocode/ui]");
    expect(said).toContain("ChartContainer");
    expect(said).toContain("data");
  } finally {
    warn.mockRestore();
  }
});

test("sem empty nao ha o que avisar", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  try {
    withTheme(
      <ChartContainer config={{ pagas: { label: "Pagas" } }} className="h-40">
        <svg />
      </ChartContainer>,
    );

    // So os nossos: a propria recharts reclama do 0x0 do happy-dom por aqui.
    const ours = warn.mock.calls.filter((call) => String(call[0]).includes("[rivocode/ui]"));
    expect(ours.length).toBe(0);
  } finally {
    warn.mockRestore();
  }
});

/**
 * A cor com que a `Sparkline` desenha, lida da arvore de elementos.
 *
 * O desenho nao chega ao DOM: o `ResponsiveContainer` mede 0x0 no happy-dom e
 * a recharts nao emite nada - o mesmo motivo que `chart-novos.test.tsx` ja
 * registra. A peca nao usa hook nenhum, entao chama-la como funcao devolve a
 * arvore inteira, e o `stroke` esta la.
 */
function strokeOf(node: unknown): string | undefined {
  if (!isValidElement(node)) return undefined;

  const props = node.props as { stroke?: string; fill?: string; children?: unknown };
  if (typeof props.stroke === "string") return props.stroke;

  for (const child of Children.toArray(props.children as ReactNode)) {
    const found = strokeOf(child);
    if (found) return found;
  }
  return undefined;
}

test("a sparkline pinta pela tendencia com trend", () => {
  // `tone` e a escala semantica de cor no catalogo inteiro - success, danger,
  // warning, info. So aqui ela queria dizer "pinte pela direcao", e com outros
  // valores; o nome desta peca diz o que ela faz.
  const descending = [9, 7, 4, 2];

  expect(strokeOf(Sparkline({ data: descending, trend: "auto" }))).toBe("var(--rc-danger)");
  expect(strokeOf(Sparkline({ data: [2, 4, 7, 9], trend: "auto" }))).toBe("var(--rc-success)");

  // Sem pedir a direcao, o acento do tema: a cor nao pode virar julgamento
  // sozinha, porque em custo subir e ruim.
  expect(strokeOf(Sparkline({ data: descending, trend: "none" }))).toBe("var(--rc-accent)");
});

test("o estado vazio aceita no no titulo, como as irmas dele", () => {
  // `title` era `string`, e `PageHeader` e `Timeline` ja aceitavam no: nao
  // dava para por um numero formatado nem um <strong> no meio da frase.
  withTheme(
    <EmptyState
      title={
        <>
          Nenhuma nota em <strong>março</strong>
        </>
      }
      description="Quando você emitir a primeira, ela aparece nesta lista."
    />,
  );

  expect(screen.getByText("março").tagName).toBe("STRONG");
});

test("o filtro de periodo consegue limitar aos exercicios abertos", () => {
  // O DatePicker repassava as quatro props do calendario e o DateRangePicker
  // so o `locale`, entao o filtro de periodo - que e justamente quem precisa
  // disso - nao conseguia fechar o ano.
  withTheme(
    <DateRangePicker
      defaultValue={{ from: new Date(2026, 2, 3), to: new Date(2026, 2, 10) }}
      startMonth={new Date(2026, 0, 1)}
      endMonth={new Date(2026, 11, 31)}
      numberOfMonths={1}
      showOutsideDays
    />,
  );
  fireEvent.click(screen.getByText("03/03/2026 – 10/03/2026"));

  const year = screen.getByLabelText("Escolha o ano") as HTMLSelectElement;
  expect(year.options.length).toBe(1);
  expect(year.options[0]!.textContent).toContain("2026");

  // A quarta prop do repasse, na mesma abertura: sem ela o mes comeca com
  // buracos nas pontas.
  expect(document.querySelectorAll('[data-outside="true"]').length).toBeGreaterThan(0);
});
