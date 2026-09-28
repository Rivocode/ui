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
    fonts: engine.DEFAULT_STATE.fonts,
  };

  const query = engine.writeQuery(state);
  expect(query).toContain("nome=clinica-sao-lucas");
  expect(query).toContain("raio=reto");
  expect(engine.readQuery(query)).toEqual(state);
  expect(engine.writeQuery(engine.DEFAULT_STATE)).toBe("");
  expect(engine.readQuery("?claro=accent.zzz_bg.12")).toEqual(engine.DEFAULT_STATE);
});

const FONTS = ["..", "apps", "docs", "src", "theme-builder", "fonts.ts"].join("/");

async function builtWith(fonts: Record<string, string>) {
  const engine = await import(ENGINE);
  const house = engine.houseBlocks(readCssTree("src/preset.css"));
  const state = engine.DEFAULT_STATE;
  const base = { light: engine.derive(state.seeds.light).colors, dark: engine.derive(state.seeds.dark).colors };
  const light = engine.build(state.seeds.light, "light", house, base.dark, true);
  const dark = engine.build(state.seeds.dark, "dark", house, base.light, true);
  const tools = await import(FONTS);
  return {
    raw: { light: light.tokens, dark: dark.tokens },
    tokens: { light: tools.applyFonts(light.tokens, fonts), dark: tools.applyFonts(dark.tokens, fonts) },
  };
}

const importsIn = (css: string) => css.split("\n").filter((line) => line.startsWith("@import"));

test("a fonte escolhida vira os tres tokens no CSS e no DTCG, com os imports no topo", async () => {
  const engine = await import(ENGINE);
  const choice = { sans: "inter", display: "fraunces", mono: "space-mono" };
  const { tokens } = await builtWith(choice);

  expect(tokens.dark["--rc-font-sans"]).toBe('"Inter Variable", "Inter", system-ui, sans-serif');
  expect(tokens.light["--rc-font-display"]).toBe('"Fraunces Variable", "Fraunces", Georgia, serif');
  expect(tokens.light["--rc-font-mono"]).toBe('"Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace');

  const css: string = engine.emitWebCss("acme", tokens, "house", [], choice);
  expect(importsIn(css)).toEqual([
    '@import "@fontsource-variable/inter";',
    '@import "@fontsource-variable/fraunces";',
    '@import "@fontsource/space-mono/latin-400.css";',
    '@import "@fontsource/space-mono/latin-700.css";',
  ]);
  const lines = css.split("\n");
  const firstRule = lines.findIndex((line) => line.startsWith("[data-rc-theme"));
  expect(firstRule).toBeGreaterThan(0);
  expect(lines.findLastIndex((line) => line.startsWith("@import"))).toBeLessThan(firstRule);
  expect(css).toContain("bun add @fontsource-variable/inter @fontsource-variable/fraunces @fontsource/space-mono");
  expect(css).toContain(
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap",
  );
  expect(css.split('--rc-font-sans: "Inter Variable", "Inter", system-ui, sans-serif;').length).toBe(3);

  const reports = engine.missingRoles("acme", css);
  expect(reports.length).toBe(2);
  for (const report of reports) expect(report.missing).toEqual([]);

  const dtcg = engine.emitDtcg(readCssTree("src/preset.css"), "acme", css);
  const dark = JSON.stringify(dtcg.files["acme-dark.tokens.json"]);
  expect(dark).toContain('"$value":["Inter Variable","Inter","system-ui","sans-serif"]');
  expect(dark).toContain('"$value":["Fraunces Variable","Fraunces","Georgia","serif"]');
  expect(JSON.stringify(dtcg.files["acme-light.tokens.json"])).toContain(
    '"$value":["Space Mono","ui-monospace","SFMono-Regular","Menlo","monospace"]',
  );
});

