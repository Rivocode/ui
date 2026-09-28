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

test("the web component does not write a raw Tailwind weight: it writes the intent", () => {
  const files = filesOf(WEB_TREES);
  expect(files.length).toBeGreaterThan(100);

  expect(rawWeights(files)).toEqual([]);
});

test("the native component does not write a raw weight either", () => {
  const files = filesOf(NATIVE_TREES);
  expect(files.length).toBeGreaterThan(80);

  expect(rawWeights(files)).toEqual([]);
});

test("the scan flags the raw weight, with and without a variant", () => {
  const line = 'cn("text-sm font-semibold", "hover:font-medium", "[&_b]:font-bold font-rc-strong")';
  expect([...line.matchAll(RAW)].map((hit) => hit[0])).toEqual([
    "font-semibold",
    "font-medium",
    "font-bold",
  ]);
  expect([..."font-rc-medium font-rc-bold --font-weight-bold".matchAll(RAW)]).toEqual([]);
});

test("every font-display in a web component carries the heading weight beside it, with the same variant", () => {
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

test("the five weights live in forma.css with the house value, and Tailwind reads them", () => {
  for (const intent of INTENTS) {
    expect(rootBlock).toContain(`--rc-weight-${intent}: ${HOUSE[intent]};`);
    expect(contract).toContain(`--font-weight-rc-${intent}: var(--rc-weight-${intent});`);
  }
});

test("the house value is the same number as the Tailwind class the intent replaced", () => {
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

test("the web Tailwind compiles each weight class to the token, and not to the number", async () => {
  const system = await __unstable__loadDesignSystem(readFileSync("src/styles.css", "utf8"), {
    base: resolve("src"),
    loadStylesheet,
    loadModule: () => Promise.reject(new Error("no plugin")),
  });

  const compiled = system.candidatesToCss(INTENTS.map((intent) => `font-rc-${intent}`));

  INTENTS.forEach((intent, at) => {
    expect(compiled[at]).toContain(`font-weight: var(--rc-weight-${intent})`);
  });
});

test("native receives the five weights in theme.css and tokens.json, with the same value", async () => {
  const theme = readFileSync("native/theme.css", "utf8");
  const { tokens } = await import("../native/tokens");
  const scales = tokens.scales as Record<string, number>;

  for (const intent of INTENTS) {
    expect(theme).toContain(`--font-weight-rc-${intent}: ${HOUSE[intent]};`);
    expect(scales[`weight-${intent}`]).toBe(HOUSE[intent]);
  }
});

test("cn treats the weight class as a weight: the last one wins, and the family stays", () => {
  expect(cn("font-sans font-rc-medium")).toBe("font-sans font-rc-medium");
  expect(cn("font-display font-rc-display")).toBe("font-display font-rc-display");
  expect(cn("font-rc-medium", "font-rc-strong")).toBe("font-rc-strong");
  expect(cn("font-rc-medium", "font-bold")).toBe("font-bold");
  expect(cn("font-semibold", "font-rc-display")).toBe("font-rc-display");
});
