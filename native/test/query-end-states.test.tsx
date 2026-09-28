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

describe("the response in hand", () => {
  test("the child is what draws, with no wrapper at all", () => {
    const screen = render(<QueryBoundary data={INVOICES}>{list}</QueryBoundary>);

    const bare = render(list(INVOICES));

    expect(textOf(screen)).toContain("Clínica São Lucas");
    expect(busy(screen)).toHaveLength(0);
    expect(views(screen)).toBe(views(bare));
  });

  test("a function child receives the data without the undefined the screen had to fend off", () => {
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

  test("the child can also be a node, for whoever does not need the data", () => {
    const screen = render(
      <QueryBoundary isLoading={false}>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("A folha inteira");
  });
});

describe("the wait", () => {
  test("without a response and without isLoading, the piece already starts loading", () => {
    const screen = render(<QueryBoundary<Invoice[]>>{list}</QueryBoundary>);

    expect(skeletons(screen)).toHaveLength(3);
    expect(busy(screen)).toHaveLength(1);
    expect(byLabel(screen, "Carregando")).toHaveLength(1);
  });

  test("with a function child, a response that did not come is a wait even with isLoading false", () => {
    const screen = render(<QueryBoundary<Invoice[]> isLoading={false}>{list}</QueryBoundary>);

    expect(busy(screen)).toHaveLength(1);
  });

  test("with a node child, isLoading rules alone", () => {
    const screen = render(
      <QueryBoundary isLoading={false}>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );

    expect(busy(screen)).toHaveLength(0);
  });

  test("while loading, it does not show the old data", () => {
    const screen = render(
      <QueryBoundary data={INVOICES} isLoading>
        {list}
      </QueryBoundary>,
    );

    expect(textOf(screen)).not.toContain("Clínica São Lucas");
  });

  test("skeletonRows changes how many rows the generic wait holds", () => {
    const screen = render(<QueryBoundary<Invoice[]> skeletonRows={5}>{list}</QueryBoundary>);

    expect(skeletons(screen)).toHaveLength(5);
  });

  test("the caller's skeleton replaces the generic rows, and speaks for itself", () => {
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

describe("the error", () => {
  test("wins over loading, and offers a retry", () => {
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

  test("without errorTitle and errorMessage, the notice has the usual two lines", () => {
    const screen = render(
      <QueryBoundary isError>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("Não foi possível carregar");
    expect(textOf(screen)).toContain("Tente de novo em alguns minutos.");
    expect(byRole(screen, "alert")).toHaveLength(1);
  });

  test("without onRetry the error speaks alone, with no button that leads nowhere", () => {
    const screen = render(
      <QueryBoundary isError>
        <Text>A folha inteira</Text>
      </QueryBoundary>,
    );

    expect(byRole(screen, "button")).toHaveLength(0);
  });
});

describe("the empty state", () => {
  test("an empty response explains the emptiness and offers a way out", () => {
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

  test("does not appear while the query is in flight", () => {
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

  test("also does not appear before the response arrives", () => {
    const screen = render(
      <QueryBoundary<Invoice[]>
        empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
      >
        {list}
      </QueryBoundary>,
    );

    expect(textOf(screen)).not.toContain("Nenhuma nota");
  });

  test("a null response counts as empty, not as a wait", () => {
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

  test("null without empty and with a function child, the piece draws nothing", () => {
    const screen = render(
      <QueryBoundary<Invoice | null> data={null}>
        {(invoice) => <Text>{invoice.customer}</Text>}
      </QueryBoundary>,
    );

    expect(drawn(screen)).toBeNull();
  });

  test("without empty, an empty list falls through to the children, who draw their own empty state", () => {
    const screen = render(
      <QueryBoundary data={[] as Invoice[]}>
        {(invoices) => (invoices.length === 0 ? <Text>Zero notas</Text> : list(invoices))}
      </QueryBoundary>,
    );

    expect(textOf(screen)).toContain("Zero notas");
  });

  test("isEmpty decides emptiness when the response is not a list", () => {
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

  test("a false isEmpty wins over the count, for a list that came empty on purpose", () => {
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

  test("the piece warns when an empty state was asked for that could never appear", () => {
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

describe("the frame", () => {
  test("the class dresses the three endings, not the children", () => {
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
