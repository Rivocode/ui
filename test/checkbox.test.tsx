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
  const classes = screen.getByRole("checkbox").className;
  expect(classes).toContain("data-[checked]:bg-accent");
  expect(classes).not.toMatch(/#[0-9a-f]{3,6}/i);
});
