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

test("o Select sem items escreve a chave no gatilho, e agora ele reclama disso", () => {
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

test("com items o gatilho mostra o rotulo, e o aviso nao aparece", () => {
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

test("quando o SelectValue resolve o rotulo sozinho, avisar seria gritar em uso correto", () => {
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

test("valor que ja e o proprio rotulo nao virou aviso, porque nada saiu errado na tela", () => {
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

test("o Combobox com item objeto e sem mapeamento escreve a chave no campo, e reclama", () => {
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

test("com itemToStringLabel o campo mostra o rotulo, e o aviso nao aparece", () => {
  const error = quiet();

  render(comboboxWithoutMapping({ itemToStringLabel: (item) => item.name }));

  expect(screen.getByPlaceholderText<HTMLInputElement>("Buscar cliente").value).toBe(
    "Freire Contabilidade",
  );
  expect(ours(error)).toHaveLength(0);

  error.mockRestore();
});

test("item na forma value e label ja tem rotulo, entao o Combobox fica calado", () => {
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

test("item em texto nao tem chave para vazar, e o Combobox fica calado", () => {
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

test("item objeto cujo rotulo repete a chave e uso legitimo, e nao rende aviso", () => {
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

test("as duas reclamacoes dizem a peca, o que apareceu, o conserto, e saem acentuadas", () => {
  const fromSelect = missingSelectItemsComplaint("todas", "Todas as situações");
  expect(fromSelect).toContain("<Select>");
  expect(fromSelect).toContain('"todas"');
  expect(fromSelect).toContain('"Todas as situações"');
  expect(fromSelect).toContain("items");
  expect(fromSelect).toContain("rótulo");
  expect(fromSelect).toContain("não");
  expect(fromSelect.split(" ")).not.toContain("rotulo");

  const fromCombobox = missingComboboxLabelComplaint("freire", "Freire Contabilidade");
  expect(fromCombobox).toContain("<Combobox>");
  expect(fromCombobox).toContain('"freire"');
  expect(fromCombobox).toContain('"Freire Contabilidade"');
  expect(fromCombobox).toContain("itemToStringLabel");
  expect(fromCombobox).toContain("está");
  expect(fromCombobox).toContain("não");
  expect(fromCombobox.split(" ")).not.toContain("esta");
});
