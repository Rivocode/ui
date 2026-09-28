import { afterAll, beforeAll, expect, test } from "bun:test";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { DataTable, type Column } from "../src/components/data-table";
import { CSS_COMPOSED_PAIRS } from "../src/lib/contrast";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * The old invariants (error beats loading, empty only after the query, the row
 * click guard) live in wave-c.test.tsx and still hold without a single edited
 * line: that is the proof the new engine did not break the API.
 * Only the new capabilities come in here.
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
        rowKey={(invoice) => invoice.id}
        {...props}
      />
    </RivoProvider>,
  );
}

/** The text of the first cell of each body row, in visible order. */
function firstColumn(container: HTMLElement) {
  return [...container.querySelectorAll("tbody tr")].map(
    (row) => row.querySelector("td")?.textContent ?? "",
  );
}

test("clicking the header sorts, clicking again reverses, and the third time undoes", () => {
  const { container } = table();
  const header = screen.getByRole("button", { name: /valor/i });

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual(["4817", "4816", "4814", "4815", "4813"]);

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual(["4813", "4815", "4814", "4816", "4817"]);

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual(["4813", "4814", "4815", "4816", "4817"]);
});

test("the th announces the direction with aria-sort", () => {
  table();
  const th = screen.getByRole("columnheader", { name: /valor/i });
  expect(th.getAttribute("aria-sort")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(th.getAttribute("aria-sort")).toBe("ascending");

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(th.getAttribute("aria-sort")).toBe("descending");
});

test("a column without sortable does not become a button", () => {
  table();
  expect(screen.queryByRole("button", { name: /cliente/i })).toBeNull();
});

test("a column with cell uses value to sort", () => {
  const columns: Column<Invoice>[] = [
    { key: "number", header: "Numero" },
    {
      key: "amount",
      header: "Valor",
      sortable: true,
      value: (invoice) => invoice.amount,
      cell: (invoice) => <span>{`R$ ${invoice.amount}`}</span>,
    },
  ];
  const { container } = table({ columns: columns });

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(firstColumn(container)).toEqual(["4817", "4816", "4814", "4815", "4813"]);
});

test("the filter matches ignoring accents and case", () => {
  const { container } = table({ filter: "ótica" });
  expect(firstColumn(container)).toEqual(["4816"]);
});

test("a filter with no result explains, without stealing the empty-query EmptyState", () => {
  table({
    filter: "zzz",
    empty: { title: "Nenhuma nota", description: "Emita a primeira." },
  });
  expect(screen.getByText(/nenhum resultado/i)).toBeDefined();
  expect(screen.queryByText("Nenhuma nota")).toBeNull();
});

test("pageSize cuts the list and the footer counts the whole", () => {
  const { container } = table({ pageSize: 2 });
  expect(firstColumn(container)).toEqual(["4813", "4814"]);
  expect(screen.getByText(/1–2 de 5/)).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: /próxima página/i }));
  expect(firstColumn(container)).toEqual(["4815", "4816"]);
  expect(screen.getByText(/3–4 de 5/)).toBeDefined();
});

test("without pageSize there is no footer", () => {
  table();
  expect(screen.queryByRole("navigation")).toBeNull();
});

test("filtering goes back to the first page", async () => {
  const { container, rerender } = table({ pageSize: 2 });
  fireEvent.click(screen.getByRole("button", { name: /próxima página/i }));
  expect(firstColumn(container)).toEqual(["4815", "4816"]);

  rerender(
    <RivoProvider scope="local">
      <DataTable
        data={INVOICES}
        columns={COLUMNS}
        rowKey={(invoice) => invoice.id}
        pageSize={2}
        filter="48"
      />
    </RivoProvider>,
  );
  // The engine's page reset runs in a microtask; in the app it already happened
  // before any eye could see, here the test waits for the queue to drain.
  await act(async () => {});
  expect(firstColumn(container)).toEqual(["4813", "4814"]);
});

