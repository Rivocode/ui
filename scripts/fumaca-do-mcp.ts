/**
 * Sobe o `@rivocode/ui-mcp` CONSTRUIDO pelo stdio, com `node`, e conversa com ele.
 *
 * O `test/servidor-mcp.test.ts` prova o servidor em memoria, chamando
 * `createServer` com o conteudo montado na hora. Ele nao ve o que so quebra
 * no pacote: o `dist/content.json` que nao foi escrito, o `bin` sem shebang, o
 * import que o bundle resolveu para um caminho que so existe no monorepo, o
 * `bun` que o `npx` de quem instala nao tem. Esta fumaca roda o mesmo comando
 * que o cliente MCP roda - `node dist/cli.js` - e cobra as oito ferramentas e
 * uma resposta de cada familia.
 *
 * Fica fora do `bun run check` porque precisa do `mcp/dist`, que so existe
 * depois do `bun run build`. Roda no `ci.yml`, logo depois do build, e no
 * `release-mcp.yml`, antes do `npm publish`.
 *
 *   bun run build:mcp && bun run scripts/fumaca-do-mcp.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const CLI = resolve("mcp/dist/cli.js");
const CONTENT = resolve("mcp/dist/content.json");

const TOOLS = [
  "audit_screen",
  "get_component",
  "get_guide",
  "get_native_parity",
  "get_tokens",
  "list_components",
  "recommend_component",
  "search_docs",
];

function die(message: string): never {
  console.error(message);
  process.exit(1);
}

for (const file of [CLI, CONTENT]) {
  if (!existsSync(file)) die(`Falta ${file}. Rode \`bun run build:mcp\` antes da fumaca.`);
}

if (!readFileSync(CLI, "utf8").startsWith("#!/usr/bin/env node")) {
  die(`${CLI} nao abre com o shebang do node: o \`npx\` nao conseguiria executar o bin.`);
}

const client = new Client({ name: "fumaca", version: "0.0.0" });
const transport = new StdioClientTransport({ command: "node", args: [CLI], stderr: "pipe" });

await client.connect(transport);

const { tools } = await client.listTools();
const names = tools.map((tool) => tool.name).sort();
if (JSON.stringify(names) !== JSON.stringify(TOOLS)) {
  die(`O servidor anunciou ${names.join(", ")}, e a fumaca espera ${TOOLS.join(", ")}.`);
}

type Result = { content: { text: string }[]; isError?: boolean };

const probes: [string, Record<string, unknown>, string][] = [
  ["list_components", {}, "**DataTable**"],
  ["get_component", { name: "DataTable" }, "# DataTable"],
  ["search_docs", { query: "mascara cnpj" }, "masked-input.md"],
  ["recommend_component", { intent: "confirmar antes de excluir" }, "## 1. AlertDialog"],
  ["get_tokens", { category: "color" }, "`--rc-accent`"],
  ["get_native_parity", { name: "Select" }, "# Select no React Native"],
  ["get_guide", { name: "convencoes" }, "RivoProvider"],
  [
    "audit_screen",
    { files: [{ path: "tela.tsx", source: 'export const A = () => <div className="z-50" />' }] },
    "**Nota: 95/100.**",
  ],
];

for (const [name, args, expected] of probes) {
  const result = (await client.callTool({ name, arguments: args })) as Result;
  const text = result.content.map((item) => item.text).join("\n");
  if (result.isError || !text.includes(expected)) {
    die(`\`${name}\` nao devolveu "${expected}":\n\n${text.slice(0, 600)}`);
  }
}

const { resources } = await client.listResources();
if (resources.length < 150) die(`So ${resources.length} resources: esperava mais de 150.`);

const version = client.getServerVersion();
await client.close();

console.log(
  `${version?.name} ${version?.version} respondeu pelo stdio: ${names.length} ferramentas,` +
    ` ${resources.length} resources, ${probes.length} chamadas conferidas.`,
);
