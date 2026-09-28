import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
} from "../src/components/combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../src/components/select";

/*
 * The long list that has real families: operation nature by type, state by
 * region, chart of accounts.
 *
 * `Combobox` grouped from early on and `Select` did not, and both show up on
 * the same filter screen - the same list came out grouped on one side and flat
 * on the other. The header also had to read as a header: the Combobox one was
 * the raw Base UI part, unstyled, with the size and color of one more option.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const NATURES = [
  { label: "Venda de mercadoria", value: "5102" },
  { label: "Devolução de venda", value: "1202" },
  { label: "Remessa para conserto", value: "5915" },
];

function GroupedSelect() {
  return (
    <Select items={NATURES} defaultValue="5102" defaultOpen>
      <SelectTrigger aria-label="Natureza da operação">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectGroupLabel>Saída</SelectGroupLabel>
          <SelectItem value="5102">Venda de mercadoria</SelectItem>
          <SelectItem value="5915">Remessa para conserto</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectGroupLabel>Entrada</SelectGroupLabel>
          <SelectItem value="1202">Devolução de venda</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

test("the Select group carries its name inside it, and not beside it", () => {
  withTheme(<GroupedSelect />);

  const [outgoing] = screen.getAllByRole("group");
  const title = screen.getByText("Saída");

  expect(outgoing!.getAttribute("aria-labelledby")).toBe(title.id);
  expect(outgoing!.contains(title)).toBe(true);
});

test("grouping hides no option, nor changes what the trigger shows", () => {
  withTheme(<GroupedSelect />);

  expect(screen.getAllByRole("option")).toHaveLength(3);
  expect(screen.getByLabelText("Natureza da operação").textContent).toContain(
    "Venda de mercadoria",
  );
});

test("the group header does not read as an option, in all three lists", () => {
  // It is smaller, lighter and uppercase - the same title as `MenuGroup`.
  // Without it "Saída" had the size and color of "Venda de mercadoria", and the
  // list looked like it had one extra option that did not click.
  withTheme(<GroupedSelect />);

  const title = screen.getByText("Saída");
  expect(title.className).toContain("text-xs");
  expect(title.className).toContain("text-fg-subtle");
  expect(title.getAttribute("role")).not.toBe("option");
});

test("the line between groups does not enter the count the screen reader announces", () => {
  // `role="presentation"`, and not the `role="separator"` of MenuSeparator: a
  // node with its own role in the middle of an option list breaks "option 3 of 12".
  const { container } = withTheme(<GroupedSelect />);

  const line = container.ownerDocument.querySelector('[role="listbox"] [role="presentation"]')!;
  expect(line.className.split(" ")).toContain("bg-border");
  expect(container.ownerDocument.querySelectorAll('[role="separator"]')).toHaveLength(0);
});

const CITIES = ["João Pessoa", "Campina Grande", "Recife"];

function GroupedCombobox() {
  return (
    <Combobox items={CITIES} defaultOpen>
      <ComboboxInput placeholder="Buscar cidade" />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxGroup>
            <ComboboxGroupLabel>Paraíba</ComboboxGroupLabel>
            <ComboboxItem value="João Pessoa">João Pessoa</ComboboxItem>
            <ComboboxItem value="Campina Grande">Campina Grande</ComboboxItem>
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxGroup>
            <ComboboxGroupLabel>Pernambuco</ComboboxGroupLabel>
            <ComboboxItem value="Recife">Recife</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

test("the Combobox header wears the same title as the Select", () => {
  withTheme(<GroupedCombobox />);

  const first = screen.getByText("Paraíba");
  const second = screen.getByText("Pernambuco");

  expect(first.className).toContain("text-xs");
  expect(first.className).toBe(second.className);
});

test("the Combobox line is the same line as the Select", () => {
  const { container } = withTheme(<GroupedCombobox />);

  const line = container.ownerDocument.querySelector('[role="listbox"] [role="presentation"]')!;
  expect(line.className.split(" ")).toContain("h-px");
  expect(line.className.split(" ")).toContain("bg-border");
});

test("the consumer class wins over the header and line classes", () => {
  const { container } = withTheme(
    <Select items={NATURES} defaultOpen>
      <SelectTrigger aria-label="Natureza">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup className="group-x">
          <SelectGroupLabel className="text-fg">Saída</SelectGroupLabel>
          <SelectItem value="5102">Venda de mercadoria</SelectItem>
        </SelectGroup>
        <SelectSeparator className="line-x" />
      </SelectContent>
    </Select>,
  );

  expect(container.ownerDocument.querySelector(".group-x")!.getAttribute("role")).toBe("group");
  expect(container.ownerDocument.querySelector(".line-x")).not.toBeNull();
  // `tailwind-merge` resolves the conflict: the caller color remains, not both.
  const title = screen.getByText("Saída");
  expect(title.className).toContain("text-fg");
  expect(title.className).not.toContain("text-fg-subtle");
});
