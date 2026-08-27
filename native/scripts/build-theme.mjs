#!/usr/bin/env node
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  MIN_TEXT,
  checkThemeMap,
  contrastRatio,
  outsideSrgb,
  refusalOf,
  toHex,
} from "./contrast.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = JSON.parse(readFileSync(resolve(HERE, "..", "package.json"), "utf8"));
const TOKENS = JSON.parse(readFileSync(resolve(HERE, "..", "tokens.json"), "utf8"));

export const ROLES = Object.keys(TOKENS.themes["rivocode-dark"]);
export const HOUSE = TOKENS.themes;

export const SEEDS = ["bg", "surface", "fg", "accent", "success", "warning", "danger", "info"];

const SAME = { "surface-raised": "surface", ring: "accent-text" };

const ALPHA = {
  overlay: { from: "ink", light: 0.42, dark: 0.62 },
  skeleton: { from: "fg", light: 0.08, dark: 0.08 },
  border: { from: "fg", light: 0.1, dark: 0.09 },
  "border-strong": { from: "fg", light: 0.48, dark: 0.38 },
  "border-disabled": { from: "fg", light: 0.3, dark: 0.22 },
  "line-hover": { from: "fg", light: 0.62, dark: 0.5 },
  selected: { from: "accent", light: 0.16, dark: 0.05 },
  "accent-subtle": { from: "accent", light: 0.22, dark: 0.14 },
  "success-subtle": { from: "success", light: 0.1, dark: 0.14 },
  "warning-subtle": { from: "warning", light: 0.1, dark: 0.14 },
  "danger-subtle": { from: "danger", light: 0.1, dark: 0.14 },
  "info-subtle": { from: "info", light: 0.1, dark: 0.14 },
};

const MIX = {
  "fg-muted": { from: "fg", toward: "bg", keep: 0.7 },
  "fg-subtle": { from: "fg", toward: "bg", keep: 0.62 },
  "fg-disabled": { from: "fg", toward: "bg", keep: 0.45 },
  "accent-hover": { from: "accent", toward: "paper", keep: 0.85 },
  "accent-active": { from: "accent", toward: "ink", keep: 0.9 },
};

const OVER = {
  "accent-fg": ["accent", "accent-active"],
  "success-fg": ["success"],
  "warning-fg": ["warning"],
  "danger-fg": ["danger"],
  "info-fg": ["info"],
};

const REUSE = {
  "accent-text": "accent",
  "success-text": "success",
  "warning-text": "warning",
  "danger-text": "danger",
  "info-text": "info",
};

const HOUSE_DEFAULT = ROLES.filter((role) => /^chart-\d+$/.test(role));

