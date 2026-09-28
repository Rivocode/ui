import { expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartContainer, type ChartConfig } from "../src/chart/chart";
import { Checkbox } from "../src/components/checkbox";
import { Clipboard } from "../src/components/clipboard";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxInput,
  ComboboxValue,
} from "../src/components/combobox";
import { DataTable, type Column } from "../src/components/data-table";
import { Editable } from "../src/components/editable";
import { EventCalendar } from "../src/components/event-calendar";
import { PasswordInput } from "../src/components/password-input";
import { QueryBoundary } from "../src/components/query-boundary";
import { Radio, RadioGroup } from "../src/components/radio";
import { Switch } from "../src/components/switch";
import { TagsInput } from "../src/components/tags-input";
import { VirtualList } from "../src/components/virtual-list";
import { LOADED_ANNOUNCEMENT, LOADING_ANNOUNCEMENT } from "../src/lib/loading-announcement";

/*
 * The four divergences the audit measured between SIBLING form components.
 * None was broken: each charged a different price to do the same thing two
 * screens later.
 *
 * What this file guards is the contract, and not the styling: that
 * `defaultValue` works without `value`, that each part's class lands on the
 * right node, and that the remove button has a real name.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/** The dressed part, checking that the class landed on the right node and not on the root. */
function wears(container: HTMLElement, marker: string, base: string) {
  const target = container.ownerDocument.querySelector(`.${marker}`);
  expect(target).not.toBeNull();
  expect(target!.className).toContain(base);
}

/* --- 1. controlled-only became the pair of the five siblings ------------ */

