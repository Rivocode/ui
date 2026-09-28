import { expect, mock, test } from "bun:test";
import { act, fireEvent, render } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { createElement, type ComponentType } from "react";

import { agentFiles } from "../apps/docs/src/agent-docs";
import { BLOCK_IMPORTS, BLOCK_LIST, importsOf } from "../apps/docs/src/block-list";
import * as chart from "../src/chart/index";
import * as form from "../src/form/index";
import * as pkg from "../src/index";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * The blocks at `/blocos` are meant to be copied. The page's promise is that
 * the file pasted into a project that only has @rivocode/ui, zod and lucide
 * compiles and mounts - and the promise breaks silently the day someone writes
 * `import { ... } from '@/demo/data'` to save a constant: the site keeps
 * working, because the alias exists there, and whoever copies takes an import
 * that does not resolve.
 *
 * Three questions, one per test: where each block imports from, whether each
 * one really mounts with the library from source, and whether the list, the
 * folder and the markdown for agents talk about the same files.
 */

const DIR = "apps/docs/src/blocks";

mock.module("@rivocode/ui", () => pkg);
mock.module("@rivocode/ui/form", () => form);
mock.module("@rivocode/ui/chart", () => chart);

test("every block imports only from the library, zod, lucide and react", () => {
  const files = readdirSync(DIR).filter((file) => file.endsWith(".tsx"));
  expect(files.length).toBeGreaterThanOrEqual(5);

  for (const file of files) {
    const source = readFileSync(`${DIR}/${file}`, "utf8");
    const imports = importsOf(source);
    expect(imports.length, file).toBeGreaterThan(1);
    expect(imports, file).toContain("@rivocode/ui");
    for (const origin of imports) {
      expect(`${file}: ${origin}`).toBe(
        `${file}: ${BLOCK_IMPORTS.includes(origin) ? origin : "origin not in the list"}`,
      );
    }
    expect(source, file).toMatch(/^export default function [A-Z]\w+\(/m);
  }
});

test("the block list, the folder and the markdown for agents talk about the same files", () => {
  const files = readdirSync(DIR)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.replace(/\.tsx$/, ""));
  expect(files.length).toBeGreaterThanOrEqual(5);

  expect(BLOCK_LIST.map((block) => block.file).sort()).toEqual(files.sort());

  const served = agentFiles();
  const index = served.get("llms.txt") ?? "";
  for (const block of BLOCK_LIST) {
    const markdown = served.get(`blocos/${block.slug}.md`);
    expect(markdown, block.slug).toBeDefined();
    expect(markdown!).toContain(readFileSync(`${DIR}/${block.file}.tsx`, "utf8").trimEnd());
    expect(index).toContain(`(/blocos/${block.slug}.md)`);
    for (const piece of block.pieces) {
      expect(served.has(`componentes/${piece.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}.md`), piece).toBe(true);
    }
  }
});

test("every block mounts with the library from source and writes its own title", async () => {
  expect(BLOCK_LIST.length).toBeGreaterThanOrEqual(5);

  let mounted = 0;
  for (const block of BLOCK_LIST) {
    const path = ["..", DIR, `${block.file}.tsx`].join("/");
    const Block = (await import(path)).default as ComponentType;
    const { container, unmount } = render(
      createElement(RivoProvider, { theme: "rivocode-dark", children: createElement(Block) }),
    );
    expect(container.querySelector("h1"), block.file).not.toBeNull();
    expect(container.textContent?.length ?? 0, block.file).toBeGreaterThan(40);
    unmount();
    mounted++;
  }

  expect(mounted).toBe(BLOCK_LIST.length);
});

const ERROR_PAGES: Array<{ file: string; heading: RegExp; must: RegExp[] }> = [
  {
    file: "not-found",
    heading: /Não achamos esta página/,
    must: [/404/, /Ir para o início/, /Voltar à página anterior/],
  },
  {
    file: "server-error",
    heading: /Não conseguimos abrir esta página/,
    must: [/500/, /Tentar de novo/, /RC-7F3A-91C2/],
  },
  {
    file: "maintenance",
    heading: /Estamos atualizando o sistema/,
    must: [/Manutenção programada/, /02:00 às 06:00/, /horário de Brasília/, /página de status/],
  },
  {
    file: "forbidden",
    heading: /Você não tem acesso ao Faturamento/,
    must: [/403/, /Pedir acesso/, /Entrar com outra conta/],
  },
];

async function mountBlock(file: string, theme: "rivocode-dark" | "rivocode-light" = "rivocode-dark") {
  const Block = (await import(["..", DIR, `${file}.tsx`].join("/"))).default as ComponentType;
  return render(createElement(RivoProvider, { theme, children: createElement(Block) }));
}

test("the four error pages are in the list, marked as errors, and each one says what to do", async () => {
  const listed = BLOCK_LIST.filter((block) => block.errorPage).map((block) => block.file);
  expect(listed.sort()).toEqual(ERROR_PAGES.map((page) => page.file).sort());

  let mounted = 0;
  for (const page of ERROR_PAGES) {
    const { container, unmount } = await mountBlock(page.file, "rivocode-light");
    const headings = container.querySelectorAll("h1");
    expect(headings.length, page.file).toBe(1);
    expect(headings[0]!.textContent ?? "", page.file).toMatch(page.heading);
    for (const text of page.must) expect(container.textContent ?? "", page.file).toMatch(text);

    const actions = [...container.querySelectorAll("button, a")];
    expect(actions.length, page.file).toBeGreaterThan(1);
    for (const action of actions) {
      const name = (action.getAttribute("aria-label") ?? action.textContent ?? "").trim();
      expect(`${page.file} ${action.tagName}: ${name}`).not.toBe(`${page.file} ${action.tagName}: `);
    }
    unmount();
    mounted++;
  }
  expect(mounted).toBe(ERROR_PAGES.length);
});

test("the error page markdown does not require the four listing endings", () => {
  const served = agentFiles();
  let checked = 0;
  for (const block of BLOCK_LIST) {
    const markdown = served.get(`blocos/${block.slug}.md`) ?? "";
    expect(markdown.includes("keep the four end states"), block.slug).toBe(!block.errorPage);
    checked++;
  }
  expect(checked).toBe(BLOCK_LIST.length);
});

test("the 404 search is a named search form, and the 500 code has a copy button", async () => {
  const first = await mountBlock("not-found");
  const search = first.container.querySelector('form[role="search"]');
  expect(search).not.toBeNull();
  expect(search!.querySelector('input[type="search"]')?.getAttribute("aria-label")).toBe(
    "Buscar em todo o sistema",
  );
  expect(search!.querySelector('button[type="submit"]')?.textContent).toBe("Buscar");
  first.unmount();

  const second = await mountBlock("server-error");
  expect(second.getByRole("button", { name: "Copiar o código" })).toBeDefined();
  second.unmount();
});

test("requesting access on the 403 confirms on screen and moves focus to the confirmation", async () => {
  const screen = await mountBlock("forbidden");

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Pedir acesso" }));
  });

  const status = screen
    .getAllByRole("status")
    .find((node) => node.textContent?.includes("Pedido enviado para Marina Costa"));
  expect(status).toBeDefined();
  expect(status!.parentElement).toBe(document.activeElement as HTMLElement);
  expect(screen.getByRole("button", { name: "Acesso pedido" }).hasAttribute("disabled")).toBe(true);
  screen.unmount();
});
