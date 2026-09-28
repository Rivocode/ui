import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "../src/components/combobox";

const CUSTOMERS = ["Clinica Sao Lucas", "Transportes Cabo Branco"];

function list(props: { items?: string[] } = {}) {
  return render(
    <RivoProvider scope="local">
      <Combobox items={props.items ?? CUSTOMERS} defaultOpen>
        <ComboboxInput placeholder="Buscar cliente" />
        <ComboboxContent emptyMessage="Nenhum cliente com esse nome.">
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </RivoProvider>,
  );
}

test("with a full list, the empty notice takes no space in the panel", () => {
  list();
  expect(screen.getByText("Clinica Sao Lucas")).toBeDefined();
  // Empty stays mounted for the screen reader, but its content (and the space
  // it takes) only appears in the empty list.
  expect(screen.queryByText(/Nenhum cliente com esse nome/)).toBeNull();
});

test("with nothing in the list, the notice appears", () => {
  list({ items: [] });
  // Base UI appends a word joiner to the end of the notice, so the screen
  // reader announces it again; that is why the lookup is by substring, and not
  // by exact text.
  expect(screen.getByText(/Nenhum cliente com esse nome/)).toBeDefined();
});

test("multiple selection builds the chips without leaving the library", () => {
  // ComboboxChips and ComboboxChip already existed and could not be assembled:
  // the piece that maps the chosen value to the chips was missing. Without it,
  // the only way was to import straight from Base UI, which is what the skill
  // says never to do.
  render(
    <RivoProvider scope="local">
      <Combobox items={CUSTOMERS} multiple defaultValue={CUSTOMERS}>
        <ComboboxChips>
          <ComboboxValue>
            {(chosen: string[]) =>
              chosen.map((cliente) => (
                <ComboboxChip key={cliente} aria-label={cliente}>
                  {cliente}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxInput placeholder="Buscar cliente" />
        </ComboboxChips>
      </Combobox>
    </RivoProvider>,
  );

  expect(screen.getByText("Clinica Sao Lucas")).toBeDefined();
  expect(screen.getByText("Transportes Cabo Branco")).toBeDefined();
  // Each chip brings its own remove button, ready in the component - and with
  // its name inside, otherwise the row announces itself "Remover, Remover".
  expect(screen.getByRole("button", { name: "Remover Clinica Sao Lucas" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Remover Transportes Cabo Branco" })).toBeDefined();
});
