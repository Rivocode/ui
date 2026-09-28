import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Button } from "../src/components/button";
import { IconButton } from "../src/components/icon-button";

const OUTLINED = ["primary", "secondary", "outline", "danger"] as const;

for (const variant of OUTLINED) {
  test(`disabled ${variant} draws the inactive outline, and does not vanish over the surface`, () => {
    render(
      <Button variant={variant} disabled>
        Travado
      </Button>,
    );
    const classes = screen.getByRole("button").className.split(" ");
    expect(classes).toContain("not-data-loading:disabled:border-border-disabled");
    expect(classes).not.toContain("not-data-loading:disabled:border-transparent");
    expect(classes.some((name) => name === "border" || name === "border-2")).toBe(true);
    expect(classes).toContain("not-data-loading:disabled:text-fg-disabled");
  });
}

test("primary and destructive keep the transparent border alive, and the size does not jump when disabling", () => {
  for (const variant of ["primary", "danger"] as const) {
    const { unmount } = render(<Button variant={variant}>Emitir</Button>);
    const classes = screen.getByRole("button").className.split(" ");
    expect(classes).toContain("border");
    expect(classes).toContain("border-transparent");
    unmount();
  }
});

test("disabled ghost stays without an outline, because enabled it never had one", () => {
  render(
    <Button variant="ghost" disabled>
      Voltar
    </Button>,
  );
  const classes = screen.getByRole("button").className.split(" ");
  expect(classes).not.toContain("border");
  expect(classes).not.toContain("border-2");
});

test("disabled IconButton inherits the inactive outline", () => {
  render(
    <IconButton label="Diminuir o zoom" variant="secondary" disabled>
      <svg />
    </IconButton>,
  );
  const classes = screen.getByRole("button", { name: "Diminuir o zoom" }).className.split(" ");
  expect(classes).toContain("not-data-loading:disabled:border-border-disabled");
  expect(classes).toContain("border");
});

test("while loading, the outline follows the variant, and not the inactive one", () => {
  render(
    <Button variant="secondary" loading>
      Emitindo
    </Button>,
  );
  const classes = screen.getByRole("button").className.split(" ");
  expect(classes).toContain("border-border-strong");
  expect(classes.filter((name) => name.startsWith("disabled:border-"))).toEqual([]);
});
