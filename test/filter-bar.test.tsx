import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import {
  FilterBar,
  FilterChip,
  type AppliedFilter,
  type FilterBarProps,
} from "../src/components/filter-bar";

function Controlled({
  initial,
  ...rest
}: { initial: AppliedFilter[] } & Omit<FilterBarProps, "filters" | "onFiltersChange">) {
  const [filters, setFilters] = useState(initial);
  return <FilterBar filters={filters} onFiltersChange={setFilters} {...rest} />;
}

function removeBy(name: string) {
  const cross = screen.getByRole("button", { name });
  cross.focus();
  fireEvent.click(cross);
}

function reservedLine() {
  return screen.queryAllByText("Nenhum filtro aplicado").find((node) => node.tagName === "P");
}

const APPLIED: AppliedFilter[] = [
  { id: "status", label: "Situacao", value: "Em aberto" },
  { id: "customer", label: "Cliente", value: "Clinica Sao Lucas" },
];

test("the chip shows the field and the value, and the value carries the weight", () => {
  render(<FilterChip label="Cliente" value="Clinica Sao Lucas" />);

  expect(screen.getByText("Cliente")).toBeDefined();
  expect(screen.getByText("Clinica Sao Lucas").className.split(" ")).toContain("font-rc-medium");
});

test("the disabled chip marks its root with data-disabled, and the disabled bar announces itself disabled", () => {
  const { container } = render(
    <FilterBar
      filters={[...APPLIED, { id: "branch", label: "Filial", value: "Centro", removable: false }]}
      onFiltersChange={() => {}}
      disabled
    />,
  );

  const bar = screen.getByRole("group");
  expect(bar.getAttribute("aria-disabled")).toBe("true");
  expect(bar.hasAttribute("data-disabled")).toBe(true);

  const chips = [...container.querySelectorAll("li > span")];
  expect(chips.length).toBe(3);
  for (const chip of chips) expect(chip.hasAttribute("data-disabled")).toBe(true);

  const branch = screen.getByText("Filial").parentElement!;
  expect(branch.querySelector("button")).toBeNull();
  expect(branch.hasAttribute("data-disabled")).toBe(true);

  for (const cross of screen.getAllByRole("button", { name: /Remover filtro/ })) {
    expect((cross as HTMLButtonElement).disabled).toBe(true);
  }
});

test("the enabled chip and the enabled bar carry no disabled mark", () => {
  const { container } = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  expect(screen.getByRole("group").hasAttribute("aria-disabled")).toBe(false);
  const chips = [...container.querySelectorAll("li > span")];
  expect(chips.length).toBe(2);
  for (const chip of chips) expect(chip.hasAttribute("data-disabled")).toBe(false);
});

test("the chip's cross says which filter goes away, not just 'Remover'", () => {
  render(<FilterChip label="Cliente" value="Clinica Sao Lucas" onRemove={() => {}} />);

  expect(
    screen.getByRole("button", { name: "Remover filtro Cliente: Clinica Sao Lucas" }),
  ).toBeDefined();
});

test("a value that is not text falls back to the field name, because a node cannot be read back", () => {
  render(<FilterChip label="Cliente" value={<em>Clinica</em>} onRemove={() => {}} />);

  expect(screen.getByRole("button", { name: "Remover filtro Cliente" })).toBeDefined();
});

test("the cross name is replaced through labels.remove, as in TagsInput", () => {
  render(
    <FilterChip
      label="Emissao"
      value="01/08"
      labels={{ remove: (text) => `Tirar o filtro ${text}` }}
      onRemove={() => {}}
    />,
  );

  expect(screen.getByRole("button", { name: "Tirar o filtro Emissao: 01/08" })).toBeDefined();
});

test("without onRemove the chip has no cross, which is how a locked filter is shown", () => {
  render(<FilterChip label="Filial" value="Matriz" />);

  expect(screen.queryByRole("button")).toBeNull();
});

