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

test("every catalog piece has a line in llms.txt and a full .md copy", () => {
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
    expect(page, name).toContain("## Import");
    expect(page, name).toContain("## In React Native");
    expect(page, name).not.toMatch(/<!doctype html|<html[\s>]|id="root"|<link rel=/i);

    for (const prop of props[name]?.props ?? []) {
      expect(page, `${name}.${prop.name}`).toContain(`| \`${prop.name}\` |`);
    }

    const preview = `.design-sync/previews/${name}.tsx`;
    const source = existsSync(preview) ? readFileSync(preview, "utf8") : "";
    if (storyNamesOf(source).length > 0) expect(page, name).toContain("## Examples");

    expect(index, name).toMatch(
      new RegExp(`^- \\[${name}\\]\\(/componentes/${slug}\\.md\\): \\S`, "m"),
    );
    expect(full, name).toContain(`Address: ${SITE}/componentes/${slug}.md\n\n${page!.trim()}`);
    checked += 1;
  }

  expect(checked).toBe(pieces.length);
});

test("every guide has a line in llms.txt and a .md copy", () => {
  expect(GUIDE_LIST.length).toBeGreaterThan(5);

  for (const guide of GUIDE_LIST) {
    const page = files.get(`${guide.slug}.md`);

    expect(page, guide.slug).toBeDefined();
    expect(page!.startsWith(`# ${guide.title}\n`), guide.slug).toBe(true);
    expect(index).toContain(`- [${guide.title}](/${guide.slug}.md): ${guide.summary}`);
    expect(full).toContain(`Address: ${SITE}/${guide.slug}.md\n\n${page!.trim()}`);
  }
});

test("llms.txt lists only the pieces, and the parts stay inside whoever composes them", () => {
  const { names, pieces } = catalog();
  expect(names.length).toBeGreaterThan(150);

  const top = index.match(/^- \[[^\]]+\]\(\/componentes\//gm) ?? [];
  const nested = index.match(/^ {2}- \[[^\]]+\]\(\/componentes\/[a-z0-9-]+\.md#/gm) ?? [];

  expect(top.length).toBe(pieces.length);
  expect(nested.length).toBe(names.length - pieces.length);
});

test("llms.txt opens in the llmstxt.org format and points to llms-full.txt", () => {
  expect(index.startsWith("# @rivocode/ui\n\n> ")).toBe(true);
  expect(index).toContain("[/llms-full.txt](/llms-full.txt)");
  expect(full.startsWith("# @rivocode/ui")).toBe(true);
  expect(full).toContain(`Address: ${SITE}/convencoes.md`);
});
