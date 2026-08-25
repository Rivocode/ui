import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { SearchInput } from "../src/components/search-input";
import { RivoProvider } from "../src/provider/rivo-provider";

function busca(props: Partial<React.ComponentProps<typeof SearchInput>> = {}) {
  return render(
    <RivoProvider scope="local">
      <SearchInput aria-label="Buscar nota" {...props} />
    </RivoProvider>,
  );
}

test("é um campo de busca com nome acessível", () => {
  busca();
  expect(screen.getByRole("searchbox", { name: "Buscar nota" })).toBeDefined();
});

test("avisa quem digitou", () => {
  let texto = "";
  busca({ onChange: (event) => (texto = event.target.value) });
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clinica" } });
  expect(texto).toBe("clinica");
});

test("o atalho aparece quando pedido, e escondido do leitor de tela", () => {
  const { container } = busca({ shortcut: "mod+k" });
  const kbd = container.querySelector("kbd");
  expect(kbd).not.toBeNull();
  expect(kbd?.closest("[aria-hidden='true']")).not.toBeNull();
});

test("sem shortcut nao ha kbd", () => {
  const { container } = busca();
  expect(container.querySelector("kbd")).toBeNull();
});

test("esc limpa o campo quando controlado de fora", () => {
  let texto = "algo";
  busca({
    value: texto,
    onChange: (event) => (texto = event.target.value),
    onClear: () => (texto = ""),
  });
  fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
  expect(texto).toBe("");
});