test("searching after turning the page draws the first page of the filter", async () => {
  const { container, rerender } = table({ pageSize: 2 });
  fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
  expect(firstColumn(container)).toEqual(["4817"]);

  rerender(
    <RivoProvider scope="local">
      <DataTable
        data={INVOICES}
        columns={COLUMNS}
        rowKey={(invoice) => invoice.id}
        pageSize={2}
        filter="Aurora"
      />
    </RivoProvider>,
  );

  expect(screen.queryByText("Nenhum resultado para a busca.")).toBeNull();
  expect(firstColumn(container)).toEqual(["4815"]);
  expect(screen.getByText("1–1 de 1")).toBeDefined();

  await act(async () => {});
});

test("re-sorting after turning the page draws the first page of the order", async () => {
  const { container } = table({ pageSize: 2 });
  fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
  expect(firstColumn(container)).toEqual(["4817"]);

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));

  expect(firstColumn(container)).toEqual(["4817", "4816"]);
  expect(screen.getByText("1–2 de 5")).toBeDefined();

  await act(async () => {});
});

test("the empty message stays silent when the filtered model still has rows", async () => {
  const { container, rerender } = table({ pageSize: 2, filter: "48" });
  fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
  expect(firstColumn(container)).toEqual(["4817"]);

  rerender(
    <RivoProvider scope="local">
      <DataTable
        data={INVOICES.slice(0, 2)}
        columns={COLUMNS}
        rowKey={(invoice) => invoice.id}
        pageSize={2}
        filter="48"
      />
    </RivoProvider>,
  );

  expect(screen.queryByText("Nenhum resultado para a busca.")).toBeNull();

  await act(async () => {});
});

test("selecting a row returns the rowKey key", () => {
  let selectedKeys: string[] = [];
  table({ selectable: true, onValueChange: (keys) => (selectedKeys = keys) });

  const row = screen.getByText("Padaria Aurora").closest("tr")!;
  fireEvent.click(within(row).getByRole("checkbox"));
  expect(selectedKeys).toEqual(["3"]);
});

test("the selected row is painted, and its background has the text contrast measured", () => {
  table({ selectable: true, value: ["2"] });

  const chosen = screen.getByText("Transportes Cabo Branco").closest("tr")!;
  const other = screen.getByText("Padaria Aurora").closest("tr")!;
  expect(chosen.hasAttribute("data-selected")).toBe(true);
  expect(other.hasAttribute("data-selected")).toBe(false);

  const tokens = chosen.className.split(" ");
  expect(tokens).toContain("data-[selected]:bg-selected");
  expect(tokens).toContain("data-[selected]:shadow-[inset_2px_0_0_var(--rc-accent)]");

  const measured = CSS_COMPOSED_PAIRS.filter(([, layer]) => layer === "--rc-selected").map(
    ([front, , under]) => `${front} ${under}`,
  );
  for (const under of ["--rc-bg", "--rc-surface"]) {
    expect(measured).toContain(`--rc-fg ${under}`);
    expect(measured).toContain(`--rc-fg-muted ${under}`);
    expect(measured).toContain(`--rc-accent-text ${under}`);
  }
});

test("the header checkbox selects the visible page, not the world", () => {
  let selectedKeys: string[] = [];
  table({
    selectable: true,
    pageSize: 2,
    onValueChange: (keys) => (selectedKeys = keys),
  });

  fireEvent.click(screen.getByRole("checkbox", { name: /selecionar todas/i }));
  expect(selectedKeys.toSorted()).toEqual(["1", "2"]);
});

test("controlled selection obeys the prop", () => {
  table({ selectable: true, value: ["2"] });

  const row = screen.getByText("Transportes Cabo Branco").closest("tr")!;
  const checkbox = within(row).getByRole("checkbox");
  expect(checkbox.getAttribute("aria-checked")).toBe("true");
});

test("clickable row and selection coexist: clicking the checkbox does not open the row", () => {
  let opened: Invoice | undefined;
  table({ selectable: true, onRowClick: (invoice) => (opened = invoice) });

  const row = screen.getByText("Padaria Aurora").closest("tr")!;
  fireEvent.click(within(row).getByRole("checkbox"));
  expect(opened).toBeUndefined();

  fireEvent.click(screen.getByText("Padaria Aurora"));
  expect(opened?.id).toBe("3");
});

