import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { LineChart, Line } from "recharts";

import { ChartContainer } from "../src/chart/chart";
import { DataTable, type Column } from "../src/components/data-table";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * Tres textos estavam cravados no JSX, e nenhum deles tinha prop: os dois
 * titulos de erro e a linha de busca sem resultado. Uma tela que carrega tres
 * listagens nao conseguia dizer qual delas falhou, e um produto que nao fala
 * portugues nao conseguia dizer nada.
 *
 * `errorTitle` tem o mesmo nome nas duas pecas de proposito - e o mesmo par
 * que o `errorMessage` ja formava.
 */

type Invoice = { id: string; number: string };

const COLUMNS: Column<Invoice>[] = [{ key: "number", header: "Numero" }];

function table(props: Partial<React.ComponentProps<typeof DataTable<Invoice>>> = {}) {
  return render(
    <RivoProvider scope="local">
      <DataTable
        data={[{ id: "1", number: "4813" }]}
        columns={COLUMNS}
        rowKey={(invoice) => invoice.id}
        {...props}
      />
    </RivoProvider>,
  );
}

function chart(props: Partial<React.ComponentProps<typeof ChartContainer>> = {}) {
  return render(
    <RivoProvider scope="local">
      <ChartContainer config={{ paid: { label: "Pagas" } }} className="h-40" {...props}>
        <LineChart data={[{ month: "ago", paid: 3 }]}>
          <Line dataKey="paid" />
        </LineChart>
      </ChartContainer>
    </RivoProvider>,
  );
}

test("sem errorTitle, o titulo do erro continua o de sempre", () => {
  table({ isError: true, data: undefined });
  expect(screen.getByText("Não foi possível carregar")).toBeDefined();
});

test("errorTitle diz o que falhou, e nao so que algo falhou", () => {
  table({
    isError: true,
    data: undefined,
    errorTitle: "Não foi possível carregar as notas",
    errorMessage: "A prefeitura não respondeu.",
  });

  expect(screen.getByText("Não foi possível carregar as notas")).toBeDefined();
  expect(screen.queryByText("Não foi possível carregar")).toBeNull();
});

test("sem noResultsMessage, a busca vazia continua com a linha de sempre", () => {
  table({ filter: "prefeitura" });
  expect(screen.getByText("Nenhum resultado para a busca.")).toBeDefined();
});

test("noResultsMessage troca a linha da busca vazia, sem tocar no empty", () => {
  table({ filter: "prefeitura", noResultsMessage: "Nenhuma nota bate com esse texto." });

  expect(screen.getByText("Nenhuma nota bate com esse texto.")).toBeDefined();
  expect(screen.queryByText("Nenhum resultado para a busca.")).toBeNull();
});

test("a busca vazia nao vira estado vazio: o empty fica reservado para o banco", () => {
  table({
    filter: "prefeitura",
    noResultsMessage: "Nenhuma nota bate com esse texto.",
    empty: { title: "Nenhuma nota por aqui", description: "Emita a primeira." },
  });

  expect(screen.queryByText("Nenhuma nota por aqui")).toBeNull();
});

test("sem errorTitle, o grafico continua com o titulo de sempre", () => {
  chart({ isError: true });
  expect(screen.getByText("Não foi possível carregar o gráfico")).toBeDefined();
});

test("errorTitle diz qual grafico do painel falhou", () => {
  chart({ isError: true, errorTitle: "Não foi possível carregar o faturamento" });

  expect(screen.getByText("Não foi possível carregar o faturamento")).toBeDefined();
  expect(screen.queryByText("Não foi possível carregar o gráfico")).toBeNull();
});

test("errorTitle e errorMessage sao o par, e continuam aparecendo juntos", () => {
  chart({
    isError: true,
    errorTitle: "Não foi possível carregar o faturamento",
    errorMessage: "A consulta expirou.",
  });

  expect(screen.getByText("Não foi possível carregar o faturamento")).toBeDefined();
  expect(screen.getByText("A consulta expirou.")).toBeDefined();
});

/*
 * O erro vence o carregando, e as quatro pecas tem que concordar nisso.
 *
 * O `ChartContainer` ordenava ao contrario - `isLoading ? esqueleto : isError`
 * -, entao uma consulta que falhou durante um refetch mostrava esqueleto e
 * escondia a falha: quem olhava via carregamento eterno e nao tinha o botao de
 * tentar de novo. O `DataTable` sempre ordenou certo, e `DataTable.md` e a
 * tabela de paridade ja afirmavam que essa era a regra da casa - a peca e que
 * discordava do texto, calada.
 */
test("com erro e carregando juntos, o DataTable mostra o erro e nao o esqueleto", () => {
  const { container } = table({ isLoading: true, isError: true });

  expect(screen.getByText("Não foi possível carregar")).toBeDefined();
  expect(container.querySelectorAll(".bg-skeleton")).toHaveLength(0);
});

test("com erro e carregando juntos, o ChartContainer mostra o erro e nao o esqueleto", () => {
  const { container } = chart({ isLoading: true, isError: true });

  expect(screen.getByText("Não foi possível carregar o gráfico")).toBeDefined();
  expect(container.querySelectorAll(".bg-skeleton")).toHaveLength(0);
});
