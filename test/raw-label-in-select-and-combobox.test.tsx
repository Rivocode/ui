import { expect, spyOn, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  missingComboboxLabelComplaint,
} from "../src/components/combobox";
import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  missingSelectItemsComplaint,
} from "../src/components/select";

const quiet = () => spyOn(console, "error").mockImplementation(() => {});

const ours = (error: ReturnType<typeof spyOn<Console, "error">>) =>
  error.mock.calls.map((call) => String(call[0])).filter((line) => line.includes("[rivocode/ui]"));

const STATUSES = [
  { label: "Todas as situações", value: "todas" },
  { label: "Em aberto", value: "aberto" },
];

const ACCOUNTS = [
  { value: "freire", name: "Freire Contabilidade" },
  { value: "cabo", name: "Transportes Cabo Branco" },
];

function selectWithoutItems() {
  return (
    <RivoProvider scope="local">
      <Select defaultValue="todas" defaultOpen>
        <SelectTrigger aria-label="Situação">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as situações</SelectItem>
          <SelectItem value="aberto">Em aberto</SelectItem>
        </SelectContent>
      </Select>
    </RivoProvider>
  );
}

function comboboxWithoutMapping(props: {
  itemToStringLabel?: (item: (typeof ACCOUNTS)[number]) => string;
}) {
  return (
    <RivoProvider scope="local">
      <Combobox
        items={ACCOUNTS}
        defaultValue={ACCOUNTS[0]}
        itemToStringLabel={props.itemToStringLabel}
        defaultOpen
      >
        <ComboboxInput placeholder="Buscar cliente" />
        <ComboboxContent>
          <ComboboxList>
            {(item: (typeof ACCOUNTS)[number]) => (
              <ComboboxItem key={item.value} value={item}>
                {item.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </RivoProvider>
  );
}

test("a Select without items writes the key in the trigger, and now it complains about it", () => {
  const error = quiet();

  render(selectWithoutItems());

  expect(screen.getByLabelText("Situação").textContent).toContain("todas");
  expect(screen.getByLabelText("Situação").textContent).not.toContain("Todas as situações");

  const complaints = ours(error);
  expect(complaints).toHaveLength(1);
  expect(complaints[0]).toContain('"todas"');
  expect(complaints[0]).toContain('"Todas as situações"');
  expect(complaints[0]).toContain("items");

  error.mockRestore();
});

test("with items the trigger shows the label, and the warning does not appear", () => {
  const error = quiet();

  render(
    <RivoProvider scope="local">
      <Select items={STATUSES} defaultValue="todas" defaultOpen>
        <SelectTrigger aria-label="Situação">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as situações</SelectItem>
          <SelectItem value="aberto">Em aberto</SelectItem>
        </SelectContent>
      </Select>
    </RivoProvider>,
  );

  expect(screen.getByLabelText("Situação").textContent).toContain("Todas as situações");
  expect(ours(error)).toHaveLength(0);

  error.mockRestore();
});

test("when SelectValue resolves the label on its own, warning would be shouting at correct usage", () => {
  const error = quiet();

  render(
    <RivoProvider scope="local">
      <Select defaultValue="todas" defaultOpen>
        <SelectTrigger aria-label="Situação">
          <SelectValue>
            {(chosen: string) => STATUSES.find((one) => one.value === chosen)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as situações</SelectItem>
        </SelectContent>
      </Select>
    </RivoProvider>,
  );

  expect(screen.getByLabelText("Situação").textContent).toContain("Todas as situações");
  expect(ours(error)).toHaveLength(0);

  error.mockRestore();
});

test("a value that already is its own label does not become a warning, because nothing went wrong on screen", () => {
  const error = quiet();

  render(
    <RivoProvider scope="local">
      <Select defaultValue="Pix" defaultOpen>
        <SelectTrigger aria-label="Forma">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Pix">Pix</SelectItem>
          <SelectItem value="Boleto">Boleto</SelectItem>
        </SelectContent>
      </Select>
    </RivoProvider>,
  );

  expect(screen.getByLabelText("Forma").textContent).toContain("Pix");
  expect(ours(error)).toHaveLength(0);

  error.mockRestore();
});

test("a Combobox with object items and no mapping writes the key in the field, and complains", () => {
  const error = quiet();

  render(comboboxWithoutMapping({}));

  expect(screen.getByPlaceholderText<HTMLInputElement>("Buscar cliente").value).toBe("freire");

  const complaints = ours(error);
  expect(complaints).toHaveLength(1);
  expect(complaints[0]).toContain('"freire"');
  expect(complaints[0]).toContain('"Freire Contabilidade"');
  expect(complaints[0]).toContain("itemToStringLabel");

  error.mockRestore();
});

test("with itemToStringLabel the field shows the label, and the warning does not appear", () => {
  const error = quiet();

  render(comboboxWithoutMapping({ itemToStringLabel: (item) => item.name }));

  expect(screen.getByPlaceholderText<HTMLInputElement>("Buscar cliente").value).toBe(
    "Freire Contabilidade",
  );
  expect(ours(error)).toHaveLength(0);

  error.mockRestore();
});

test("an item shaped as value and label already has a label, so the Combobox stays quiet", () => {
  const error = quiet();
  const pairs = [
    { label: "Freire Contabilidade", value: "freire" },
    { label: "Transportes Cabo Branco", value: "cabo" },
  ];

  render(
    <RivoProvider scope="local">
      <Combobox items={pairs} defaultValue={pairs[0]} defaultOpen>
        <ComboboxInput placeholder="Buscar cliente" />
        <ComboboxContent>
          <ComboboxList>
            {(item: (typeof pairs)[number]) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </RivoProvider>,
  );

  expect(screen.getByPlaceholderText<HTMLInputElement>("Buscar cliente").value).toBe(
    "Freire Contabilidade",
  );
  expect(ours(error)).toHaveLength(0);

  error.mockRestore();
});

test("a text item has no key to leak, and the Combobox stays quiet", () => {
  const error = quiet();
  const names = ["Clinica Sao Lucas", "Transportes Cabo Branco"];

  render(
    <RivoProvider scope="local">
      <Combobox items={names} defaultValue={names[0]} defaultOpen>
        <ComboboxInput placeholder="Buscar cliente" />
        <ComboboxContent>
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

  expect(screen.getByPlaceholderText<HTMLInputElement>("Buscar cliente").value).toBe(
    "Clinica Sao Lucas",
  );
  expect(ours(error)).toHaveLength(0);

  error.mockRestore();
});

test("an object item whose label repeats the key is legitimate usage, and yields no warning", () => {
  const error = quiet();
  const methods = [{ value: "Pix" }, { value: "Boleto" }];

  render(
    <RivoProvider scope="local">
      <Combobox items={methods} defaultValue={methods[0]} defaultOpen>
        <ComboboxInput placeholder="Buscar forma" />
        <ComboboxContent>
          <ComboboxList>
            {(item: (typeof methods)[number]) => (
              <ComboboxItem key={item.value} value={item}>
                {item.value}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </RivoProvider>,
  );

  expect(screen.getByPlaceholderText<HTMLInputElement>("Buscar forma").value).toBe("Pix");
  expect(ours(error)).toHaveLength(0);

  error.mockRestore();
});

test("both complaints name the component, what showed up, the fix, and are written in English", () => {
  const fromSelect = missingSelectItemsComplaint("todas", "Todas as situações");
  expect(fromSelect).toContain("<Select>");
  expect(fromSelect).toContain('"todas"');
  expect(fromSelect).toContain('"Todas as situações"');
  expect(fromSelect).toContain("items");
  expect(fromSelect).toContain("the label");
  expect(fromSelect).toContain("raw key");
  expect(fromSelect).not.toMatch(/rótulo|não/);

  const fromCombobox = missingComboboxLabelComplaint("freire", "Freire Contabilidade");
  expect(fromCombobox).toContain("<Combobox>");
  expect(fromCombobox).toContain('"freire"');
  expect(fromCombobox).toContain('"Freire Contabilidade"');
  expect(fromCombobox).toContain("itemToStringLabel");
  expect(fromCombobox).toContain("is showing");
  expect(fromCombobox).toContain("raw key");
  expect(fromCombobox).not.toMatch(/está|não/);
});
