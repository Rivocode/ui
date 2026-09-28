import { afterAll, beforeAll, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import type { Content } from "../mcp/src/content";
import { createServer } from "../mcp/src/server";
import { buildContent, cells, leadSentence } from "../scripts/mcp-content";
import { audit, renderMarkdown } from "../.claude/skills/rivocode-ui-audit/scripts/audit.mjs";

const content: Content = buildContent();
const client = new Client({ name: "test", version: "0.0.0" });

beforeAll(async () => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer(content, { version: "0.0.0-test" }).connect(serverSide);
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

test("the server announces the eight tools, each with an English description", async () => {
  const { tools } = await client.listTools();

  expect(tools.map((tool) => tool.name).sort()).toEqual([...TOOLS].sort());
  for (const tool of tools) {
    expect(tool.description?.length ?? 0).toBeGreaterThan(60);
    expect(tool.description).toMatch(/\b(?:the|and|of)\b/);
    expect(tool.description).not.toMatch(/[áéíóúâêôãõç]/);
    expect(tool.annotations?.readOnlyHint).toBe(true);
  }
});

test("the content comes from the versions the manifests declare", () => {
  const web = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
  const native = JSON.parse(readFileSync("native/package.json", "utf8")) as { version: string };

  expect(content.generatedFrom).toEqual({ web: web.version, native: native.version });
});

test("every catalog component is answered by list_components, get_component and get_native_parity", async () => {
  expect(content.components.length).toBeGreaterThan(80);

  const listing = (await call("list_components")).text;

  for (const entry of content.components) {
    expect(listing).toContain(`**${entry.name}**`);

    const page = await call("get_component", { name: entry.name });
    expect(page.isError).toBe(false);
    expect(page.text).toStartWith(`# ${entry.name}\n`);
    expect(page.text).toContain("## In React Native");

    const bySlug = await call("get_component", { name: entry.slug });
    expect(bySlug.text).toStartWith(`# ${entry.name}\n`);

    const parity = await call("get_native_parity", { name: entry.name });
    expect(parity.isError).toBe(false);
    expect(parity.text).toContain(
      `**Parity of ${entry.name}:** ${content.parity[entry.name]?.state}`,
    );
  }
});

test("every catalog piece has a parity row and a summary", () => {
  expect(content.components.length).toBeGreaterThan(80);

  for (const entry of content.components) {
    expect(content.parity[entry.name]).toBeDefined();
    expect(entry.summary.length).toBeGreaterThan(10);
    expect(entry.summary).not.toMatch(/\s$/);
  }
});

test("a part returns the page of the piece that contains it, with the note that it is a part", async () => {
  const parts = Object.entries(content.parts);
  expect(parts.length).toBeGreaterThan(40);

  for (const [part, owner] of parts) {
    const page = await call("get_component", { name: part });
    expect(page.isError).toBe(false);
    expect(page.text).toContain(`\`${part}\` is a part of \`${owner}\``);
    expect(page.text).toContain(`\n# ${owner}\n`);
  }
});

test("a name that does not exist comes back as an error, with the way to the catalog", async () => {
  const missing = await call("get_component", { name: "Carrossel" });

  expect(missing.isError).toBe(true);
  expect(missing.text).toContain("Carrossel");

  expect((await call("get_native_parity", { name: "Carrossel" })).isError).toBe(true);
  expect((await call("get_guide", { name: "does-not-exist" })).isError).toBe(true);
  expect((await call("list_components", { family: "does-not-exist" })).isError).toBe(true);
});

test("list_components filters the family ignoring accents and case", async () => {
  const family =
    content.components.find((entry) => /[áéíóúç]/.test(entry.family))?.family ??
    content.components[0]?.family;
  expect(family).toBeDefined();

  const folded = family!.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
  const listing = await call("list_components", { family: folded });
  const expected = content.components.filter((entry) => entry.family === family);

  expect(expected.length).toBeGreaterThan(0);
  expect(listing.isError).toBe(false);
  for (const entry of expected) expect(listing.text).toContain(`**${entry.name}**`);
  const other = content.components.find((entry) => entry.family !== family)!;
  expect(listing.text).not.toContain(`**${other.name}**`);
});

test("search_docs ignores accents and case", async () => {
  const plain = await call("search_docs", { query: "cnpj mask" });
  const accented = await call("search_docs", { query: "CNPJ MÁSK" });

  expect(plain.isError).toBe(false);
  expect(plain.text).toContain("componentes/masked-input.md");
  expect(accented.text).toBe(plain.text.replace('"cnpj mask"', '"CNPJ MÁSK"'));
});

test("search_docs returns the matching snippet, and says when nothing matched", async () => {
  const hit = await call("search_docs", { query: "data-rc-density", limit: 3 });
  expect(hit.text).toContain("data-rc-density");

  const none = await call("search_docs", { query: "zzqqxxyy" });
  expect(none.isError).toBe(false);
  expect(none.text).toContain("Nothing matched");
});

const INTENTS: [intent: string, expected: string][] = [
  ["confirm before deleting the invoice", "AlertDialog"],
  ["choose a customer from a long list that comes from the server", "Combobox"],
  ["how much of the storage capacity is in use", "Meter"],
  ["invoice listing with pagination and search", "DataTable"],
  ["button with only a trash icon", "IconButton"],
  ["whole-page maintenance notice", "Banner"],
  ["password with the eye that reveals it", "PasswordInput"],
  ["attach a file by dragging", "FileUpload"],
  ["customer CPF field", "MaskedInput"],
  ["CPF or CNPJ in the same field", "MaskedInput"],
  ["contact mobile phone", "MaskedInput"],
  ["CEP that fills in the address", "PostalCodeField"],
  ["date of birth", "DatePicker"],
  ["SMS verification code", "OTPField"],
  ["pix key field", "Input"],
  ["car license plate", "MaskedInput"],
  ["credit card number", "MaskedInput"],
  ["customer e-mail", "Input"],
  ["invoice amount in reais", "CurrencyInput"],
  ["customer registration with many fields", "Fieldset"],
  ["staged flow where each step depends on the previous one", "Steps"],
  ["delete an item from the list", "ToastViewport"],
  ["undo the deletion", "ToastViewport"],
  ["permanently delete the invoice with no way back", "AlertDialog"],
  ["edit a field directly in the table", "Editable"],
  ["show advanced options only when the person asks for them", "Collapsible"],
  ["save a form draft", "Form"],
  ["global search to find any screen in the app", "Command"],
  ["empty screen the first time", "EmptyState"],
  ["open the item detail over the screen without leaving it", "Sheet"],
];

const PORTUGUESE_INTENTS: [intent: string, expected: string][] = [
  ["confirmar antes de excluir a nota", "AlertDialog"],
  ["botão só com ícone de lixeira", "IconButton"],
  ["senha com o olho que revela", "PasswordInput"],
  ["anexar arquivo arrastando", "FileUpload"],
  ["campo de CPF do cliente", "MaskedInput"],
  ["data de nascimento", "DatePicker"],
  ["busca global para achar qualquer tela do app", "Command"],
  ["tela vazia na primeira vez", "EmptyState"],
];

test("recommend_component puts the choice table piece first", async () => {
  const wrong: string[] = [];
  for (const [intent, expected] of INTENTS) {
    const answer = await call("recommend_component", { intent });
    expect(answer.isError).toBe(false);
    const first = /^## 1\. (\w+)/m.exec(answer.text)?.[1];
    if (first !== expected) wrong.push(`${intent}: ${first}, expected ${expected}`);
  }
  expect(wrong).toEqual([]);
});

test("recommend_component still understands a Portuguese intent", async () => {
  const wrong: string[] = [];
  for (const [intent, expected] of PORTUGUESE_INTENTS) {
    const answer = await call("recommend_component", { intent });
    expect(answer.isError).toBe(false);
    const first = /^## 1\. (\w+)/m.exec(answer.text)?.[1];
    if (first !== expected) wrong.push(`${intent}: ${first}, expected ${expected}`);
  }
  expect(wrong).toEqual([]);
});

test("recommend_component brings the when-not-to-use section and the neighbors it names", async () => {
  const answer = await call("recommend_component", {
    intent: "confirm before deleting the invoice",
  });

  expect(answer.text).toContain("**When not to use:**");
  expect(answer.text).toContain("## Neighbors that the AlertDialog page names");
  expect(answer.text).toContain("**Dialog**");
});

test("recommend_component with platform native says how the piece looks on a phone", async () => {
  const answer = await call("recommend_component", {
    intent: "show a keyboard shortcut in the text",
    platform: "native",
  });

  expect(answer.text).toContain("## 1. Kbd");
  expect(answer.text).toContain(`**In React Native:** ${content.parity["Kbd"]?.state}`);
});

test("every choice table row points to a piece that exists", () => {
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

test("get_tokens resolves the alias inside its own theme", async () => {
  const colors = await call("get_tokens", { category: "color" });

  const grid = colors.text.split("\n").find((line) => line.startsWith("| chart-grid |"));
  expect(grid).toBeDefined();
  const [, , , dark, light] = cells(grid!);
  expect(dark).not.toBe(light);
  expect(colors.text).toContain("`--rc-accent`");
});

test("get_tokens covers scale, density and motion, and returns the raw DTCG", async () => {
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

  expect((await call("get_tokens", { file: "nothing.json" })).isError).toBe(true);
});

test("get_native_parity brings the signature and the props of the piece that gets another name", async () => {
  const answer = await call("get_native_parity", { name: "Popconfirm" });

  expect(answer.text).toContain(content.parity["Popconfirm"]!.state);
  expect(content.parity["Popconfirm"]!.state).toContain("`AlertDialog`");
  expect(answer.text).toContain("| `Popconfirm` → `AlertDialog` | `trigger` | — |");
  expect(answer.text).not.toContain("`onAction`");
  expect(answer.text).toContain("## Props of `AlertDialog` in @rivocode/ui-native");
  expect(answer.text).toContain("| `onConfirm` |");
  expect(answer.text).not.toContain("`actionLabel`");
});

test("every listed guide is served, by name and by alias", async () => {
  expect(content.guides.length).toBeGreaterThan(15);

  for (const guide of content.guides) {
    const answer = await call("get_guide", { name: guide.slug });
    expect(answer.isError).toBe(false);
    expect(answer.text).toStartWith(content.files[guide.path]!);
  }

  const aliases: [string, string][] = [
    ["IA", "para-agents.md"],
    ["agents", "para-agents.md"],
    ["conventions", "convencoes.md"],
    ["Formulários", "skill/reference/forms.md"],
    ["forms", "skill/reference/forms.md"],
    ["densidade", "densidade.md"],
    ["density", "densidade.md"],
    ["temas", "temas.md"],
    ["themes", "temas.md"],
  ];
  for (const [alias, path] of aliases) {
    expect((await call("get_guide", { name: alias })).text).toStartWith(content.files[path]!);
  }
});

test("every skill reference becomes a guide", () => {
  const references = Object.keys(content.files).filter((path) =>
    path.startsWith("skill/reference/"),
  );
  expect(references.length).toBeGreaterThan(8);

  const served = new Set(content.guides.map((guide) => guide.path));
  for (const path of references) expect(served.has(path)).toBe(true);
});

test("every page and every DTCG file is a resource, and the resource returns the text", async () => {
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

test("the server does not talk to the network at runtime", () => {
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

test("the first sentence crosses the markdown line break", () => {
  expect(leadSentence("Aviso de pagina: uma faixa larga\nque fica no topo. E mais.")).toBe(
    "Aviso de pagina: uma faixa larga que fica no topo.",
  );
  expect(leadSentence("Acao. Sai como botao nativo, e vira link. E mais.")).toBe(
    "Acao. Sai como botao nativo, e vira link.",
  );
  expect(cells("| `a \\| b` | c|d |")).toEqual(["`a | b`", "c", "d"]);
});

test("audit_screen returns the same report as the skill, by the same math", async () => {
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
  expect(answer.text).toContain("**Score: 0/100.** Outside the contract.");
  expect(answer.text).toContain("`react-hook-form` is not in package.json");
});

test("audit_screen brings judgment and dismissal into the score", async () => {
  const source = readFileSync("test/fixtures/auditoria/boa/cobranca.tsx", "utf8");
  const files = [{ path: "cobranca.tsx", source }];

  const clean = await call("audit_screen", { files });
  expect(clean.text).toContain("**Score: 100/100.**");

  const judged = await call("audit_screen", {
    files,
    findings: [
      { rule: "escolha-de-peca", file: "cobranca.tsx", line: 60, message: "Toast para a falha" },
      { rule: "regra-inventada", file: "cobranca.tsx", line: 1, message: "nada" },
    ],
  });
  expect(judged.text).toContain("**Score: 95/100.**");
  expect(judged.text).toContain("L60 **escolha-de-peca** (serious, judgment)");
  expect(judged.text).toContain("the rule `regra-inventada` does not exist");

  const colored = [
    { path: "cor.tsx", source: 'export const A = () => <div className="bg-red-500" />' },
  ];
  expect((await call("audit_screen", { files: colored })).text).toContain("**Score: 90/100.**");
  const dismissed = await call("audit_screen", {
    files: colored,
    dismissals: [
      { rule: "cor-literal", file: "cor.tsx", line: 1, reason: "Amostra de marca do cliente" },
    ],
  });
  expect(dismissed.text).toContain("**Score: 100/100.**");
  expect(dismissed.text).toContain("Reason: Amostra de marca do cliente");
});

test("audit_screen reads the manifests from nearest to root, and reaches the same score as the script in a monorepo", async () => {
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
  expect(answer.text).toContain("**Score: 100/100.** Follows the house.");
  expect(answer.text).not.toContain("**peer-faltando**");
});

test("get_component finds a part without its own page by the name of the piece that contains it", async () => {
  for (const [part, owner] of [
    ["SidebarMenuItem", "Sidebar"],
    ["SidebarHeader", "Sidebar"],
    ["SidebarContent", "Sidebar"],
  ] as const) {
    const answer = await call("get_component", { name: part });
    expect(answer.isError).toBe(false);
    expect(answer.text).toContain(`\`${part}\` is a part of \`${owner}\``);
  }

  const page = await call("get_component", { name: "SidebarMenuItem" });
  expect(page.text).toContain("render={<NavLink");

  const direct = await call("get_component", { name: "Sidebar" });
  expect(direct.text).not.toContain("is a part of");
});

test("get_component keeps refusing a name that belongs to no piece", async () => {
  const answer = await call("get_component", { name: "Sidebarzinha" });
  expect(answer.isError).toBe(true);
});
