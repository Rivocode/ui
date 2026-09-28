import { expect, test } from "bun:test";
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { __unstable__loadDesignSystem } from "tailwindcss";

import { cn } from "../src/lib/cn";

const HOUSE = {
  regular: 400,
  medium: 500,
  strong: 600,
  bold: 700,
  display: 600,
} as const;

const INTENTS = Object.keys(HOUSE) as (keyof typeof HOUSE)[];

const RAW = /(?<![\w-])font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)(?![\w-])/g;

const DISPLAY = /(?<=^|[\s"'`{(])([^\s"'`{(]*:)?font-display(?![\w-])/g;

const ALLOWED_RAW: Record<string, string> = {};

const WEB_TREES = [
  "src/components/**/*.{ts,tsx}",
  "src/ai/**/*.{ts,tsx}",
  "src/chart/**/*.{ts,tsx}",
  "src/dnd/**/*.{ts,tsx}",
  "src/editor/**/*.{ts,tsx}",
  "src/form/**/*.{ts,tsx}",
  "src/provider/**/*.{ts,tsx}",
];

const NATIVE_TREES = ["native/src/**/*.{ts,tsx}"];

function filesOf(trees: string[]) {
  const found: string[] = [];
  for (const tree of trees) for (const file of new Glob(tree).scanSync(".")) found.push(file);
  return found;
}

function rawWeights(files: string[]) {
  const hits: string[] = [];
  for (const file of files) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        for (const hit of line.matchAll(RAW)) {
          const where = `${file}:${index + 1} ${hit[0]}`;
          if (!ALLOWED_RAW[`${file} ${hit[0]}`]) hits.push(where);
        }
      });
  }
  return hits;
}

const shape = readFileSync("src/tokens/forma.css", "utf8");
const contract = readFileSync("src/tokens/contract.css", "utf8");
const rootBlock = shape.slice(shape.indexOf(":root"), shape.indexOf("}"));

test("a peca do web nao escreve peso cru do Tailwind: escreve a intencao", () => {
  const files = filesOf(WEB_TREES);
  expect(files.length).toBeGreaterThan(100);

  expect(rawWeights(files)).toEqual([]);
});

test("a peca nativa tambem nao escreve peso cru", () => {
  const files = filesOf(NATIVE_TREES);
  expect(files.length).toBeGreaterThan(80);

  expect(rawWeights(files)).toEqual([]);
});

test("a varredura acusa o peso cru, com e sem variante", () => {
  const line = 'cn("text-sm font-semibold", "hover:font-medium", "[&_b]:font-bold font-rc-strong")';
  expect([...line.matchAll(RAW)].map((hit) => hit[0])).toEqual([
    "font-semibold",
    "font-medium",
    "font-bold",
  ]);
  expect([..."font-rc-medium font-rc-bold --font-weight-bold".matchAll(RAW)]).toEqual([]);
});

test("toda font-display da peca web leva o peso de titulo ao lado, com a mesma variante", () => {
  const files = filesOf(WEB_TREES);
  expect(files.length).toBeGreaterThan(100);

  const missing: string[] = [];
  let seen = 0;
  for (const file of files) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        for (const hit of line.matchAll(DISPLAY)) {
          seen++;
          const tokens = line.split(/[\s"'`{}()]+/);
          if (!tokens.includes(`${hit[1] ?? ""}font-rc-display`)) {
            missing.push(`${file}:${index + 1}`);
          }
        }
      });
  }

  expect(seen).toBeGreaterThan(15);
  expect(missing).toEqual([]);
});

test("os cinco pesos moram no forma.css com o valor da casa, e o Tailwind os le", () => {
  for (const intent of INTENTS) {
    expect(rootBlock).toContain(`--rc-weight-${intent}: ${HOUSE[intent]};`);
    expect(contract).toContain(`--font-weight-rc-${intent}: var(--rc-weight-${intent});`);
  }
});

test("o valor da casa e o mesmo numero da classe do Tailwind que a intencao substituiu", () => {
  const tailwind = readFileSync("node_modules/tailwindcss/theme.css", "utf8");
  const REPLACED = {
    regular: "normal",
    medium: "medium",
    strong: "semibold",
    bold: "bold",
    display: "semibold",
  } as const;

  for (const intent of INTENTS) {
    const hit = new RegExp(`--font-weight-${REPLACED[intent]}: (\\d+);`).exec(tailwind);
    const house = new RegExp(`--rc-weight-${intent}: (\\d+);`).exec(rootBlock);
    expect([intent, house?.[1]]).toEqual([intent, hit?.[1]]);
  }
});

async function loadStylesheet(id: string, base: string) {
  let path = isAbsolute(id) ? id : resolve(base, id);
  if (!id.startsWith(".") && !isAbsolute(id)) {
    path = join(process.cwd(), "node_modules", id);
    if (!(await Bun.file(path).exists())) path = join(process.cwd(), "node_modules", id, "index.css");
  }
  return { path, base: dirname(path), content: await Bun.file(path).text() };
}

test("o Tailwind do web compila cada classe de peso para o token, e nao para o numero", async () => {
  const system = await __unstable__loadDesignSystem(readFileSync("src/styles.css", "utf8"), {
    base: resolve("src"),
    loadStylesheet,
    loadModule: () => Promise.reject(new Error("sem plugin")),
  });

  const compiled = system.candidatesToCss(INTENTS.map((intent) => `font-rc-${intent}`));

  INTENTS.forEach((intent, at) => {
    expect(compiled[at]).toContain(`font-weight: var(--rc-weight-${intent})`);
  });
});

test("o nativo recebe os cinco pesos no theme.css e no tokens.json, com o mesmo valor", async () => {
  const theme = readFileSync("native/theme.css", "utf8");
  const { tokens } = await import("../native/tokens");
  const scales = tokens.scales as Record<string, number>;

  for (const intent of INTENTS) {
    expect(theme).toContain(`--font-weight-rc-${intent}: ${HOUSE[intent]};`);
    expect(scales[`weight-${intent}`]).toBe(HOUSE[intent]);
  }
});

test("o cn trata a classe de peso como peso: a ultima vence, e a familia fica", () => {
  expect(cn("font-sans font-rc-medium")).toBe("font-sans font-rc-medium");
  expect(cn("font-display font-rc-display")).toBe("font-display font-rc-display");
  expect(cn("font-rc-medium", "font-rc-strong")).toBe("font-rc-strong");
  expect(cn("font-rc-medium", "font-bold")).toBe("font-bold");
  expect(cn("font-semibold", "font-rc-display")).toBe("font-rc-display");
});