test("the cross stretches the touch target through a pseudo-element, without fattening the pill", () => {
  render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} />);
  const cross = screen.getByRole("button");

  expect(cross.className).toContain("relative");
  expect(cross.className).toContain("after:absolute");
  expect(cross.className).toContain("after:-inset-1.5");
});

test("the value truncates with an ellipsis and carries the whole text in title", () => {
  const long = "Clinica Sao Lucas Servicos Medicos e Hospitalares Ltda";
  render(<FilterChip label="Cliente" value={long} />);
  const valueNode = screen.getByText(long);

  expect(valueNode.className).toContain("truncate");
  expect(valueNode.className).toContain("max-w-40");
  expect(valueNode.getAttribute("title")).toBe(long);
});

test("the chip carries neither a literal color nor a status tone", () => {
  render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} />);
  const chip = screen.getByText("Cliente").parentElement!;

  expect(chip.className).not.toMatch(/#[0-9a-f]{3,6}|rgba?\(/i);
  expect(chip.className).not.toMatch(/bg-(success|warning|danger|info)/);
  expect(chip.className).toContain("rounded-pill");
});

test("the disabled chip locks the cross, so a second tap does not repeat the query", () => {
  render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} disabled />);

  expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
});

test("the row comes out as a list, with one item per filter", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);

  expect(screen.getByRole("list").getAttribute("role")).toBe("list");
  expect(screen.getAllByRole("listitem").length).toBe(2);
});

test("the cross reports which filter left and delivers what remained", () => {
  const left = mock();
  const rest = mock();
  render(<FilterBar filters={APPLIED} onRemove={left} onFiltersChange={rest} />);

  fireEvent.click(
    screen.getByRole("button", { name: "Remover filtro Cliente: Clinica Sao Lucas" }),
  );

  expect(left).toHaveBeenCalledWith(APPLIED[1]);
  expect(rest).toHaveBeenCalledWith([APPLIED[0]]);
});

test("the piece keeps no list of its own: with no one changing the state, the chip stays there", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);

  fireEvent.click(
    screen.getByRole("button", { name: "Remover filtro Cliente: Clinica Sao Lucas" }),
  );

  expect(screen.getAllByRole("listitem").length).toBe(2);
});

test("a filter with removable false shows without a cross", () => {
  render(
    <FilterBar
      filters={[{ id: "branch", label: "Filial", value: "Matriz", removable: false }, ...APPLIED]}
      onFiltersChange={() => {}}
    />,
  );

  expect(screen.getAllByRole("listitem").length).toBe(3);
  expect(screen.queryByRole("button", { name: /Filial/ })).toBeNull();
});

