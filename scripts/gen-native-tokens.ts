/**
 * Fase 0 do @rivocode/ui-native: os tokens saem do CSS para JSON e TS.
 *
 * A fonte unica continua sendo o CSS - e nele que os guards de contraste e de
 * documentacao ja mordem. Este script DERIVA a forma que o React Native
 * consome: numeros sem "px", cores resolvidas (var() nao existe la), e so o
 * que traduz. Sombra de caixa, clamp() de marketing e empilhamento por
 * z-index sao ideias de CSS; ficam de fora com o motivo anotado.
 *
 * `bun run check:native` roda o gerador e falha se o resultado comitado
 * divergir: mudou token no CSS, o native/ anda junto no mesmo commit.
 */

const read = (path: string) => Bun.file(path).text();

/** `--rc-p-lima-500: #d4f34a;` vira ["p-lima-500", "#d4f34a"]. */
function declarations(css: string) {
  const found: Array<[string, string]> = [];
  for (const match of css.matchAll(/--rc-([\w-]+):\s*([^;]+);/g)) {
    found.push([match[1], match[2].trim()]);
  }
  return found;
}

/** `rgb(212 243 74 / 0.14)` vira `rgba(212,243,74,0.14)`, que o RN entende. */
function toNativeColor(value: string, palette: Map<string, string>): string | null {
  const reference = /^var\(--rc-(p-[\w-]+)\)$/.exec(value);
  if (reference) return palette.get(reference[1]) ?? null;

  const rgb = /^rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)$/.exec(value);
  if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${rgb[4]})`;

  if (value.startsWith("#")) return value;
  return null;
}

/** `6px` vira 6; `120ms` vira 120; o resto fica de fora. */
const toNumber = (value: string) => {
  const match = /^([\d.]+)(?:px|ms)$/.exec(value);
  return match ? Number(match[1]) : null;
};

const paletteCss = await read("src/tokens/palette.css");
// Escala e forma sao lidas juntas: para o nativo as duas sao a mesma coisa,
// que e "medida que nao vem do tema de cor".
const scalesCss =
  (await read("src/tokens/scales.css")) + "\n" + (await read("src/tokens/forma.css"));

const palette = new Map<string, string>();
for (const [name, value] of declarations(paletteCss)) {
  if (name.startsWith("p-") && value.startsWith("#")) palette.set(name, value);
}

/**
 * Divide o CSS em blocos de primeiro nivel, cabecalho + corpo. A densidade
 * compacta redefine as mesmas variaveis da confortavel no mesmo arquivo, e um
 * matchAll cego deixava a ultima vencer: o control-md saia 32 em vez de 40.
 */
function topLevelBlocks(css: string) {
  const blocks: Array<{ header: string; body: string }> = [];
  let header = "";
  let body = "";
  let depth = 0;

  for (const char of css) {
    if (char === "{") {
      depth++;
      if (depth === 1) {
        body = "";
        continue;
      }
    }
    if (char === "}") {
      depth--;
      if (depth === 0) {
        blocks.push({ header: header.trim(), body });
        header = "";
        continue;
      }
    }
    if (depth === 0) header += char;
    else body += char;
  }

  return blocks;
}

/* As escalas que traduzem: forma, tipografia, movimento e densidade. O
   `clamp()` de marketing, o z-index e os @keyframes ficam no CSS, onde
   fazem sentido. */
const scales: Record<string, number> = {};
const fonts: Record<string, string> = {};
const densities: Record<"comfortable" | "compact", Record<string, number>> = {
  comfortable: {},
  compact: {},
};

for (const block of topLevelBlocks(scalesCss)) {
  if (block.header.startsWith("@media") || block.header.startsWith("@keyframes")) continue;

  const density = block.header.includes('data-rc-density="compact"')
    ? "compact"
    : block.header.includes('data-rc-density="comfortable"')
      ? "comfortable"
      : null;

  for (const [name, value] of declarations(block.body)) {
    if (name.startsWith("z-") || name.startsWith("tracking-")) continue;
    if (name.startsWith("font-")) {
      fonts[name.slice(5)] = value.split(",")[0].trim().replace(/^"|"$/g, "");
      continue;
    }
    const number = toNumber(value) ?? (/^[\d.]+$/.test(value) ? Number(value) : null);
    if (number === null) continue;
    if (density) densities[density][name] = number;
    else scales[name] = number;
  }
}

async function themeColors(path: string) {
  const css = await read(path);
  const colors: Record<string, string> = {};
  for (const [name, value] of declarations(css)) {
    const color = toNativeColor(value, palette);
    if (color) colors[name] = color;
  }
  return colors;
}

const tokens = {
  $comment:
    "Gerado por scripts/gen-native-tokens.ts a partir de src/tokens/*.css. Nao editar: rode bun run gen:native.",
  palette: Object.fromEntries(palette),
  scales,
  densities,
  fonts,
  themes: {
    "rivocode-dark": await themeColors("src/tokens/themes/rivocode-dark.css"),
    "rivocode-light": await themeColors("src/tokens/themes/rivocode-light.css"),
  },
};

const json = `${JSON.stringify(tokens, null, 2)}\n`;

/**
 * O tema para o NativeWind v5, que fala Tailwind 4 como o web: o @theme
 * gera exatamente as mesmas classes - bg-bg, text-fg-muted, rounded-md.
 *
 * Cada cor sai como light-dark(claro, escuro): o compilador do
 * react-native-css transforma isso numa regra condicionada a
 * prefers-color-scheme, avaliada em runtime - e Appearance.setColorScheme()
 * troca o tema inteiro sem var() viva nenhuma, que e exatamente o que o
 * inliner dele nao tolera. O provider faz esse set a partir da prop `theme`.
 * Fontes ficam de fora ate o app carrega-las com expo-font; sem a fonte
 * instalada, o nome vira erro.
 */
const dark = tokens.themes["rivocode-dark"];
const light = tokens.themes["rivocode-light"];
const themeLines = [
  ...Object.entries(dark).map(([role, darkColor]) => {
    const lightColor = (light as Record<string, string>)[role];
    const value =
      lightColor && lightColor !== darkColor
        ? `light-dark(${lightColor}, ${darkColor})`
        : darkColor;
    return `  --color-${role}: ${value};`;
  }),
  ...Object.entries(scales)
    .filter(([name]) => name.startsWith("radius-"))
    .map(([name, value]) => `  --${name}: ${value}px;`),
  ...Object.entries(scales)
    .filter(([name]) => name.startsWith("text-"))
    .flatMap(([name, value]) => {
      // O par --text-X--line-height e a sintaxe que o Tailwind 4 le para dar
      // altura de linha a cada tamanho. Titulo aperta, corpo respira - os
      // mesmos leading-tight e leading-normal do web.
      const leading = value >= 20 ? scales["leading-tight"] : scales["leading-normal"];
      return [
        `  --${name}: ${value}px;`,
        `  --${name}--line-height: ${Math.round(value * leading)}px;`,
      ];
    }),
];

const themeCss = `/* Gerado por scripts/gen-native-tokens.ts. Nao editar: rode bun run gen:native. */

