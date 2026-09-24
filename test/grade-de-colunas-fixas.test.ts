import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;

function fixedGrids(source: string) {
  const blocks: string[] = [];
  const opening = /<Grid\b[^>]*\bcolumns=/g;
  for (let match = opening.exec(source); match; match = opening.exec(source)) {
    const end = source.indexOf("</Grid>", match.index);
    blocks.push(source.slice(match.index, end < 0 ? undefined : end));
  }
  return blocks;
}

test("a vitrine do painel nao poe Badge, que nao quebra, numa Grid de colunas fixas", () => {
  const source = readFileSync(`${ROOT}demo/painel.tsx`, "utf8");
  expect(source).toContain("<Grid");
  expect(source).toContain("<Badge");

  for (const block of fixedGrids(source)) {
    expect(block).not.toContain("<Badge");
  }

  const badge = source.indexOf("Autorizadas: 41");
  expect(badge).toBeGreaterThan(0);
  const before = source.slice(0, badge);
  const opening = before.slice(Math.max(before.lastIndexOf("<Grid"), before.lastIndexOf("<Stack")));
  const tag = opening.slice(0, opening.indexOf(">"));
  expect(tag).not.toContain("columns=");
  expect(/\bminItemWidth=|\bwrap\b/.test(tag)).toBe(true);
});

test("a pagina do Grid avisa que coluna fixa nao protege conteudo que nao quebra", () => {
  const page = readFileSync(`${ROOT}.design-sync/docs/Grid.md`, "utf8");
  expect(page).toContain("não protege conteúdo que não quebra");
});