test("TagsInput keeps its own list when it only receives defaultValue", () => {
  // A screen filter submits nothing and stores nothing: paying a `useState` just
  // to exist was the price only this component charged.
  withTheme(<TagsInput aria-label="Palavras do filtro" defaultValue={["nf-e"]} />);

  const field = screen.getByLabelText("Palavras do filtro");
  fireEvent.change(field, { target: { value: "urgente" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(screen.getByText("nf-e")).toBeDefined();
  expect(screen.getByText("urgente")).toBeDefined();
});

test("the x removes the chip also when the component owns the list", () => {
  withTheme(<TagsInput aria-label="Marcadores" defaultValue={["nf-e", "urgente"]} />);

  fireEvent.click(screen.getByRole("button", { name: "Remover urgente" }));

  expect(screen.queryByText("urgente")).toBeNull();
  expect(screen.getByText("nf-e")).toBeDefined();
});

test("removing a chip moves focus to the neighbor's x, and without a neighbor to the field", () => {
  withTheme(<TagsInput aria-label="Marcadores" defaultValue={["nf-e", "urgente", "prefeitura"]} />);

  const first = screen.getByRole("button", { name: "Remover nf-e" });
  first.focus();
  fireEvent.click(first);
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remover urgente" }));

  const last = screen.getByRole("button", { name: "Remover prefeitura" });
  last.focus();
  fireEvent.click(last);
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remover urgente" }));

  fireEvent.click(screen.getByRole("button", { name: "Remover urgente" }));
  expect(document.activeElement).toBe(screen.getByLabelText("Marcadores"));
});

test("with `value`, the outside is still in charge", () => {
  // The pair must not have become "defaultValue wins": passing `value` says the
  // list lives in the app, and the component must not draw another one.
  withTheme(
    <TagsInput
      aria-label="Marcadores"
      value={["nf-e"]}
      defaultValue={["ignorada"]}
      onValueChange={() => {}}
    />,
  );

  const field = screen.getByLabelText("Marcadores");
  fireEvent.change(field, { target: { value: "urgente" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(screen.getByText("nf-e")).toBeDefined();
  expect(screen.queryByText("urgente")).toBeNull();
  expect(screen.queryByText("ignorada")).toBeNull();
});

test("Editable keeps its own text when it only receives defaultValue", () => {
  withTheme(<Editable defaultValue="Clínica São Lucas" label="Cliente" />);

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente");
  fireEvent.change(field, { target: { value: "Clínica Aurora" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(screen.getByRole("button", { name: /Clínica Aurora/ })).toBeDefined();
});

test("an uncontrolled Editable still reverts on Escape", () => {
  withTheme(<Editable defaultValue="Clínica São Lucas" label="Cliente" />);

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente");
  fireEvent.change(field, { target: { value: "outra coisa" } });
  fireEvent.keyDown(field, { key: "Escape" });

  expect(screen.getByRole("button", { name: /Clínica São Lucas/ })).toBeDefined();
});

/* --- 2. a single name for the remove button ----------------------------- */

test("the TagsInput chip says what is removed, through `labels`", () => {
  withTheme(
    <TagsInput
      aria-label="Marcadores"
      defaultValue={["nf-e"]}
      labels={{ remove: (tag) => `Tirar o marcador ${tag}` }}
    />,
  );

  expect(screen.getByRole("button", { name: "Tirar o marcador nf-e" })).toBeDefined();
});

const CUSTOMERS = ["Clinica Sao Lucas", "Transportes Cabo Branco"];

function chips(chip: (customer: string) => React.ReactNode) {
  return withTheme(
    <Combobox items={CUSTOMERS} multiple defaultValue={CUSTOMERS}>
      <ComboboxChips>
        <ComboboxValue>{(chosen: string[]) => chosen.map(chip)}</ComboboxValue>
        <ComboboxInput placeholder="Buscar cliente" />
      </ComboboxChips>
    </Combobox>,
  );
}

test("the Combobox chip x names the chip, without asking for anything", () => {
  // It was the worst of the four: `aria-label="Remover"` hardcoded in the
  // component, with no prop at all - there was no way to translate it nor to say
  // what is removed, and three chips announced "Remover, Remover, Remover".
  chips((customer) => <ComboboxChip key={customer}>{customer}</ComboboxChip>);

  expect(screen.getByRole("button", { name: "Remover Clinica Sao Lucas" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Remover Transportes Cabo Branco" })).toBeDefined();
});

test("a chip that is not text falls back to its own aria-label", () => {
  chips((customer) => (
    <ComboboxChip key={customer} aria-label={customer}>
      <span>{customer}</span>
    </ComboboxChip>
  ));

  expect(screen.getByRole("button", { name: "Remover Clinica Sao Lucas" })).toBeDefined();
});

test("the Combobox chip x accepts another verb, through `labels`", () => {
  chips((customer) => (
    <ComboboxChip key={customer} labels={{ remove: (label) => `Tirar ${label} da seleção` }}>
      {customer}
    </ComboboxChip>
  ));

  expect(screen.getByRole("button", { name: "Tirar Clinica Sao Lucas da seleção" })).toBeDefined();
});

test("changing one Clipboard name does not erase the other", () => {
  // The object required both: whoever changed only the verb lost the
  // confirmation, and TypeScript enforced it - now each name has its own default.
  withTheme(<Clipboard value="4813" labels={{ copy: "Copiar a chave" }} />);

  expect(screen.getByRole("button", { name: "Copiar a chave" })).toBeDefined();
});

test("changing one PasswordInput name does not erase the other", () => {
  withTheme(<PasswordInput aria-label="Senha" labels={{ show: "Revelar a senha" }} />);

  const eye = screen.getByRole("button", { name: "Revelar a senha" });
  fireEvent.click(eye);

  expect(screen.getByRole("button", { name: "Esconder senha" })).toBeDefined();
});

/* --- 3. the password frame got a part name ------------------------------ */

test("the password dresses frame, field and button by name", () => {
  const { container } = withTheme(
    <PasswordInput
      aria-label="Senha"
      classNames={{ wrapper: "moldura-p", input: "campo-p", action: "olho-p" }}
    />,
  );

  wears(container, "moldura-p", "--rc-control-md");
  wears(container, "campo-p", "h-[var(--rc-control-md)]");
  expect(container.ownerDocument.querySelector(".campo-p")!.tagName).toBe("INPUT");
  expect(container.ownerDocument.querySelector(".olho-p")!.tagName).toBe("BUTTON");

  // The frame is the frame: its class must not slip onto the field, which is
  // where the loose `className` lands.
  expect(screen.getByLabelText("Senha").className).not.toContain("moldura-p");
});

test("the password className still dresses the field, and not the frame", () => {
  // This is the only component in the catalog where the root is not the
  // `className` target. Changing that now would silently change the width of
  // every login screen.
  withTheme(<PasswordInput aria-label="Senha" className="campo-velho" />);

  expect(screen.getByLabelText("Senha").className).toContain("campo-velho");
});

/* --- 4. the three controls of the same list ----------------------------- */

test("the Radio circle has an outside name, like the Checkbox box", () => {
  const { container } = withTheme(
    <RadioGroup defaultValue="pix">
      <Radio value="pix" classNames={{ circle: "circulo-r" }}>
        Pix
      </Radio>
    </RadioGroup>,
  );

  wears(container, "circulo-r", "rounded-pill");
  expect(container.ownerDocument.querySelector(".circulo-r")!.getAttribute("role")).toBe("radio");
});

test("the three controls put the same gap between control and label", () => {
  // They show up side by side on the same form screen, and Checkbox used
  // `gap-2` against the `gap-3` of the other two: the labels did not line up.
  withTheme(
    <>
      <Checkbox>ISS retido</Checkbox>
      <RadioGroup defaultValue="pix">
        <Radio value="pix">Pix</Radio>
      </RadioGroup>
      <Switch>Enviar o XML</Switch>
    </>,
  );

  for (const text of ["ISS retido", "Pix", "Enviar o XML"]) {
    const label = screen.getByText(text).closest("label")!;
    expect(`${text}: ${label.className.includes("gap-2")}`).toBe(`${text}: true`);
  }
});

test("none of the three disables through opacity", () => {
  // `opacity-60` lowers border, mark and text all at once, and `check:contrast`
  // does not measure opacity: a pair approved in the theme file could fail on
  // screen without anything flagging it.
  const { container } = withTheme(
    <>
      <Checkbox disabled>ISS retido</Checkbox>
      <RadioGroup defaultValue="pix" disabled>
        <Radio value="pix">Pix</Radio>
      </RadioGroup>
      <Switch disabled>Enviar o XML</Switch>
    </>,
  );

  for (const role of ["checkbox", "radio", "switch"]) {
    const control = container.ownerDocument.querySelector(`[role="${role}"]`)!;
    expect(`${role}: ${control.className.includes("opacity-")}`).toBe(`${role}: false`);
    expect(`${role}: ${control.className.includes("data-[disabled]:cursor-not-allowed")}`).toBe(
      `${role}: true`,
    );
    // The border goes down one step in all three, and not two. When this test
    // was born the decision was not to touch it - `--rc-border` vanishes at
    // 1.30:1 against the fill, and `border-strong` makes disabled look like
    // enabled -, and the way out was to have no way out. `--rc-border-disabled`
    // was born for that middle band the same day, so the rule became the
    // opposite: whatever is disabled goes down.
    expect(`${role}: ${control.className.includes("data-[disabled]:border-border-disabled")}`).toBe(
      `${role}: true`,
    );
    expect(`${role}: ${control.className.includes("data-[disabled]:bg-surface-raised")}`).toBe(
      `${role}: ${role !== "switch"}`,
    );
  }
});

test("the mark of all three fades along with the control", () => {
  // Without this the mark stays white on the faded surface and disappears - and
  // on the Switch the thumb is the only place to read whether it is on.
  const { container } = withTheme(
    <>
      <Checkbox defaultChecked disabled aria-label="ISS" />
      <RadioGroup defaultValue="pix" disabled>
        <Radio value="pix" aria-label="Pix" />
      </RadioGroup>
      <Switch defaultChecked disabled aria-label="XML" />
    </>,
  );

  const box = container.ownerDocument.querySelector('[role="checkbox"]')!;
  expect(box.className).toContain("data-[disabled]:text-fg-disabled");

  for (const selector of ['[role="radio"] > span', '[role="switch"] > span']) {
    const mark = container.ownerDocument.querySelector(selector)!;
    expect(`${selector}: ${mark.className.includes("data-[disabled]:bg-fg-disabled")}`).toBe(
      `${selector}: true`,
    );
  }
});

test("the accent only paints the enabled control, without depending on class order", () => {
  // Tailwind emits the `data-[...]` variants in alphabetical order, so
  // `data-[disabled]` beat `data-[checked]` by luck and LOST to
  // `data-[indeterminate]`: a disabled select-all box, in a mixed state, came
  // out painted in full accent.
  const { container } = withTheme(
    <Checkbox indeterminate disabled aria-label="Selecionar todas" />,
  );

  const box = container.ownerDocument.querySelector('[role="checkbox"]')!;
  const classes = box.className.split(" ");
  expect(classes).toContain("data-[indeterminate]:not-data-disabled:bg-accent-text");
  expect(classes).not.toContain("data-[indeterminate]:bg-accent-text");
  expect(classes).not.toContain("data-[indeterminate]:not-data-disabled:bg-accent");
});

/* --- 5. the siblings of a query's endings --------------------------------
 *
 * There are FIVE since 08/27, and not four: EventCalendar was born already
 * with the four endings. The table below is what keeps the sixth from being
 * born crooked, and that is why it is named by role and not by number - a
 * number in the name ages with the first new component, and that is what
 * happened to the JSDoc that said "the four query components".
 * ----------------------------------------------------------------------- */

type Invoice = { id: string; customer: string };

const INVOICES: Invoice[] = [
  { id: "1", customer: "Clinica Sao Lucas" },
  { id: "2", customer: "Transportes Cabo Branco" },
];

const INVOICE_COLUMNS: Column<Invoice>[] = [{ key: "customer", header: "Cliente" }];

const CHART_CONFIG: ChartConfig = { pagas: { label: "Pagas" } };

type Query = {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  labels?: { retry?: string; loading?: string; loaded?: string };
};

const SISTERS: Record<string, (query: Query) => ReactNode> = {
  VirtualList: (query) => (
    <VirtualList
      items={query.isLoading ? undefined : INVOICES}
      itemKey={(invoice) => invoice.id}
      renderItem={(invoice) => <span>{invoice.customer}</span>}
      maxHeight={200}
      label="Notas"
      {...query}
    />
  ),
  QueryBoundary: (query) => (
    <QueryBoundary data={query.isLoading ? undefined : INVOICES} {...query}>
      {(invoices) => <p>{invoices.length} notas</p>}
    </QueryBoundary>
  ),
  DataTable: (query) => (
    <DataTable
      data={query.isLoading ? undefined : INVOICES}
      columns={INVOICE_COLUMNS}
      rowKey={(invoice) => invoice.id}
      {...query}
    />
  ),
  ChartContainer: (query) => (
    <ChartContainer config={CHART_CONFIG} className="h-40" {...query}>
      <svg />
    </ChartContainer>
  ),
  EventCalendar: (query) => (
    <EventCalendar
      label="Agenda"
      view="agenda"
      events={query.isLoading ? undefined : []}
      {...query}
    />
  ),
};

const sisters = Object.entries(SISTERS);

test("the siblings swap the retry button name through `labels.retry`", () => {
  for (const [name, sister] of sisters) {
    const view = withTheme(sister({ isError: true, onRetry: () => {}, labels: { retry: "Try again" } }));
    const named = within(view.container).queryByRole("button", { name: "Try again" });

    expect(`${name}: ${named !== null}`).toBe(`${name}: true`);
    view.unmount();
  }
});

test("the four say the SAME default when nobody passes `labels.retry`", () => {
  for (const [name, sister] of sisters) {
    const view = withTheme(sister({ isError: true, onRetry: () => {} }));
    const named = within(view.container).queryByRole("button", { name: "Tentar de novo" });

    expect(`${name}: ${named !== null}`).toBe(`${name}: true`);
    view.unmount();
  }
});

test("the button of all four runs `onRetry`, and does not just show up", () => {
  for (const [name, sister] of sisters) {
    let retries = 0;
    const view = withTheme(sister({ isError: true, onRetry: () => (retries += 1) }));

    fireEvent.click(within(view.container).getByRole("button", { name: "Tentar de novo" }));

    expect(`${name}: ${retries}`).toBe(`${name}: 1`);
    view.unmount();
  }
});

test("the waiting state of all four comes out in a live region with text, and not only in `aria-busy`", () => {
  for (const [name, sister] of sisters) {
    const view = withTheme(sister({ isLoading: true }));
    const region = view.container.querySelector("[data-rc-status]");

    expect(`${name}: ${region?.getAttribute("role")}`).toBe(`${name}: status`);
    expect(`${name}: ${region?.getAttribute("aria-live")}`).toBe(`${name}: polite`);
    expect(`${name}: ${region?.textContent}`).toBe(`${name}: ${LOADING_ANNOUNCEMENT}`);
    view.unmount();
  }
});

test("waiting and arrival say what `labels.loading` and `labels.loaded` dictate", () => {
  const labels = { loading: "Loading…", loaded: "Content loaded" };
  for (const [name, sister] of sisters) {
    const view = withTheme(sister({ isLoading: true, labels }));
    const region = () => view.container.querySelector("[data-rc-status]");
    expect(`${name}: ${region()?.textContent}`).toBe(`${name}: Loading…`);

    view.rerender(
      <RivoProvider scope="local">{sister({ isLoading: false, labels })}</RivoProvider>,
    );
    expect(`${name}: ${region()?.textContent}`).toBe(`${name}: Content loaded`);
    view.unmount();
  }
});

test("data arrival speaks through the SAME node, which is not remounted with the content", () => {
  for (const [name, sister] of sisters) {
    const view = withTheme(sister({ isLoading: true }));
    const before = view.container.querySelector("[data-rc-status]");

    view.rerender(<RivoProvider scope="local">{sister({ isLoading: false })}</RivoProvider>);
    const after = view.container.querySelector("[data-rc-status]");

    expect(`${name}: ${after === before}`).toBe(`${name}: true`);
    expect(`${name}: ${after?.textContent}`).toBe(`${name}: ${LOADED_ANNOUNCEMENT}`);
    view.unmount();
  }
});
