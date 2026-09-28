/**
 * The content `@rivocode/ui-mcp` serves, built from the same source as the site.
 *
 * The MCP server does not talk to the network: everything it answers travels
 * inside the tarball, in a `dist/content.json` this file writes at build time.
 * The source is the same one the site publishes - `agentFiles()` for the
 * markdown, the two props JSON files, the skill's choice table, the parity and
 * signature tables that `check:parity` and `check:signature` already hold
 * against the code, and the tokens through the same `exportDtcg` as
 * `rivocode-ui tokens`. A second hand-written copy would drift from the site
 * on the first release.
 *
 * The test `test/mcp-server.test.ts` calls `buildContent()` directly and does
 * not read `dist/`: a test that reads a build artifact passes on the machine
 * that just built and fails in CI, where `check` runs before the build.
 *
 *   bun run scripts/mcp-content.ts --out mcp/dist/content.json
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { agentFiles, readDocs } from "../apps/docs/src/agent-docs";
import { GUIDE_LIST } from "../apps/docs/src/guide-list";
import { findParent } from "../apps/docs/src/parts";
import type {
  Choice,
  ComponentEntry,
  Content,
  Guide,
  NativeProp,
  ParityRow,
} from "../mcp/src/content";
import { readCssTree } from "../src/tokens/css-tree";
import { exportDtcg } from "../src/tokens/dtcg";
import { countAtLeast } from "./scan";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const at = (path: string) => resolve(ROOT, path);

const SKILL = ".claude/skills/rivocode-ui";
const CHOICE_FILE = `${SKILL}/reference/components.md`;
const CHOICE_SECTION = "## Choices that usually go wrong";
const PARITY_FILE = "apps/docs/src/content/react-native.md";
const PARITY_SECTION = "## Parity, piece by piece";
const SIGNATURE_FILE = `${SKILL}/reference/native.md`;
const SIGNATURE_SECTION = "## The signature, prop by prop";
const AVOID_SECTION = "## When not to use";
const NATIVE_PROPS = "apps/docs/src/native-props.json";
const HOUSE_CSS = "src/preset.css";

/**
 * The `get_guide` name of each skill reference, in the same style as the site
 * guide slugs. A new reference without a line here goes out under its file
 * name, and does not disappear.
 */
const REFERENCE_SLUG: Record<string, string> = {
  method: "metodo",
  fluxo: "fluxo",
  texto: "texto",
  layout: "layout",
  design: "design",
  components: "escolha-de-peca",
  a11y: "acessibilidade",
  forms: "formularios",
  hooks: "hooks-utilitarios",
  charts: "graficos",
  theming: "vestir-cliente",
  native: "tela-nativa",
};

const read = (path: string) => readFileSync(at(path), "utf8");

export function section(markdown: string, title: string): string | undefined {
  const start = markdown.indexOf(`\n${title}\n`);
  if (start < 0) return undefined;
  const body = markdown.slice(start + title.length + 2);
  const end = body.search(/\n## /);
  return (end < 0 ? body : body.slice(0, end)).trim();
}

export function cells(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let code = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index]!;
    if (char === "`") code = !code;
    if (char === "\\" && line[index + 1] === "|") {
      current += "|";
      index++;
      continue;
    }
    if (char === "|" && !code) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  out.push(current.trim());

  return out.slice(1, -1);
}

function tableLines(markdown: string, title: string, file: string): string[] {
  const body = section(markdown, title);
  if (!body) throw new Error(`Section "${title}" not found in ${file}.`);
  return body.split("\n").filter((line) => line.startsWith("|"));
}