export const EXPLAIN = {
  ...Object.fromEntries(
    Object.entries(SAME).map(([role, from]) => [role, `igual a \`${from}\``]),
  ),
  ...Object.fromEntries(
    Object.entries(ALPHA).map(([role, how]) => [
      role,
      `alfa de \`${how.from}\` (${how.light} no claro, ${how.dark} no escuro)`,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(MIX).map(([role, how]) => [
      role,
      `\`${how.from}\` puxado ${Math.round((1 - how.keep) * 100)}% para \`${how.toward}\``,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(OVER).map(([role, fills]) => [
      role,
      `o tom de \`fg\`/\`bg\` que pesa mais sobre ${fills.map((fill) => `\`${fill}\``).join(" e ")},` +
        " e o branco ou o preto puro quando nenhum dos dois alcanca 4,5:1",
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(REUSE).map(([role, from]) => [
      role,
      `o proprio \`${from}\`, e so quando ele passa em 4,5:1; senao o comando recusa`,
    ]),
  ),
  ...Object.fromEntries(
    HOUSE_DEFAULT.map((role) => [role, "a serie da RivoCode, medida sobre o SEU fundo"]),
  ),
};

export const DERIVED = Object.keys(EXPLAIN);

const MAP_EMITTER = {
  on: false,
  why:
    "O emissor do `RivoNativeThemeMap` esta escrito e desligado nesta versao.\n" +
    "    As pecas que pintavam fora da classe passaram a resolver a cor do CSS\n" +
    "    compilado em runtime, e com isso o mapa deixou de ter o que fazer: um\n" +
    "    segundo lugar para manter a cor de um cliente e como a promessa se quebra\n" +
    "    seis meses depois, por divergencia calada.\n" +
    "    Se aquele caminho falhar no aparelho, ligue de volta a bandeira\n" +
    "    `MAP_EMITTER.on` em native/scripts/build-theme.mjs - o formato respeitado\n" +
    "    aqui e o do `bun run gen:native --tema`, e nao um inventado por este\n" +
    "    comando. Ate la, o mapa sai por la.",
};

const REFUSED = {
  alpha:
    "carrega alfa. Semente e cor CHEIA: a escada de alfa desta casa sai dela - `border`, `border-strong`, `selected`, `overlay` e os cinco `*-subtle` -, e semente translucida faria alfa sobre alfa sem ninguem ter pedido. Escreva a cor por baixo.",
  mix: "`color-mix()` nao e uma cor, e uma conta que so o navegador resolve: o resultado depende do espaco de interpolacao, do metodo de matiz e de quanto sobra de cada lado. Escreva o resultado, ou converta.",
  syntax: "nao e uma cor que esta conta reconhece. Ela le hexadecimal de 3, 4, 6 e 8 digitos, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()` e `color()` nos espacos predefinidos do CSS. Nome de cor da CSS - `rebeccapurple` - nao entra: o pacote nao carrega a tabela de nomes.",
};

export function normalizeHex(value) {
  return toHex(String(value ?? "").trim()) ?? null;
}

const bytes = (hex) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
const hex = (parts) => `#${parts.map((part) => Math.max(0, Math.min(255, Math.round(part))).toString(16).padStart(2, "0")).join("")}`;

export function mix(from, toward, keep) {
  const a = bytes(from);
  const b = bytes(toward);
  return hex(a.map((part, at) => keep * part + (1 - keep) * b[at]));
}

export function withAlpha(color, amount) {
  return `rgba(${bytes(color).join(",")},${amount})`;
}

const WHITE = "#ffffff";
const BLACK = "#000000";

export const isDarkScheme = (bg) => contrastRatio(bg, WHITE) > contrastRatio(bg, BLACK);

export function failuresOf(map, slot, role) {
  const named = new RegExp(`(^|\\s)${role.replace(/-/g, "\\-")}(?![\\w-])`);
  let scheme = "light";
  let count = 0;
  for (const finding of checkThemeMap("medida", map, ROLES)) {
    const header = /\/\s*(light|dark)\s*$/.exec(finding.line);
    if (header) {
      scheme = header[1];
      continue;
    }
    if (!finding.ok && scheme === slot && named.test(finding.line)) count++;
  }
  return count;
}

export function suggestFor(slots, slot, role) {
  const from = REUSE[role];
  if (!from) return undefined;
  const fill = slots[slot].colors[from];
  const toward = isDarkScheme(slots[slot].colors.bg) ? WHITE : BLACK;
  for (let step = 1; step <= 50; step++) {
    const candidate = mix(fill, toward, 1 - step / 50);
    const map = {
      light: slot === "light" ? { ...slots.light.colors, [role]: candidate } : slots.light.colors,
      dark: slot === "dark" ? { ...slots.dark.colors, [role]: candidate } : slots.dark.colors,
    };
    if (failuresOf(map, slot, role) === 0) return candidate;
  }
  return undefined;
}

export const ANCHORS = ["bg", "fg"];

export function derive(seeds, slot) {
  const loose = ANCHORS.filter((role) => !seeds[role]);
  if (loose.length > 0) {
    throw new Error(`sem ${loose.join(" e ")}: e deles que saem o claro, o escuro e a escada de alfa`);
  }
  const colors = {};
  const scheme = isDarkScheme(seeds.bg) ? "dark" : "light";
  const ink = contrastRatio(seeds.fg, WHITE) > contrastRatio(seeds.bg, WHITE) ? seeds.fg : seeds.bg;
  const paper = ink === seeds.fg ? seeds.bg : seeds.fg;
  const anchors = { ...seeds, ink, paper };

  for (const role of ROLES) colors[role] = seeds[role];

  const put = (role, value) => {
    if (colors[role] === undefined && value !== undefined) colors[role] = value;
  };

  for (const [role, from] of Object.entries(REUSE)) put(role, colors[from] ?? anchors[from]);

  for (const [role, how] of Object.entries(MIX)) {
    const from = colors[how.from] ?? anchors[how.from];
    const toward = colors[how.toward] ?? anchors[how.toward];
    if (from && toward) put(role, mix(from, toward, how.keep));
  }

  for (const [role, fills] of Object.entries(OVER)) {
    const solid = fills.map((fill) => colors[fill] ?? anchors[fill]).filter(Boolean);
    if (solid.length !== fills.length) continue;
    const score = (candidate) => Math.min(...solid.map((fill) => contrastRatio(candidate, fill)));
    const own = score(ink) >= score(paper) ? ink : paper;
    const extreme = score(BLACK) >= score(WHITE) ? BLACK : WHITE;
    put(role, score(own) >= MIN_TEXT ? own : extreme);
  }

  for (const [role, from] of Object.entries(SAME)) put(role, colors[from]);

  for (const [role, how] of Object.entries(ALPHA)) {
    const from = colors[how.from] ?? anchors[how.from];
    if (from) put(role, withAlpha(from, how[scheme]));
  }

  for (const role of HOUSE_DEFAULT) put(role, HOUSE[`rivocode-${scheme}`][role]);

  const written = ROLES.filter((role) => seeds[role] !== undefined);
  const guessed = ROLES.filter((role) => seeds[role] === undefined && colors[role] !== undefined);
  const missing = ROLES.filter((role) => colors[role] === undefined);

  return { slot, scheme, colors, written, guessed, missing };
}

export function readPalette(path) {
  return import(pathToFileURL(path).href).then((loaded) => {
    const found = Object.entries(loaded).filter(
      ([, value]) => typeof value === "object" && value !== null && !Array.isArray(value),
    );
    const withSchemes = found.filter(([, value]) => "light" in value || "dark" in value);
    return withSchemes.length > 0 ? withSchemes : found;
  });
}

export function schemesOf(palette) {
  const entries = Object.entries(palette);
  const nested = entries.filter(([, value]) => typeof value === "object" && value !== null);
  if (nested.length === 0) return { names: ["*"], slots: { light: palette, dark: palette } };
  const names = nested.map(([name]) => name);
  if (nested.length === 1) {
    const [, only] = nested[0];
    return { names, slots: { light: only, dark: only } };
  }
  if (nested.length === 2 && names.includes("light") && names.includes("dark")) {
    return { names, slots: { light: palette.light, dark: palette.dark } };
  }
  return { names, slots: undefined };
}

export function unreadable(colors) {
  const bad = [];
  for (const [role, value] of Object.entries(colors)) {
    if (typeof value !== "string") continue;
    if (normalizeHex(value)) continue;
    const why = refusalOf(value) ?? "alpha";
    bad.push({ role, value: value.trim(), why });
  }
  return bad;
}

export function outsideGamut(colors) {
  const wide = [];
  for (const [role, value] of Object.entries(colors)) {
    if (typeof value !== "string") continue;
    if (outsideSrgb(value)) wide.push({ role, value: value.trim(), hex: normalizeHex(value) });
  }
  return wide;
}

export function emitCss(slots, source) {
  const lines = ROLES.map((role) => {
    const light = slots.light.colors[role];
    const dark = slots.dark.colors[role];
    const value = light === dark ? light : `light-dark(${light}, ${dark})`;
    return `  --color-${role}: ${value};`;
  });

  return (
    `/* Gerado de ${source} por rivocode-ui-native-theme. Nao editar: rode o comando de novo. */\n\n` +
    `/* Importe DEPOIS de "@rivocode/ui-native/theme.css", no global.css do app:\n` +
    `     @import "@rivocode/ui-native/theme.css";\n` +
    `     @import "./${basename(source).replace(/\.[^.]+$/, "")}.theme.css";\n` +
    `   e rode "npx rivocode-ui-native-css" para o generated.css sair com a marca. */\n\n` +
    `@theme {\n${lines.join("\n")}\n}\n`
  );
}

export function emitMap(slots, source, name) {
  const map = { light: slots.light.colors, dark: slots.dark.colors };
  return (
    `/* Gerado de ${source} por rivocode-ui-native-theme --mapa. Nao editar. */\n` +
    `import type { RivoNativeThemeMap } from "@rivocode/ui-native";\n\n` +
    `export const ${name}Theme: RivoNativeThemeMap = ${JSON.stringify(map, null, 2)};\n`
  );
}

export function report(slots, name) {
  const label = { light: "claro", dark: "escuro" };
  const map = { light: slots.light.colors, dark: slots.dark.colors };
  const findings = checkThemeMap(name, map, ROLES);
  const failures = { light: [], dark: [] };
  let scheme = "light";

  for (const finding of findings) {
    const header = /\/\s*(light|dark)\s*$/.exec(finding.line);
    if (header) {
      scheme = header[1];
      continue;
    }
    if (!finding.ok) failures[scheme].push(finding.line.trim().replace(/^(FALHA|FALTA)\s+/, ""));
  }

  const text = ["Guarda de contraste:"];
  for (const slot of ["light", "dark"]) {
    const lines = failures[slot];
    text.push(`  ${label[slot]}: ${lines.length === 0 ? "passa" : `${lines.length} falha(s)`}`);
    for (const line of lines) text.push(`    ${line}`);
  }

  return { failures, text: text.join("\n") };
}

function distance(a, b) {
  const grid = Array.from({ length: a.length + 1 }, (_, row) => [row, ...Array(b.length).fill(0)]);
  for (let column = 0; column <= b.length; column++) grid[0][column] = column;
  for (let row = 1; row <= a.length; row++) {
    for (let column = 1; column <= b.length; column++) {
      grid[row][column] = Math.min(
        grid[row - 1][column] + 1,
        grid[row][column - 1] + 1,
        grid[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
    }
  }
  return grid[a.length][b.length];
}

function wrap(text, width = 72, indent = "    ") {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join(`\n${indent}`);
}

const die = (message) => {
  console.error(message);
  process.exit(1);
};

async function main() {
  const argv = process.argv.slice(2);
  const flags = argv.filter((argument) => argument.startsWith("-"));
  const files = argv.filter((argument) => !argument.startsWith("-"));

  if (flags.includes("--mapa") && !MAP_EMITTER.on) {
    die(`--mapa esta desligado.\n\n    ${MAP_EMITTER.why}`);
  }

  if (flags.includes("--papeis")) {
    console.log(
      `Os ${ROLES.length} papeis do @rivocode/ui-native ${PACKAGE.version}.\n\n` +
        `Voce escreve ${SEEDS.length}, por esquema:\n` +
        SEEDS.map((role) => `  ${role}`).join("\n") +
        `\n\nO comando deriva ${DERIVED.length}, e nunca inventa matiz nova - so reusa cor\n` +
        `que voce escreveu, ou compoe alfa dela:\n` +
        DERIVED.map((role) => `  ${role.padEnd(18)} ${EXPLAIN[role]}`).join("\n") +
        "\n\nQualquer um deles se escreve a mao para o comando parar de derivar.",
    );
    process.exit(0);
  }

  const source = files[0];
  if (!source) {
    die(
      "Falta a paleta: rivocode-ui-native-theme meu-tema.ts [saida.css]\n\n" +
        "    A paleta e um arquivo .ts, .js, .mjs ou .json que exporta `light` e\n" +
        `    \`dark\` com os ${SEEDS.length} papeis de semente: ${SEEDS.join(", ")}.\n` +
        "    `rivocode-ui-native-theme --papeis` lista o que o comando deriva.",
    );
  }

  const path = resolve(process.cwd(), source);
  const base = basename(source).replace(/\.[^.]+$/, "");
  const output = files[1] ?? resolve(dirname(path), `${base}.theme.css`);

  const candidates = await readPalette(path).catch((error) =>
    die(
      `Nao consegui carregar ${source}: ${error.message}\n\n` +
        "    O arquivo tem que exportar um objeto. `.ts` roda direto no Node 22.6+\n" +
        "    (o Node apaga os tipos); em Node mais antigo, salve a paleta como\n" +
        "    `.mjs` ou `.json`, que nao dependem de loader nenhum.",
    ),
  );

  if (candidates.length === 0) {
    die(
      `Nenhum objeto exportado em ${source}.\n\n` +
        "    Esperado: `export const acme = { light: { ... }, dark: { ... } };`",
    );
  }

  const [, palette] = candidates[0];
  const { names, slots: raw } = schemesOf(palette);

  if (!raw) {
    die(
      `${names.length} esquemas em ${source}: ${names.join(", ")}.\n\n` +
        "    Cabem dois, e o teto nao e escolha nossa. Cada papel sai como\n" +
        "    `light-dark(claro, escuro)`, e `light-dark()` tem DUAS vagas: uma clara\n" +
        "    e uma escura. O compilador do react-native-css crava o valor dentro da\n" +
        "    regra - nos KB de CSS compilado nao sobra uma variavel viva no aparelho\n" +
        "    -, entao nao ha terceira vaga para nada trocar em runtime.\n\n" +
        "    Um terceiro esquema e um terceiro BUNDLE: rode o comando uma vez por par\n" +
        "    e escolha o CSS no build. Uma vitrine de cinco temas, como a do web, nao\n" +
        "    cabe sem cinco bundles.\n\n" +
        "    Se os dois que voce quer sao dois destes, deixe so eles no arquivo, com\n" +
        "    os nomes `light` e `dark`.",
    );
  }

  const strange = [];
  for (const slot of ["light", "dark"]) {
    for (const role of Object.keys(raw[slot])) {
      if (ROLES.includes(role)) continue;
      const meant = ROLES.find((known) => distance(role, known) <= 2);
      strange.push(`    ${slot}.${role}${meant ? `  - quis dizer \`${meant}\`?` : ""}`);
    }
  }
  if (strange.length > 0) {
    die(
      `${strange.length} nome(s) na paleta que o @rivocode/ui-native ${PACKAGE.version} nao tem:\n` +
        strange.join("\n") +
        `\n\n    A lista de papeis sai de \`tokens.json\` do pacote instalado, e nao de\n` +
        "    uma copia dentro deste comando: papel que sumiu numa versao nova e\n" +
        "    acusado aqui em vez de ficar sem efeito calado.\n" +
        "    `rivocode-ui-native-theme --papeis` lista os que valem.",
    );
  }

  const blind = [];
  for (const slot of ["light", "dark"]) {
    for (const bad of unreadable(raw[slot])) blind.push({ slot, ...bad });
  }
  if (blind.length > 0) {
    const reasons = [...new Set(blind.map(({ why }) => why))];
    die(
      `${blind.length} cor(es) que a conta de contraste nao sabe ler:\n` +
        blind.map(({ slot, role, value }) => `    ${slot}.${role}: ${value}`).join("\n") +
        "\n\n" +
        reasons.map((why) => `    ${wrap(REFUSED[why])}`).join("\n\n") +
        "\n\n    A conta le OKLCH, OKLab, LCH, Lab, HSL, HWB, `color()` e sRGB, e\n" +
        "    converte tudo para sRGB antes de medir - a paleta do Tailwind 4 entra\n" +
        "    direto, sem passar por conversor. O que sobra acima e o que nao tem\n" +
        "    medida possivel, e nao uma conversao que falta.\n\n" +
        "    Gerar sem medir seria escrever um tema que ninguem mediu, que e\n" +
        "    exatamente o que este comando existe para nao deixar acontecer.",
    );
  }

  const seeded = {};
  for (const slot of ["light", "dark"]) {
    seeded[slot] = {};
    for (const [role, value] of Object.entries(raw[slot])) seeded[slot][role] = normalizeHex(value);
  }

  const loose = [];
  for (const slot of ["light", "dark"]) {
    for (const role of ANCHORS) {
      if (!seeded[slot][role]) loose.push(`    ${slot}.${role}`);
    }
  }
  if (loose.length > 0) {
    die(
      `${loose.length} papel(eis) de ancora sem valor:\n` +
        loose.join("\n") +
        `\n\n    \`${ANCHORS.join("` e `")}\` sao os dois de onde sai todo o resto: e por\n` +
        "    eles que o comando sabe se o esquema e claro ou escuro, qual e a\n" +
        "    escada de alfa, e qual tom pesa mais sobre um botao. Sem eles nao ha\n" +
        "    o que derivar, e nem o que medir.",
    );
  }

  const slots = {};
  for (const slot of ["light", "dark"]) slots[slot] = derive(seeded[slot], slot);

  const holes = [];
  for (const slot of ["light", "dark"]) {
    for (const role of slots[slot].missing) {
      const known = DERIVED.includes(role) || SEEDS.includes(role);
      holes.push(
        `    ${slot}.${role}` +
          (SEEDS.includes(role)
            ? "  - e semente: nao ha de onde derivar"
            : known
              ? `  - sairia de: ${EXPLAIN[role]} - e a fonte tambem falta`
              : `  - papel novo no @rivocode/ui-native ${PACKAGE.version}, e este comando ainda nao sabe derivar`),
      );
    }
  }
  if (holes.length > 0) {
    die(
      `${holes.length} papel(eis) sem valor:\n` +
        holes.join("\n") +
        "\n\n    Papel sem valor nao da erro no aparelho: a peca herda a cor da\n" +
        "    RivoCode e a tela sai misturada, metade do cliente e metade nossa.\n" +
        "    Por isso ele para o comando aqui, e nao no celular meses depois.\n" +
        "    `rivocode-ui-native-theme --papeis` diz o que cada um faz.",
    );
  }

  const { failures, text } = report(slots, base);
  const broken = [...failures.light, ...failures.dark];

  if (broken.length > 0) {
    const advice = [];
    const said = new Set();
    for (const slot of ["light", "dark"]) {
      for (const line of failures[slot]) {
        const role = line.split(/\s+/)[0];
        if (!slots[slot].guessed.includes(role)) continue;
        if (said.has(`${slot}.${role}`)) continue;
        said.add(`${slot}.${role}`);
        const suggestion = suggestFor(slots, slot, role);
        advice.push(
          `    ${slot}.${role} foi DERIVADO: ${EXPLAIN[role]}.` +
            (suggestion
              ? `\n      \`${role}: "${suggestion}"\` passaria - confira se e a cor da marca.`
              : "\n      Escreva-o na paleta para o comando parar de derivar."),
        );
      }
    }

    die(
      `${text}\n\n` +
        (advice.length > 0
          ? `${advice.join("\n")}\n\n    O comando nao inventa matiz nova: ele so reusa cor que voce\n` +
            "    escreveu, ou compoe alfa dela. Papel derivado errado e pior que\n" +
            "    papel pedido, entao onde reusar nao passa ele recusa e diz o numero.\n\n"
          : "") +
        "Nada foi escrito: conserte o contraste antes de gerar o CSS.",
    );
  }

  if (flags.includes("--mapa")) {
    const target = resolve(dirname(path), `${base}.theme.ts`);
    writeFileSync(target, emitMap(slots, source, base.replace(/-/g, "")));
    console.log(`${target}: ${ROLES.length} papeis, claro e escuro.`);
  }

  const css = emitCss(slots, source);
  writeFileSync(output, css);

  const written = slots.light.written.length;
  console.log(text);
  console.log(
    `\n${output}: ${ROLES.length} papeis, claro e escuro. ` +
      `${written} escrito(s) por voce, ${ROLES.length - written} derivado(s).`,
  );
  if (slots.light.guessed.some((role) => HOUSE_DEFAULT.includes(role))) {
    console.log(
      `\nAviso: chart-1 a chart-8 sairam na serie da RivoCode, medida sobre o SEU\n` +
        "fundo e aprovada. Serie de grafico nao e identidade de marca, e por isso\n" +
        "ela tem padrao; escreva-a na paleta se a marca tiver a dela.",
    );
  }
  const wide = [];
  for (const slot of ["light", "dark"]) {
    for (const found of outsideGamut(raw[slot])) wide.push({ slot, ...found });
  }
  if (wide.length > 0) {
    console.log(
      `\nAviso: ${wide.length} cor(es) da paleta descreve(m) tom que o sRGB nao\n` +
        "alcanca. A tela corta o excedente canal por canal, e e o valor CORTADO\n" +
        "que foi medido e escrito - o mesmo pixel que o aparelho mostra:\n" +
        wide.map(({ slot, role, value, hex }) => `  ${slot}.${role}: ${value} -> ${hex}`).join("\n"),
    );
  }
  if (slots.light.colors.bg && isDarkScheme(slots.light.colors.bg)) {
    console.log(
      "\nAviso: o esquema `light` tem fundo escuro. As vagas do `light-dark()` sao\n" +
        "por nome, e nao por medida: o aparelho no modo claro vai mostrar este.",
    );
  }
}

const entry = process.argv[1]
  ? pathToFileURL(realpathSync(process.argv[1])).href
  : undefined;

if (entry === import.meta.url) {
  await main();
}

export { MAP_EMITTER };
