/**
 * O conteudo que o `@rivocode/ui-mcp` serve, montado da mesma fonte do site.
 *
 * O servidor MCP nao fala com a rede: tudo o que ele responde viaja dentro do
 * tarball, num `dist/content.json` escrito por este arquivo no build. A fonte e
 * a mesma que o site publica - `agentFiles()` para o markdown, os dois JSON de
 * props, a tabela de escolha da skill, as tabelas de paridade e de assinatura
 * que `check:paridade` e `check:assinatura` ja seguram contra o codigo, e os
 * tokens pela mesma `exportDtcg` do `rivocode-ui tokens`. Uma segunda copia
 * escrita a mao divergiria do site no primeiro release.
 *
 * O teste `test/servidor-mcp.test.ts` chama `buildContent()` direto, e nao le
 * o `dist/`: teste que le artefato de build passa na maquina que acabou de
 * construir e falha na CI, onde o `check` roda antes do build.
 *
 *   bun run scripts/conteudo-do-mcp.ts --out mcp/dist/content.json
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
import { exportDtcg, readCssTree } from "../src/tokens/dtcg";
import { countAtLeast } from "./varredura";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const at = (path: string) => resolve(ROOT, path);

const SKILL = ".claude/skills/rivocode-ui";
const CHOICE_FILE = `${SKILL}/reference/components.md`;
const CHOICE_SECTION = "## Escolhas que costumam sair erradas";
const PARITY_FILE = "apps/docs/src/content/react-native.md";
const PARITY_SECTION = "## A paridade, peça por peça";
const SIGNATURE_FILE = `${SKILL}/reference/native.md`;
const SIGNATURE_SECTION = "## A assinatura, prop a prop";
const NATIVE_PROPS = "apps/docs/src/native-props.json";
const HOUSE_CSS = "src/preset.css";

/**
 * O nome em portugues de cada referencia da skill, no mesmo estilo dos guias do
 * site. Referencia nova sem linha aqui sai com o nome do arquivo, e nao some.
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
  if (!body) throw new Error(`Nao achei a secao "${title}" em ${file}.`);
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
 * A primeira frase do primeiro paragrafo, e a seguinte quando a primeira e
 * curta demais para dizer algo ("Acao." e a frase inteira do Button). O
 * `firstSentence` do site le a primeira LINHA, e o markdown quebra a frase no
 * meio: "no topo da area que ela" era a descricao inteira do Banner.
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
      title: "Convenções",
      summary:
        "O contrato de uso: Provider, tokens, vocabulário de classes e as regras de toda peça.",
      path: "convencoes.md",
    },
  ];

  for (const { slug, title, summary } of GUIDE_LIST) {
    if (files.has(`${slug}.md`)) guides.push({ slug, title, summary, path: `${slug}.md` });
  }

  const skill = files.get("skill/SKILL.md") ?? "";
  guides.push({
    slug: "skill-completa",
    title: titleOf(skill, "Skill"),
    summary: "A skill inteira: o método, o Provider, o vocabulário de classes e o que nunca fazer.",
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

    const avoidance = section(`\n${doc.body}`, "## Quando não usar");
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

  countAtLeast("pecas no catalogo", components.length, 80);
  countAtLeast(`linhas da tabela de escolha em ${CHOICE_FILE}`, choices.length, 20);
  countAtLeast(`linhas de paridade em ${PARITY_FILE}`, Object.keys(parity).length, 80);
  countAtLeast(`pecas na assinatura de ${SIGNATURE_FILE}`, Object.keys(signature).length, 40);
  countAtLeast(`pecas em ${NATIVE_PROPS}`, Object.keys(nativeProps).length, 60);
  countAtLeast("arquivos DTCG", Object.keys(tokens).length, 5);

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
    console.error("Diga onde eu escrevo: bun run scripts/conteudo-do-mcp.ts --out <arquivo>");
    process.exit(1);
  }

  const content = buildContent();
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, JSON.stringify(content));

  console.log(
    `${content.components.length} pecas, ${Object.keys(content.files).length} documentos e` +
      ` ${content.guides.length} guias em ${out}, da documentacao de @rivocode/ui` +
      ` ${content.generatedFrom.web} e @rivocode/ui-native ${content.generatedFrom.native}.`,
  );
}