test("a sorting column renders in the same case as one that does not sort", () => {
  // The th already asks for uppercase, and the browser stylesheet resets
  // text-transform on form controls: the sortable column renders a button
  // inside, and the row came out in mixed case - "Numero" next to "CLIENTE".
  const { container } = table();

  const header = container.querySelector("th") as HTMLElement;
  const sortButton = container.querySelector("th button") as HTMLElement;

  expect(header.className).toContain("uppercase");
  expect(sortButton.className).toContain("uppercase");
});

/* ------------------------------------------------------------------------ *
 * The middle path: many rows, without sending the person to the server
 * ------------------------------------------------------------------------ */

/*
 * happy-dom does no layout, so every measure comes out zero and the
 * virtualizer would conclude no row fits. The stub below gives a height to the
 * frame and the row - and only that: what decides how many rows go in is
 * still @tanstack/react-virtual.
 */
const VIEWPORT_HEIGHT = 400;
const ROW_HEIGHT = 40;
const MEASURED = new Map<string, PropertyDescriptor | undefined>();

beforeAll(() => {
  for (const name of ["offsetHeight", "offsetWidth"]) {
    MEASURED.set(name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name));
  }
  // The virtualizer measures the frame by `offsetHeight`, which in happy-dom
  // is always zero: without the stub it concludes no row fits.
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
  for (const [name, descriptor] of MEASURED) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  }
});

const LOG: Invoice[] = Array.from({ length: 500 }, (_, index) => ({
  id: String(index),
  number: String(9000 + index),
  customer: `Cliente ${index}`,
  amount: index,
}));

const bodyRows = (container: HTMLElement) =>
  [...container.querySelectorAll("tbody tr")].filter((row) => !row.hasAttribute("aria-hidden"));

test("without asking for anything, five hundred rows still render in full", () => {
  const { container } = table({ data: LOG });
  expect(bodyRows(container).length).toBe(500);
  expect(container.querySelector("[data-rc-viewport]")).toBeNull();
});

test("with a max height, the scrolling frame is the positioning block for the cells' sr-only", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });
  const tokens = container.querySelector("[data-rc-viewport]")!.className.split(" ");
  expect(tokens).toContain("overflow-auto");
  expect(tokens).toContain("relative");
});

test("with virtual, only a handful of rows goes to the DOM", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  const rendered = bodyRows(container).length;
  expect(rendered).toBeGreaterThan(0);
  expect(rendered).toBeLessThan(60);
});

test("virtualized, it is still a real <table>", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  expect(container.querySelectorAll("table").length).toBe(1);
  const body = container.querySelector("tbody")!;
  expect([...body.children].every((child) => child.tagName === "TR")).toBe(true);
  for (const row of bodyRows(container)) {
    expect(row.querySelector("td")).toBeTruthy();
  }
});

test("the virtualized table says how many rows exist, and where each one is", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  // 500 data rows plus the header one.
  expect(container.querySelector("table")!.getAttribute("aria-rowcount")).toBe("501");
  expect(bodyRows(container)[0]!.getAttribute("aria-rowindex")).toBe("2");
});

test("the spacers do not pass for data rows", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  const spacers = [...container.querySelectorAll("tbody tr[aria-hidden='true']")];
  expect(spacers.length).toBeGreaterThan(0);
  for (const spacer of spacers) expect(spacer.textContent).toBe("");
});

test("the header sticks to the top of the scrolling frame", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  const head = container.querySelector("thead")!;
  expect(head.className).toContain("sticky");
  expect(head.className).toContain("z-[var(--rc-z-sticky)]");
});

test("the frame gets a height and its own scrolling", () => {
  const { container } = table({ data: LOG, maxHeight: 320 });

  const viewport = container.querySelector("[data-rc-viewport]") as HTMLElement;
  expect(viewport).toBeTruthy();
  expect(viewport.style.maxHeight).toBe("320px");
  // Without `virtual`, scrolling is just scrolling: all the rows are still there.
  expect(bodyRows(container).length).toBe(500);
});

test("virtualized, sorting still works - which is the reason it exists", () => {
  const { container } = table({ data: LOG, virtual: true, maxHeight: VIEWPORT_HEIGHT });

  expect(bodyRows(container)[0]!.querySelector("td")!.textContent).toBe("9000");

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  fireEvent.click(screen.getByRole("button", { name: /valor/i }));

  expect(bodyRows(container)[0]!.querySelector("td")!.textContent).toBe("9499");
});

