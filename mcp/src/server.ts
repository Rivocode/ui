import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  audit,
  renderMarkdown,
  RULES,
} from "../../.claude/skills/rivocode-ui-audit/scripts/audit.mjs";
import type { ComponentEntry, Content } from "./content";
import { clip, compact, fold, overlap, queryStems, stems, terms, words } from "./text";

export type ServerOptions = {
  /** The version of `@rivocode/ui-mcp` itself, which the client sees in the handshake. */
  version: string;
};

type Answer = { content: { type: "text"; text: string }[]; isError?: boolean };

const SITE = "https://ds.rivocode.com.br";
const DOC_SCHEME = "rivocode://docs/";
const TOKEN_SCHEME = "rivocode://tokens/";

const reply = (text: string): Answer => ({ content: [{ type: "text", text }] });
const fail = (text: string): Answer => ({ content: [{ type: "text", text }], isError: true });

const GUIDE_ALIASES: Record<string, string> = {
  conventions: "convencoes",
  contract: "convencoes",
  contrato: "convencoes",
  ia: "para-agents",
  ai: "para-agents",
  agents: "para-agents",
  agent: "para-agents",
  llm: "para-agents",
  llms: "para-agents",
  mcp: "para-agents",
  install: "instalacao",
  installation: "instalacao",
  instalar: "instalacao",
  "quick start": "inicio-rapido",
  architecture: "arquitetura",
  "brazilian documents": "documentos-brasileiros",
  theme: "temas",
  tema: "temas",
  themes: "temas",
  density: "densidade",
  icons: "icones",
  icone: "icones",
  icon: "icones",
  formulario: "formularios",
  form: "formularios",
  forms: "formularios",
  grafico: "graficos",
  chart: "graficos",
  charts: "graficos",
  a11y: "acessibilidade",
  accessibility: "acessibilidade",
  method: "metodo",
  flow: "fluxo",
  text: "texto",
  copy: "texto",
  components: "escolha-de-peca",
  "choosing a piece": "escolha-de-peca",
  theming: "vestir-cliente",
  native: "tela-nativa",
  "react native": "react-native",
  reactnative: "react-native",
  quickstart: "inicio-rapido",
  audit: "auditoria",
  "full skill": "skill-completa",
  skill: "skill-completa",
  auditar: "auditoria",
  "rivocode-ui-audit": "auditoria",
};

const ABSENT = /n[ãa]o porta|fila|not port|queue/;
const JUDGMENT = new Set(["julgamento", "judgment"]);

const CATEGORIES = ["color", "scale", "density", "motion", "all"] as const;
type Category = (typeof CATEGORIES)[number];

const SCALE_GROUPS = ["text", "leading", "z", "ring", "radius", "tracking"];
const MOTION_GROUPS = ["duration", "ease", "spring"];

type Token = { $type?: string; $value?: unknown; $description?: string; $extensions?: unknown };
type Flat = { path: string; css: string; value: unknown; description?: string };

function flatten(group: unknown, prefix: string[] = []): Flat[] {
  if (!group || typeof group !== "object") return [];
  const token = group as Token;
  if ("$value" in token) {
    const extension = (token.$extensions as Record<string, { css?: string }> | undefined)?.[
      "br.com.rivocode"
    ];
    return [
      {
        path: prefix.join("."),
        css: extension?.css ?? "",
        value: token.$value,
        description: token.$description,
      },
    ];
  }

  return Object.entries(group as Record<string, unknown>)
    .filter(([key]) => !key.startsWith("$"))
    .flatMap(([key, child]) => flatten(child, [...prefix, key]));
}

