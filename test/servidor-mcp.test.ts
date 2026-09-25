import { afterAll, beforeAll, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import type { Content } from "../mcp/src/content";
import { createServer } from "../mcp/src/server";
import { buildContent, cells, leadSentence } from "../scripts/conteudo-do-mcp";
import { audit, renderMarkdown } from "../.claude/skills/rivocode-ui-audit/scripts/audit.mjs";

const content: Content = buildContent();
const client = new Client({ name: "teste", version: "0.0.0" });

beforeAll(async () => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer(content, { version: "0.0.0-teste" }).connect(serverSide);
  await client.connect(clientSide);
});

afterAll(async () => {
  await client.close();
});

type Result = { content: { type: string; text: string }[]; isError?: boolean };

async function call(name: string, args: Record<string, unknown> = {}) {
  const result = (await client.callTool({ name, arguments: args })) as Result;
  return {
    text: result.content.map((item) => item.text).join("\n"),
    isError: result.isError === true,
  };
}

const TOOLS = [
  "list_components",
  "get_component",
  "search_docs",
  "recommend_component",
  "get_tokens",
  "get_native_parity",
  "get_guide",
  "audit_screen",
];

test("o servidor anuncia as oito ferramentas, cada uma com descricao em portugues", async () => {
  const { tools } = await client.listTools();

  expect(tools.map((tool) => tool.name).sort()).toEqual([...TOOLS].sort());
  for (const tool of tools) {
    expect(tool.description?.length ?? 0).toBeGreaterThan(60);
    expect(tool.description).toMatch(/[áéíóúâêôãõç]/);
    expect(tool.annotations?.readOnlyHint).toBe(true);
  }
});

test("o conteudo sai das versoes que os manifestos declaram", () => {
  const web = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
  const native = JSON.parse(readFileSync("native/package.json", "utf8")) as { version: string };

  expect(content.generatedFrom).toEqual({ web: web.version, native: native.version });
});

test("todo componente do catalogo e respondido por list_components, get_component e get_native_parity", async () => {
  expect(content.components.length).toBeGreaterThan(80);

  const listing = (await call("list_components")).text;

  for (const entry of content.components) {
    expect(listing).toContain(`**${entry.name}**`);

    const page = await call("get_component", { name: entry.name });
    expect(page.isError).toBe(false);
    expect(page.text).toStartWith(`# ${entry.name}\n`);
    expect(page.text).toContain("## No React Native");

    const bySlug = await call("get_component", { name: entry.slug });
    expect(bySlug.text).toStartWith(`# ${entry.name}\n`);

    const parity = await call("get_native_parity", { name: entry.name });
    expect(parity.isError).toBe(false);
    expect(parity.text).toContain(
      `**Paridade de ${entry.name}:** ${content.parity[entry.name]?.state}`,
    );
  }
});

test("toda peca do catalogo tem linha de paridade e resumo", () => {
  expect(content.components.length).toBeGreaterThan(80);

  for (const entry of content.components) {
    expect(content.parity[entry.name]).toBeDefined();
    expect(entry.summary.length).toBeGreaterThan(10);
    expect(entry.summary).not.toMatch(/\s$/);
  }
});

test("a parte devolve a pagina da peca que a compoe, com o aviso de que e parte", async () => {
  const parts = Object.entries(content.parts);
  expect(parts.length).toBeGreaterThan(40);

  for (const [part, owner] of parts) {
    const page = await call("get_component", { name: part });
    expect(page.isError).toBe(false);
    expect(page.text).toContain(`\`${part}\` é parte de \`${owner}\``);
    expect(page.text).toContain(`\n# ${owner}\n`);
  }
});

test("nome que nao existe volta como erro, com o caminho para o catalogo", async () => {
  const missing = await call("get_component", { name: "Carrossel" });

  expect(missing.isError).toBe(true);
  expect(missing.text).toContain("Carrossel");

  expect((await call("get_native_parity", { name: "Carrossel" })).isError).toBe(true);
  expect((await call("get_guide", { name: "nao-existe" })).isError).toBe(true);
  expect((await call("list_components", { family: "nao-existe" })).isError).toBe(true);
});

