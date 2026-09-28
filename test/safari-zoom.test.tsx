import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Combobox, ComboboxInput } from "../src/components/combobox";
import { Input, Textarea } from "../src/components/field";
import { MaskedInput } from "../src/components/masked-input";
import { SearchInput } from "../src/components/search-input";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * O zoom automatico do Safari do iPhone.
 *
 * O Safari amplia a pagina inteira ao focar um campo cuja fonte esta abaixo
 * de 16px, e depois nao volta sozinho: quem digitou fica com a tela ampliada
 * ate fechar o teclado e pincar de volta. A escala da casa e densa de
 * proposito - o --rc-text-base e 14px - e o campo medio, que e o padrao, usava
 * exatamente ela. Uma bancada externa mediu 32 campos abaixo de 16px em 12
 * telas a 390px, e todos eram este mesmo defeito.
 *
 * O conserto sobe a fonte so do controle, so abaixo de 640px: a escala do
 * resto da interface nao muda, e o desktop nao muda nada. Quatro dos cinco
 * campos herdam isso do inputVariants; o SearchInput desenha o proprio campo
 * e precisa da mesma linha.
 *
 * O teste roda no happy-dom, que nao tem folha de estilo nem media query: nao
 * ha como medir 16px aqui. Entao ele asserta a classe que produz a regra, do
 * mesmo jeito que test/classnames.test.tsx asserta a classe que veste a
 * parte. O que ele protege e a decisao, e nao o pixel.
 */

/** A classe que tira o campo do gatilho de zoom do Safari. */
const NO_ZOOM = "max-sm:text-[16px]";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("o campo de texto nao dispara o zoom do Safari, em nenhum tamanho", () => {
  for (const size of ["sm", "md", "lg"] as const) {
    const { unmount } = withTheme(<Input size={size} aria-label="Número da nota" />);
    expect(screen.getByRole("textbox").className).toContain(NO_ZOOM);
    unmount();
  }
});

test("o campo de varias linhas tambem nao dispara", () => {
  const { container } = withTheme(<Textarea aria-label="Observação" />);
  expect(container.querySelector("textarea")!.className).toContain(NO_ZOOM);
});

test("o campo de busca tambem nao dispara, e ele nao passa pelo inputVariants", () => {
  withTheme(<SearchInput aria-label="Buscar nota" />);
  expect(screen.getByRole("searchbox").className).toContain(NO_ZOOM);
});

test("o campo com mascara tambem nao dispara", () => {
  withTheme(<MaskedInput mask="cpf" aria-label="CPF" />);
  expect(screen.getByRole("textbox").className).toContain(NO_ZOOM);
});

test("o campo do combobox tambem nao dispara", () => {
  withTheme(
    <Combobox items={["Clinica Sao Lucas"]}>
      <ComboboxInput aria-label="Cliente" />
    </Combobox>,
  );
  expect(screen.getByRole("combobox").className).toContain(NO_ZOOM);
});

test("no desktop a escala densa continua de pe", () => {
  // A metade que o conserto nao pode quebrar: subir a fonte abaixo de 640px
  // nao vale subir a escala inteira. O medio segue no text-base, que e o
  // --rc-text-base de 14px, e o pequeno segue menor que ele.
  const { unmount } = withTheme(<Input aria-label="Número da nota" />);
  expect(screen.getByRole("textbox").className).toContain("text-base");
  unmount();

  withTheme(<Input size="sm" aria-label="Número da nota" />);
  expect(screen.getByRole("textbox").className).toContain("text-sm");
});