export function createServer(content: Content, options: ServerOptions): McpServer {
  const { web, native } = content.generatedFrom;
  const byName = new Map(content.components.map((entry) => [entry.name, entry]));
  const every = [...byName.keys(), ...Object.keys(content.parts)];

  const lookup = new Map<string, string>();
  for (const name of every) {
    lookup.set(compact(name), name);
  }
  for (const entry of content.components) lookup.set(compact(entry.slug), entry.name);

  function resolveName(query: string): string | undefined {
    return lookup.get(compact(query)) ?? prefixOwner(query);
  }

  function prefixOwner(query: string): string | undefined {
    const wanted = query.trim();
    if (!/^[A-Z][A-Za-z0-9]+$/.test(wanted)) return undefined;
    return [...byName.keys()]
      .filter((name) => wanted.startsWith(name) && /^[A-Z]/.test(wanted.slice(name.length)))
      .sort((a, b) => b.length - a.length)[0];
  }

  function catalogName(name: string): string | undefined {
    if (byName.has(name) || content.parts[name]) return name;
    return every.find((known) => known.startsWith(name));
  }

  function pointedBy(piece: string): string[] {
    return [
      ...new Set(
        [...(content.avoid[piece] ?? "").matchAll(/`(?:use)?([A-Z][A-Za-z0-9]*)/g)]
          .map((match) => catalogName(match[1]!))
          .filter((name): name is string => name !== undefined && name !== piece),
      ),
    ];
  }

  function ownerOf(name: string): ComponentEntry | undefined {
    return byName.get(content.parts[name] ?? name);
  }

  function suggest(query: string): string {
    const wanted = compact(query);
    const wantedStems = stems(query);
    const near = every.filter((name) => {
      const flat = compact(name);
      if (wanted.length > 2 && (flat.includes(wanted) || wanted.includes(flat))) return true;
      const entry = byName.get(name);
      return entry ? overlap(wantedStems, stems(entry.summary)).length > 0 : false;
    });

    return near.length > 0
      ? `Maybe: ${near.slice(0, 8).join(", ")}.`
      : "Use `list_components` to see the catalog, or `recommend_component` to describe the intent.";
  }

  function pageOf(entry: ComponentEntry) {
    return content.files[`componentes/${entry.slug}.md`] ?? "";
  }

  const guideSlugs = new Map<string, string>();
  for (const guide of content.guides) {
    guideSlugs.set(compact(guide.slug), guide.slug);
    guideSlugs.set(compact(guide.title), guide.slug);
    const file = /([\w-]+)\.md$/.exec(guide.path)?.[1];
    if (file && !guideSlugs.has(compact(file))) guideSlugs.set(compact(file), guide.slug);
  }
  for (const [alias, slug] of Object.entries(GUIDE_ALIASES)) {
    if (!guideSlugs.has(compact(alias))) guideSlugs.set(compact(alias), slug);
  }

  const provenance =
    `Bundled documentation of @rivocode/ui ${web} and @rivocode/ui-native ${native}.` +
    ` The newest version lives at ${SITE}.`;

  const server = new McpServer(
    { name: "rivocode-ui", title: "RivoCode UI", version: options.version },
    {
      instructions:
        "RivoCode's design system (@rivocode/ui on the web, @rivocode/ui-native on React Native). " +
        "Before building a screen, read `get_guide` with `convencoes`. To choose a piece, " +
        "describe the intent in `recommend_component`; to use it, read the whole page in " +
        "`get_component` - props, examples and when not to use it. Color, scale and density come " +
        "from `get_tokens`: never write a literal color. To score a finished screen, `audit_screen`. " +
        "Everything is served from the package, with no network. " +
        provenance,
    },
  );

  server.registerTool(
    "list_components",
    {
      title: "List the pieces",
      description:
        "Lists the pieces of the @rivocode/ui catalog, grouped by family, with one line " +
        "about each, the parts that only exist inside it and its state on React Native.",
      inputSchema: {
        family: z
          .string()
          .optional()
          .describe("Filters by family, such as Feedback. Case and accents are ignored."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ family }) => {
      const wanted = family ? fold(family).trim() : undefined;
      const families = new Map<string, ComponentEntry[]>();
      for (const entry of content.components) {
        if (wanted && fold(entry.family) !== wanted) continue;
        const list = families.get(entry.family) ?? [];
        list.push(entry);
        families.set(entry.family, list);
      }

      if (families.size === 0) {
        const known = [...new Set(content.components.map((entry) => entry.family))].sort();
        return fail(`There is no family "${family}". The families are: ${known.join(", ")}.`);
      }

      const count = [...families.values()].reduce((sum, list) => sum + list.length, 0);
      const sections = [...families.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, list]) => {
          const lines = list.map((entry) => {
            const parity = content.parity[entry.name]?.state;
            const parts = entry.parts.length > 0 ? ` Parts: ${entry.parts.join(", ")}.` : "";
            return `- **${entry.name}** — ${entry.summary}${parts}${parity ? ` (React Native: ${parity})` : ""}`;
          });
          return `## ${name}\n\n${lines.join("\n")}`;
        });

      return reply(
        `# The @rivocode/ui catalog\n\n${count} pieces. ${provenance}\n` +
          "The page of each one comes from `get_component`.\n\n" +
          sections.join("\n\n"),
      );
    },
  );

  server.registerTool(
    "get_component",
    {
      title: "Page of a piece",
      description:
        "Returns the whole markdown page of a piece: what it is for, import, examples that " +
        'run, props table, the parts, the "When not to use" section and how it looks on ' +
        "React Native. Accepts the exported name (DataTable), the kebab name (data-table) or a " +
        "part (CardHeader), which returns the page of the piece that contains it.",
      inputSchema: {
        name: z.string().min(1).describe("The piece name, such as DataTable or data-table."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ name }) => {
      const found = resolveName(name);
      const entry = found ? ownerOf(found) : undefined;
      if (!found || !entry)
        return fail(`There is no piece "${name}" in the catalog. ${suggest(name)}`);

      const asked = name.trim();
      const shown =
        found === entry.name && asked !== entry.name && compact(asked) !== compact(entry.slug)
          ? asked
          : found;
      const note =
        shown === entry.name
          ? ""
          : `> \`${shown}\` is a part of \`${entry.name}\` and only exists inside it. The page below documents both.\n\n`;

      return reply(`${note}${pageOf(entry)}\n\n---\n\n${provenance}`);
    },
  );

  const searchable = Object.entries(content.files)
    .filter(([path, text]) => path !== "llms.txt" && text.length > 400)
    .map(([path, text]) => {
      const title = /^#\s+(.+)$/m.exec(text)?.[1]?.trim() ?? path;
      return { path, text, title, folded: fold(text), foldedTitle: fold(title) };
    });

  server.registerTool(
    "search_docs",
    {
      title: "Search the documentation",
      description:
        "Full-text search over all the bundled documentation: piece pages, guides, conventions " +
        "and the skill. Ignores accents and case, and returns the documents with the matching snippets.",
      inputSchema: {
        query: z.string().min(2).describe('What to look for, such as "CNPJ mask" or "z-index".'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .describe("How many documents, up to 30. The default is 8."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query, limit }) => {
      const phrase = fold(query).trim();
      const meaningful = terms(query);
      const wanted = [
        ...new Set(
          meaningful.length > 0 ? meaningful : words(query).filter((word) => word.length > 1),
        ),
      ];
      if (wanted.length === 0) return fail("The search needs at least one word.");

      const weight = new Map(
        wanted.map((term) => {
          const frequency = searchable.filter((doc) => doc.folded.includes(term)).length;
          return [term, Math.log((searchable.length + 1) / (frequency + 1)) + 0.1];
        }),
      );

      const ranked = searchable
        .map((doc) => {
          const matched = wanted.filter((term) => doc.folded.includes(term));
          const score = matched.reduce(
            (sum, term) =>
              sum +
              weight.get(term)! *
                (Math.min(doc.folded.split(term).length - 1, 10) +
                  (doc.foldedTitle.includes(term) ? 8 : 0)),
            0,
          );
          const phraseHit = wanted.length > 1 && doc.folded.includes(phrase) ? 20 : 0;
          return { doc, matched, score: score + phraseHit };
        })
        .filter((hit) => hit.matched.length > 0);

      const best = Math.max(0, ...ranked.map((hit) => hit.matched.length));
      const hits = ranked
        .filter((hit) => hit.matched.length === best)
        .sort((a, b) => b.score - a.score || a.doc.path.localeCompare(b.doc.path))
        .slice(0, limit ?? 8);

      if (hits.length === 0) {
        return reply(
          `Nothing matched "${query}". Try other words, or ` +
            "`recommend_component` if what you have is a screen intent.",
        );
      }

      const partial =
        best < wanted.length
          ? `No document has all the words; these have ${best} of ${wanted.length}.\n\n`
          : "";

      const blocks = hits.map(({ doc, matched }) => {
        const lines = doc.text
          .split("\n")
          .map((line, index) => ({
            line,
            index,
            count: matched.filter((term) => fold(line).includes(term)).length,
          }))
          .filter((item) => item.count > 0 && item.line.trim().length > 2)
          .sort((a, b) => b.count - a.count || a.index - b.index)
          .slice(0, 3)
          .sort((a, b) => a.index - b.index);
        const snippets = lines.map((item) => `  > ${clip(item.line, 220)}`);
        return `- **${doc.title}** — \`${DOC_SCHEME}${doc.path}\`\n${snippets.join("\n")}`;
      });

      return reply(
        `# ${hits.length} document(s) for "${query}"\n\n${partial}${blocks.join("\n\n")}\n\n` +
          "The whole page of a piece comes from `get_component`; that of a guide, from `get_guide`.",
      );
    },
  );

  const choiceIndex = content.choices.map((choice) => ({
    choice,
    situation: stems(choice.situation),
    why: stems(choice.why),
  }));
  const componentIndex = content.components.map((entry) => ({
    entry,
    summary: stems(`${entry.summary} ${lede(pageOf(entry))}`),
    avoid: stems(content.avoid[entry.name] ?? ""),
  }));

  server.registerTool(
    "recommend_component",
    {
      title: "Recommend the piece",
      description:
        'Given an interface intent in free text ("confirm before deleting the invoice", ' +
        '"notice that goes away by itself"), returns the candidate pieces in order, with the ' +
        "reason: the matching row of the house choice table, the piece description, and the " +
        '"When not to use" section of each one, which is where the neighboring piece is named.',
      inputSchema: {
        intent: z
          .string()
          .min(3)
          .describe("The interface intent, in English (common Portuguese words also work)."),
        platform: z
          .enum(["web", "native"])
          .optional()
          .describe(
            "native flags the pieces that do not port and points to their name on React Native.",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("How many candidates, up to 10. The default is 4."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ intent, platform, limit }) => {
      const query = queryStems(intent);
      if (query.size === 0) return fail("Describe the intent with at least one content word.");

      type Candidate = { score: number; reasons: string[] };
      const candidates = new Map<string, Candidate>();
      const add = (name: string, score: number, reason: string) => {
        const owner = content.parts[name] ?? name;
        if (!byName.has(owner) || score <= 0) return;
        const current = candidates.get(owner) ?? { score: 0, reasons: [] };
        current.score += score;
        if (!current.reasons.includes(reason)) current.reasons.push(reason);
        candidates.set(owner, current);
      };

      const bestRow = new Map<string, { score: number; reason: string }>();
      for (const { choice, situation, why } of choiceIndex) {
        const hitSituation = overlap(query, situation).length;
        const hitWhy = overlap(query, why).length;
        if (hitSituation === 0) continue;
        const score = hitSituation * 6 + hitWhy * 2;
        choice.pieces.forEach((name, index) => {
          const rowScore = index === 0 ? score : score - 2;
          if ((bestRow.get(name)?.score ?? 0) >= rowScore) return;
          bestRow.set(name, {
            score: rowScore,
            reason: `Choice table: "${choice.situation}" → ${choice.pieces.join(" + ")}. ${choice.why}`,
          });
        });
      }
      for (const [name, { score, reason }] of bestRow) add(name, score, reason);

      for (const { entry, summary, avoid } of componentIndex) {
        const hitSummary = overlap(query, summary).length;
        if (hitSummary > 0) add(entry.name, hitSummary * 3, `The piece: ${entry.summary}`);

        const hitAvoid = overlap(query, avoid).length;
        if (hitAvoid < 2) continue;
        for (const name of pointedBy(entry.name)) {
          add(
            name,
            hitAvoid * 2,
            `The "When not to use" of ${entry.name} points to ${name} for a case like this one.`,
          );
        }
      }

      const top = Math.max(0, ...[...candidates.values()].map((candidate) => candidate.score));
      const ranked = [...candidates.entries()]
        .filter(([, candidate]) => candidate.score >= top * 0.2)
        .sort(([, a], [, b]) => b.score - a.score)
        .slice(0, limit ?? 4);

      if (ranked.length === 0) {
        return reply(
          `No piece matched "${intent}". Try describing what the person does on the screen ` +
            "(choose, confirm, notify, list), or see the catalog in `list_components`.",
        );
      }

      const blocks = ranked.map(([name, candidate], index) => {
        const entry = byName.get(name)!;
        const parity = content.parity[name];
        const avoid = content.avoid[name];
        const lines = [
          `## ${index + 1}. ${name} (${entry.family})`,
          "",
          ...candidate.reasons.slice(0, 3).map((reason) => `- ${reason}`),
        ];
        if (avoid) lines.push("", `**When not to use:** ${clip(avoid, 600)}`);
        if (platform === "native" && parity) {
          lines.push("", `**In React Native:** ${parity.state} — ${parity.note}`);
        } else if (parity && ABSENT.test(parity.state)) {
          lines.push("", `React Native: ${parity.state}.`);
        }
        return lines.join("\n");
      });

      const [leader] = ranked[0]!;
      const shown = new Set(ranked.map(([name]) => name));
      const neighbors = [...new Set(pointedBy(leader).map((name) => content.parts[name] ?? name))]
        .filter((name) => !shown.has(name) && byName.has(name))
        .map((name) => `- **${name}**: ${byName.get(name)!.summary}`);
      const aside =
        neighbors.length > 0
          ? `\n\n## Neighbors that the ${leader} page names\n\n${neighbors.join("\n")}`
          : "";

      return reply(
        `# Candidates for "${intent}"\n\n${blocks.join("\n\n")}${aside}\n\n` +
          "Confirm the choice by reading the whole page in `get_component` before writing the screen.",
      );
    },
  );

  server.registerTool(
    "get_tokens",
    {
      title: "Theme tokens",
      description:
        "The house tokens: color roles in both themes, scales (typography, radius, " +
        "stacking, focus), comfortable and compact density, and motion (duration, easing, " +
        "spring). With `file`, returns the raw DTCG 2025.10 JSON, the same as `npx rivocode-ui tokens`.",
      inputSchema: {
        category: z
          .enum(CATEGORIES)
          .optional()
          .describe("color, scale, density, motion or all. The default is all."),
        file: z
          .string()
          .optional()
          .describe("A DTCG file by name, such as rivocode-light.tokens.json."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ category, file }) => {
      if (file) {
        const raw = content.tokens[file] ?? content.tokens[`${file}.tokens.json`];
        if (!raw) {
          return fail(
            `There is no file "${file}". The files are: ${Object.keys(content.tokens).join(", ")}.`,
          );
        }
        return reply(JSON.stringify(raw, undefined, 2));
      }

      return reply(renderTokens(content, category ?? "all", provenance));
    },
  );

  server.registerTool(
    "get_native_parity",
    {
      title: "Parity with React Native",
      description:
        "How a web piece exists in @rivocode/ui-native: the parity table row " +
        "(translates, becomes another piece, does not port), the React Native section of the page, " +
        "each prop whose name or shape changes in the call, and the props of the native piece.",
      inputSchema: {
        name: z
          .string()
          .min(1)
          .describe("The piece name on the web, such as Select or Popconfirm."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ name }) => {
      const found = resolveName(name);
      const entry = found ? ownerOf(found) : undefined;
      if (!found || !entry)
        return fail(`There is no piece "${name}" in the catalog. ${suggest(name)}`);

      const parity = content.parity[entry.name];
      const renamed = parity && /`([A-Za-z0-9]+)`/.exec(parity.state)?.[1];
      const nativeName = found === entry.name ? (renamed ?? entry.name) : found;
      const lines = [`# ${found} in React Native`, ""];

      if (found !== entry.name) lines.push(`\`${found}\` is a part of \`${entry.name}\`.`, "");
      lines.push(
        parity
          ? `**Parity of ${entry.name}:** ${parity.state} — ${parity.note}`
          : `**Parity of ${entry.name}:** no row in the table.`,
      );

      const section = /\n## In React Native\n([\s\S]*?)(?=\n## |$)/.exec(pageOf(entry))?.[1];
      if (section) lines.push("", "## On the piece page", "", section.trim());

      const rows = content.signature[found] ?? [];
      lines.push("", "## The signature, prop by prop", "");
      lines.push(
        rows.length > 0
          ? `${content.signatureHeader}\n${rows.join("\n")}`
          : "No signature difference beyond the two general native rules: everything is controlled, and lists come in through `items`.",
      );

      const props = content.nativeProps[nativeName];
      if (props && props.props.length > 0) {
        lines.push(
          "",
          `## Props of \`${nativeName}\` in @rivocode/ui-native`,
          "",
          `Import: \`${props.entry
            .replace(/^native\/src\/(?:index\.ts)?/, "@rivocode/ui-native/")
            .replace(/\/index\.ts$/, "")
            .replace(/\/$/, "")}\``,
          "",
          "| Prop | Type | Required |",
          "| --- | --- | --- |",
          ...props.props.map(
            (prop) =>
              `| \`${prop.name}\` | \`${prop.type.replace(/\|/g, "\\|")}\` | ${prop.required ? "yes" : "no"} |`,
          ),
        );
      }

      lines.push("", "---", "", provenance);
      return reply(lines.join("\n"));
    },
  );

  server.registerTool(
    "get_guide",
    {
      title: "Guide",
      description:
        "A whole guide, in markdown: the conventions (the usage contract), installation, themes, " +
        "tokens, density, icons, React Native, AI and agents, and the skill references " +
        "(method, flow, text, layout, design, choosing a piece, accessibility, forms, " +
        "charts). Without `name`, lists the guides.",
      inputSchema: {
        name: z
          .string()
          .optional()
          .describe(
            "The guide, such as convencoes, forms, density or agents. The slugs from the list and English names both work.",
          ),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ name }) => {
      const catalog = content.guides
        .map((guide) => `- \`${guide.slug}\` — **${guide.title}**: ${guide.summary}`)
        .join("\n");

      if (!name) return reply(`# Guides\n\n${catalog}\n\n${provenance}`);

      const slug = guideSlugs.get(compact(name));
      const guide = content.guides.find((item) => item.slug === slug);
      if (!guide) return fail(`There is no guide "${name}". The guides are:\n\n${catalog}`);

      return reply(`${content.files[guide.path] ?? ""}\n\n---\n\n${provenance}`);
    },
  );

  const located = z.object({
    rule: z.string().min(1).describe("The rule id, as the audit skill lists it."),
    file: z.string().min(1).describe("The file path, the same as in `files`."),
    line: z.number().int().min(1).describe("The line, counted from 1."),
  });

  server.registerTool(
    "audit_screen",
    {
      title: "Audit a screen",
      description:
        "Audits screen files of an app that uses @rivocode/ui or @rivocode/ui-native against " +
        "the house rules and returns the report with a deterministic score from 0 to 100: literal " +
        "color, numeric z-index, piece rewritten by hand, field without a label, money as a float, " +
        "CPF without a validator, homemade Pix, import from the wrong path and missing peer. Judgment " +
        "findings and dismissals come in through `findings` and `dismissals`, and weigh in the same " +
        "math. It is the same audit as the rivocode-ui-audit skill.",
      inputSchema: {
        files: z
          .array(
            z.object({
              path: z.string().min(1).describe("The file path, which appears in the report."),
              source: z.string().describe("The whole file text."),
            }),
          )
          .min(1)
          .max(60)
          .describe("The screen files, each with path and text."),
        package_json: z
          .string()
          .optional()
          .describe(
            "The text of the app's package.json, to check the peers. In a monorepo, use `package_jsons`.",
          ),
        package_jsons: z
          .array(
            z.object({
              path: z
                .string()
                .min(1)
                .describe("The package.json path, such as `apps/web/package.json`."),
              source: z.string().describe("The package.json text."),
            }),
          )
          .max(20)
          .optional()
          .describe(
            "The package.json files from the one nearest the screen to the monorepo root. They add up: a peer at the root counts, as in the skill script.",
          ),
        findings: z
          .array(located.extend({ message: z.string().min(1).describe("What is wrong.") }))
          .optional()
          .describe("The judgment findings, by the ids of the judgment rules the report lists."),
        dismissals: z
          .array(
            located.extend({
              reason: z.string().min(1).describe("Why the finding does not apply."),
            }),
          )
          .optional()
          .describe("The dismissed mechanical findings, each with the reason."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ files, package_json, package_jsons, findings, dismissals }) => {
      const report = audit({
        files,
        manifests: [
          ...(package_json === undefined ? [] : [{ path: "package.json", source: package_json }]),
          ...(package_jsons ?? []),
        ],
        findings,
        dismissals,
      });
      const rules = RULES.filter((rule) => JUDGMENT.has(rule.kind as string))
        .map((rule) => `\`${rule.id}\``)
        .join(", ");
      return reply(
        `${renderMarkdown(report)}\n---\n\nJudgment rules that come in through \`findings\`: ${rules}. ` +
          "The whole skill, with the audit loop, comes from `get_guide` with `auditoria`.",
      );
    },
  );

  for (const [path, text] of Object.entries(content.files)) {
    const title = /^#\s+(.+)$/m.exec(text)?.[1]?.trim() ?? path;
    server.registerResource(
      path,
      `${DOC_SCHEME}${path}`,
      {
        title,
        description: `${SITE}/${path}`,
        mimeType: path.endsWith(".md") ? "text/markdown" : "text/plain",
      },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text }] }),
    );
  }

  for (const [file, json] of Object.entries(content.tokens)) {
    server.registerResource(
      file,
      `${TOKEN_SCHEME}${file}`,
      {
        title: file,
        description: "House tokens in DTCG 2025.10 JSON.",
        mimeType: "application/json",
      },
      async (uri) => ({
        contents: [
          { uri: uri.href, mimeType: "application/json", text: JSON.stringify(json, undefined, 2) },
        ],
      }),
    );
  }

  return server;
}

function lede(page: string): string {
  const body = page.replace(/^#\s+.+\n/, "");
  const end = body.search(/\n## /);
  return end < 0 ? body.slice(0, 600) : body.slice(0, end);
}

function lookupAlias(content: Content, alias: string, prefer?: unknown): unknown {
  const path = alias.slice(1, -1).split(".");
  for (const file of [prefer, ...Object.values(content.tokens)]) {
    let node: unknown = file;
    for (const key of path) node = (node as Record<string, unknown> | undefined)?.[key];
    if (node && typeof node === "object" && "$value" in node) return (node as Token).$value;
  }
  return undefined;
}

function show(content: Content, value: unknown, prefer?: unknown, depth = 0): string {
  if (typeof value === "string" && /^\{[\w.-]+\}$/.test(value) && depth < 4) {
    const target = lookupAlias(content, value, prefer);
    return target === undefined ? value : `${value} = ${show(content, target, prefer, depth + 1)}`;
  }
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.every((item) => typeof item === "number")
      ? `cubic-bezier(${value.join(", ")})`
      : value.map((item) => show(content, item, prefer, depth)).join(", ");
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record["hex"] === "string") {
      const alpha =
        typeof record["alpha"] === "number" && record["alpha"] !== 1 ? ` / ${record["alpha"]}` : "";
      return `${record["hex"]}${alpha}`;
    }
    if ("value" in record && "unit" in record) return `${record["value"]}${record["unit"]}`;
    return JSON.stringify(value);
  }
  return String(value);
}

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ");

function renderTokens(content: Content, category: Category, provenance: string): string {
  const out: string[] = ["# @rivocode/ui tokens", ""];
  const files = content.tokens as Record<string, Record<string, unknown>>;
  const themes = Object.keys(files)
    .filter((file) => file.endsWith(".tokens.json") && files[file]?.["color"])
    .sort();

  if (category === "color" || category === "all") {
    const columns = themes.map((file) => file.replace(".tokens.json", ""));
    const flat = themes.map(
      (file) => new Map(flatten(files[file]?.["color"], ["color"]).map((row) => [row.path, row])),
    );
    const paths = [...new Set(flat.flatMap((map) => [...map.keys()]))];
    out.push(
      "## Color roles",
      "",
      "The piece paints the role, and the theme answers. In a class, the role becomes `bg-<role>`, `text-<role>` and `border-<role>`: no literal color.",
      "",
      `| Role | CSS | ${columns.join(" | ")} |`,
      `| --- | --- | ${columns.map(() => "---").join(" | ")} |`,
      ...paths.map((path) => {
        const first = flat.find((map) => map.has(path))?.get(path);
        const values = flat.map((map, index) => {
          const row = map.get(path);
          return row ? cell(show(content, row.value, files[themes[index]!])) : "—";
        });
        return `| ${path.replace(/^color\./, "")} | \`${first?.css ?? ""}\` | ${values.join(" | ")} |`;
      }),
      "",
    );
  }

  const table = (title: string, file: string, groups: string[]) => {
    const source = files[file] ?? {};
    const rows = groups.flatMap((group) => flatten(source[group], [group]));
    out.push(
      `## ${title}`,
      "",
      "| Token | CSS | Value |",
      "| --- | --- | --- |",
      ...rows.map((row) => `| ${row.path} | \`${row.css}\` | ${cell(show(content, row.value))} |`),
      "",
    );
  };

  if (category === "scale" || category === "all") {
    table("Scales", "scales.tokens.json", SCALE_GROUPS);
  }

  if (category === "density" || category === "all") {
    const modes = Object.keys(files)
      .filter((file) => file.startsWith("density-"))
      .sort();
    const maps = modes.map((file) => new Map(flatten(files[file]).map((row) => [row.path, row])));
    const paths = [...new Set(maps.flatMap((map) => [...map.keys()]))];
    const names = modes.map((file) => file.replace(/^density-|\.tokens\.json$/g, ""));
    out.push(
      "## Density",
      "",
      "One attribute, `data-rc-density`, and the pieces change height without changing catalog.",
      "",
      `| Token | CSS | ${names.join(" | ")} |`,
      `| --- | --- | ${names.map(() => "---").join(" | ")} |`,
      ...paths.map((path) => {
        const first = maps.find((map) => map.has(path))?.get(path);
        return `| ${path} | \`${first?.css ?? ""}\` | ${maps.map((map) => cell(show(content, map.get(path)?.value ?? "—"))).join(" | ")} |`;
      }),
      "",
    );
  }

  if (category === "motion" || category === "all") {
    table("Motion", "scales.tokens.json", MOTION_GROUPS);
  }

  out.push(
    "## The DTCG files",
    "",
    ...Object.keys(content.tokens).map(
      (file) => `- \`${TOKEN_SCHEME}${file}\` (or \`get_tokens\` with \`file: "${file}"\`)`,
    ),
    "",
    provenance,
  );

  return out.join("\n");
}