test("list_components filtra a familia sem acento", async () => {
  const family = content.components.find((entry) => /[áéíóúç]/.test(entry.family))?.family;
  expect(family).toBeDefined();

  const folded = family!.normalize("NFD").replace(/\p{M}/gu, "");
  const listing = await call("list_components", { family: folded });
  const expected = content.components.filter((entry) => entry.family === family);

  expect(expected.length).toBeGreaterThan(0);
  expect(listing.isError).toBe(false);
  for (const entry of expected) expect(listing.text).toContain(`**${entry.name}**`);
  const other = content.components.find((entry) => entry.family !== family)!;
  expect(listing.text).not.toContain(`**${other.name}**`);
});

test("search_docs ignora acento e caixa", async () => {
  const plain = await call("search_docs", { query: "mascara cnpj" });
  const accented = await call("search_docs", { query: "MÁSCARA CNPJ" });

  expect(plain.isError).toBe(false);
  expect(plain.text).toContain("componentes/masked-input.md");
  expect(accented.text).toBe(plain.text.replace('"mascara cnpj"', '"MÁSCARA CNPJ"'));
});

test("search_docs devolve o trecho que casou, e diz quando nada casou", async () => {
  const hit = await call("search_docs", { query: "data-rc-density", limit: 3 });
  expect(hit.text).toContain("data-rc-density");

  const none = await call("search_docs", { query: "zzqqxxyy" });
  expect(none.isError).toBe(false);
  expect(none.text).toContain("Nada casou");
});

const INTENTS: [intent: string, expected: string][] = [
  ["confirmar antes de excluir a nota", "AlertDialog"],
  ["escolher um cliente numa lista longa vinda do servidor", "Combobox"],
  ["quanto do armazenamento esta em uso", "Meter"],
  ["listagem de notas com paginação e busca", "DataTable"],
  ["botão só com ícone de lixeira", "IconButton"],
  ["aviso da página inteira de manutenção", "Banner"],
  ["senha com o olho que revela", "PasswordInput"],
  ["anexar arquivo arrastando", "FileUpload"],
];

