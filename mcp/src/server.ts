import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  audit,
  renderMarkdown,
  RULES,
} from "../../.claude/skills/rivocode-ui-audit/scripts/audit.mjs";
import type { ComponentEntry, Content } from "./content";
import { clip, compact, fold, overlap, stems, terms, words } from "./text";

export type ServerOptions = {
  /** A versao do proprio `@rivocode/ui-mcp`, que o cliente ve no aperto de mao. */
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
  contrato: "convencoes",
  ia: "para-agents",
  ai: "para-agents",
  agents: "para-agents",
  agent: "para-agents",
  llm: "para-agents",
  llms: "para-agents",
  mcp: "para-agents",
  install: "instalacao",
  instalar: "instalacao",
  theme: "temas",
  tema: "temas",
  themes: "temas",
  density: "densidade",
  icons: "icones",
  icone: "icones",
  formulario: "formularios",
  form: "formularios",
  forms: "formularios",
  grafico: "graficos",
  chart: "graficos",
  charts: "graficos",
  a11y: "acessibilidade",
  method: "metodo",
  components: "escolha-de-peca",
  theming: "vestir-cliente",
  native: "tela-nativa",
  "react native": "react-native",
  reactnative: "react-native",
  quickstart: "inicio-rapido",
  audit: "auditoria",
  auditar: "auditoria",
  "rivocode-ui-audit": "auditoria",
};

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
      ? `Talvez: ${near.slice(0, 8).join(", ")}.`
      : "Use `list_components` para ver o catálogo, ou `recommend_component` para descrever a intenção.";
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
    `Documentação empacotada de @rivocode/ui ${web} e @rivocode/ui-native ${native}.` +
    ` A versão mais nova mora em ${SITE}.`;

  const server = new McpServer(
    { name: "rivocode-ui", title: "RivoCode UI", version: options.version },
    {
      instructions:
        "Design system da RivoCode (@rivocode/ui no web, @rivocode/ui-native no React Native). " +
        "Antes de montar uma tela, leia `get_guide` com `convencoes`. Para escolher uma peça, " +
        "descreva a intenção em `recommend_component`; para usá-la, leia a página inteira em " +
        "`get_component` - props, exemplos e quando não usar. Cor, escala e densidade saem de " +
        "`get_tokens`: nunca escreva cor literal. Para dar nota a uma tela pronta, `audit_screen`. " +
        "Tudo é servido do pacote, sem rede. " +
        provenance,
    },
  );

  server.registerTool(
    "list_components",
    {
      title: "Listar as peças",
      description:
        "Lista as peças do catálogo do @rivocode/ui, agrupadas por família, com uma linha " +
        "sobre cada uma, as partes que só existem dentro dela e o estado no React Native.",
      inputSchema: {
        family: z
          .string()
          .optional()
          .describe("Filtra por família, como Formulário ou Feedback. Sem acento também serve."),
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
        return fail(`Não há a família "${family}". As famílias são: ${known.join(", ")}.`);
      }

      const count = [...families.values()].reduce((sum, list) => sum + list.length, 0);
      const sections = [...families.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, list]) => {
          const lines = list.map((entry) => {
            const parity = content.parity[entry.name]?.state;
            const parts = entry.parts.length > 0 ? ` Partes: ${entry.parts.join(", ")}.` : "";
            return `- **${entry.name}** — ${entry.summary}${parts}${parity ? ` (React Native: ${parity})` : ""}`;
          });
          return `## ${name}\n\n${lines.join("\n")}`;
        });

      return reply(
        `# Catálogo do @rivocode/ui\n\n${count} peças. ${provenance}\n` +
          "A página de cada uma sai de `get_component`.\n\n" +
          sections.join("\n\n"),
      );
    },
  );

  server.registerTool(
    "get_component",
    {
      title: "Página de uma peça",
      description:
        "Devolve a página markdown inteira de uma peça: para que serve, importação, exemplos " +
        'que rodam, tabela de props, as partes, a seção "Quando não usar" e como ela fica no ' +
        "React Native. Aceita o nome exportado (DataTable), o kebab (data-table) ou uma parte " +
        "(CardHeader), que devolve a página da peça que a compõe.",
      inputSchema: {
        name: z.string().min(1).describe("O nome da peça, como DataTable ou data-table."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ name }) => {
      const found = resolveName(name);
      const entry = found ? ownerOf(found) : undefined;
      if (!found || !entry) return fail(`Não há peça "${name}" no catálogo. ${suggest(name)}`);

      const asked = name.trim();
      const shown = found === entry.name && asked !== entry.name && compact(asked) !== compact(entry.slug) ? asked : found;
      const note =
        shown === entry.name
          ? ""
          : `> \`${shown}\` é parte de \`${entry.name}\` e só existe dentro dela. A página abaixo documenta as duas.\n\n`;

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
      title: "Buscar na documentação",
      description:
        "Busca textual em toda a documentação empacotada: páginas de peça, guias, convenções " +
        "e a skill. Ignora acento e caixa, e devolve os documentos com os trechos que casaram.",
      inputSchema: {
        query: z.string().min(2).describe('O que procurar, como "máscara de CNPJ" ou "z-index".'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .describe("Quantos documentos, até 30. O padrão é 8."),
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
      if (wanted.length === 0) return fail("A busca precisa de ao menos uma palavra.");

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
          `Nada casou com "${query}". Tente outras palavras, ou ` +
            "`recommend_component` se o que você tem é uma intenção de tela.",
        );
      }

      const partial =
        best < wanted.length
          ? `Nenhum documento tem todas as palavras; estes têm ${best} de ${wanted.length}.\n\n`
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
        `# ${hits.length} documento(s) para "${query}"\n\n${partial}${blocks.join("\n\n")}\n\n` +
          "A página inteira de uma peça sai de `get_component`; a de um guia, de `get_guide`.",
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
      title: "Recomendar a peça",
      description:
        'Dada uma intenção de interface em texto livre ("confirmar antes de excluir a nota", ' +
        '"aviso que some sozinho"), devolve as peças candidatas em ordem, com o motivo: a ' +
        "linha da tabela de escolha da casa que casou, a descrição da peça, e a seção " +
        '"Quando não usar" de cada uma, que é onde a peça vizinha é nomeada.',
      inputSchema: {
        intent: z.string().min(3).describe("A intenção de interface, em português."),
        platform: z
          .enum(["web", "native"])
          .optional()
          .describe("native marca as peças que não portam e aponta o nome delas no React Native."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Quantas candidatas, até 10. O padrão é 4."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ intent, platform, limit }) => {
      const query = stems(intent);
      if (query.size === 0)
        return fail("Descreva a intenção com ao menos uma palavra de conteúdo.");

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

      for (const { choice, situation, why } of choiceIndex) {
        const hitSituation = overlap(query, situation).length;
        const hitWhy = overlap(query, why).length;
        if (hitSituation === 0) continue;
        const score = hitSituation * 6 + hitWhy * 2;
        choice.pieces.forEach((name, index) =>
          add(
            name,
            index === 0 ? score : score - 2,
            `Tabela de escolha: "${choice.situation}" → ${choice.pieces.join(" + ")}. ${choice.why}`,
          ),
        );
      }

      for (const { entry, summary, avoid } of componentIndex) {
        const hitSummary = overlap(query, summary).length;
        if (hitSummary > 0) add(entry.name, hitSummary * 3, `A peça: ${entry.summary}`);

        const hitAvoid = overlap(query, avoid).length;
        if (hitAvoid < 2) continue;
        for (const name of pointedBy(entry.name)) {
          add(
            name,
            hitAvoid * 2,
            `O "Quando não usar" de ${entry.name} aponta ${name} para um caso parecido com este.`,
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
          `Nenhuma peça casou com "${intent}". Tente descrever o que a pessoa faz na tela ` +
            "(escolher, confirmar, avisar, listar), ou veja o catálogo em `list_components`.",
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
        if (avoid) lines.push("", `**Quando não usar:** ${clip(avoid, 600)}`);
        if (platform === "native" && parity) {
          lines.push("", `**No React Native:** ${parity.state} — ${parity.note}`);
        } else if (parity && /não porta|fila/.test(parity.state)) {
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
          ? `\n\n## Vizinhas que a página de ${leader} nomeia\n\n${neighbors.join("\n")}`
          : "";

      return reply(
        `# Candidatas para "${intent}"\n\n${blocks.join("\n\n")}${aside}\n\n` +
          "Confirme a escolha lendo a página inteira em `get_component` antes de escrever a tela.",
      );
    },
  );

  server.registerTool(
    "get_tokens",
    {
      title: "Tokens do tema",
      description:
        "Os tokens da casa: papéis de cor nos dois temas, escalas (tipografia, raio, " +
        "empilhamento, foco), densidade confortável e compacta, e movimento (duração, curva, " +
        "mola). Com `file`, devolve o JSON DTCG 2025.10 cru, o mesmo do `npx rivocode-ui tokens`.",
      inputSchema: {
        category: z
          .enum(CATEGORIES)
          .optional()
          .describe("color, scale, density, motion ou all. O padrão é all."),
        file: z
          .string()
          .optional()
          .describe("Um arquivo DTCG pelo nome, como rivocode-light.tokens.json."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ category, file }) => {
      if (file) {
        const raw = content.tokens[file] ?? content.tokens[`${file}.tokens.json`];
        if (!raw) {
          return fail(
            `Não há o arquivo "${file}". Os arquivos são: ${Object.keys(content.tokens).join(", ")}.`,
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
      title: "Paridade com o React Native",
      description:
        "Como uma peça do web existe no @rivocode/ui-native: a linha da tabela de paridade " +
        "(traduz, vira outra, não porta), a seção React Native da página, cada prop que muda " +
        "de nome ou de forma na chamada, e as props da peça nativa.",
      inputSchema: {
        name: z.string().min(1).describe("O nome da peça no web, como Select ou Popconfirm."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ name }) => {
      const found = resolveName(name);
      const entry = found ? ownerOf(found) : undefined;
      if (!found || !entry) return fail(`Não há peça "${name}" no catálogo. ${suggest(name)}`);

      const parity = content.parity[entry.name];
      const renamed = parity && /vira\s+`([A-Za-z0-9]+)`/.exec(parity.state)?.[1];
      const nativeName = found === entry.name ? (renamed ?? entry.name) : found;
      const lines = [`# ${found} no React Native`, ""];

      if (found !== entry.name) lines.push(`\`${found}\` é parte de \`${entry.name}\`.`, "");
      lines.push(
        parity
          ? `**Paridade de ${entry.name}:** ${parity.state} — ${parity.note}`
          : `**Paridade de ${entry.name}:** sem linha na tabela.`,
      );

      const section = /\n## No React Native\n([\s\S]*?)(?=\n## |$)/.exec(pageOf(entry))?.[1];
      if (section) lines.push("", "## Na página da peça", "", section.trim());

      const rows = content.signature[found] ?? [];
      lines.push("", "## A assinatura, prop a prop", "");
      lines.push(
        rows.length > 0
          ? `${content.signatureHeader}\n${rows.join("\n")}`
          : "Nenhuma divergência de assinatura além das duas regras gerais do nativo: tudo é controlado, e lista entra por `items`.",
      );

      const props = content.nativeProps[nativeName];
      if (props && props.props.length > 0) {
        lines.push(
          "",
          `## Props de \`${nativeName}\` no @rivocode/ui-native`,
          "",
          `Importação: \`${props.entry
            .replace(/^native\/src\/(?:index\.ts)?/, "@rivocode/ui-native/")
            .replace(/\/index\.ts$/, "")
            .replace(/\/$/, "")}\``,
          "",
          "| Prop | Tipo | Obrigatória |",
          "| --- | --- | --- |",
          ...props.props.map(
            (prop) =>
              `| \`${prop.name}\` | \`${prop.type.replace(/\|/g, "\\|")}\` | ${prop.required ? "sim" : "não"} |`,
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
      title: "Guia",
      description:
        "Um guia inteiro, em markdown: as convenções (o contrato de uso), instalação, temas, " +
        "tokens, densidade, ícones, React Native, IA e agents, e as referências da skill " +
        "(método, fluxo, texto, layout, design, escolha de peça, acessibilidade, formulários, " +
        "gráficos). Sem `name`, lista os guias.",
      inputSchema: {
        name: z
          .string()
          .optional()
          .describe("O guia, como convencoes, formularios, densidade ou ia."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ name }) => {
      const catalog = content.guides
        .map((guide) => `- \`${guide.slug}\` — **${guide.title}**: ${guide.summary}`)
        .join("\n");

      if (!name) return reply(`# Guias\n\n${catalog}\n\n${provenance}`);

      const slug = guideSlugs.get(compact(name));
      const guide = content.guides.find((item) => item.slug === slug);
      if (!guide) return fail(`Não há o guia "${name}". Os guias são:\n\n${catalog}`);

      return reply(`${content.files[guide.path] ?? ""}\n\n---\n\n${provenance}`);
    },
  );

  const located = z.object({
    rule: z.string().min(1).describe("O id da regra, como escolha-de-peca."),
    file: z.string().min(1).describe("O caminho do arquivo, igual ao de `files`."),
    line: z.number().int().min(1).describe("A linha, contada a partir de 1."),
  });

  server.registerTool(
    "audit_screen",
    {
      title: "Auditar uma tela",
      description:
        "Audita arquivos de tela de um app que usa o @rivocode/ui ou o @rivocode/ui-native contra " +
        "as regras da casa e devolve o relatório com nota de 0 a 100, determinística: cor literal, " +
        "z-index numérico, peça reescrita à mão, campo sem rótulo, dinheiro em float, CPF sem " +
        "validador, Pix caseiro, import pelo caminho errado e peer faltando. Os achados de julgamento " +
        "e os descartes entram por `findings` e `dismissals`, e pesam na mesma conta. É a mesma " +
        "auditoria da skill rivocode-ui-audit.",
      inputSchema: {
        files: z
          .array(
            z.object({
              path: z.string().min(1).describe("O caminho do arquivo, que aparece no relatório."),
              source: z.string().describe("O texto inteiro do arquivo."),
            }),
          )
          .min(1)
          .max(60)
          .describe("Os arquivos de tela, cada um com caminho e texto."),
        package_json: z
          .string()
          .optional()
          .describe(
            "O texto do package.json do app, para conferir os peers. Num monorepo, use `package_jsons`.",
          ),
        package_jsons: z
          .array(
            z.object({
              path: z
                .string()
                .min(1)
                .describe("O caminho do package.json, como `apps/web/package.json`."),
              source: z.string().describe("O texto do package.json."),
            }),
          )
          .max(20)
          .optional()
          .describe(
            "Os package.json do mais perto da tela ao da raiz do monorepo. Somam: o peer na raiz conta, como no script da skill.",
          ),
        findings: z
          .array(located.extend({ message: z.string().min(1).describe("O que está errado.") }))
          .optional()
          .describe("Os achados de julgamento: escolha-de-peca, texto-generico, provider-ausente…"),
        dismissals: z
          .array(
            located.extend({ reason: z.string().min(1).describe("Por que o achado não vale.") }),
          )
          .optional()
          .describe("Os achados mecânicos descartados, cada um com o motivo."),
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
      const rules = RULES.filter((rule) => rule.kind === "julgamento")
        .map((rule) => `\`${rule.id}\``)
        .join(", ");
      return reply(
        `${renderMarkdown(report)}\n---\n\nRegras de julgamento que entram por \`findings\`: ${rules}. ` +
          "A skill inteira, com o laço de auditoria, sai de `get_guide` com `auditoria`.",
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
        description: "Tokens da casa em JSON DTCG 2025.10.",
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
  const out: string[] = ["# Tokens do @rivocode/ui", ""];
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
      "## Papéis de cor",
      "",
      "A peça pinta o papel, e o tema responde. Na classe, o papel vira `bg-<papel>`, `text-<papel>` e `border-<papel>`: cor literal não entra.",
      "",
      `| Papel | CSS | ${columns.join(" | ")} |`,
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
      "| Token | CSS | Valor |",
      "| --- | --- | --- |",
      ...rows.map((row) => `| ${row.path} | \`${row.css}\` | ${cell(show(content, row.value))} |`),
      "",
    );
  };

  if (category === "scale" || category === "all") {
    table("Escalas", "scales.tokens.json", SCALE_GROUPS);
  }

  if (category === "density" || category === "all") {
    const modes = Object.keys(files)
      .filter((file) => file.startsWith("density-"))
      .sort();
    const maps = modes.map((file) => new Map(flatten(files[file]).map((row) => [row.path, row])));
    const paths = [...new Set(maps.flatMap((map) => [...map.keys()]))];
    const names = modes.map((file) => file.replace(/^density-|\.tokens\.json$/g, ""));
    out.push(
      "## Densidade",
      "",
      "Um atributo só, `data-rc-density`, e as peças trocam de altura sem trocar de catálogo.",
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
    table("Movimento", "scales.tokens.json", MOTION_GROUPS);
  }

  out.push(
    "## Os arquivos DTCG",
    "",
    ...Object.keys(content.tokens).map(
      (file) => `- \`${TOKEN_SCHEME}${file}\` (ou \`get_tokens\` com \`file: "${file}"\`)`,
    ),
    "",
    provenance,
  );

  return out.join("\n");
}