test("o papel da casa ao lado de uma fonte de cliente sai com o pacote da casa, e nao com o fonts.css", async () => {
  const engine = await import(ENGINE);
  const tools = await import(FONTS);
  const choice = { sans: "lato", display: "house", mono: "system" };
  const { raw, tokens } = await builtWith(choice);
  const css: string = engine.emitWebCss("acme", tokens, "house", [], choice);

  expect(importsIn(css)).toEqual([
    '@import "@fontsource/lato/latin-400.css";',
    '@import "@fontsource/lato/latin-700.css";',
    '@import "@fontsource/poppins/latin-600.css";',
    '@import "@fontsource/poppins/latin-700.css";',
  ]);
  expect(css).not.toContain("@rivocode/ui/fonts.css");
  expect(tokens.dark["--rc-font-mono"]).toBe(tools.SYSTEM_STACK.mono);
  expect(tokens.dark["--rc-font-display"]).toBe(raw.dark["--rc-font-display"]);

  const houseFaces = readCssTree("src/tokens/themes/rivocode-fonts.css");
  const declared = [...houseFaces.matchAll(/@import "([^"]+)"/g)].map((match) => match[1]);
  expect(declared.length).toBeGreaterThan(2);
  expect(Object.values(tools.HOUSE_IMPORTS).flat().sort()).toEqual(declared.sort());

  const house: string = engine.emitWebCss("acme", raw, "house", [], tools.HOUSE_FONTS);
  expect(importsIn(house)).toEqual([]);
  expect(house).toContain('@import "@rivocode/ui/fonts.css"');
});

test("o peso que falta sai nomeado pelo token, com o vizinho que o navegador escolheria", async () => {
  const tools = await import(FONTS);
  expect(tools.weightFits("sans", tools.familyOf("inter"))).toEqual([]);
  expect(tools.weightFits("display", tools.familyOf("inter"))).toEqual([]);
  expect(tools.weightFits("sans", tools.familyOf("lato"))).toEqual([
    { intent: "medium", wanted: 500, falls: 400, synthetic: false },
    { intent: "strong", wanted: 600, falls: 700, synthetic: false },
  ]);
  expect(tools.weightFits("display", tools.familyOf("lato"))).toEqual([
    { intent: "display", wanted: 600, falls: 700, synthetic: false },
  ]);
  expect(tools.weightFits("display", tools.familyOf("dm-serif-display"))).toEqual([
    { intent: "display", wanted: 600, falls: 400, synthetic: true },
  ]);
  expect(tools.weightFits("sans", tools.familyOf("dm-serif-display"))).toEqual([
    { intent: "medium", wanted: 500, falls: 400, synthetic: false },
    { intent: "strong", wanted: 600, falls: 400, synthetic: true },
    { intent: "bold", wanted: 700, falls: 400, synthetic: true },
  ]);
  expect(tools.weightFits("mono", tools.familyOf("dm-mono"))).toEqual([]);
});

test("o peso de casa do montador e o do forma.css, lido pelo tokens.json", async () => {
  const tools = await import(FONTS);
  const shape = await Bun.file("src/tokens/forma.css").text();
  for (const intent of tools.WEIGHT_INTENTS as string[]) {
    expect(shape).toContain(`--rc-weight-${intent}: ${tools.HOUSE_WEIGHTS[intent]};`);
  }
  expect(tools.USED_WEIGHTS).toEqual([400, 500, 600, 700]);
});

test("titulo sem 600 cai no peso disponivel mais proximo no proprio tema, e a casa nao declara peso", async () => {
  const tools = await import(FONTS);
  const engine = await import(ENGINE);

  expect(tools.weightTokens(tools.HOUSE_FONTS)).toEqual({});
  expect(tools.weightTokens({ sans: "house", display: "lato", mono: "house" })).toEqual({
    "--rc-weight-display": "700",
  });
  expect(tools.weightTokens({ sans: "house", display: "dm-serif-display", mono: "house" })).toEqual({
    "--rc-weight-display": "400",
  });
  expect(tools.weightTokens({ sans: "system", display: "system", mono: "system" })).toEqual({});

  const fonts = { sans: "house", display: "lato", mono: "house" };
  const tokens = {
    light: tools.applyFonts({ "--rc-bg": "#ffffff" }, fonts),
    dark: tools.applyFonts({ "--rc-bg": "#000000" }, fonts),
  };
  const css: string = engine.emitWebCss("acme", tokens, "house", [], fonts);
  expect(css.match(/--rc-weight-display: 700;/g)?.length).toBe(2);
  expect(css).not.toContain("--rc-weight-medium");

  const house: string = engine.emitWebCss(
    "acme",
    {
      light: tools.applyFonts({ "--rc-bg": "#ffffff" }, tools.HOUSE_FONTS),
      dark: tools.applyFonts({ "--rc-bg": "#000000" }, tools.HOUSE_FONTS),
    },
    "house",
    [],
    tools.HOUSE_FONTS,
  );
  expect(house).not.toContain("--rc-weight-");
});

