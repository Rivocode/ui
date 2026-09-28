import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Checkbox } from "../src/components/checkbox";

test("renders with the checkbox role", () => {
  render(<Checkbox aria-label="Selecionar linha" />);
  expect(screen.getByRole("checkbox", { name: "Selecionar linha" })).toBeDefined();
});

test("when checked it announces it is checked", () => {
  render(<Checkbox aria-label="x" checked />);
  expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe("true");
});

test('the mixed state exists, which is the "some selected" of select all', () => {
  render(<Checkbox aria-label="x" indeterminate />);
  expect(screen.getByRole("checkbox").getAttribute("aria-checked")).toBe("mixed");
});

test("the inner drawing changes between checked and mixed", () => {
  const { unmount } = render(<Checkbox aria-label="x" checked />);
  expect(document.querySelector("[data-rc-check]")?.getAttribute("data-rc-check")).toBe("checked");
  unmount();

  render(<Checkbox aria-label="x" indeterminate />);
  expect(document.querySelector("[data-rc-check]")?.getAttribute("data-rc-check")).toBe(
    "indeterminate",
  );
});

test("uses the theme accent when checked, without a literal color", () => {
  render(<Checkbox aria-label="x" checked />);
  const box = screen.getByRole("checkbox");
  const classes = box.className.split(" ");
  // `not-data-disabled` goes into the selector on purpose: without it
  // `data-[indeterminate]` beat the disabled state, by alphabetical order.
  expect(classes).toContain("data-[checked]:not-data-disabled:bg-accent-text");
  expect(classes).toContain("data-[checked]:not-data-disabled:border-accent-text");
  // The solid lime measured 1.21:1 over the page in the light theme, and the
  // checked box boundary vanished: the tick was left floating, with no box around.
  expect(classes).not.toContain("data-[checked]:not-data-disabled:bg-accent");
  expect(classes).not.toContain("data-[checked]:not-data-disabled:border-accent");
  // The tick follows: inside the dark fill it reads in `surface-raised`, and
  // the graphite of `accent-fg` would no longer be readable.
  expect(classes).toContain("data-[checked]:not-data-disabled:text-surface-raised");
  expect(classes).not.toContain("data-[checked]:not-data-disabled:text-accent-fg");
  expect(box.className).not.toMatch(/#[0-9a-f]{3,6}/i);
});