test("recommend_component poe a peca da tabela de escolha em primeiro", async () => {
  for (const [intent, expected] of INTENTS) {
    const answer = await call("recommend_component", { intent });
    expect(answer.isError).toBe(false);
    expect(/^## 1\. (\w+)/m.exec(answer.text)?.[1]).toBe(expected);
  }
});

test("recommend_component traz o quando nao usar e as vizinhas que ele nomeia", async () => {
  const answer = await call("recommend_component", { intent: "confirmar antes de excluir a nota" });

  expect(answer.text).toContain("**Quando não usar:**");
  expect(answer.text).toContain("## Vizinhas que a página de AlertDialog nomeia");
  expect(answer.text).toContain("**Dialog**");
});

test("recommend_component com platform native diz como a peca fica no celular", async () => {
  const answer = await call("recommend_component", {
    intent: "mostrar um atalho de teclado no texto",
    platform: "native",
  });

  expect(answer.text).toContain("## 1. Kbd");
  expect(answer.text).toContain(`**No React Native:** ${content.parity["Kbd"]?.state}`);
});

test("toda linha da tabela de escolha aponta para peca que existe", () => {
  expect(content.choices.length).toBeGreaterThan(20);

  const names = new Set([
    ...content.components.map((entry) => entry.name),
    ...Object.keys(content.parts),
  ]);
  for (const choice of content.choices) {
    expect(choice.pieces.length).toBeGreaterThan(0);
    for (const piece of choice.pieces) expect(names.has(piece)).toBe(true);
  }
});

test("get_tokens resolve o alias dentro do proprio tema", async () => {
  const colors = await call("get_tokens", { category: "color" });

  const grid = colors.text.split("\n").find((line) => line.startsWith("| chart-grid |"));
  expect(grid).toBeDefined();
  const [, , , dark, light] = cells(grid!);
  expect(dark).not.toBe(light);
  expect(colors.text).toContain("`--rc-accent`");
});

test("get_tokens cobre escala, densidade e movimento, e devolve o DTCG cru", async () => {
  const scale = await call("get_tokens", { category: "scale" });
  expect(scale.text).toContain("`--rc-radius-md`");

  const density = await call("get_tokens", { category: "density" });
  expect(density.text).toContain("| comfortable | compact |");
  expect(density.text).toContain("`--rc-control-md`");

  const motion = await call("get_tokens", { category: "motion" });
  expect(motion.text).toContain("`--rc-duration-base`");
  expect(motion.text).toContain("cubic-bezier(");

  const raw = await call("get_tokens", { file: "rivocode.resolver.json" });
  expect((JSON.parse(raw.text) as { name: string }).name).toBe("@rivocode/ui");

  expect((await call("get_tokens", { file: "nada.json" })).isError).toBe(true);
});

test("get_native_parity traz a assinatura e as props da peca que ganha outro nome", async () => {
  const answer = await call("get_native_parity", { name: "Popconfirm" });

  expect(answer.text).toContain("vira `AlertDialog`");
  expect(answer.text).toContain("| `Popconfirm` → `AlertDialog` | `onConfirm` | `onAction` |");
  expect(answer.text).toContain("## Props de `AlertDialog` no @rivocode/ui-native");
  expect(answer.text).toContain("| `actionLabel` | `string` | sim |");
});

test("todo guia listado e servido, pelo nome e pelos apelidos", async () => {
  expect(content.guides.length).toBeGreaterThan(15);

  for (const guide of content.guides) {
    const answer = await call("get_guide", { name: guide.slug });
    expect(answer.isError).toBe(false);
    expect(answer.text).toStartWith(content.files[guide.path]!);
  }

  const aliases: [string, string][] = [
    ["IA", "para-agents.md"],
    ["conventions", "convencoes.md"],
    ["Formulários", "skill/reference/forms.md"],
    ["densidade", "densidade.md"],
    ["temas", "temas.md"],
  ];
  for (const [alias, path] of aliases) {
    expect((await call("get_guide", { name: alias })).text).toStartWith(content.files[path]!);
  }
});

test("toda referencia da skill vira guia", () => {
  const references = Object.keys(content.files).filter((path) =>
    path.startsWith("skill/reference/"),
  );
  expect(references.length).toBeGreaterThan(8);

  const served = new Set(content.guides.map((guide) => guide.path));
  for (const path of references) expect(served.has(path)).toBe(true);
});

test("toda pagina e todo arquivo DTCG saem como resource, e o resource devolve o texto", async () => {
  const { resources } = await client.listResources();
  const expected = Object.keys(content.files).length + Object.keys(content.tokens).length;

  expect(resources.length).toBeGreaterThan(150);
  expect(resources.length).toBe(expected);

  const page = await client.readResource({ uri: "rivocode://docs/componentes/data-table.md" });
  expect((page.contents[0] as { text: string }).text).toBe(
    content.files["componentes/data-table.md"]!,
  );

  const tokens = await client.readResource({ uri: "rivocode://tokens/palette.tokens.json" });
  expect(JSON.parse((tokens.contents[0] as { text: string }).text)).toEqual(
    content.tokens["palette.tokens.json"],
  );
});

test("o servidor nao fala com a rede em tempo de execucao", () => {
  for (const file of [
    "mcp/src/server.ts",
    "mcp/src/cli.ts",
    "mcp/src/text.ts",
    ".claude/skills/rivocode-ui-audit/scripts/audit.mts",
  ]) {
    const source = readFileSync(file, "utf8");
    expect(source).not.toMatch(/\bfetch\(|node:https?|node:net|XMLHttpRequest|WebSocket/);
  }
});

test("a primeira frase atravessa a quebra de linha do markdown", () => {
  expect(leadSentence("Aviso de pagina: uma faixa larga\nque fica no topo. E mais.")).toBe(
    "Aviso de pagina: uma faixa larga que fica no topo.",
  );
  expect(leadSentence("Acao. Sai como botao nativo, e vira link. E mais.")).toBe(
    "Acao. Sai como botao nativo, e vira link.",
  );
  expect(cells("| `a \\| b` | c|d |")).toEqual(["`a | b`", "c", "d"]);
});

test("audit_screen devolve o mesmo relatorio da skill, pela mesma conta", async () => {
  const files = ["emissao.tsx", "emissao-nativa.tsx"].map((name) => ({
    path: `ruim/${name}`,
    source: readFileSync(`test/fixtures/auditoria/ruim/${name}`, "utf8"),
  }));
  const manifest = readFileSync("test/fixtures/auditoria/ruim/package.json", "utf8");

  const answer = await call("audit_screen", { files, package_json: manifest });
  const expected = renderMarkdown(
    audit({ files, manifests: [{ path: "package.json", source: manifest }] }),
  );

  expect(answer.isError).toBe(false);
  expect(answer.text).toStartWith(expected);
  expect(answer.text).toContain("**Nota: 0/100.** Fora do contrato.");
  expect(answer.text).toContain("`react-hook-form` não está no package.json");
});

test("audit_screen leva o julgamento e o descarte para a nota", async () => {
  const source = readFileSync("test/fixtures/auditoria/boa/cobranca.tsx", "utf8");
  const files = [{ path: "cobranca.tsx", source }];

  const clean = await call("audit_screen", { files });
  expect(clean.text).toContain("**Nota: 100/100.**");

  const judged = await call("audit_screen", {
    files,
    findings: [
      { rule: "escolha-de-peca", file: "cobranca.tsx", line: 60, message: "Toast para a falha" },
      { rule: "regra-inventada", file: "cobranca.tsx", line: 1, message: "nada" },
    ],
  });
  expect(judged.text).toContain("**Nota: 95/100.**");
  expect(judged.text).toContain("L60 **escolha-de-peca** (sério, julgamento)");
  expect(judged.text).toContain("a regra `regra-inventada` não existe");

  const colored = [
    { path: "cor.tsx", source: 'export const A = () => <div className="bg-red-500" />' },
  ];
  expect((await call("audit_screen", { files: colored })).text).toContain("**Nota: 90/100.**");
  const dismissed = await call("audit_screen", {
    files: colored,
    dismissals: [
      { rule: "cor-literal", file: "cor.tsx", line: 1, reason: "Amostra de marca do cliente" },
    ],
  });
  expect(dismissed.text).toContain("**Nota: 100/100.**");
  expect(dismissed.text).toContain("Motivo: Amostra de marca do cliente");
});

test("audit_screen le os manifestos do mais perto ao da raiz, e chega a mesma nota do script num monorepo", async () => {
  const dir = "apps/docs/src/blocks";
  const names = ["dashboard.tsx", "forbidden.tsx", "listing.tsx", "login.tsx", "settings.tsx"];
  const files = names.map((name) => ({
    path: `${dir}/${name}`,
    source: readFileSync(`${dir}/${name}`, "utf8"),
  }));
  const manifests = ["apps/docs/package.json", "package.json"].map((path) => ({
    path,
    source: readFileSync(path, "utf8"),
  }));

  const nearestOnly = await call("audit_screen", { files, package_json: manifests[0]!.source });
  expect(nearestOnly.text).toContain("**peer-faltando**");

  const answer = await call("audit_screen", { files, package_jsons: manifests });
  expect(answer.isError).toBe(false);
  expect(answer.text).toStartWith(renderMarkdown(audit({ files, manifests })));
  expect(answer.text).toContain("**Nota: 100/100.** Segue a casa.");
  expect(answer.text).not.toContain("**peer-faltando**");
});
