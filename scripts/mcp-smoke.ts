/**
 * Starts the BUILT `@rivocode/ui-mcp` over stdio, with `node`, and talks to it.
 *
 * `test/mcp-server.test.ts` proves the server in memory, calling
 * `createServer` with content assembled on the spot. It does not see what only
 * breaks in the package: the `dist/content.json` that was not written, the
 * `bin` without a shebang, the import the bundle resolved to a path that only
 * exists in the monorepo, the `bun` that the installer's `npx` does not have.
 * This smoke test runs the same command the MCP client runs - `node
 * dist/cli.js` - and demands the eight tools and one answer from each family.
 *
 * It stays out of `bun run check` because it needs `mcp/dist`, which only
 * exists after `bun run build`. It runs in `ci.yml`, right after the build,
 * and in `release-mcp.yml`, before `npm publish`.
 *
 *   bun run build:mcp && bun run scripts/mcp-smoke.ts
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
  if (!existsSync(file)) die(`Missing ${file}. Run \`bun run build:mcp\` before the smoke test.`);
}

if (!readFileSync(CLI, "utf8").startsWith("#!/usr/bin/env node")) {
  die(`${CLI} does not start with the node shebang: \`npx\` could not run the bin.`);
}

const client = new Client({ name: "smoke", version: "0.0.0" });
const transport = new StdioClientTransport({ command: "node", args: [CLI], stderr: "pipe" });

await client.connect(transport);

const { tools } = await client.listTools();
const names = tools.map((tool) => tool.name).sort();
if (JSON.stringify(names) !== JSON.stringify(TOOLS)) {
  die(`The server announced ${names.join(", ")}, and the smoke test expects ${TOOLS.join(", ")}.`);
}

type Result = { content: { text: string }[]; isError?: boolean };

const probes: [string, Record<string, unknown>, string | RegExp][] = [
  ["list_components", {}, "**DataTable**"],
  ["get_component", { name: "DataTable" }, "# DataTable"],
  ["search_docs", { query: "cnpj mask" }, "masked-input.md"],
  ["recommend_component", { intent: "confirm before deleting" }, "## 1. AlertDialog"],
  ["get_tokens", { category: "color" }, "`--rc-accent`"],
  ["get_native_parity", { name: "Select" }, "# Select in React Native"],
  ["get_guide", { name: "convencoes" }, "RivoProvider"],
  [
    "audit_screen",
    { files: [{ path: "tela.tsx", source: 'export const A = () => <div className="z-50" />' }] },
    /\*\*(?:Nota|Score): 95\/100\.\*\*/,
  ],
];

for (const [name, args, expected] of probes) {
  const result = (await client.callTool({ name, arguments: args })) as Result;
  const text = result.content.map((item) => item.text).join("\n");
  const found = typeof expected === "string" ? text.includes(expected) : expected.test(text);
  if (result.isError || !found) {
    die(`\`${name}\` did not return "${expected}":\n\n${text.slice(0, 600)}`);
  }
}

const { resources } = await client.listResources();
if (resources.length < 150) die(`Only ${resources.length} resources: expected more than 150.`);

const version = client.getServerVersion();
await client.close();

console.log(
  `${version?.name} ${version?.version} answered over stdio: ${names.length} tools,` +
    ` ${resources.length} resources, ${probes.length} calls checked.`,
);
