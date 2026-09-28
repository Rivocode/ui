import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { PasswordInput } from "../src/components/password-input";
import { SidebarProvider, SidebarInput } from "../src/components/sidebar";
import { RivoProvider } from "../src/provider/rivo-provider";

const preset = await Bun.file("src/preset.css").text();

test("the browser autofill wears the theme, in the base layer", () => {
  const base = preset.slice(preset.indexOf("@layer base {"));

  expect(base).toContain("input:-webkit-autofill");
  expect(base).toContain("-webkit-text-fill-color: var(--rc-fg)");
  expect(base).toContain("box-shadow: 0 0 0 1000px var(--rc-surface) inset");
  expect(preset.slice(0, preset.indexOf("@layer base {"))).not.toContain("autofill");
});

test("the Edge password eye does not show up next to the component's eye", () => {
  render(
    <RivoProvider scope="local">
      <PasswordInput aria-label="Senha" />
    </RivoProvider>,
  );
  const tokens = screen.getByLabelText("Senha").className.split(" ");

  expect(tokens).toContain("[&::-ms-reveal]:hidden");
  expect(tokens).toContain("[&::-ms-clear]:hidden");
});

test("the sidebar search does not draw the browser x", () => {
  render(
    <RivoProvider scope="local">
      <SidebarProvider>
        <SidebarInput label="Buscar" />
      </SidebarProvider>
    </RivoProvider>,
  );
  const tokens = screen.getByLabelText("Buscar").className.split(" ");

  expect(tokens).toContain("[&::-webkit-search-cancel-button]:hidden");
});
