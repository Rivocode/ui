import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Checkbox } from "../src/components/checkbox";

test("sai com papel de caixa de marcar", () => {
  render(<Checkbox aria-label="Selecionar linha" />);
  expect(screen.getByRole("checkbox", { name: "Selecionar linha" })).toBeDefined();
});

test("marcada anuncia que esta marcada", () => {
  render(<Checkbox aria-label="x" checked />);
  expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe("true");
});

test('o estado misto existe, que e o "alguns selecionados" do selecionar todos', () => {
  render(<Checkbox aria-label="x" indeterminate />);
  expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe("mixed");
});

test("o desenho de dentro muda entre marcada e mista", () => {
  const { unmount } = render(<Checkbox aria-label="x" checked />);
  expect(document.querySelector("[data-rc-check]")?.getAttribute("data-rc-check")).toBe("checked");
  unmount();

  render(<Checkbox aria-label="x" indeterminate />);
  expect(document.querySelector("[data-rc-check]")?.getAttribute("data-rc-check")).toBe(
    "indeterminate",
  );
});

test("usa o acento do tema quando marcada, sem cor literal", () => {
  render(<Checkbox aria-label="x" checked />);
  const box = screen.getByRole("checkbox");
  const classes = box.className.split(" ");
  // O `not-data-disabled` entra no seletor de proposito: sem ele o
  // `data-[indeterminate]` vencia o desabilitado, por ordem alfabetica.
  expect(classes).toContain("data-[checked]:not-data-disabled:bg-accent-text");
  expect(classes).toContain("data-[checked]:not-data-disabled:border-accent-text");
  // A lima cheia media 1,21:1 sobre a pagina no tema claro, e a fronteira da
  // caixa marcada sumia: sobrava o tique flutuando, sem caixa em volta.
  expect(classes).not.toContain("data-[checked]:not-data-disabled:bg-accent");
  expect(classes).not.toContain("data-[checked]:not-data-disabled:border-accent");
  // O tique acompanha: dentro do preenchimento escuro ele se le em
  // `surface-raised`, e o grafite de `accent-fg` nao se leria mais.
  expect(classes).toContain("data-[checked]:not-data-disabled:text-surface-raised");
  expect(classes).not.toContain("data-[checked]:not-data-disabled:text-accent-fg");
  expect(box.className).not.toMatch(/#[0-9a-f]{3,6}/i);
});
