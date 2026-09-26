import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { PasswordInput } from "../src/components/password-input";
import { SidebarProvider, SidebarInput } from "../src/components/sidebar";
import { RivoProvider } from "../src/provider/rivo-provider";

const preset = await Bun.file("src/preset.css").text();

test("o preenchimento automatico do navegador veste o tema, na camada base", () => {
  const base = preset.slice(preset.indexOf("@layer base {"));

  expect(base).toContain("input:-webkit-autofill");
  expect(base).toContain("-webkit-text-fill-color: var(--rc-fg)");
  expect(base).toContain("box-shadow: 0 0 0 1000px var(--rc-surface) inset");
  expect(preset.slice(0, preset.indexOf("@layer base {"))).not.toContain("autofill");
});

test("o olho de senha do Edge nao aparece ao lado do olho da peca", () => {
  render(
    <RivoProvider scope="local">
      <PasswordInput aria-label="Senha" />
    </RivoProvider>,
  );
  const tokens = screen.getByLabelText("Senha").className.split(" ");

  expect(tokens).toContain("[&::-ms-reveal]:hidden");
  expect(tokens).toContain("[&::-ms-clear]:hidden");
});

test("a busca da barra lateral nao desenha o xis do navegador", () => {
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