/* So o @theme: o build do Tailwind ja o materializa em :root sozinho, e uma
   segunda declaracao da mesma variavel derruba o inliner do compilador
   nativo. O light-dark() vira regra de prefers-color-scheme no compilador,
   e o provider troca o tema em runtime com Appearance.setColorScheme(). */
@theme {
${themeLines.join("\n")}
}
`;

const ts = `/* Gerado por scripts/gen-native-tokens.ts. Nao editar: rode bun run gen:native. */

export const tokens = ${JSON.stringify(tokens, null, 2)} as const;

export type RivoNativeTheme = keyof typeof tokens.themes;
export type RivoNativeColorRole = keyof (typeof tokens.themes)["rivocode-dark"];
`;

// No modo check nada e escrito: compara o comitado com o que os CSS pedem
// agora, e falha ANTES de esconder a diferenca.
/* ---------------------------------------------------------------------------
 * O tema de cliente
 *
 * A camada 3 do web e um arquivo CSS com os 51 papeis num seletor de tema.
 * Aqui ele vira o mapa que o `RivoProvider` do nativo veste. A fonte e a
 * mesma nos dois lados de proposito: um segundo lugar para manter a cor de um
 * cliente e como a promessa se quebra na pratica - nao por decisao, por
 * divergencia silenciosa seis meses depois.
 *
 *   bun run gen:native --tema tema-acme.css --saida acme.theme.ts
 *
 * O arquivo pode trazer um seletor so, que serve aos dois esquemas, ou o par
 * `x-light` e `x-dark`, que e a convencao dos temas de casa.
 * ------------------------------------------------------------------------- */

const themeArg = process.argv.indexOf("--tema");

if (themeArg !== -1) {
  const source = process.argv[themeArg + 1];
  if (!source) {
    console.error("Falta o arquivo: bun run gen:native --tema tema-acme.css");
    process.exit(1);
  }

  const outArg = process.argv.indexOf("--saida");
  const target = outArg !== -1 ? process.argv[outArg + 1]! : source.replace(/\.css$/, ".theme.ts");
  const css = await read(source);

  /** Cada bloco `[data-rc-theme="x"] { ... }` do arquivo, por nome. */
  const blocks = new Map<string, string>();
  for (const block of css.matchAll(/\[data-rc-theme=["']([\w-]+)["']\]\s*\{([\s\S]*?)\}/g)) {
    blocks.set(block[1]!, block[2]!);
  }

  if (blocks.size === 0) {
    console.error(`Nenhum [data-rc-theme="..."] em ${source}: e ele que declara a camada 3.`);
    process.exit(1);
  }

  const colorsOf = (body: string) => {
    const colors: Record<string, string> = {};
    for (const [name, value] of declarations(body)) {
      const color = toNativeColor(value, palette);
      if (color) colors[name] = color;
    }
    return colors;
  };

  // `acme-light` e `acme-dark` sao o mesmo tema em dois esquemas; um nome
  // solto veste os dois, porque um tema de um esquema so e uma escolha
  // legitima - e melhor do que inventar o outro por conta propria.
  const names = [...blocks.keys()];
  const base = names[0]!.replace(/-(light|dark)$/, "");
  const light = blocks.get(`${base}-light`) ?? blocks.get(base) ?? blocks.get(names[0]!)!;
  const dark = blocks.get(`${base}-dark`) ?? blocks.get(base) ?? blocks.get(names[0]!)!;

  const map = { light: colorsOf(light), dark: colorsOf(dark) };
  const missing = Object.keys(tokens.themes["rivocode-dark"]).filter(
    (role) => !(role in map.light) || !(role in map.dark),
  );

  await Bun.write(
    target,
    `/* Gerado de ${source} por bun run gen:native --tema. Nao editar. */\n` +
      `import type { RivoNativeThemeMap } from "@rivocode/ui-native";\n\n` +
      `export const ${base.replace(/-/g, "")}Theme: RivoNativeThemeMap = ${JSON.stringify(map, null, 2)};\n`,
  );

  console.log(`${target}: ${Object.keys(map.light).length} papeis, claro e escuro.`);
  if (missing.length > 0) {
    // Papel faltando nao e detalhe: a peca que o pede herda a cor da RivoCode,
    // e isso so aparece na tela do cliente, meses depois.
    console.error(`\n${missing.length} papel(eis) sem valor no tema: ${missing.join(", ")}`);
    process.exit(1);
  }
  process.exit(0);
}

if (process.argv.includes("--check")) {
  const committedJson = await read("native/tokens.json").catch(() => "");
  const committedTheme = await read("native/theme.css").catch(() => "");
  if (committedJson !== json || committedTheme !== themeCss) {
    console.error("native/ divergiu dos CSS. Rode: bun run gen:native");
    process.exit(1);
  }
  console.log("native/ em dia com os CSS.");
  process.exit(0);
}

await Bun.write("native/tokens.json", json);
await Bun.write("native/tokens.ts", ts);
await Bun.write("native/theme.css", themeCss);

console.log(
  `native/tokens.json e tokens.ts: ${palette.size} cores cruas, ${
    Object.keys(scales).length
  } escalas, 2 temas.`,
);

export {};