test("clear shows up from two filters on", () => {
  const { rerender } = render(<FilterBar filters={[APPLIED[0]!]} onFiltersChange={() => {}} />);
  expect(screen.queryByRole("button", { name: /Limpar/ })).toBeNull();

  rerender(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  expect(screen.getByRole("button", { name: "Limpar 2 filtros" })).toBeDefined();
});

test("clearFrom changes the threshold, and with 1 clear shows from the first", () => {
  render(<FilterBar filters={[APPLIED[0]!]} onFiltersChange={() => {}} clearFrom={1} />);

  expect(screen.getByRole("button", { name: "Limpar 1 filtro" })).toBeDefined();
});

test("clear notifies first and delivers the empty list afterwards", () => {
  const cleared = mock();
  const rest = mock();
  render(<FilterBar filters={APPLIED} onClear={cleared} onFiltersChange={rest} />);

  fireEvent.click(screen.getByRole("button", { name: "Limpar 2 filtros" }));

  expect(cleared).toHaveBeenCalled();
  expect(rest).toHaveBeenCalledWith([]);
});

test("with no listener, there is neither clear nor cross: a button that does nothing is a lie", () => {
  render(<FilterBar filters={APPLIED} />);

  expect(screen.queryAllByRole("button").length).toBe(0);
});

test("the row stays reserved when there is no filter, so the screen does not jump on the first one", () => {
  render(<FilterBar filters={[]} onFiltersChange={() => {}} />);
  const row = screen.getByRole("group", { name: "Filtros aplicados" });

  expect(row.className).toContain("min-h-[var(--rc-control-sm)]");
  expect(reservedLine()).toBeDefined();
});

test("the reserved height comes from the density token, not from a hardcoded number", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  const row = screen.getByRole("group", { name: "Filtros aplicados" });

  expect(row.className).toContain("--rc-control-sm");
  expect(row.className).not.toMatch(/min-h-\[\d/);
});

test("reserve false drops the row and keeps the announcement mounted", () => {
  render(<FilterBar filters={[]} onFiltersChange={() => {}} reserve={false} />);
  const row = screen.getByRole("group", { name: "Filtros aplicados" });

  expect(row.className).not.toContain("min-h-[var(--rc-control-sm)]");
  expect(reservedLine()).toBeUndefined();
  expect(screen.getByRole("status").textContent).toBe("Nenhum filtro aplicado");
});

test("the count goes out in a live region, which is where screen reader users learn that it changed", () => {
  const { rerender } = render(<FilterBar filters={[]} onFiltersChange={() => {}} />);
  expect(screen.getByRole("status").textContent).toBe("Nenhum filtro aplicado");

  rerender(<FilterBar filters={[APPLIED[0]!]} onFiltersChange={() => {}} />);
  expect(screen.getByRole("status").textContent).toBe("1 filtro aplicado");

  rerender(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  expect(screen.getByRole("status").textContent).toBe("2 filtros aplicados");
});

test("the reserved line hides from the screen reader, because the live region already says it", () => {
  render(<FilterBar filters={[]} onFiltersChange={() => {}} />);

  expect(reservedLine()!.getAttribute("aria-hidden")).toBe("true");
});

test("when narrow, the row scrolls horizontally and no chip shrinks", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  const list = screen.getByRole("list");

  expect(list.className).toContain("overflow-x-auto");
  expect(list.className).not.toContain("flex-wrap");
  for (const item of screen.getAllByRole("listitem")) {
    expect(item.className).toContain("shrink-0");
  }
});

test("clear stays outside the scrolling stretch, anchored at the end", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  const clear = screen.getByRole("button", { name: "Limpar 2 filtros" });

  expect(clear.closest("ul")).toBeNull();
  expect(clear.className).toContain("shrink-0");
});

test("with no cross and overflowing, the scrolling stretch becomes a tab stop", () => {
  render(
    <FilterBar
      filters={APPLIED.map((each) => ({ ...each, removable: false }))}
      onFiltersChange={() => {}}
    />,
  );
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 0);

  expect(list.getAttribute("tabindex")).toBe("0");
});

test("with no cross but everything fitting, there is no tab stop: there is nothing to scroll", () => {
  render(
    <FilterBar
      filters={APPLIED.map((each) => ({ ...each, removable: false }))}
      onFiltersChange={() => {}}
    />,
  );
  const list = screen.getByRole("list");

  scroller(list, 561, 561, 0);

  expect(list.hasAttribute("tabindex")).toBe(false);
  expect(list.hasAttribute("aria-label")).toBe(false);
});

test("the tab stop gets a name, because a nameless stop does not say where the person is", () => {
  render(
    <FilterBar
      filters={APPLIED.map((each) => ({ ...each, removable: false }))}
      onFiltersChange={() => {}}
    />,
  );
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 0);

  expect(list.getAttribute("aria-label")).toBe("Filtros aplicados: role para ver todos");
});

test("the stop name follows the row name, and does not invent a second one", () => {
  render(
    <FilterBar
      filters={APPLIED.map((each) => ({ ...each, removable: false }))}
      onFiltersChange={() => {}}
      label="Filtros da fila"
    />,
  );
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 0);

  expect(list.getAttribute("aria-label")).toBe("Filtros da fila: role para ver todos");
});

