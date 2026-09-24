import { expect, test } from "bun:test";

import { readCssTree } from "../src/tokens/css-tree";

/*
 * O montador de tema do site (`apps/docs/src/theme-builder/engine.ts`) copia as
 * tabelas de derivacao do `rivocode-ui-native-theme`, porque aquele modulo le
 * o disco no topo e nao roda no navegador. Copia envelhece calada: o comando
 * ganha uma regra, o site continua com a velha, e o link que a pessoa leva do
 * site gera um tema que o comando escreveria diferente.
 *
 * Esta guarda roda os dois com as mesmas sementes e cobra papel por papel, o
 * CSS nativo byte a byte, e que o que o site exporta passa no `check-theme`.
 *
 * O caminho do motor e montado em tempo de execucao de proposito: o `tsc` da
 * raiz nao tem o `resolveJsonModule` que o site tem, e o motor importa o
 * `tokens.json` do nativo.
 */

const ENGINE = ["..", "apps", "docs", "src", "theme-builder", "engine.ts"].join("/");
const NATIVE = ["..", "native", "scripts", "build-theme.mjs"].join("/");

type Palette = Record<string, string>;

const SEEDS: Array<{ name: string; light: Palette; dark: Palette }> = [
  {
    name: "azul",
    light: { bg: "#f7f8fa", surface: "#ffffff", fg: "#0f172a", accent: "#2563eb", success: "#15803d", warning: "#b45309", danger: "#b91c1c", info: "#1d4ed8" },
    dark: { bg: "#0b1020", surface: "#141b2d", fg: "#f1f5f9", accent: "#3b82f6", success: "#22c55e", warning: "#f59e0b", danger: "#ef4444", info: "#60a5fa" },
  },
  {
    name: "rosa, com texto escrito a mao",
    light: { bg: "#fffafc", surface: "#ffffff", fg: "#1f1020", accent: "#db2777", "accent-text": "#9d174d", success: "#15803d", warning: "#a16207", danger: "#b91c1c", info: "#1d4ed8" },
    dark: { bg: "#140a12", surface: "#1f121c", fg: "#fdf2f8", accent: "#f472b6", success: "#4ade80", warning: "#facc15", danger: "#f87171", info: "#93c5fd" },
  },
];

test("o montador deriva cada papel igual ao rivocode-ui-native-theme", async () => {
  const engine = await import(ENGINE);
  const native = await import(NATIVE);

  expect(engine.ROLES).toEqual(native.ROLES);
  expect([...engine.SEEDS]).toEqual(native.SEEDS);

  let compared = 0;
  for (const { name, light, dark } of SEEDS) {
    for (const [slot, seeds] of [["light", light], ["dark", dark]] as const) {
      const ours = engine.derive(seeds);
      const theirs = native.derive(seeds, slot);
      expect(ours.scheme, name).toBe(theirs.scheme);
      for (const role of native.ROLES as string[]) {
        expect(`${name}/${slot}/${role}: ${ours.colors[role]}`).toBe(
          `${name}/${slot}/${role}: ${theirs.colors[role]}`,
        );
        compared++;
      }
    }

    const slots = { light: native.derive(light, "light"), dark: native.derive(dark, "dark") };
    expect(engine.emitNativeCss({ light: slots.light.colors, dark: slots.dark.colors }, `${name}.json`)).toBe(
      native.emitCss(slots, `${name}.json`),
    );
  }

  expect(compared).toBeGreaterThan(150);
});

test("o tema que o montador exporta declara todos os papeis e passa na medida", async () => {
  const engine = await import(ENGINE);
  const house = engine.houseBlocks(readCssTree("src/preset.css"));
  const state = engine.DEFAULT_STATE;

  const base = { light: engine.derive(state.seeds.light).colors, dark: engine.derive(state.seeds.dark).colors };
  const light = engine.build(state.seeds.light, "light", house, base.dark, true);
  const dark = engine.build(state.seeds.dark, "dark", house, base.light, true);

  const pairs = [...engine.measureWeb("claro", light.tokens), ...engine.measureWeb("escuro", dark.tokens)];
  expect(pairs.length).toBeGreaterThan(150);
  expect(pairs.filter((pair: { ok: boolean }) => !pair.ok)).toEqual([]);

  const css = engine.emitWebCss("acme", { light: light.tokens, dark: dark.tokens }, "house", []);
  const reports = engine.missingRoles("acme", css);
  expect(reports.length).toBe(2);
  for (const report of reports) {
    expect(report.missing).toEqual([]);
    expect(report.declared).toBe(report.required);
  }

  const native = engine.measureNative({ light: light.derived.colors, dark: dark.derived.colors });
  expect(native).toEqual({ light: [], dark: [] });

  const dtcg = engine.emitDtcg(readCssTree("src/preset.css"), "acme", css);
  expect(dtcg.themes).toEqual(["acme-light", "acme-dark"]);
});

test("par reprovado sai escrito no cabecalho do CSS exportado", async () => {
  const engine = await import(ENGINE);
  const house = engine.houseBlocks(readCssTree("src/preset.css"));
  const seeds = { ...engine.DEFAULT_STATE.seeds.light, fg: "#9a9a9a" };
  const built = engine.build(seeds, "light", house, engine.derive(engine.DEFAULT_STATE.seeds.dark).colors, true);
  const failing = engine.measureWeb("claro", built.tokens).filter((pair: { ok: boolean }) => !pair.ok);

  expect(failing.length).toBeGreaterThan(0);
  const css = engine.emitWebCss("acme", { light: built.tokens, dark: built.tokens }, "house", failing.map((pair: { text: string }) => pair.text));
  expect(css).toContain(`ATENÇÃO: ${failing.length} pares reprovaram`);
  expect(css).toContain(failing[0].text);
});

test("o estado do montador vai e volta pela URL", async () => {
  const engine = await import(ENGINE);
  const state = {
    name: "clinica-sao-lucas",
    seeds: {
      light: { ...engine.DEFAULT_STATE.seeds.light, accent: "#2563eb" },
      dark: { ...engine.DEFAULT_STATE.seeds.dark, accent: "#3b82f6", danger: "#ff5555" },
    },
    radius: "square",
    autoFix: false,
  };

  const query = engine.writeQuery(state);
  expect(query).toContain("nome=clinica-sao-lucas");
  expect(query).toContain("raio=reto");
  expect(engine.readQuery(query)).toEqual(state);
  expect(engine.writeQuery(engine.DEFAULT_STATE)).toBe("");
  expect(engine.readQuery("?claro=accent.zzz_bg.12")).toEqual(engine.DEFAULT_STATE);
});
