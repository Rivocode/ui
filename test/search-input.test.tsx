import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { SearchInput } from "../src/components/search-input";
import { RivoProvider } from "../src/provider/rivo-provider";

function query(props: Partial<React.ComponentProps<typeof SearchInput>> = {}) {
  return render(
    <RivoProvider scope="local">
      <SearchInput aria-label="Buscar nota" {...props} />
    </RivoProvider>,
  );
}

test("é um campo de busca com nome acessível", () => {
  query();
  expect(screen.getByRole("searchbox", { name: "Buscar nota" })).toBeDefined();
});

test("avisa quem digitou", () => {
  let text = "";
  query({ onChange: (event) => (text = event.target.value) });
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clinica" } });
  expect(text).toBe("clinica");
});

test("o atalho aparece quando pedido, e escondido do leitor de tela", () => {
  const { container } = query({ shortcut: "mod+k" });
  const kbd = container.querySelector("kbd");
  expect(kbd).not.toBeNull();
  expect(kbd?.closest("[aria-hidden='true']")).not.toBeNull();
});

test("sem shortcut nao ha kbd", () => {
  const { container } = query();
  expect(container.querySelector("kbd")).toBeNull();
});

test("esc limpa o campo quando controlado de fora", () => {
  let text = "algo";
  query({
    value: text,
    onChange: (event) => (text = event.target.value),
    onClear: () => (text = ""),
  });
  fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
  expect(text).toBe("");
});

test("acompanha os tres tamanhos, para alinhar com as irmas da barra de filtro", () => {
  // Ele cravava a altura media e nao tinha `size`. Ao lado de um Select
  // pequeno numa barra de filtro, a busca saia mais alta e a barra torta.
  query({ size: "sm" });
  expect(screen.getByRole("searchbox").className).toContain("--rc-control-sm");
});

test("o respiro do atalho vence o do tamanho", () => {
  // O Kbd fica dentro do campo, entao o pr do atalho precisa vir depois do pr
  // do tamanho no cn - senao o texto digitado passa por baixo dele.
  query({ size: "sm", shortcut: "mod+k" });
  expect(screen.getByRole("searchbox").className).toContain("pr-16");
});
