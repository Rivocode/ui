#!/usr/bin/env node
import { readFileSync } from "node:fs";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import type { Content } from "./content";
import { createServer } from "./server";

const content = JSON.parse(
  readFileSync(new URL("./content.json", import.meta.url), "utf8"),
) as Content;
const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  version: string;
};

const server = createServer(content, { version: manifest.version });
await server.connect(new StdioServerTransport());

console.error(
  `@rivocode/ui-mcp ${manifest.version} no stdio, com a documentação de @rivocode/ui ` +
    `${content.generatedFrom.web} e @rivocode/ui-native ${content.generatedFrom.native}.`,
);
