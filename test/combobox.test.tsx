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

test("com lista cheia, o aviso de vazio nao ocupa lugar no painel", () => {
  list();
  expect(screen.getByText("Clinica Sao Lucas")).toBeDefined();
  // O Empty fica montado para o leitor de tela, mas o recheio (e o espaco
  // que ele ocupa) so aparece na lista vazia.
  expect(screen.queryByText(/Nenhum cliente com esse nome/)).toBeNull();
});

test("sem nada na lista, o aviso aparece", () => {
  list({ items: [] });
  // A Base UI cola um juntador de palavras no fim do aviso, para o leitor de
  // tela reanunciar; por isso a busca e por trecho, e nao por texto exato.
  expect(screen.getByText(/Nenhum cliente com esse nome/)).toBeDefined();
});

test("a escolha multipla monta as fichas sem sair da biblioteca", () => {
  // ComboboxChips e ComboboxChip ja existiam e nao tinham como ser montados:
  // faltava a peca que mapeia o valor escolhido para as fichas. Sem ela, o
  // unico caminho era importar direto da Base UI, que e o que a skill manda
  // nunca fazer.
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
  // Cada ficha traz o proprio botao de remover, ja pronto no componente - e
  // com o nome dela dentro, senao a fila se anuncia "Remover, Remover".
  expect(screen.getByRole("button", { name: "Remover Clinica Sao Lucas" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Remover Transportes Cabo Branco" })).toBeDefined();
});
