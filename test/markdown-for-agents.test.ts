import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";

import { agentFiles, SITE } from "../apps/docs/src/agent-docs";
import { storyNamesOf } from "../apps/docs/src/example-source";
import { GUIDE_LIST } from "../apps/docs/src/guide-list";
import { findParent } from "../apps/docs/src/parts";
import { slugify } from "../apps/docs/src/slug";

const files = agentFiles();
const index = files.get("llms.txt") ?? "";
const full = files.get("llms-full.txt") ?? "";

function catalog() {
  const names = readdirSync(".design-sync/docs")
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
  const pieces = names.filter((name) => !findParent(name, names));
  return { names, pieces };
}

test("toda peca do catalogo tem linha no llms.txt e copia .md completa", () => {
  const { names, pieces } = catalog();
  expect(names.length).toBeGreaterThan(150);
  expect(pieces.length).toBeGreaterThan(80);

  const props = JSON.parse(readFileSync("apps/docs/src/component-props.json", "utf8")) as Record<
    string,
    { props: Array<{ name: string }> }
  >;

  let checked = 0;
  for (const name of pieces) {
    const slug = slugify(name);
    const page = files.get(`componentes/${slug}.md`);

    expect(page, name).toBeDefined();
    expect(page!.startsWith(`# ${name}\n`), name).toBe(true);
    expect(page, name).toContain("## Importação");
    expect(page, name).toContain("## No React Native");
    expect(page, name).not.toMatch(/<!doctype html|<html[\s>]|id="root"|<link rel=/i);

    for (const prop of props[name]?.props ?? []) {
      expect(page, `${name}.${prop.name}`).toContain(`| \`${prop.name}\` |`);
    }

    const preview = `.design-sync/previews/${name}.tsx`;
    const source = existsSync(preview) ? readFileSync(preview, "utf8") : "";
    if (storyNamesOf(source).length > 0) expect(page, name).toContain("## Exemplos");

    expect(index, name).toMatch(
      new RegExp(`^- \\[${name}\\]\\(/componentes/${slug}\\.md\\): \\S`, "m"),
    );
    expect(full, name).toContain(`Endereço: ${SITE}/componentes/${slug}.md\n\n${page!.trim()}`);
    checked += 1;
  }

  expect(checked).toBe(pieces.length);
});

test("todo guia tem linha no llms.txt e copia .md", () => {
  expect(GUIDE_LIST.length).toBeGreaterThan(5);

  for (const guide of GUIDE_LIST) {
    const page = files.get(`${guide.slug}.md`);

    expect(page, guide.slug).toBeDefined();
    expect(page!.startsWith(`# ${guide.title}\n`), guide.slug).toBe(true);
    expect(index).toContain(`- [${guide.title}](/${guide.slug}.md): ${guide.summary}`);
    expect(full).toContain(`Endereço: ${SITE}/${guide.slug}.md\n\n${page!.trim()}`);
  }
});

test("o llms.txt lista so as pecas, e as partes ficam dentro de quem as compoe", () => {
  const { names, pieces } = catalog();
  expect(names.length).toBeGreaterThan(150);

  const top = index.match(/^- \[[^\]]+\]\(\/componentes\//gm) ?? [];
  const nested = index.match(/^ {2}- \[[^\]]+\]\(\/componentes\/[a-z0-9-]+\.md#/gm) ?? [];

  expect(top.length).toBe(pieces.length);
  expect(nested.length).toBe(names.length - pieces.length);
});

test("o llms.txt abre no formato do llmstxt.org e aponta para o llms-full.txt", () => {
  expect(index.startsWith("# @rivocode/ui\n\n> ")).toBe(true);
  expect(index).toContain("[/llms-full.txt](/llms-full.txt)");
  expect(full.startsWith("# @rivocode/ui")).toBe(true);
  expect(full).toContain(`Endereço: ${SITE}/convencoes.md`);
});