const namesIn = (text: string) =>
  [...text.matchAll(/`([A-Z][A-Za-z0-9]*)/g)].map((match) => match[1]!);

function readChoices(known: Set<string>): Choice[] {
  const rows = tableLines(read(CHOICE_FILE), CHOICE_SECTION, CHOICE_FILE).slice(2);

  return rows.map((line) => {
    const [situation = "", piece = "", why = ""] = cells(line);
    return {
      situation,
      pieces: [...new Set(namesIn(piece).filter((name) => known.has(name)))],
      why,
    };
  });
}

function readParity(): Record<string, ParityRow> {
  const parity: Record<string, ParityRow> = {};

  for (const line of tableLines(read(PARITY_FILE), PARITY_SECTION, PARITY_FILE).slice(2)) {
    const [piece = "", state = "", note = ""] = cells(line);
    const name = namesIn(piece)[0];
    if (name) parity[name] = { state, note };
  }

  return parity;
}

function readSignature() {
  const lines = tableLines(read(SIGNATURE_FILE), SIGNATURE_SECTION, SIGNATURE_FILE);
  const signature: Record<string, string[]> = {};

  for (const line of lines.slice(2)) {
    const name = namesIn(cells(line)[0] ?? "")[0];
    if (!name) continue;
    (signature[name] ??= []).push(line);
  }

  return { header: lines.slice(0, 2).join("\n"), signature };
}

/**
 * The first sentence of the first paragraph, plus the next one when the first
 * is too short to say anything ("Action." was the whole Button sentence). The
 * site's `firstSentence` reads the first LINE, and markdown breaks a sentence
 * in the middle: "no topo da area que ela" was once the whole Banner summary.
 */
export function leadSentence(body: string): string {
  const paragraph =
    body
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block.length > 0 && !block.startsWith("#") && !block.startsWith("```")) ??
    "";
  const flat = paragraph
    .replace(/\s+/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1");
  let sentence = "";
  for (const piece of flat.split(/(?<=[.!?])\s+/)) {
    sentence = sentence ? `${sentence} ${piece}` : piece;
    if (sentence.length >= 40) break;
  }
  return sentence.length > 220 ? `${sentence.slice(0, 219).trimEnd()}…` : sentence;
}

function titleOf(markdown: string, fallback: string) {
  return /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() ?? fallback;
}

function readGuides(files: Map<string, string>): Guide[] {
  const guides: Guide[] = [
    {
      slug: "convencoes",
      title: "Conventions",
      summary:
        "The usage contract: Provider, tokens, class vocabulary and the rules every piece follows.",
      path: "convencoes.md",
    },
  ];

  for (const { slug, title, summary } of GUIDE_LIST) {
    if (files.has(`${slug}.md`)) guides.push({ slug, title, summary, path: `${slug}.md` });
  }

  const skill = files.get("skill/SKILL.md") ?? "";
  const auditSkill = "skill-auditoria/SKILL.md";
  if (files.has(auditSkill)) {
    guides.push({
      slug: "auditoria",
      title: titleOf(files.get(auditSkill)!, "Audit"),
      summary:
        "The audit skill: the loop, the mechanical and judgment rules, and the score math that `audit_screen` returns.",
      path: auditSkill,
    });
  }
  guides.push({
    slug: "skill-completa",
    title: titleOf(skill, "Skill"),
    summary:
      "The whole skill: the method, the Provider, the class vocabulary and what never to do.",
    path: "skill/SKILL.md",
  });

  const tasks = new Map<string, string>();
  for (const line of skill.split("\n")) {
    const [task, link] = cells(line);
    const file = link && /\(reference\/([\w-]+)\.md\)/.exec(link)?.[1];
    if (task && file) tasks.set(file, task);
  }

  for (const [path, text] of files) {
    const file = /^skill\/reference\/([\w-]+)\.md$/.exec(path)?.[1];
    if (!file) continue;
    guides.push({
      slug: REFERENCE_SLUG[file] ?? file,
      title: titleOf(text, file),
      summary: tasks.get(file) ?? titleOf(text, file),
      path,
    });
  }

  return guides;
}

export function buildContent(): Content {
  const docs = readDocs();
  const names = new Set(docs.map((doc) => doc.name));

  const all = agentFiles();
  all.delete("llms-full.txt");
  for (const path of [...all.keys()]) if (!/\.(?:md|txt)$/.test(path)) all.delete(path);

  const parts: Record<string, string> = {};
  const avoid: Record<string, string> = {};
  const components: ComponentEntry[] = [];

  for (const doc of docs) {
    const owner = findParent(doc.name, names);
    if (owner) parts[doc.name] = owner;
  }

  for (const doc of docs.sort((a, b) => a.name.localeCompare(b.name))) {
    if (parts[doc.name]) continue;

    components.push({
      name: doc.name,
      slug: doc.slug,
      family: doc.family,
      summary: leadSentence(doc.body),
      parts: Object.keys(parts)
        .filter((part) => parts[part] === doc.name)
        .sort(),
    });

    const avoidance = section(`\n${doc.body}`, AVOID_SECTION);
    if (avoidance) avoid[doc.name] = avoidance;
  }

  const choices = readChoices(names);
  const parity = readParity();
  const { header, signature } = readSignature();
  const nativeProps = JSON.parse(read(NATIVE_PROPS)) as Record<
    string,
    { entry: string; props: NativeProp[] }
  >;
  const tokens = exportDtcg(readCssTree(at(HOUSE_CSS))).files;

  countAtLeast("pieces in the catalog", components.length, 80);
  countAtLeast(`choice table rows in ${CHOICE_FILE}`, choices.length, 20);
  countAtLeast(`parity rows in ${PARITY_FILE}`, Object.keys(parity).length, 80);
  countAtLeast(`pieces in the signature of ${SIGNATURE_FILE}`, Object.keys(signature).length, 40);
  countAtLeast(`pieces in ${NATIVE_PROPS}`, Object.keys(nativeProps).length, 60);
  countAtLeast("DTCG files", Object.keys(tokens).length, 5);

  const web = JSON.parse(read("package.json")) as { version: string };
  const native = JSON.parse(read("native/package.json")) as { version: string };

  return {
    generatedFrom: { web: web.version, native: native.version },
    files: Object.fromEntries(all),
    components,
    parts,
    avoid,
    choices,
    parity,
    signatureHeader: header,
    signature,
    nativeProps,
    tokens,
    guides: readGuides(all),
  };
}

if (import.meta.main) {
  const flag = process.argv.indexOf("--out");
  const out = flag >= 0 ? process.argv[flag + 1] : undefined;

  if (!out) {
    console.error("Say where to write: bun run scripts/mcp-content.ts --out <file>");
    process.exit(1);
  }

  const content = buildContent();
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, JSON.stringify(content));

  console.log(
    `${content.components.length} pieces, ${Object.keys(content.files).length} documents and` +
      ` ${content.guides.length} guides in ${out}, from the documentation of @rivocode/ui` +
      ` ${content.generatedFrom.web} and @rivocode/ui-native ${content.generatedFrom.native}.`,
  );
}
