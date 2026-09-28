#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  CSS_CODE,
  type Finding,
  MAP_ROLES,
  type ThemeMap,
  checkCodePair,
  checkThemeCss,
  checkThemeMap,
  readTokens,
  resolveTokens,
} from "./lib/contrast";
import { type ThemeReport, checkThemes, reportOf, themeBlocks } from "./lib/theme-check";
import { readCssTree } from "./tokens/css-tree";
import { type CssSource, exportDtcg } from "./tokens/dtcg";
import { THEME_ROLES } from "./tokens/theme-roles";

const HERE = dirname(fileURLToPath(import.meta.url));

const SKILL_SOURCE = resolve(HERE, "../skill");
const AGENT = resolve(HERE, "../agent/rivocode-ui.md");
const PACKAGE = resolve(HERE, "../package.json");
const HOUSE_CSS = resolve(HERE, "preset.css");

const HELP = `
@rivocode/ui

  rivocode-ui skill                    installs the skill in this project, in .claude/skills
  rivocode-ui skill --global           installs it for all your projects, in ~/.claude

  rivocode-ui check-theme <css...>     checks the roles and measures the contrast of your theme
  rivocode-ui check-theme <map.ts>     the same, on the map React Native wears
  rivocode-ui check-theme <...> --json the same check, in JSON, for your CI

  rivocode-ui tokens --out <dir>       writes the house tokens as DTCG 2025.10 JSON
  rivocode-ui tokens <css...> --out <dir>
                                       the same, with your theme in place of the house ones

The skill teaches the library to an agent: the contract, the choice between
similar pieces, and the addresses of the raw documentation.

check-theme asks two questions, in this order. First, whether the theme declares
every role the library expects - a missing one is not a compile error: the
build passes, and the screen is what finds out. Then, whether the pairs that carry
text, control boundaries and graphical objects reach the WCAG minimum, with alpha
composited over the background it is drawn on. It is the same math and the same
table of pairs the design system holds itself to.

The extension says which of the two theme forms you wrote: \`.css\` is web
layer 3, and the command merges the declarations by selector; \`.ts\`, \`.mjs\` or
\`.js\` is the map with \`light\` and \`dark\` that the @rivocode/ui-native
RivoProvider receives, and the command imports the module. They are two formats
of the same theme, and a single command for both - two CLIs would diverge at the
first fix only one of them received.

tokens translates the three layers into the W3C Design Tokens Community Group
format, which Tokens Studio and Figma's variable import read directly: one file
for the palette, one for the scale, one per density, one per theme, and a
resolver that says how to combine them. The role keeps pointing to the palette by
alias, as in the CSS.
`;

function version() {
  try {
    return (JSON.parse(readFileSync(PACKAGE, "utf8")) as { version: string }).version;
  } catch {
    return "?";
  }
}

