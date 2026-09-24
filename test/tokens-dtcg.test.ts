import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readCssTree } from "../src/tokens/css-tree";
import { EXTENSION, RESOLVER, exportDtcg } from "../src/tokens/dtcg";

type Node = Record<string, unknown>;
type Flat = Map<string, Node>;

const house = readCssTree("src/preset.css");
const result = exportDtcg(house);
const files = result.files as Record<string, Node>;

const TYPES = new Set([
  "color",
  "dimension",
  "duration",
  "cubicBezier",
  "number",
  "fontFamily",
  "fontWeight",
  "shadow",
  "transition",
  "strokeStyle",
  "border",
  "gradient",
  "typography",
]);

function flatten(group: Node, into: Flat = new Map(), path: string[] = []): Flat {
  for (const [name, child] of Object.entries(group)) {
    if (name.startsWith("$")) continue;
    expect(name).not.toMatch(/[{}.]/);
    const node = child as Node;
    if ("$value" in node) into.set([...path, name].join("."), node);
    else flatten(node, into, [...path, name]);
  }
  return into;
}

const isAlias = (value: unknown): value is string =>
  typeof value === "string" && /^\{[^{}]+\}$/.test(value);

const unit = (value: unknown, units: string[]) => {
  const item = value as { value?: unknown; unit?: unknown };
  return typeof item?.value === "number" && units.includes(item.unit as string);
};

