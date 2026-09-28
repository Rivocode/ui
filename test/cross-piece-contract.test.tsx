import { expect, spyOn, test } from "bun:test";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Children, isValidElement, useState, type ReactNode } from "react";
import { Line, LineChart } from "recharts";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartContainer } from "../src/chart/chart";
import { Sparkline } from "../src/chart/sparkline";
import { Calendar } from "../src/components/calendar";
import { DataTable, type Column } from "../src/components/data-table";
import { DateRangePicker } from "../src/components/date-range-picker";
import { EmptyState } from "../src/components/empty-state";
import { Tree, type TreeNode } from "../src/components/tree";

/*
 * The five divergences the audit measured between the DATA pieces and the
 * STRUCTURE pieces. None broke anything alone: the cost was the screen author
 * finding out, piece by piece, that the same data had a different name in each
 * one - and, in the chart empty case, that the state they asked for would
 * never appear.
 *
 * The divergent names answered through aliases during 0.6 and left in 0.7:
 * each test here now guards the only name left for each piece of data.
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

test("the tree speaks the catalog vocabulary: value and onValueChange", () => {
  function Screen() {
    const [ids, setIds] = useState<string[]>([]);
    return (
      <>
        <Tree
          items={DEPARTMENTS}
          value={ids}
          onValueChange={setIds}
          multiple
          open={["financeiro"]}
        />
        <p>Escolhidos: {ids.join(",") || "nenhum"}</p>
      </>
    );
  }

  withTheme(<Screen />);
  fireEvent.click(screen.getByText("Contas a pagar"));
  expect(screen.getByText("Escolhidos: contas-pagar")).toBeDefined();
});

test("with nobody controlling it, the tree keeps its own choice", () => {
  // The choice was required: a tree that only needed to open and close
  // demanded a useState from whoever mounted it, and TreeSelect - which wraps
  // it - already accepted the same thing as optional.
  withTheme(
    <Tree items={DEPARTMENTS} defaultValue={["contas-pagar"]} multiple open={["financeiro"]} />,
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

test("the table speaks the same vocabulary as the tree", () => {
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

test("the table selection obeys value, as the tree obeys its own", () => {
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

test("the chart empty state offers the way out, like the table's", () => {
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

test("the chart empty state counts the chart's own points, without the data prop", () => {
  // The old defect: the condition was `empty && data && data.length === 0`,
  // and whoever passed `empty` without `data` - which is optional, and whose
  // list is already written in `<LineChart data={...}>` one line below - never
  // saw the empty state, with no error at all. The chart drew axes over nothing.
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

test("with points, the chart draws instead of showing the empty state", () => {
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

test("empty with no point to count warns in development", () => {
  // It does not fail: bringing the screen down over a state that may never
  // occur would be worse than silence. But silence was the defect, so it speaks.
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  try {
    withTheme(
      <ChartContainer
        config={{ pagas: { label: "Pagas" } }}
        empty={{ title: "Sem notas", description: "Escolha outro intervalo." }}
        className="h-40"
      >
        {/* No `data` here, nor on the child: the case where the container has
            no way to count. */}
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

test("without empty there is nothing to warn about", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  try {
    withTheme(
      <ChartContainer config={{ pagas: { label: "Pagas" } }} className="h-40">
        <svg />
      </ChartContainer>,
    );

    // Only ours: recharts itself complains about happy-dom's 0x0 around here.
    const ours = warn.mock.calls.filter((call) => String(call[0]).includes("[rivocode/ui]"));
    expect(ours.length).toBe(0);
  } finally {
    warn.mockRestore();
  }
});

/**
 * The color the `Sparkline` draws with, read from the element tree.
 *
 * The drawing does not reach the DOM: `ResponsiveContainer` measures 0x0 in
 * happy-dom and recharts emits nothing - the same reason
 * `chart-new-pieces.test.tsx` already records. The piece uses no hook, so
 * calling it as a function returns the whole tree, and the `stroke` is there.
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

test("the sparkline paints by direction with trend", () => {
  // `tone` is the semantic color scale across the whole catalog - success,
  // danger, warning, info. Only here did it mean "paint by direction", and with
  // other values; the name on this piece says what it does.
  const descending = [9, 7, 4, 2];

  expect(strokeOf(Sparkline({ data: descending, trend: "auto" }))).toBe("var(--rc-danger)");
  expect(strokeOf(Sparkline({ data: [2, 4, 7, 9], trend: "auto" }))).toBe("var(--rc-success)");

  // Without asking for direction, the theme accent: color cannot become a
  // judgment by itself, because for costs going up is bad.
  expect(strokeOf(Sparkline({ data: descending, trend: "none" }))).toBe("var(--rc-accent)");
});

test("the empty state accepts a node as title, like its siblings", () => {
  // `title` was `string`, and `PageHeader` and `Timeline` already accepted a
  // node: there was no way to put a formatted number or a <strong> mid-sentence.
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

test("the period filter can limit to the open fiscal years", () => {
  withTheme(
    <DateRangePicker
      defaultValue={{ from: new Date(2026, 2, 3), to: new Date(2026, 2, 10) }}
      min="2026-01-01"
      max="2026-12-31"
      numberOfMonths={1}
      showOutsideDays
    />,
  );
  fireEvent.click(screen.getByText("03/03/2026 – 10/03/2026"));

  const year = screen.getByLabelText("Escolha o ano");
  expect(year.textContent).toContain("2026");
  act(() => {
    fireEvent.click(year);
  });
  const years = screen.getAllByRole("option");
  expect(years.length).toBe(1);
  expect(years[0]!.textContent).toContain("2026");
  expect(document.querySelectorAll("select")).toHaveLength(0);

  expect(document.querySelectorAll('[data-outside="true"]').length).toBeGreaterThan(0);
});

test("the calendar arrow bar lets the click reach the month and the year, and only the arrows receive it", () => {
  withTheme(<Calendar defaultMonth={new Date(2026, 2, 1)} />);
  const previous = screen.getByRole("button", { name: "Ir para o mês anterior" });
  const nav = previous.parentElement!;

  expect(nav.className.split(" ")).toContain("pointer-events-none");
  expect(previous.className.split(" ")).toContain("pointer-events-auto");
  expect(
    screen.getByRole("button", { name: "Ir para o próximo mês" }).className.split(" "),
  ).toContain("pointer-events-auto");
  expect(screen.getByLabelText("Escolha o mês").getAttribute("role")).toBe("combobox");
});

test("the select box is a column, and the inner list shrinks and scrolls when the box has a max height", () => {
  withTheme(<Calendar defaultMonth={new Date(2026, 2, 1)} />);
  act(() => {
    fireEvent.click(screen.getByLabelText("Escolha o ano"));
  });
  const list = screen.getByRole("listbox");
  const box = list.parentElement!;

  expect(list.className.split(" ")).toContain("min-h-0");
  expect(list.className.split(" ")).toContain("overflow-y-auto");
  expect(box.className.split(" ")).toContain("flex-col");
  expect(box.className.split(" ")).toContain("max-h-72");
});