function install(global: boolean) {
  const root = global ? process.env.HOME : process.cwd();

  if (!root) {
    console.error("Could not find your home directory. Run without --global.");
    process.exit(1);
  }

  const target = join(root, ".claude", "skills", "rivocode-ui");

  try {
    mkdirSync(target, { recursive: true });
    cpSync(SKILL_SOURCE, target, { recursive: true });
  } catch (error) {
    console.error(`Could not write to ${target}.`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  if (existsSync(AGENT)) {
    const agentsDir = join(root, ".claude", "agents");
    mkdirSync(agentsDir, { recursive: true });
    cpSync(AGENT, join(agentsDir, "rivocode-ui.md"));
  }

  const where = global ? "for all your projects" : "in this project";
  console.log(`Skill installed ${where}, in ${target}`);
  console.log(`Agent installed in ${join(root, ".claude", "agents", "rivocode-ui.md")}`);
  console.log("The agent loads by itself when you ask for a screen.");
}

function wrap(text: string, indent: string) {
  const lines: string[] = [];
  let line = indent;

  for (const word of text.split(" ")) {
    if (line.length + word.length + 1 > 88 && line.trim().length > 0) {
      lines.push(line);
      line = indent;
    }
    line += line === indent ? word : ` ${word}`;
  }

  lines.push(line);
  return lines;
}

function count(many: number, one: string, some: string) {
  return `${many} ${many === 1 ? one : some}`;
}

function human(reports: ThemeReport[]) {
  const lines: string[] = [];

  for (const theme of reports) {
    lines.push("");
    lines.push(`${theme.selector}   (${theme.files.join(", ")})`);

    if (theme.missing.length === 0) {
      lines.push(`  ${theme.declared} of ${theme.required} roles. Complete theme.`);
      continue;
    }

    const holes = theme.missing.length;
    lines.push(
      `  ${theme.declared} of ${theme.required} roles. ${holes} missing.`,
    );

    for (const [silent, title] of [
      [true, "SILENT BREAKAGE, which is why nobody reports it:"],
      [false, "VISIBLE BREAKAGE, on the screen that uses the role:"],
    ] as const) {
      const group = theme.missing.filter((role) => role.silent === silent);
      if (group.length === 0) continue;

      lines.push("");
      lines.push(`  ${title}`);

      for (const role of group) {
        lines.push("");
        lines.push(`    ${role.role}`);
        lines.push(...wrap(role.effect, "      "));
        if (role.note) {
          lines.push(...wrap(`New role in ${role.version}: ${role.note}`, "      "));
        }
        if (role.meant) {
          lines.push(
            ...wrap(
              `You declared ${role.meant}, too similar to be anything else: it is this role with a typo.`,
              "      ",
            ),
          );
        }
      }
    }
  }

  const short = reports.filter((theme) => theme.missing.length > 0);
  const holes = short.reduce((total, theme) => total + theme.missing.length, 0);

  lines.push("");

  if (short.length === 0) {
    const required = [...new Set(reports.map((theme) => theme.required))]
      .sort((one, other) => one - other)
      .join(" and ");
    lines.push(
      `${count(reports.length, "complete theme", "complete themes")}, against the ` +
        `${required} roles of @rivocode/ui ${version()}.`,
    );
  } else {
    lines.push(
      `${count(holes, "missing role", "missing roles")} in ${short.length} of ` +
        `${count(reports.length, "theme", "themes")}, in @rivocode/ui ${version()}.`,
    );
    lines.push(
      "None of them is a compile error: tsc passes, the build passes, and the screen comes out wrong.",
    );
  }

  return lines.join("\n");
}

const CSS = ".css";
const MODULE = new Set([".ts", ".mts", ".cts", ".js", ".mjs", ".cjs"]);

function contrastHuman(findings: Finding[]) {
  const lines = ["", "Contrast, now that all the roles are there:"];
  for (const finding of findings) lines.push(finding.line);

  const bad = findings.filter((finding) => !finding.ok);
  lines.push("");

  if (bad.length === 0) {
    lines.push(
      "Every pair above the minimum: 4.5:1 for text and 7:1 for body text (WCAG 1.4.3), " +
        "3:1 for control boundaries and graphical objects (1.4.11).",
    );
    return lines.join("\n");
  }

  lines.push(
    `${count(bad.length, "pair below the minimum", "pairs below the minimum")}, ` +
      `in @rivocode/ui ${version()}.`,
  );
  lines.push(
    "Alpha was composited over the background it is drawn on before measuring: that is " +
      "what the eye sees, and measuring the raw color answers the wrong question.",
  );

  if (bad.some((finding) => finding.line.includes("did not resolve"))) {
    lines.push(
      "The values that did not resolve were not measured. The math reads hexadecimal of " +
        "3, 4, 6 and 8 digits, rgb(), rgba(), hsl(), hsla(), hwb(), lab(), lch(), " +
        "oklab(), oklch() and color() in the CSS predefined spaces, and converts " +
        "everything to sRGB before measuring - the Tailwind 4 palette goes in directly. " +
        "Left out are color-mix(), which is math and not a color, and CSS color names " +
        "like rebeccapurple. Those come out unmeasured, and what is not measured is not promised.",
    );
  }

  return lines.join("\n");
}

function cssSources(files: string[]) {
  const sources: Array<{ file: string; css: string }> = [];

  for (const file of files) {
    try {
      sources.push({ file, css: readFileSync(file, "utf8") });
    } catch {
      console.error(`Could not read ${file}.`);
      process.exit(1);
    }
  }

  return sources;
}

async function themeMaps(files: string[]) {
  const maps: Array<{ file: string; name: string; map: ThemeMap }> = [];

  for (const file of files) {
    let loaded: Record<string, unknown>;

    try {
      loaded = (await import(pathToFileURL(resolve(file)).href)) as Record<string, unknown>;
    } catch (error) {
      console.error(`Could not load ${file}.`);
      console.error(error instanceof Error ? error.message : error);
      console.error(
        "Reading a map written in TypeScript needs Node 22.18 or newer. " +
          "On an older Node, point to a .mjs that exports the same object.",
      );
      process.exit(1);
    }

    const found = Object.entries(loaded).filter(
      ([, value]) =>
        typeof value === "object" && value !== null && "light" in value && "dark" in value,
    );

    if (found.length === 0) {
      console.error(`No theme map in ${file}.`);
      console.error(
        "A map is an exported object with `light` and `dark`, each with the color " +
          "roles. It is what `bun run gen:native --theme` writes, and what the " +
          "@rivocode/ui-native RivoProvider receives.",
      );
      process.exit(1);
    }

    for (const [name, value] of found) maps.push({ file, name, map: value as ThemeMap });
  }

  return maps;
}

async function checkTheme(args: string[]) {
  const json = args.includes("--json");
  const files = args.filter((argument) => !argument.startsWith("-"));
  const unknown = args.filter((argument) => argument.startsWith("-") && argument !== "--json");

  if (unknown.length > 0) {
    console.error(`Unknown option ${unknown.join(", ")}. check-theme only accepts --json.`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error("Tell me which theme to read: rivocode-ui check-theme theme-acme.css");
    console.error(
      "Pass ALL the files that make up the theme at once: the command merges the declarations by selector, and what it did not read counts as missing.",
    );
    process.exit(1);
  }

  const strange = files.filter((file) => extname(file) !== CSS && !MODULE.has(extname(file)));

  if (strange.length > 0) {
    console.error(`Cannot read ${strange.join(", ")}.`);
    console.error(
      "The extension says which theme form it is: .css for web layer 3, or .ts, .mjs and .js for the React Native map with `light` and `dark`.",
    );
    process.exit(1);
  }

  const sources = cssSources(files.filter((file) => extname(file) === CSS));
  const maps = await themeMaps(files.filter((file) => MODULE.has(extname(file))));

  const reports: ThemeReport[] = checkThemes(sources, THEME_ROLES);
  const mapRoles = MAP_ROLES.map((role) => `--rc-${role}`);

  for (const { file, name, map } of maps) {
    for (const scheme of ["light", "dark"] as const) {
      const present = new Set(Object.keys(map[scheme]).map((role) => `--rc-${role}`));
      const report = reportOf(`${name} / ${scheme}`, [file], present, mapRoles);
      if (report) reports.push(report);
    }
  }

  if (reports.length === 0) {
    console.error(`No theme block in ${files.join(", ")}.`);
    console.error(
      'A block becomes a theme when it declares at least one `--rc-` role, like `[data-rc-theme="acme"] { --rc-bg: ... }`. Without that I would go green without having looked at anything, which is the failure this command exists to prevent.',
    );
    process.exit(1);
  }

  const broken = reports.some((theme) => theme.missing.length > 0);

  if (broken) {
    if (json) {
      console.log(JSON.stringify({ version: version(), ok: false, themes: reports }, undefined, 2));
    } else {
      console.log(human(reports));
    }
    process.exit(1);
  }

  const findings: Finding[] = [];

  const lookup = readTokens(sources.map((source) => source.css).join("\n"));
  for (const block of themeBlocks(sources)) {
    if (!reports.some((theme) => theme.selector === block.selector)) continue;
    findings.push(...checkThemeCss(block.selector, resolveTokens(block.tokens, lookup)));
  }

  const house = readTokens(readCssTree(HOUSE_CSS));
  for (const block of themeBlocks(sources)) {
    if (!Object.values(CSS_CODE).some((role) => role in block.tokens)) continue;
    const worn = { ...house, ...resolveTokens(block.tokens, { ...house, ...lookup }) };
    findings.push(
      ...checkCodePair(`${block.selector}, machine-read code`, worn[CSS_CODE.ink], worn[CSS_CODE.paper]),
    );
  }

  for (const { file, name, map } of maps) {
    findings.push(...checkThemeMap(`${file}:${name}`, map));
  }

  const failed = findings.some((finding) => !finding.ok);

  if (json) {
    console.log(
      JSON.stringify(
        { version: version(), ok: !failed, themes: reports, contrast: findings },
        undefined,
        2,
      ),
    );
  } else {
    console.log(human(reports));
    console.log(contrastHuman(findings));
  }

  if (failed) process.exit(1);
}

function tokens(args: string[]) {
  const options = new Map<string, string>();
  const files: string[] = [];

  for (let at = 0; at < args.length; at++) {
    const argument = args[at]!;
    if (argument === "--out" || argument === "--format") {
      const value = args[at + 1];
      if (!value || value.startsWith("-")) {
        console.error(`Missing value for ${argument}.`);
        process.exit(1);
      }
      options.set(argument, value);
      at++;
    } else if (argument.startsWith("-")) {
      console.error(`Unknown option ${argument}. tokens accepts --out and --format.`);
      process.exit(1);
    } else {
      files.push(argument);
    }
  }

  const format = options.get("--format") ?? "dtcg";
  if (format !== "dtcg") {
    console.error(`Cannot write the format "${format}". For now it is only dtcg.`);
    process.exit(1);
  }

  const out = options.get("--out");
  if (!out) {
    console.error("Tell me where to write: rivocode-ui tokens --out tokens");
    process.exit(1);
  }

  const strange = files.filter((file) => extname(file) !== CSS);
  if (strange.length > 0) {
    console.error(`Cannot read ${strange.join(", ")}. tokens reads the theme in .css, web layer 3.`);
    process.exit(1);
  }

  const result = exportDtcg(readCssTree(HOUSE_CSS), cssSources(files) as CssSource[]);

  if (result.themes.length === 0) {
    console.error(`No [data-rc-theme="..."] in ${files.join(", ")}.`);
    console.error(
      "It is the selector that declares layer 3. Without it I would write the house palette and scale and claim I exported your theme.",
    );
    process.exit(1);
  }

  try {
    mkdirSync(out, { recursive: true });
    for (const [name, content] of Object.entries(result.files)) {
      writeFileSync(join(out, name), `${JSON.stringify(content, undefined, 2)}\n`);
    }
  } catch (error) {
    console.error(`Could not write to ${out}.`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  console.log(
    `${count(result.count, "token", "tokens")} in ${count(Object.keys(result.files).length, "file", "files")}, in ${out}: ` +
      `${result.themes.join(", ")}.`,
  );

  if (result.skipped.length > 0) {
    console.log("\nLeft out, because the format has no way to express them:");
    const grouped = new Map<string, { scopes: string[]; reason: string }>();
    for (const item of result.skipped) {
      const key = `${item.variable}: ${item.value}`;
      const seen = grouped.get(key) ?? { scopes: [], reason: item.reason };
      seen.scopes.push(item.scope);
      grouped.set(key, seen);
    }
    for (const [key, { scopes, reason }] of grouped) {
      console.log(`  ${key}   (${scopes.join(", ")})`);
      console.log(wrap(reason, "    ").join("\n"));
    }
  }
}

const [command, ...rest] = process.argv.slice(2);

if (command === "skill") {
  install(rest.includes("--global") || rest.includes("-g"));
} else if (command === "check-theme") {
  await checkTheme(rest);
} else if (command === "tokens") {
  tokens(rest);
} else if (command === "--help" || command === "-h" || command === undefined) {
  console.log(HELP.trim());
} else {
  console.error(`Unknown command "${command}".`);
  console.log(HELP.trim());
  process.exit(1);
}
