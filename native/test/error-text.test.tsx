import { describe, expect, test } from "bun:test";
import { Text } from "react-native";

import { DataList } from "../src";
import { ChartContainer } from "../src/chart/chart";
import { byClass, render, textOf } from "./helpers";

/*
 * The same three texts the web freed from the JSX were hardcoded here, and
 * native fell behind: the chart error title, the list error title and the
 * no-results search line. A screen that loads two listings could not say which
 * one failed, and a product that does not speak Portuguese could say nothing -
 * on the phone side, which is where it shows up the most.
 *
 * The prop name is the same on both sides on purpose: `errorTitle`,
 * `errorMessage` and `noResultsMessage`. Whoever writes the web screen and the
 * phone screen writes both in the same week, and a prop with a similar but not
 * equal name costs one doc lookup per piece.
 */

const ROWS = [
  { id: "1", name: "Clínica São Lucas" },
  { id: "2", name: "Transportes Cabo Branco" },
];

function list(props: Partial<Parameters<typeof DataList<(typeof ROWS)[number]>>[0]> = {}) {
  return (
    <DataList
      data={ROWS}
      keyExtractor={(row) => row.id}
      renderItem={(row) => <Text>{row.name}</Text>}
      {...props}
    />
  );
}

function chart(props: Partial<Parameters<typeof ChartContainer>[0]> = {}) {
  return render(
    <ChartContainer config={{ paid: { label: "Pagas" } }} className="h-40" {...props}>
      {() => null}
    </ChartContainer>,
  );
}

describe("DataList", () => {
  test("without errorTitle the notice stays a single line, as it always was", () => {
    const screen = render(list({ isError: true }));
    expect(textOf(screen)).toContain("Não foi possível carregar a lista.");
    // One line of text in the notice, not two: the title has no default here.
    expect(byClass(screen, /text-danger-text/).length).toBe(1);
  });

  test("errorTitle says which list failed, and the message details it below", () => {
    const screen = render(
      list({
        isError: true,
        errorTitle: "Não foi possível carregar as notas",
        errorMessage: "A prefeitura não respondeu.",
      }),
    );

    expect(textOf(screen)).toContain("Não foi possível carregar as notas");
    expect(textOf(screen)).toContain("A prefeitura não respondeu.");
    expect(byClass(screen, /text-danger-text/).length).toBe(2);
  });

  test("without noResultsMessage, the empty search keeps the usual line", () => {
    expect(textOf(render(list({ filter: "zzz" })))).toContain("Nenhum resultado para a busca.");
  });

  test("noResultsMessage replaces the empty-search line, without touching empty", () => {
    const screen = render(
      list({
        filter: "zzz",
        noResultsMessage: "Nenhuma nota bate com esse texto.",
        empty: { title: "Nenhuma nota por aqui", description: "Emita a primeira." },
      }),
    );

    expect(textOf(screen)).toContain("Nenhuma nota bate com esse texto.");
    expect(textOf(screen)).not.toContain("Nenhum resultado para a busca.");
    // A filter that emptied the list is not an empty query: `empty` stays reserved for the database.
    expect(textOf(screen)).not.toContain("Nenhuma nota por aqui");
  });
});

describe("ChartContainer", () => {
  test("without errorTitle, the chart keeps the usual title", () => {
    expect(textOf(chart({ isError: true }))).toContain("Não foi possível carregar o gráfico");
  });

  test("errorTitle says which dashboard chart failed", () => {
    const screen = chart({ isError: true, errorTitle: "Não foi possível carregar o faturamento" });

    expect(textOf(screen)).toContain("Não foi possível carregar o faturamento");
    expect(textOf(screen)).not.toContain("Não foi possível carregar o gráfico");
  });

  test("errorTitle and errorMessage are a pair, and still appear together", () => {
    const screen = chart({
      isError: true,
      errorTitle: "Não foi possível carregar o faturamento",
      errorMessage: "A consulta expirou.",
    });

    expect(textOf(screen)).toContain("Não foi possível carregar o faturamento");
    expect(textOf(screen)).toContain("A consulta expirou.");
  });
});

/*
 * Error wins over loading, and both packages have to agree.
 *
 * `ChartContainer` on BOTH sides ordered it the other way around - loading
 * before error -, so a query that failed during a refetch showed a skeleton and
 * hid the failure. On the phone it hurts more: there is no visible network bar,
 * and the person keeps staring at a loading state that never ends, without the
 * retry button. `DataList` and `DataTable` always ordered it right, and the doc
 * already promised that order - it was the chart pieces that disagreed with the
 * text.
 */
describe("error wins over loading", () => {
  test("DataList shows the error, not the skeleton", () => {
    const screen = render(list({ isLoading: true, isError: true }));

    expect(textOf(screen)).toContain("Não foi possível carregar a lista.");
    expect(byClass(screen, /bg-skeleton/)).toHaveLength(0);
  });

  test("ChartContainer shows the error, not the skeleton", () => {
    const screen = chart({ isLoading: true, isError: true });

    expect(textOf(screen)).toContain("Não foi possível carregar o gráfico");
    expect(byClass(screen, /bg-skeleton/)).toHaveLength(0);
  });
});