test("labels.scroll replaces the name of the scrolling stretch", () => {
  render(
    <FilterBar
      filters={APPLIED.map((each) => ({ ...each, removable: false }))}
      onFiltersChange={() => {}}
      labels={{ scroll: (name) => `${name}, arraste para o lado` }}
    />,
  );
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 0);

  expect(list.getAttribute("aria-label")).toBe("Filtros aplicados, arraste para o lado");
});

test("with crosses present, overflowing adds neither stop nor name: the keyboard already arrives through the chips", () => {
  render(<FilterBar filters={SIX} onFiltersChange={() => {}} />);
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 0);

  expect(list.hasAttribute("tabindex")).toBe(false);
  expect(list.hasAttribute("aria-label")).toBe(false);
});

test("with crosses present, the scrolling stretch adds no tab stop", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);

  expect(screen.getByRole("list").hasAttribute("tabindex")).toBe(false);
});

test("when disabled, the bar locks every cross and clear at once", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} disabled />);

  for (const control of screen.getAllByRole("button")) {
    expect(control.hasAttribute("disabled")).toBe(true);
  }
});

test("disabled and overflowing, the scrolling stretch stays reachable by keyboard", () => {
  render(<FilterBar filters={SIX} onFiltersChange={() => {}} disabled />);
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 0);

  expect(list.getAttribute("tabindex")).toBe("0");
  expect(list.getAttribute("aria-label")).toBe("Filtros aplicados: role para ver todos");
});

test("disabled and everything fitting, disabled does not invent a tab stop", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} disabled />);
  const list = screen.getByRole("list");

  scroller(list, 561, 561, 0);

  expect(list.hasAttribute("tabindex")).toBe(false);
});

test("classNames dresses each part, not the root", () => {
  render(
    <FilterBar
      filters={APPLIED}
      onFiltersChange={() => {}}
      classNames={{
        list: "list-x",
        item: "item-x",
        chip: "chip-x",
        clear: "clear-x",
      }}
    />,
  );

  expect(screen.getByRole("list").className).toContain("list-x");
  expect(screen.getAllByRole("listitem")[0]!.className).toContain("item-x");
  expect(screen.getByText("Situacao").parentElement!.className).toContain("chip-x");
  expect(screen.getByRole("button", { name: "Limpar 2 filtros" }).className).toContain("clear-x");
});

test("classNames also dresses the reserved line", () => {
  render(<FilterBar filters={[]} onFiltersChange={() => {}} classNames={{ empty: "empty-x" }} />);

  expect(reservedLine()!.className).toContain("empty-x");
});

test("the chip parts are dressed one by one", () => {
  render(
    <FilterChip
      label="Cliente"
      value="Acme"
      onRemove={() => {}}
      classNames={{ label: "label-x", value: "value-x", remove: "cross-x" }}
    />,
  );

  expect(screen.getByText("Cliente").className).toContain("label-x");
  expect(screen.getByText("Acme").className).toContain("value-x");
  expect(screen.getByRole("button").className).toContain("cross-x");
});

test("the bar size flows down to the chips", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} size="sm" />);

  expect(screen.getByText("Situacao").parentElement!.className.split(" ")).toContain("h-5");
});

test("the row name can be replaced, so two bars on the same screen are not confused", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} label="Filtros da fila" />);

  expect(screen.getByRole("group", { name: "Filtros da fila" })).toBeDefined();
});

