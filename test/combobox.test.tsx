import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../src/components/combobox";

const CLIENTES = ["Clinica Sao Lucas", "Transportes Cabo Branco"];

function lista(props: { items?: string[] } = {}) {
  return render(
    <RivoProvider scope="local">
      <Combobox items={props.items ?? CLIENTES} defaultOpen>
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
  lista();
  expect(screen.getByText("Clinica Sao Lucas")).toBeDefined();
  // O Empty fica montado para o leitor de tela, mas o recheio — e o espaco
  // que ele ocupa — so aparece na lista vazia.
  expect(screen.queryByText(/Nenhum cliente com esse nome/)).toBeNull();
});

test("sem nada na lista, o aviso aparece", () => {
  lista({ items: [] });
  // A Base UI cola um juntador de palavras no fim do aviso, para o leitor de
  // tela reanunciar; por isso a busca e por trecho, e nao por texto exato.
  expect(screen.getByText(/Nenhum cliente com esse nome/)).toBeDefined();
});
