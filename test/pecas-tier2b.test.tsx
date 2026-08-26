import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Splitter } from "../src/components/splitter";
import { Editable } from "../src/components/editable";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/* --- Splitter ----------------------------------------------------------- */

test("a divisoria e um separator que o teclado move", () => {
  // Arrastar com o mouse e metade da peca: sem teclado, quem nao usa ponteiro
  // fica preso na proporcao que o desenvolvedor escolheu.
  let size = 40;
  withTheme(
    <Splitter
      defaultSize={40}
      onSizeChange={(next) => {
        size = next;
      }}
      start={<p>Lista</p>}
      end={<p>Detalhe</p>}
      label="Lista e detalhe"
    />,
  );

  const handle = screen.getByRole("separator", { name: "Lista e detalhe" });
  expect(handle.getAttribute("aria-valuenow")).toBe("40");

  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(size).toBeGreaterThan(40);
});

test("a divisoria respeita o minimo dos dois lados", () => {
  let size = 20;
  withTheme(
    <Splitter
      defaultSize={20}
      min={20}
      onSizeChange={(next) => {
        size = next;
      }}
      start={<p>Lista</p>}
      end={<p>Detalhe</p>}
      label="Lista e detalhe"
    />,
  );

  fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowLeft" });
  expect(size).toBe(20);
});

test("no celular os dois lados empilham, em vez de espremer", () => {
  // Duas colunas de 190px nao sao duas colunas: sao duas listas ilegiveis.
  withTheme(<Splitter start={<p>Lista</p>} end={<p>Detalhe</p>} label="Lista e detalhe" />);

  // O primeiro filho e o container do provider; a peca e o proximo.
  const splitter = screen.getByRole("separator").parentElement!;
  expect(splitter.className).toContain("max-md:flex-col");
  expect(screen.getByRole("separator").className).toContain("max-md:hidden");
});

/* --- Editable ----------------------------------------------------------- */

test("o texto vira campo no clique e volta no Enter", () => {
  let saved = "";
  withTheme(
    <Editable
      value="Clínica São Lucas"
      label="Cliente"
      onValueChange={(next) => {
        saved = next;
      }}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente") as HTMLInputElement;

  fireEvent.change(field, { target: { value: "Clínica Aurora" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(saved).toBe("Clínica Aurora");
});

test("o Escape desfaz, e nao salva pela metade", () => {
  // Sair pela lateral e o gesto de quem se arrependeu: salvar ali transforma
  // um clique errado numa edicao que ninguem pediu.
  let saved = "sem mudanca";
  withTheme(
    <Editable
      value="Clínica São Lucas"
      label="Cliente"
      onValueChange={(next) => {
        saved = next;
      }}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente");

  fireEvent.change(field, { target: { value: "outra coisa" } });
  fireEvent.keyDown(field, { key: "Escape" });

  expect(saved).toBe("sem mudanca");
  expect(screen.getByRole("button", { name: /Clínica São Lucas/ })).toBeDefined();
});