test("the bar texts can be replaced entirely", () => {
  render(
    <FilterBar
      filters={APPLIED}
      onFiltersChange={() => {}}
      labels={{
        remove: (text) => `Tirar ${text}`,
        clear: (count) => `Zerar os ${count}`,
        status: (count) => `${count} recortes`,
      }}
    />,
  );

  expect(screen.getByRole("button", { name: "Tirar Situacao: Em aberto" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Zerar os 2" })).toBeDefined();
  expect(screen.getByRole("status").textContent).toBe("2 recortes");
});

function scroller(list: HTMLElement, box: number, content: number, at: number) {
  Object.defineProperty(list, "clientWidth", { value: box, configurable: true });
  Object.defineProperty(list, "scrollWidth", { value: content, configurable: true });
  Object.defineProperty(list, "scrollLeft", { value: at, writable: true, configurable: true });
  fireEvent.scroll(list);
}

const SIX: AppliedFilter[] = [
  { id: "status", label: "Situacao", value: "Em aberto" },
  { id: "emissao", label: "Emissao", value: "01/08 a 31/08" },
  { id: "customer", label: "Cliente", value: "Clinica Sao Lucas Servicos Medicos Ltda" },
  { id: "vendor", label: "Fornecedor", value: "Distribuidora Hospitalar Norte" },
  { id: "branch", label: "Filial", value: "Matriz Centro" },
  { id: "seller", label: "Vendedor", value: "Maria Fernanda de Albuquerque" },
];

test("when everything fits, no edge fades: a complete row cannot pretend it continues", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  const list = screen.getByRole("list");

  scroller(list, 600, 600, 0);

  expect(list.className).not.toContain("mask-l-from");
  expect(list.className).not.toContain("mask-r-from");
});

test("with filters left over on the right, the right edge fades, which is the hint that there is more", () => {
  render(<FilterBar filters={SIX} onFiltersChange={() => {}} />);
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 0);

  expect(list.className).toContain("mask-r-from-[calc(100%-1.5rem)]");
  expect(list.className).toContain("mask-r-to-100%");
  expect(list.className).not.toContain("mask-l-from");
});

test("in the middle of the scroll both edges fade, because there are filters on both sides", () => {
  render(<FilterBar filters={SIX} onFiltersChange={() => {}} />);
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 520);

  expect(list.className).toContain("mask-l-from-[calc(100%-1.5rem)]");
  expect(list.className).toContain("mask-r-from-[calc(100%-1.5rem)]");
});

test("at the end of the scroll only the left fades: on the right there is nothing more to promise", () => {
  render(<FilterBar filters={SIX} onFiltersChange={() => {}} />);
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 1039);

  expect(list.className).toContain("mask-l-from-[calc(100%-1.5rem)]");
  expect(list.className).not.toContain("mask-r-from");
});

test("going back to the start the left fade goes away too", () => {
  render(<FilterBar filters={SIX} onFiltersChange={() => {}} />);
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 1039);
  scroller(list, 250, 1289, 0);

  expect(list.className).not.toContain("mask-l-from");
  expect(list.className).toContain("mask-r-from");
});

test("the fade does not change the chip count: all stay in the row and reachable", () => {
  render(<FilterBar filters={SIX} onFiltersChange={() => {}} />);
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 0);

  expect(screen.getAllByRole("listitem").length).toBe(6);
  expect(list.className).toContain("overflow-x-auto");
  expect(list.className).not.toContain("flex-wrap");
});

test("focus stops away from the faded edge, by the same measure as the fade", () => {
  render(<FilterBar filters={SIX} onFiltersChange={() => {}} />);

  expect(screen.getByRole("list").className).toContain("scroll-px-6");
});

test("with the scroller as a tab stop, focusing it turns off the fade", () => {
  render(
    <FilterBar
      filters={SIX.map((each) => ({ ...each, removable: false }))}
      onFiltersChange={() => {}}
    />,
  );
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 520);

  expect(list.getAttribute("tabindex")).toBe("0");
  expect(list.className).toContain("focus-visible:mask-none");
  expect(list.className).toContain("focus-visible:ring-2");
});

test("clear counts what is applied, not what fit on the screen", () => {
  render(<FilterBar filters={SIX} onFiltersChange={() => {}} />);
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 0);

  expect(screen.getByRole("button", { name: "Limpar 6 filtros" })).toBeDefined();
  expect(screen.getByRole("status").textContent).toBe("6 filtros aplicados");
});

