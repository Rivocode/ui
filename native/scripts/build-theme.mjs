#!/usr/bin/env node
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
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
    Object.entries(SAME).map(([role, from]) => [role, `same as \`${from}\``]),
  ),
  ...Object.fromEntries(
    Object.entries(ALPHA).map(([role, how]) => [
      role,
      `alpha of \`${how.from}\` (${how.light} in light, ${how.dark} in dark)`,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(MIX).map(([role, how]) => [
      role,
      `\`${how.from}\` pulled ${Math.round((1 - how.keep) * 100)}% toward \`${how.toward}\``,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(OVER).map(([role, fills]) => [
      role,
      `the \`fg\`/\`bg\` tone that weighs more over ${fills.map((fill) => `\`${fill}\``).join(" and ")},` +
        " and pure white or black when neither reaches 4.5:1",
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(REUSE).map(([role, from]) => [
      role,
      `\`${from}\` itself, and only when it passes 4.5:1; otherwise the command refuses`,
    ]),
  ),
  ...Object.fromEntries(
    HOUSE_DEFAULT.map((role) => [role, "the RivoCode series, measured over YOUR background"]),
  ),
};

export const DERIVED = Object.keys(EXPLAIN);

const MAP_EMITTER = {
  on: false,
  why:
    "The object theme map emitter is written and switched off in this version.\n" +
    "    The components that painted outside the class now resolve the color from\n" +
    "    the compiled CSS at runtime, and with that the map has nothing left to do:\n" +
    "    a second place to keep a client's color is how the promise breaks six\n" +
    "    months later, through silent divergence.\n" +
    "    If that path fails on the device, switch the flag\n" +
    "    `MAP_EMITTER.on` in native/scripts/build-theme.mjs back on - the format\n" +
    "    honored here is the one from `bun run gen:native --theme`, not one invented\n" +
    "    by this command. Until then, the map comes from there.",
};

const REFUSED = {
  alpha:
    "carries alpha. A seed is a SOLID color: this house's alpha ladder comes from it - `border`, `border-strong`, `selected`, `overlay` and the five `*-subtle` -, and a translucent seed would make alpha over alpha without anyone asking. Write the color underneath.",
  mix: "`color-mix()` is not a color, it is a calculation only the browser resolves: the result depends on the interpolation space, the hue method and how much is left on each side. Write the result, or convert it.",
  syntax: "is not a color this calculation recognizes. It reads 3, 4, 6 and 8 digit hexadecimal, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()` and `color()` in the predefined CSS spaces. A CSS color name - `rebeccapurple` - is not accepted: the package does not ship the name table.",
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
  for (const finding of checkThemeMap("measure", map, ROLES)) {
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
    throw new Error(`missing ${loose.join(" and ")}: light, dark and the alpha ladder come from them`);
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

export function candidatesOf(loaded) {
  const found = Object.entries(loaded).filter(
    ([, value]) => typeof value === "object" && value !== null && !Array.isArray(value),
  );
  const withSchemes = found.filter(([, value]) => "light" in value || "dark" in value);
  if (withSchemes.length > 0) return withSchemes;
  if (found.some(([name]) => name === "light" || name === "dark")) {
    return [["light and dark", Object.fromEntries(found)]];
  }
  return found;
}

export async function readPalette(path) {
  if (extname(path) === ".json") {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    const found = candidatesOf(parsed);
    if (found.length > 0) return found;
    return Object.values(parsed).some((value) => typeof value === "string")
      ? [[basename(path), parsed]]
      : [];
  }
  return candidatesOf(await import(pathToFileURL(path).href));
}

export function schemesOf(palette) {
  const entries = Object.entries(palette);
  const nested = entries.filter(([, value]) => typeof value === "object" && value !== null);
  if (nested.length === 0) {
    return { names: ["*"], paired: false, slots: { light: palette, dark: palette } };
  }
  const names = nested.map(([name]) => name);
  if (nested.length === 1) {
    const [, only] = nested[0];
    return { names, paired: false, slots: { light: only, dark: only } };
  }
  if (nested.length === 2 && names.includes("light") && names.includes("dark")) {
    return { names, paired: true, slots: { light: palette.light, dark: palette.dark } };
  }
  return { names, paired: false, slots: undefined };
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
    `/* Generated from ${source} by rivocode-ui-native-theme. Do not edit: run the command again. */\n\n` +
    `/* Import AFTER "@rivocode/ui-native/theme.css", in the app's global.css:\n` +
    `     @import "@rivocode/ui-native/theme.css";\n` +
    `     @import "./${basename(source).replace(/\.[^.]+$/, "")}.theme.css";\n` +
    `   and run "npx rivocode-ui-native-css" so generated.css comes out with the brand. */\n\n` +
    `@theme {\n${lines.join("\n")}\n}\n`
  );
}

export function emitMap(slots, source, name) {
  const map = { light: slots.light.colors, dark: slots.dark.colors };
  return (
    `/* Generated from ${source} by rivocode-ui-native-theme --map. Do not edit. */\n` +
    `type ThemeMap = { light: Record<string, string>; dark: Record<string, string> };\n\n` +
    `export const ${name}Theme: ThemeMap = ${JSON.stringify(map, null, 2)};\n`
  );
}

export function report(slots, name) {
  const label = { light: "light", dark: "dark" };
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
    if (!finding.ok) failures[scheme].push(finding.line.trim().replace(/^(FALHA|FALTA|FAIL|MISSING)\s+/, ""));
  }

  const text = ["Contrast guard:"];
  for (const slot of ["light", "dark"]) {
    const lines = failures[slot];
    text.push(`  ${label[slot]}: ${lines.length === 0 ? "passes" : `${lines.length} failure(s)`}`);
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
  const wantsMap = flags.includes("--map") || flags.includes("--mapa");
  const wantsRoles = flags.includes("--roles") || flags.includes("--papeis");
  const files = argv.filter((argument) => !argument.startsWith("-"));

  if (wantsMap && !MAP_EMITTER.on) {
    die(`--map is switched off.\n\n    ${MAP_EMITTER.why}`);
  }

  if (wantsRoles) {
    console.log(
      `The ${ROLES.length} roles of @rivocode/ui-native ${PACKAGE.version}.\n\n` +
        `You write ${SEEDS.length}, per scheme:\n` +
        SEEDS.map((role) => `  ${role}`).join("\n") +
        `\n\nThe command derives ${DERIVED.length}, and never invents a new hue - it only reuses a color\n` +
        `you wrote, or composes alpha from it:\n` +
        DERIVED.map((role) => `  ${role.padEnd(18)} ${EXPLAIN[role]}`).join("\n") +
        "\n\nAny of them can be written by hand to make the command stop deriving it.",
    );
    process.exit(0);
  }

  const source = files[0];
  if (!source) {
    die(
      "Missing the palette: rivocode-ui-native-theme my-theme.ts [output.css]\n\n" +
        "    The palette is a .ts, .js, .mjs or .json file that exports `light` and\n" +
        `    \`dark\` with the ${SEEDS.length} seed roles: ${SEEDS.join(", ")}.\n` +
        "    `rivocode-ui-native-theme --roles` lists what the command derives.\n" +
        "    `--papeis` and `--mapa` are still accepted as aliases of `--roles` and `--map`.",
    );
  }

  const path = resolve(process.cwd(), source);
  const base = basename(source).replace(/\.[^.]+$/, "");
  const output = files[1] ?? resolve(dirname(path), `${base}.theme.css`);

  const candidates = await readPalette(path).catch((error) =>
    die(
      `Could not load ${source}: ${error.message}\n\n` +
        "    The file must export an object. `.ts` runs directly on Node 22.6+\n" +
        "    (Node strips the types); on older Node, save the palette as\n" +
        "    `.mjs` or `.json`, which depend on no loader at all.",
    ),
  );

  if (candidates.length === 0) {
    die(
      `No object exported in ${source}.\n\n` +
        "    Expected: `export const acme = { light: { ... }, dark: { ... } };`",
    );
  }

  const [, palette] = candidates[0];
  const { names, paired, slots: raw } = schemesOf(palette);

  if (!raw) {
    die(
      `${names.length} schemes in ${source}: ${names.join(", ")}.\n\n` +
        "    Two fit, and the ceiling is not our choice. Each role comes out as\n" +
        "    `light-dark(light, dark)`, and `light-dark()` has TWO slots: a light one\n" +
        "    and a dark one. The react-native-css compiler bakes the value into the\n" +
        "    rule - in the KB of compiled CSS no live variable is left on the device\n" +
        "    -, so there is no third slot for anything to switch at runtime.\n\n" +
        "    A third scheme is a third BUNDLE: run the command once per pair\n" +
        "    and pick the CSS at build time. A five-theme showcase, like the web one,\n" +
        "    does not fit without five bundles.\n\n" +
        "    If the two you want are two of these, leave only them in the file, named\n" +
        "    `light` and `dark`.",
    );
  }

  const strange = [];
  for (const slot of ["light", "dark"]) {
    for (const role of Object.keys(raw[slot])) {
      if (ROLES.includes(role)) continue;
      const meant = ROLES.find((known) => distance(role, known) <= 2);
      strange.push(`    ${slot}.${role}${meant ? `  - did you mean \`${meant}\`?` : ""}`);
    }
  }
  if (strange.length > 0) {
    die(
      `${strange.length} name(s) in the palette that @rivocode/ui-native ${PACKAGE.version} does not have:\n` +
        strange.join("\n") +
        `\n\n    The role list comes from \`tokens.json\` of the installed package, not from\n` +
        "    a copy inside this command: a role that disappeared in a new version is\n" +
        "    flagged here instead of silently having no effect.\n" +
        "    `rivocode-ui-native-theme --roles` lists the valid ones.",
    );
  }

  const blind = [];
  for (const slot of ["light", "dark"]) {
    for (const bad of unreadable(raw[slot])) blind.push({ slot, ...bad });
  }
  if (blind.length > 0) {
    const reasons = [...new Set(blind.map(({ why }) => why))];
    die(
      `${blind.length} color(s) the contrast calculation cannot read:\n` +
        blind.map(({ slot, role, value }) => `    ${slot}.${role}: ${value}`).join("\n") +
        "\n\n" +
        reasons.map((why) => `    ${wrap(REFUSED[why])}`).join("\n\n") +
        "\n\n    The calculation reads OKLCH, OKLab, LCH, Lab, HSL, HWB, `color()` and sRGB, and\n" +
        "    converts everything to sRGB before measuring - the Tailwind 4 palette goes in\n" +
        "    directly, with no converter. What is left above is what cannot be\n" +
        "    measured at all, not a missing conversion.\n\n" +
        "    Generating without measuring would write a theme nobody measured, which is\n" +
        "    exactly what this command exists to prevent.",
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
      `${loose.length} anchor role(s) with no value:\n` +
        loose.join("\n") +
        `\n\n    \`${ANCHORS.join("` and `")}\` are the two everything else comes from: they are how\n` +
        "    the command knows whether the scheme is light or dark, what the alpha\n" +
        "    ladder is, and which tone weighs more over a button. Without them there is\n" +
        "    nothing to derive, and nothing to measure.",
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
            ? "  - is a seed: there is nothing to derive it from"
            : known
              ? `  - would come from: ${EXPLAIN[role]} - and the source is missing too`
              : `  - new role in @rivocode/ui-native ${PACKAGE.version}, and this command does not know how to derive it yet`),
      );
    }
  }
  if (holes.length > 0) {
    die(
      `${holes.length} role(s) with no value:\n` +
        holes.join("\n") +
        "\n\n    A role with no value does not error on the device: the component inherits the\n" +
        "    RivoCode color and the screen comes out mixed, half the client's and half ours.\n" +
        "    That is why it stops the command here, and not on the phone months later.\n" +
        "    `rivocode-ui-native-theme --roles` says what each one does.",
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
          `    ${slot}.${role} was DERIVED: ${EXPLAIN[role]}.` +
            (suggestion
              ? `\n      \`${role}: "${suggestion}"\` would pass - check that it is the brand color.`
              : "\n      Write it in the palette to make the command stop deriving it."),
        );
      }
    }

    die(
      `${text}\n\n` +
        (advice.length > 0
          ? `${advice.join("\n")}\n\n    The command does not invent a new hue: it only reuses a color you\n` +
            "    wrote, or composes alpha from it. A wrongly derived role is worse than\n" +
            "    a requested role, so where reusing does not pass it refuses and states the number.\n\n"
          : "") +
        "Nothing was written: fix the contrast before generating the CSS.",
    );
  }

  if (wantsMap) {
    const target = resolve(dirname(path), `${base}.theme.ts`);
    writeFileSync(target, emitMap(slots, source, base.replace(/-/g, "")));
    console.log(`${target}: ${ROLES.length} roles, light and dark.`);
  }

  const css = emitCss(slots, source);
  writeFileSync(output, css);

  const written = slots.light.written.length;
  console.log(text);
  console.log(
    `\n${output}: ${ROLES.length} roles, ` +
      `${paired ? "light and dark" : "a single scheme"}. ` +
      `${written} written by you, ${ROLES.length - written} derived.`,
  );
  if (!paired) {
    console.log(
      `\nWarning: the palette brought a single scheme (${names.join(", ")}), so the two\n` +
        "`light-dark()` slots came out equal and the CSS has no `light-dark()`\n" +
        "at all: the device shows this same theme in light and in dark mode.\n" +
        "For both modes, export `light` and `dark` with the seeds of each.",
    );
  }
  if (slots.light.guessed.some((role) => HOUSE_DEFAULT.includes(role))) {
    console.log(
      `\nWarning: chart-1 to chart-8 came out in the RivoCode series, measured over YOUR\n` +
        "background and approved. A chart series is not brand identity, which is why\n" +
        "it has a default; write it in the palette if the brand has its own.",
    );
  }
  const wide = [];
  for (const slot of ["light", "dark"]) {
    for (const found of outsideGamut(raw[slot])) wide.push({ slot, ...found });
  }
  if (wide.length > 0) {
    console.log(
      `\nWarning: ${wide.length} palette color(s) describe a tone sRGB cannot\n` +
        "reach. The screen clips the excess channel by channel, and the CLIPPED value is\n" +
        "what was measured and written - the same pixel the device shows:\n" +
        wide.map(({ slot, role, value, hex }) => `  ${slot}.${role}: ${value} -> ${hex}`).join("\n"),
    );
  }
  if (slots.light.colors.bg && isDarkScheme(slots.light.colors.bg)) {
    console.log(
      "\nWarning: the `light` scheme has a dark background. The `light-dark()` slots are\n" +
        "by name, not by measurement: the device in light mode will show this one.",
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