test("virtualized, filtering still works and the count follows", () => {
  const { container } = table({
    data: LOG,
    virtual: true,
    maxHeight: VIEWPORT_HEIGHT,
    filter: "9007",
  });

  expect(container.querySelector("table")!.getAttribute("aria-rowcount")).toBe("2");
  expect(bodyRows(container)[0]!.querySelector("td")!.textContent).toBe("9007");
});

function withProvider(node: React.ReactNode) {
  return <RivoProvider scope="local">{node}</RivoProvider>;
}

test("when data shrinks below the open page, the table goes back to the last one that exists", () => {
  const props = { columns: COLUMNS, rowKey: (invoice: Invoice) => invoice.id, pageSize: 2 };
  const { container, rerender } = render(withProvider(<DataTable data={INVOICES} {...props} />));

  fireEvent.click(screen.getByRole("button", { name: /próxima página/i }));
  fireEvent.click(screen.getByRole("button", { name: /próxima página/i }));
  expect(firstColumn(container)).toEqual(["4817"]);

  rerender(withProvider(<DataTable data={INVOICES.slice(0, 3)} {...props} />));
  expect(firstColumn(container)).toEqual(["4815"]);
  expect(screen.getByText(/3–3 de 3/)).toBeDefined();
});

test("uncontrolled selection prunes the key of the row that left data", () => {
  const seen: string[][] = [];
  const props = {
    columns: COLUMNS,
    rowKey: (invoice: Invoice) => invoice.id,
    selectable: true,
    onValueChange: (keys: string[]) => seen.push(keys),
  };
  const { rerender } = render(withProvider(<DataTable data={INVOICES} {...props} />));

  fireEvent.click(within(screen.getByText("Padaria Aurora").closest("tr")!).getByRole("checkbox"));
  fireEvent.click(within(screen.getByText("Otica Central").closest("tr")!).getByRole("checkbox"));
  expect(seen.at(-1)).toEqual(["3", "4"]);

  act(() => {
    rerender(
      withProvider(<DataTable data={INVOICES.filter((invoice) => invoice.id !== "3")} {...props} />),
    );
  });
  expect(seen.at(-1)).toEqual(["4"]);

  fireEvent.click(within(screen.getByText("Acougue do Ze").closest("tr")!).getByRole("checkbox"));
  expect(seen.at(-1)).toEqual(["4", "5"]);
});

type Person = { id: string; name: string; score: number | null | undefined };

const PEOPLE: Person[] = [
  { id: "1", name: "Zuleica", score: 3 },
  { id: "2", name: "Álvaro", score: null },
  { id: "3", name: "Érica", score: -2 },
  { id: "4", name: "bruno", score: undefined },
  { id: "5", name: "Item 10", score: 0 },
  { id: "6", name: "Item 9", score: 8 },
];

const PEOPLE_COLUMNS: Column<Person>[] = [
  { key: "name", header: "Nome", sortable: true },
  { key: "score", header: "Pontos", sortable: true },
];

function people() {
  return render(
    withProvider(<DataTable data={PEOPLE} columns={PEOPLE_COLUMNS} rowKey={(item) => item.id} />),
  );
}

test("text order follows Portuguese: accent with its letter, case ignored, numbers by value", () => {
  const { container } = people();
  fireEvent.click(screen.getByRole("button", { name: /nome/i }));
  expect(firstColumn(container)).toEqual([
    "Álvaro",
    "bruno",
    "Érica",
    "Item 9",
    "Item 10",
    "Zuleica",
  ]);
});

test("empty stays at the end in both directions, and does not count as zero", () => {
  const { container } = people();
  const header = screen.getByRole("button", { name: /pontos/i });

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual([
    "Érica",
    "Item 10",
    "Zuleica",
    "Item 9",
    "Álvaro",
    "bruno",
  ]);

  fireEvent.click(header);
  expect(firstColumn(container)).toEqual([
    "Item 9",
    "Zuleica",
    "Item 10",
    "Érica",
    "Álvaro",
    "bruno",
  ]);
});
