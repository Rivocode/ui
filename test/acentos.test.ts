import { expect, test } from "bun:test";
import { Glob } from "bun";

import { WORDS } from "../scripts/acentuar";

const ATTRIBUTE =
  /(?:aria-label|aria-valuetext|aria-description|title|placeholder|alt|summary|caption|label|description|[a-zA-Z]+(?:Label|Message|Text|Title))\s*[=:]\s*/g;

const JSX_TEXT = /[\w"'}/\]]>\s*((?:[^<>{}"'=;()]|\{[^{}]*\})*?)\s*</g;

const CONSOLE = /console\.(?:log|error|warn)\(\s*[`"]([^`"]+)[`"]/g;

function braced(code: string, from: number) {
  let depth = 0;
  for (let at = from; at < code.length; at++) {
    if (code[at] === "{") depth += 1;
    else if (code[at] === "}") {
      depth -= 1;
      if (depth === 0) return code.slice(from + 1, at);
    }
  }
  return "";
}

async function labelsOf(file: string) {
  const code = await Bun.file(file).text();
  const clean = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

  const labels: string[] = [];

  for (const hit of clean.matchAll(ATTRIBUTE)) {
    const at = hit.index! + hit[0].length;
    const opener = clean[at];

    if (opener === '"' || opener === "'" || opener === "`") {
      const end = clean.indexOf(opener, at + 1);
      if (end > 0) labels.push(clean.slice(at + 1, end));
      continue;
    }

    if (opener === "{") {
      for (const literal of braced(clean, at).matchAll(/(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g)) {
        labels.push(literal[2]!);
      }
    }
  }

  for (const hit of clean.matchAll(JSX_TEXT)) labels.push(hit[1]!);
  for (const hit of clean.matchAll(CONSOLE)) labels.push(hit[1]!);

  return labels.filter((label) => /[A-Za-zÀ-ÿ]{3}/.test(label));
}

async function missesIn(files: string[]) {
  const misses: string[] = [];

  for (const file of files) {
    for (const label of await labelsOf(file)) {
      const written = label.replace(/\$\{[^}]*\}/g, " ").replace(/\{[^}]*\}/g, " ");

      for (const word of written.matchAll(/[A-Za-zÀ-ÿ]+/g)) {
        const right = WORDS[word[0]!.toLowerCase()];
        if (right && right !== word[0]!.toLowerCase()) {
          misses.push(`${file}: "${label.trim()}" -> ${word[0]} deveria ser ${right}`);
        }
      }
    }
  }

  return [...new Set(misses)];
}

test("todo texto que a biblioteca escreve na tela sai acentuado", async () => {
  const trees = ["src/**/*.{ts,tsx}", "native/src/**/*.{ts,tsx}"];
  const files: string[] = [];
  for (const tree of trees) {
    for await (const file of new Glob(tree).scan(".")) files.push(file);
  }

  expect(files.length).toBeGreaterThan(100);

  expect(await missesIn(files)).toEqual([]);
});

test("todo texto de tela dos exemplos publicados no site sai acentuado", async () => {
  const files: string[] = [];
  for await (const file of new Glob(".design-sync/previews/*.tsx").scan({ cwd: ".", dot: true })) {
    files.push(file);
  }

  expect(files.length).toBeGreaterThan(100);

  expect(await missesIn(files)).toEqual([]);
});