test("the list classNames redraws the fade, for whoever wants another measure", () => {
  render(
    <FilterBar
      filters={SIX}
      onFiltersChange={() => {}}
      classNames={{ list: "mask-r-from-[calc(100%-4rem)]" }}
    />,
  );
  const list = screen.getByRole("list");

  scroller(list, 250, 1289, 0);

  expect(list.className).toContain("mask-r-from-[calc(100%-4rem)]");
  expect(list.className).not.toContain("mask-r-from-[calc(100%-1.5rem)]");
});

test("once a chip is removed, focus goes to the next one's cross, not to the top of the document", () => {
  render(<Controlled initial={SIX} />);

  removeBy("Remover filtro Situacao: Em aberto");

  expect(document.activeElement?.getAttribute("aria-label")).toBe(
    "Remover filtro Emissao: 01/08 a 31/08",
  );
});

test("removing one after another, focus never falls to body: six filters, six landings", () => {
  render(<Controlled initial={SIX} />);
  const landings: string[] = [];

  for (const filter of SIX) {
    const cross = screen.getByRole("button", {
      name: new RegExp(`^Remover filtro ${filter.label}`),
    });
    cross.focus();
    fireEvent.click(cross);
    landings.push(document.activeElement === document.body ? "body" : "somewhere in the bar");
  }

  expect(landings.length).toBe(6);
  expect(landings).not.toContain("body");
});

test("it was the last chip, so focus lands on clear, which is the remaining neighbor", () => {
  render(<Controlled initial={SIX} />);

  removeBy("Remover filtro Vendedor: Maria Fernanda de Albuquerque");

  expect(document.activeElement?.textContent).toBe("Limpar 5 filtros");
});

test("it was the last one and there is no clear, so focus goes back to the previous cross", () => {
  render(<Controlled initial={APPLIED} clearFrom={Infinity} />);

  removeBy("Remover filtro Cliente: Clinica Sao Lucas");

  expect(document.activeElement?.getAttribute("aria-label")).toBe(
    "Remover filtro Situacao: Em aberto",
  );
});

test("with only locked chips left, focus lands on the scrolling stretch, not on body", () => {
  const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, get: () => 0 });
  try {
    render(
      <Controlled
        initial={[
          APPLIED[0]!,
          { id: "branch", label: "Filial", value: "Matriz", removable: false },
        ]}
        clearFrom={Infinity}
      />,
    );

    removeBy("Remover filtro Situacao: Em aberto");

    expect(document.activeElement).toBe(screen.getByRole("list"));
    expect(screen.getByRole("list").getAttribute("tabindex")).toBe("-1");
  } finally {
    if (width) Object.defineProperty(HTMLElement.prototype, "scrollWidth", width);
    else delete (HTMLElement.prototype as { scrollWidth?: number }).scrollWidth;
  }
});

test("with only locked chips left in a scrolling list, focus lands on it, which is already a tab stop", async () => {
  const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get: () => 900,
  });
  try {
    render(
      <Controlled
        initial={[
          APPLIED[0]!,
          { id: "branch", label: "Filial", value: "Matriz", removable: false },
        ]}
        clearFrom={Infinity}
      />,
    );

    removeBy("Remover filtro Situacao: Em aberto");
    await act(async () => {});

    const list = screen.getByRole("list");
    expect(document.activeElement).toBe(list);
    expect(list.getAttribute("tabindex")).toBe("0");
  } finally {
    if (width) Object.defineProperty(HTMLElement.prototype, "scrollWidth", width);
    else delete (HTMLElement.prototype as { scrollWidth?: number }).scrollWidth;
  }
});

test("the last filter left, focus lands on the root, which is what still has a name", () => {
  render(<Controlled initial={[APPLIED[0]!]} clearFrom={Infinity} />);

  removeBy("Remover filtro Situacao: Em aberto");

  const row = screen.getByRole("group", { name: "Filtros aplicados" });
  expect(document.activeElement).toBe(row);
  expect(row.getAttribute("tabindex")).toBe("-1");
});