function colorProblem(value: unknown): string | undefined {
  const color = value as { colorSpace?: unknown; components?: unknown; alpha?: unknown; hex?: unknown };
  if (color?.colorSpace !== "srgb") return "colorSpace";
  const components = color.components as number[];
  if (!Array.isArray(components) || components.length !== 3) return "components";
  if (components.some((part) => typeof part !== "number" || part < 0 || part > 1)) return "faixa";
  if (color.alpha !== undefined && (typeof color.alpha !== "number" || color.alpha < 0 || color.alpha > 1))
    return "alpha";
  if (color.hex !== undefined && !/^#[\da-f]{6}$/.test(color.hex as string)) return "hex";
  return undefined;
}

function valueProblem(type: string, value: unknown): string | undefined {
  if (type === "color") return colorProblem(value);
  if (type === "dimension") return unit(value, ["px", "rem"]) ? undefined : "dimensao";
  if (type === "duration") return unit(value, ["ms", "s"]) ? undefined : "duracao";
  if (type === "number") return typeof value === "number" ? undefined : "numero";
  if (type === "cubicBezier") {
    const points = value as number[];
    if (!Array.isArray(points) || points.length !== 4) return "curva";
    if (points.some((point) => typeof point !== "number")) return "curva";
    return points[0]! >= 0 && points[0]! <= 1 && points[2]! >= 0 && points[2]! <= 1
      ? undefined
      : "x fora de [0, 1]";
  }
  if (type === "fontFamily") {
    return typeof value === "string" || (Array.isArray(value) && value.every((item) => typeof item === "string"))
      ? undefined
      : "familia";
  }
  if (type === "shadow") {
    const layers = Array.isArray(value) ? value : [value];
    for (const layer of layers as Node[]) {
      if (colorProblem(layer.color)) return "cor da sombra";
      for (const key of ["offsetX", "offsetY", "blur", "spread"]) {
        if (!unit(layer[key], ["px", "rem"])) return `sombra sem ${key}`;
      }
    }
    return undefined;
  }
  return `tipo sem validador: ${type}`;
}

function context(theme: string, density = "comfortable"): Flat {
  const merged: Flat = new Map();
  for (const name of [
    "palette.tokens.json",
    "scales.tokens.json",
    `density-${density}.tokens.json`,
    `${theme}.tokens.json`,
  ]) {
    expect(files[name]).toBeDefined();
    for (const [path, token] of flatten(files[name]!)) merged.set(path, token);
  }
  return merged;
}

function resolved(tokens: Flat, path: string, seen: string[] = []): Node {
  const token = tokens.get(path);
  if (!token) throw new Error(`alias sem destino: ${[...seen, path].join(" -> ")}`);
  if (seen.includes(path)) throw new Error(`alias circular: ${[...seen, path].join(" -> ")}`);
  return isAlias(token.$value) ? resolved(tokens, token.$value.slice(1, -1), [...seen, path]) : token;
}

const contract = readFileSync("src/tokens/contract.css", "utf8");
const themeBlock = contract.slice(contract.indexOf("@theme"), contract.indexOf("@layer"));
const CONTRACT = [...new Set([...themeBlock.matchAll(/var\((--rc-[\w-]+)\)/g)].map((hit) => hit[1]!))];

test("o export da casa sai em um arquivo por camada, por densidade e por tema", () => {
  expect(Object.keys(files).sort()).toEqual(
    [
      "density-compact.tokens.json",
      "density-comfortable.tokens.json",
      "palette.tokens.json",
      "rivocode-dark.tokens.json",
      "rivocode-light.tokens.json",
      RESOLVER,
      "scales.tokens.json",
    ].sort(),
  );
  expect(result.themes).toEqual(["rivocode-dark", "rivocode-light"]);
  expect(result.count).toBeGreaterThan(180);
});

test("todo token tem um tipo do DTCG 2025.10 e um valor na forma desse tipo", () => {
  let seen = 0;
  const problems: string[] = [];
  for (const [file, content] of Object.entries(files)) {
    if (file === RESOLVER) continue;
    for (const [path, token] of flatten(content)) {
      seen++;
      const type = token.$type as string;
      if (!TYPES.has(type)) {
        problems.push(`${file} ${path}: tipo ${type}`);
        continue;
      }
      if (isAlias(token.$value)) continue;
      const problem = valueProblem(type, token.$value);
      if (problem) problems.push(`${file} ${path}: ${problem}`);
    }
  }
  expect(seen).toBeGreaterThan(180);
  expect(problems).toEqual([]);
});

test("todo alias resolve, sem ciclo, para um token do mesmo tipo", () => {
  let aliases = 0;
  const problems: string[] = [];
  for (const theme of result.themes) {
    for (const density of ["comfortable", "compact"]) {
      const tokens = context(theme, density);
      for (const [path, token] of tokens) {
        if (!isAlias(token.$value)) continue;
        aliases++;
        try {
          const target = resolved(tokens, path);
          if (target.$type !== token.$type) problems.push(`${theme} ${path}: ${target.$type}`);
        } catch (error) {
          problems.push(`${theme} ${path}: ${(error as Error).message}`);
        }
      }
    }
  }
  expect(aliases).toBeGreaterThan(60);
  expect(problems).toEqual([]);
});

test("todo token que o contrato do Tailwind le esta no export, nos dois temas", () => {
  expect(CONTRACT.length).toBeGreaterThan(60);
  for (const theme of result.themes) {
    const present = new Set(
      [...context(theme).values()].map(
        (token) => (token.$extensions as Record<string, { css: string }>)[EXTENSION]!.css,
      ),
    );
    const spring = new Set(
      result.skipped.filter((item) => item.value.startsWith("linear(")).map((item) => item.variable),
    );
    expect(spring.size).toBeGreaterThanOrEqual(3);
    expect(CONTRACT.filter((variable) => !present.has(variable) && !spring.has(variable))).toEqual([]);
  }
});

test("o papel que aponta para a paleta no CSS vira alias da paleta, e nao uma copia da cor", () => {
  const css = readFileSync("src/tokens/themes/rivocode-light.css", "utf8");
  const pointing = [...css.matchAll(/--rc-([\w-]+):\s*var\(--rc-p-([\w-]+)\)/g)];
  expect(pointing.length).toBeGreaterThan(20);

  const colors = flatten(files["rivocode-light.tokens.json"]!);
  for (const [, role, swatch] of pointing) {
    const step = swatch!.match(/^(.*)-(\d+)$/);
    const target = step ? `palette.${step[1]}.${step[2]}` : `palette.${swatch}`;
    expect(colors.get(`color.${role}`)?.$value).toBe(`{${target}}`);
  }
});

test("a cor que chega ao fim do alias e a mesma do CSS, com o alfa preservado", () => {
  const dark = context("rivocode-dark");
  expect((resolved(dark, "color.accent").$value as Node).hex).toBe("#d4f34a");
  expect(dark.get("color.chart-grid")?.$value).toBe("{color.border}");

  const light = context("rivocode-light");
  const overlay = light.get("color.overlay")!.$value as Node;
  expect(overlay.alpha).toBe(0.42);
  expect(overlay.hex).toBe("#0f1113");
  expect((resolved(light, "color.accent-text").$value as Node).hex).toBe("#4a7100");
});

test("as duas densidades tem os mesmos tokens, e a compacta encolhe o controle", () => {
  const comfortable = flatten(files["density-comfortable.tokens.json"]!);
  const compact = flatten(files["density-compact.tokens.json"]!);
  expect(comfortable.size).toBeGreaterThan(10);
  expect([...compact.keys()].sort()).toEqual([...comfortable.keys()].sort());
  expect(comfortable.get("control.md")?.$value).toEqual({ value: 40, unit: "px" });
  expect(compact.get("control.md")?.$value).toEqual({ value: 32, unit: "px" });
});

test("o resolver aponta so para arquivos que o export escreveu", () => {
  const resolver = files[RESOLVER] as { version: string; resolutionOrder: unknown[] };
  expect(resolver.version).toBe("2025.10");
  const refs = [...JSON.stringify(resolver).matchAll(/"\$ref":"([^"#][^"]*)"/g)].map((hit) => hit[1]!);
  expect(refs.length).toBeGreaterThanOrEqual(6);
  for (const ref of refs) expect(files[ref]).toBeDefined();
  expect(resolver.resolutionOrder).toHaveLength(3);
});

test("o que fica de fora e so o gancho vazio e a curva de mola, com o motivo", () => {
  expect(
    result.skipped.every((item) => item.value === "none" || item.value.startsWith("linear(")),
  ).toBe(true);
  expect(result.skipped.map((item) => item.variable)).toContain("--rc-accent-image");
});

test("o comando tokens exporta um tema de cliente, com a cor propria e o resto apontando para a paleta", async () => {
  const dir = mkdtempSync(join(tmpdir(), "rc-dtcg-"));
  const dark = readFileSync("src/tokens/themes/rivocode-dark.css", "utf8")
    .replace('"rivocode-dark"', '"acme-dark"')
    .replace("--rc-accent: var(--rc-p-lima-500);", "--rc-accent: var(--acme-brand);");
  const theme = join(dir, "tema-acme.css");
  writeFileSync(theme, `:root {\n  --acme-brand: oklch(0.62 0.19 260);\n}\n\n${dark}`);

  const run = Bun.spawnSync(["bun", "src/cli.ts", "tokens", theme, "--out", join(dir, "saida")]);
  expect(run.exitCode).toBe(0);

  const written = JSON.parse(readFileSync(join(dir, "saida", "acme-dark.tokens.json"), "utf8")) as Node;
  const tokens = flatten(written);
  expect(tokens.size).toBeGreaterThan(40);
  const accent = tokens.get("color.accent")!;
  expect(isAlias(accent.$value)).toBe(false);
  expect(colorProblem(accent.$value)).toBeUndefined();
  expect(tokens.get("color.bg")?.$value).toBe("{palette.graphite.950}");
  expect(existsSync(join(dir, "saida", "palette.tokens.json"))).toBe(true);
  expect(existsSync(join(dir, "saida", "rivocode-dark.tokens.json"))).toBe(false);

  const resolver = readFileSync(join(dir, "saida", RESOLVER), "utf8");
  expect(resolver).toContain('"acme-dark.tokens.json"');
});

test("o comando tokens recusa o arquivo sem tema, em vez de exportar a casa no lugar", () => {
  const dir = mkdtempSync(join(tmpdir(), "rc-dtcg-"));
  const loose = join(dir, "solto.css");
  writeFileSync(loose, ":root { --acme-brand: #123456; }\n");
  const run = Bun.spawnSync(["bun", "src/cli.ts", "tokens", loose, "--out", join(dir, "saida")]);
  expect(run.exitCode).toBe(1);
  expect(existsSync(join(dir, "saida"))).toBe(false);
});
