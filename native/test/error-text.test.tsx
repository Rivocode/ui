import { describe, expect, test } from "bun:test";
import { Text } from "react-native";

import { DataList } from "../src";
import { ChartContainer } from "../src/chart/chart";
import { byClass, render, textOf } from "./helpers";

/*
 * Os mesmos tres textos que o web soltou do JSX estavam cravados aqui, e o
 * nativo ficou para tras: o titulo do erro do grafico, o titulo do erro da
 * lista e a linha da busca sem resultado. Uma tela que carrega duas listagens
 * nao conseguia dizer qual delas caiu, e um produto que nao fala portugues nao
 * conseguia dizer nada - do lado do celular, que e onde ele mais aparece.
 *
 * O nome de prop e o mesmo dos dois lados de proposito: `errorTitle`,
 * `errorMessage` e `noResultsMessage`. Quem escreve a tela de web e a de
 * celular escreve as duas na mesma semana, e prop com nome parecido mas nao
 * igual custa uma consulta a doc por peca.
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
  test("sem errorTitle o aviso continua de uma linha so, como sempre foi", () => {
    const screen = render(list({ isError: true }));
    expect(textOf(screen)).toContain("Não foi possível carregar a lista.");
    // Uma linha de texto no aviso, e nao duas: o titulo nao tem padrao aqui.
    expect(byClass(screen, /text-danger-text/).length).toBe(1);
  });

  test("errorTitle diz qual lista caiu, e a mensagem detalha embaixo", () => {
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

  test("sem noResultsMessage, a busca vazia continua com a linha de sempre", () => {
    expect(textOf(render(list({ filter: "zzz" })))).toContain("Nenhum resultado para a busca.");
  });

  test("noResultsMessage troca a linha da busca vazia, sem tocar no empty", () => {
    const screen = render(
      list({
        filter: "zzz",
        noResultsMessage: "Nenhuma nota bate com esse texto.",
        empty: { title: "Nenhuma nota por aqui", description: "Emita a primeira." },
      }),
    );

    expect(textOf(screen)).toContain("Nenhuma nota bate com esse texto.");
    expect(textOf(screen)).not.toContain("Nenhum resultado para a busca.");
    // Filtro que zerou nao e consulta vazia: o `empty` fica reservado ao banco.
    expect(textOf(screen)).not.toContain("Nenhuma nota por aqui");
  });
});

describe("ChartContainer", () => {
  test("sem errorTitle, o grafico continua com o titulo de sempre", () => {
    expect(textOf(chart({ isError: true }))).toContain("Não foi possível carregar o gráfico");
  });

  test("errorTitle diz qual grafico do painel caiu", () => {
    const screen = chart({ isError: true, errorTitle: "Não foi possível carregar o faturamento" });

    expect(textOf(screen)).toContain("Não foi possível carregar o faturamento");
    expect(textOf(screen)).not.toContain("Não foi possível carregar o gráfico");
  });

  test("errorTitle e errorMessage sao o par, e continuam aparecendo juntos", () => {
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
 * O erro vence o carregando, e os dois pacotes tem que concordar.
 *
 * O `ChartContainer` dos DOIS lados ordenava ao contrario - carregando antes
 * de erro -, entao consulta que falhou durante um refetch mostrava esqueleto e
 * escondia a falha. No celular doi mais: nao ha barra de rede visivel, e a
 * pessoa fica olhando um carregamento que nunca termina, sem o botao de tentar
 * de novo. `DataList` e `DataTable` sempre ordenaram certo, e a doc ja
 * prometia essa ordem - as pecas de grafico e que discordavam do texto.
 */
describe("erro vence carregando", () => {
  test("o DataList mostra o erro, e nao o esqueleto", () => {
    const screen = render(list({ isLoading: true, isError: true }));

    expect(textOf(screen)).toContain("Não foi possível carregar a lista.");
    expect(byClass(screen, /bg-skeleton/)).toHaveLength(0);
  });

  test("o ChartContainer mostra o erro, e nao o esqueleto", () => {
    const screen = chart({ isLoading: true, isError: true });

    expect(textOf(screen)).toContain("Não foi possível carregar o gráfico");
    expect(byClass(screen, /bg-skeleton/)).toHaveLength(0);
  });
});