test("the emergency landing gives back the tabindex on leaving, so it does not leave a new stop behind", () => {
  render(<Controlled initial={[APPLIED[0]!]} clearFrom={Infinity} />);

  removeBy("Remover filtro Situacao: Em aberto");
  const row = screen.getByRole("group", { name: "Filtros aplicados" });
  fireEvent.blur(row);

  expect(row.hasAttribute("tabindex")).toBe(false);
});

test("with the bar locking in the same step, focus steers clear of the disabled cross", () => {
  function Reloading() {
    const [filters, setFilters] = useState(SIX);
    const [busy, setBusy] = useState(false);
    return (
      <FilterBar
        filters={filters}
        disabled={busy}
        onFiltersChange={(rest) => {
          setFilters(rest);
          setBusy(true);
        }}
      />
    );
  }

  render(<Reloading />);
  removeBy("Remover filtro Situacao: Em aberto");

  expect(document.activeElement).not.toBe(document.body);
  expect((document.activeElement as HTMLButtonElement).disabled).not.toBe(true);
});

test("focus that was not in the row is not pulled into it", () => {
  render(<Controlled initial={SIX} />);
  const outside = document.createElement("button");
  document.body.append(outside);
  outside.focus();

  fireEvent.click(screen.getByRole("button", { name: "Remover filtro Situacao: Em aberto" }));

  expect(document.activeElement).toBe(outside);
  outside.remove();
});

test("the caller's aria-label beats label, and replaces BOTH names at once", () => {
  // The rule is the same as in `Tracker` and `Splitter`, with no exception: a
  // piece that has its own name prop lets the caller's `aria-label` win. Two
  // `FilterBar`s on the same screen - one for invoices, another for suppliers -
  // need different names, and `label` already plays another role.
  //
  // What took care is that here the name baptizes TWO nodes: the row and the
  // scrolling stretch, when it becomes a tab stop. If only the root obeyed, the
  // stop would keep the old name and the screen would have two names for the
  // same place.
  const { container } = render(
    <FilterBar
      filters={APPLIED}
      onFiltersChange={() => {}}
      label="Filtros da listagem"
      aria-label="Fila de cobranca"
    />,
  );

  expect(screen.getByRole("group", { name: "Fila de cobranca" })).toBeDefined();
  expect(screen.queryByRole("group", { name: "Filtros da listagem" })).toBeNull();

  const list = container.querySelector('[role="list"]') as HTMLElement;
  if (list.hasAttribute("aria-label")) {
    expect(list.getAttribute("aria-label")).toContain("Fila de cobranca");
  }
});

test("clear keeps the locked filter and counts only the ones it removes", () => {
  const onFiltersChange = mock((_next: AppliedFilter[]) => {});
  render(
    <FilterBar
      filters={[{ id: "branch", label: "Filial", value: "Centro", removable: false }, ...APPLIED]}
      onFiltersChange={onFiltersChange}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Limpar 2 filtros" }));

  expect(onFiltersChange).toHaveBeenCalledTimes(1);
  expect(onFiltersChange.mock.calls[0]![0].map((filter) => filter.id)).toEqual(["branch"]);
});

test("clear does not show when only the locked one would pass the threshold", () => {
  render(
    <FilterBar
      filters={[{ id: "branch", label: "Filial", value: "Centro", removable: false }, APPLIED[0]!]}
      onFiltersChange={() => {}}
    />,
  );

  expect(screen.queryByRole("button", { name: /Limpar/ })).toBeNull();
});

test("after clear, focus lands on the role=group root", () => {
  render(<Controlled initial={APPLIED} />);

  const clear = screen.getByRole("button", { name: "Limpar 2 filtros" });
  clear.focus();
  act(() => {
    fireEvent.click(clear);
  });

  const group = screen.getByRole("group", { name: "Filtros aplicados" });
  expect(document.activeElement).toBe(group);
  expect(group.getAttribute("tabindex")).toBe("-1");
});