test("a familia baixa a face do peso que o token escreveu, e nao a que ela nao tem", async () => {
  const tools = await import(FONTS);
  expect(tools.facesOf(tools.familyOf("lato"))).toEqual([400, 700]);
  expect(tools.facesOf(tools.familyOf("dm-serif-display"))).toEqual([400]);
  expect(tools.facesOf(tools.familyOf("inter"))).toEqual([400, 500, 600, 700]);
  expect(tools.googleFontsUrl({ sans: "house", display: "lato", mono: "house" })).toContain(
    "family=Lato:wght@400;700&",
  );
});

test("o trecho do React Native usa os nomes que o expo-google-fonts registra", async () => {
  const tools = await import(FONTS);
  const snippet: string = tools.nativeFontsSnippet({ sans: "ibm-plex-sans", display: "dm-serif-display", mono: "house" });
  expect(snippet).toContain('import { IBMPlexSans_400Regular } from "@expo-google-fonts/ibm-plex-sans";');
  expect(snippet).toContain('import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";');
  expect(snippet).toContain('import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";');
  expect(snippet).toContain(
    'fonts={{ sans: "IBMPlexSans_400Regular", display: "DMSerifDisplay_400Regular", mono: "JetBrainsMono_400Regular" }}',
  );
  expect(tools.nativeFontsSnippet({ sans: "inter", display: "inter", mono: "system" })).toContain(
    'fonts={{ sans: "Inter_400Regular", display: "Inter_600SemiBold" }}',
  );
  expect(tools.nativeInstallCommand({ sans: "system", display: "system", mono: "system" })).toBeUndefined();
  expect(tools.nativeFontsSnippet({ sans: "system", display: "system", mono: "system" })).not.toContain("useFonts");
});

test("a escolha de fonte vai e volta pela URL, e so o que difere da casa entra", async () => {
  const engine = await import(ENGINE);
  const state = { ...engine.DEFAULT_STATE, fonts: { sans: "plus-jakarta-sans", display: "house", mono: "system" } };
  const query = engine.writeQuery(state);

  expect(query).toBe("?corpo=plus-jakarta-sans&codigo=sistema");
  expect(engine.readQuery(query)).toEqual(state);
  expect(engine.readQuery("?corpo=nao-existe&codigo=inter&titulo=fraunces").fonts).toEqual({
    sans: "house",
    display: "fraunces",
    mono: "house",
  });
});

test("toda familia da lista tem pacote, categoria e o peso 400", async () => {
  const tools = await import(FONTS);
  const families = tools.FAMILIES as Array<{ id: string; family: string; category: string; variable: boolean; weights: number[] }>;

  expect(families.length).toBeGreaterThan(35);
  expect(new Set(families.map((family) => family.id)).size).toBe(families.length);
  for (const category of ["sans-serif", "serif", "monospace"]) {
    expect(families.filter((family) => family.category === category).length).toBeGreaterThan(4);
  }

  let checked = 0;
  for (const family of families) {
    const pkg: string = tools.packageOf(family);
    expect(pkg).toMatch(family.variable ? /^@fontsource-variable\/[a-z0-9-]+$/ : /^@fontsource\/[a-z0-9-]+$/);
    expect(family.id).toBe(family.family.toLowerCase().replace(/ /g, "-"));
    expect(["sans-serif", "serif", "monospace"]).toContain(family.category);
    expect(family.weights).toContain(400);
    const role = family.category === "monospace" ? "mono" : "sans";
    expect(tools.stackOf(role, family.id)).toContain(`"${family.family}"`);
    checked++;
  }
  expect(checked).toBe(families.length);
});
