import { describe, expect, spyOn, test } from "bun:test";
import { Text, View } from "react-native";
import type { ReactTestRenderer } from "react-test-renderer";

import { QueryBoundary } from "../src";
import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

type Invoice = { id: string; customer: string };

const INVOICES: Invoice[] = [
  { id: "1", customer: "Clínica São Lucas" },
  { id: "2", customer: "Transportes Cabo Branco" },
];

function list(invoices: Invoice[]) {
  return (
    <View>
      {invoices.map((invoice) => (
        <Text key={invoice.id}>{invoice.customer}</Text>
      ))}
    </View>
  );
}

function busy(screen: ReactTestRenderer) {
  return screen.root.findAll(
    (node) => typeof node.type === "string" && node.props?.accessibilityState?.busy === true,
  );
}

function skeletons(screen: ReactTestRenderer) {
  return byClass(screen, /bg-skeleton/);
}

function views(screen: ReactTestRenderer) {
  return screen.root.findAll((node) => node.type === "View").length;
}

function drawn(screen: ReactTestRenderer) {
  const root = screen.toJSON();
  return Array.isArray(root) ? root : (root?.children ?? null);
}

describe("a resposta na mao", () => {
  test("quem desenha e o filho, sem embrulho nenhum", () => {
    const screen = render(<QueryBoundary data={INVOICES}>{list}</QueryBoundary>);

    const bare = render(list(INVOICES));

    expect(textOf(screen)).toContain("Clínica São Lucas");
    expect(busy(screen)).toHaveLength(0);
    expect(views(screen)).toBe(views(bare));
  });

  test("o filho em funcao recebe o dado sem o undefined que a tela tinha que afastar", () => {
    let seen: Invoice[] | undefined;

    render(
      <QueryBoundary data={INVOICES}>
        {(invoices) => {
          seen = invoices;
          return list(invoices);
        }}
      </QueryBoundary>,
    );

    expect(seen).toHaveLength(2);
  });

  test("o filho tambem pode ser no, para quem nao precisa do dado", () => {
    const screen = render(
      <QueryBoundary isLoading={false}>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("A folha inteira");
  });
});

describe("a espera", () => {
  test("sem resposta e sem isLoading, a peca ja entra carregando", () => {
    const screen = render(<QueryBoundary<Invoice[]>>{list}</QueryBoundary>);

    expect(skeletons(screen)).toHaveLength(3);
    expect(busy(screen)).toHaveLength(1);
    expect(byLabel(screen, "Carregando")).toHaveLength(1);
  });

  test("com filho em funcao, a resposta que nao veio e espera mesmo com isLoading falso", () => {
    const screen = render(<QueryBoundary<Invoice[]> isLoading={false}>{list}</QueryBoundary>);

    expect(busy(screen)).toHaveLength(1);
  });

  test("com filho em no, o isLoading manda sozinho", () => {
    const screen = render(
      <QueryBoundary isLoading={false}>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );

    expect(busy(screen)).toHaveLength(0);
  });

  test("carregando, ela nao mostra os dados velhos", () => {
    const screen = render(
      <QueryBoundary data={INVOICES} isLoading>
        {list}
      </QueryBoundary>,
    );

    expect(textOf(screen)).not.toContain("Clínica São Lucas");
  });

  test("skeletonRows muda quantas linhas a espera generica segura", () => {
    const screen = render(<QueryBoundary<Invoice[]> skeletonRows={5}>{list}</QueryBoundary>);

    expect(skeletons(screen)).toHaveLength(5);
  });

  test("o esqueleto de quem chama substitui as linhas genericas, e fala por si", () => {
    const screen = render(
      <QueryBoundary isLoading skeleton={<Text>Buscando as notas</Text>}>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("Buscando as notas");
    expect(skeletons(screen)).toHaveLength(0);
    expect(byLabel(screen, "Carregando")).toHaveLength(0);
  });
});

describe("o erro", () => {
  test("vence o carregando, e oferece nova tentativa", () => {
    let retries = 0;
    const screen = render(
      <QueryBoundary
        data={INVOICES}
        isError
        isLoading
        onRetry={() => (retries += 1)}
        errorTitle="Não foi possível carregar as notas"
      >
        {list}
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("Não foi possível carregar as notas");
    expect(textOf(screen)).not.toContain("Clínica São Lucas");
    expect(skeletons(screen)).toHaveLength(0);

    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(retries).toBe(1);
  });

  test("sem errorTitle e sem errorMessage, o aviso tem as duas linhas de sempre", () => {
    const screen = render(
      <QueryBoundary isError>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("Não foi possível carregar");
    expect(textOf(screen)).toContain("Tente de novo em alguns minutos.");
    expect(byRole(screen, "alert")).toHaveLength(1);
  });

  test("sem onRetry o erro fala sozinho, sem botao que nao leva a lugar nenhum", () => {
    const screen = render(
      <QueryBoundary isError>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );

    expect(byRole(screen, "button")).toHaveLength(0);
  });
});

describe("o vazio", () => {
  test("a resposta vazia explica o vazio e oferece saida", () => {
    const screen = render(
      <QueryBoundary
        data={[] as Invoice[]}
        empty={{
          title: "Nenhuma nota por aqui",
          description: "Quando você emitir a primeira, ela aparece nesta lista.",
          action: <Text>Emitir nota</Text>,
        }}
      >
        {list}
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("Nenhuma nota por aqui");
    expect(textOf(screen)).toContain("Emitir nota");
  });

  test("nao aparece enquanto a consulta esta em pe", () => {
    const screen = render(
      <QueryBoundary
        data={[] as Invoice[]}
        isLoading
        empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
      >
        {list}
      </QueryBoundary>,
    );

    expect(textOf(screen)).not.toContain("Nenhuma nota");
  });

  test("tambem nao aparece antes de a resposta chegar", () => {
    const screen = render(
      <QueryBoundary<Invoice[]>
        empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
      >
        {list}
      </QueryBoundary>,
    );

    expect(textOf(screen)).not.toContain("Nenhuma nota");
  });

  test("resposta nula conta como vazia, e nao como espera", () => {
    const screen = render(
      <QueryBoundary<Invoice | null>
        data={null}
        empty={{ title: "Nota apagada", description: "Ela não está mais no sistema." }}
      >
        {(invoice) => <Text>{invoice.customer}</Text>}
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("Nota apagada");
  });

  test("nula sem empty e com filho em funcao, a peca nao desenha nada", () => {
    const screen = render(
      <QueryBoundary<Invoice | null> data={null}>
        {(invoice) => <Text>{invoice.customer}</Text>}
      </QueryBoundary>,
    );

    expect(drawn(screen)).toBeNull();
  });

  test("sem empty, a lista vazia cai nos filhos, que desenham o vazio deles", () => {
    const screen = render(
      <QueryBoundary data={[] as Invoice[]}>
        {(invoices) => (invoices.length === 0 ? <Text>Zero notas</Text> : list(invoices))}
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("Zero notas");
  });

  test("isEmpty decide o vazio quando a resposta nao e lista", () => {
    const screen = render(
      <QueryBoundary
        data={{ items: [] as Invoice[], total: 0 }}
        isEmpty
        empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
      >
        {(page) => list(page.items)}
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("Nenhuma nota");
  });

  test("isEmpty falso vence a contagem, para a lista que veio vazia de proposito", () => {
    const screen = render(
      <QueryBoundary
        data={[] as Invoice[]}
        isEmpty={false}
        empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
      >
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("A folha inteira");
  });

  test("a peca avisa quando pediram um vazio que nunca poderia aparecer", () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    try {
      render(
        <QueryBoundary
          data={{ items: [] as Invoice[], total: 0 }}
          empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
        >
          {(page) => list(page.items)}
        </QueryBoundary>,
      );

      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain("isEmpty");
    } finally {
      warn.mockRestore();
    }
  });
});

describe("a moldura", () => {
  test("a classe veste os tres finais, e nao os filhos", () => {
    const loading = render(
      <QueryBoundary className="min-h-40" isLoading>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );
    expect(byClass(loading, /min-h-40/)).toHaveLength(1);

    const error = render(
      <QueryBoundary className="min-h-40" isError>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );
    expect(byClass(error, /min-h-40/)).toHaveLength(1);

    const empty = render(
      <QueryBoundary
        className="min-h-40"
        data={[] as Invoice[]}
        empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
      >
        {list}
      </QueryBoundary>,
    );
    expect(byClass(empty, /min-h-40/)).toHaveLength(1);

    const drawn = render(
      <QueryBoundary className="min-h-40" data={INVOICES}>
        {list}
      </QueryBoundary>,
    );
    expect(byClass(drawn, /min-h-40/)).toHaveLength(0);
  });
});
