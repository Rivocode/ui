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
 * Os blocos de `/blocos` sao para copiar. A promessa da pagina e que o arquivo
 * colado num projeto que so tem o @rivocode/ui, o zod e o lucide compila e
 * monta - e a promessa quebra sem barulho no dia em que alguem escreve
 * `import { ... } from '@/demo/data'` para economizar uma constante: o site
 * continua funcionando, porque o alias existe la, e quem copia leva um import
 * que nao resolve.
 *
 * Tres perguntas, uma por teste: de onde cada bloco importa, se cada um monta
 * de verdade com a biblioteca da fonte, e se a lista, a pasta e o markdown
 * para agents falam dos mesmos arquivos.
 */

const DIR = "apps/docs/src/blocks";

mock.module("@rivocode/ui", () => pkg);
mock.module("@rivocode/ui/form", () => form);
mock.module("@rivocode/ui/chart", () => chart);

test("todo bloco importa so da biblioteca, do zod, do lucide e do react", () => {
  const files = readdirSync(DIR).filter((file) => file.endsWith(".tsx"));
  expect(files.length).toBeGreaterThanOrEqual(5);

  for (const file of files) {
    const source = readFileSync(`${DIR}/${file}`, "utf8");
    const imports = importsOf(source);
    expect(imports.length, file).toBeGreaterThan(1);
    expect(imports, file).toContain("@rivocode/ui");
    for (const origin of imports) {
      expect(`${file}: ${origin}`).toBe(
        `${file}: ${BLOCK_IMPORTS.includes(origin) ? origin : "origem fora da lista"}`,
      );
    }
    expect(source, file).toMatch(/^export default function [A-Z]\w+\(/m);
  }
});

test("a lista de blocos, a pasta e o markdown para agents falam dos mesmos arquivos", () => {
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

test("todo bloco monta com a biblioteca da fonte e escreve o proprio titulo", async () => {
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

test("as quatro paginas de erro estao na lista, marcadas como erro, e cada uma diz o que fazer", async () => {
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

test("o markdown da pagina de erro nao cobra os quatro finais de listagem", () => {
  const served = agentFiles();
  let checked = 0;
  for (const block of BLOCK_LIST) {
    const markdown = served.get(`blocos/${block.slug}.md`) ?? "";
    expect(markdown.includes("mantenha os quatro finais"), block.slug).toBe(!block.errorPage);
    checked++;
  }
  expect(checked).toBe(BLOCK_LIST.length);
});

test("a busca da 404 e um formulario de busca com nome, e o codigo da 500 tem botao de copiar", async () => {
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

test("pedir acesso na 403 confirma na tela e leva o foco para a confirmacao", async () => {
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
