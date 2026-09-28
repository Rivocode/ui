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
 * A lista longa que tem familias de verdade: natureza de operacao por tipo, UF
 * por regiao, plano de contas.
 *
 * O `Combobox` agrupava desde cedo e o `Select` nao, e as duas aparecem na
 * mesma tela de filtro - a mesma lista saia agrupada de um lado e plana do
 * outro. O cabecalho tambem tinha que se ler como cabecalho: o do Combobox era
 * a peca crua da Base UI, sem estilo, e tinha o tamanho e a cor de mais uma
 * opcao.
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

test("o grupo do Select carrega o nome dele por dentro, e nao ao lado", () => {
  withTheme(<GroupedSelect />);

  const [outgoing] = screen.getAllByRole("group");
  const title = screen.getByText("Saída");

  expect(outgoing!.getAttribute("aria-labelledby")).toBe(title.id);
  expect(outgoing!.contains(title)).toBe(true);
});

test("agrupar nao esconde opcao nenhuma, nem troca o que o gatilho mostra", () => {
  withTheme(<GroupedSelect />);

  expect(screen.getAllByRole("option")).toHaveLength(3);
  expect(screen.getByLabelText("Natureza da operação").textContent).toContain(
    "Venda de mercadoria",
  );
});

test("o cabecalho do grupo nao se le como opcao, nas tres listas", () => {
  // Ele e menor, mais claro e em caixa alta - o mesmo titulo do `MenuGroup`.
  // Sem isso "Saída" tinha o tamanho e a cor de "Venda de mercadoria", e a
  // lista parecia ter uma opcao a mais que nao clicava.
  withTheme(<GroupedSelect />);

  const title = screen.getByText("Saída");
  expect(title.className).toContain("text-xs");
  expect(title.className).toContain("text-fg-subtle");
  expect(title.getAttribute("role")).not.toBe("option");
});

test("a linha entre grupos nao entra na contagem que o leitor de tela anuncia", () => {
  // `role="presentation"`, e nao o `role="separator"` do MenuSeparator: um no
  // com papel proprio no meio de uma lista de opcoes quebra o "opcao 3 de 12".
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

test("o cabecalho do Combobox veste o mesmo titulo do Select", () => {
  withTheme(<GroupedCombobox />);

  const first = screen.getByText("Paraíba");
  const second = screen.getByText("Pernambuco");

  expect(first.className).toContain("text-xs");
  expect(first.className).toBe(second.className);
});

test("a linha do Combobox e a mesma linha do Select", () => {
  const { container } = withTheme(<GroupedCombobox />);

  const line = container.ownerDocument.querySelector('[role="listbox"] [role="presentation"]')!;
  expect(line.className.split(" ")).toContain("h-px");
  expect(line.className.split(" ")).toContain("bg-border");
});

test("a classe de quem usa vence a do cabecalho e a da linha", () => {
  const { container } = withTheme(
    <Select items={NATURES} defaultOpen>
      <SelectTrigger aria-label="Natureza">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup className="grupo-x">
          <SelectGroupLabel className="text-fg">Saída</SelectGroupLabel>
          <SelectItem value="5102">Venda de mercadoria</SelectItem>
        </SelectGroup>
        <SelectSeparator className="linha-x" />
      </SelectContent>
    </Select>,
  );

  expect(container.ownerDocument.querySelector(".grupo-x")!.getAttribute("role")).toBe("group");
  expect(container.ownerDocument.querySelector(".linha-x")).not.toBeNull();
  // `tailwind-merge` desfaz o conflito: sobra a cor de quem chama, e nao as duas.
  const title = screen.getByText("Saída");
  expect(title.className).toContain("text-fg");
  expect(title.className).not.toContain("text-fg-subtle");
});
