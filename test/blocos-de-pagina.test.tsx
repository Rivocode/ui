import { expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
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
