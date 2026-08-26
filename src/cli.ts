#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const SKILL_SOURCE = resolve(HERE, "../skill");
const AGENT = resolve(HERE, "../agent/rivocode-ui.md");

const HELP = `
@rivocode/ui

  rivocode-ui skill            instala a skill neste projeto, em .claude/skills
  rivocode-ui skill --global   instala para todos os seus projetos, em ~/.claude

A skill ensina a biblioteca a um agente: o contrato, a escolha entre as peças
parecidas, e os endereços da documentação crua.
`;

function install(global: boolean) {
  const root = global ? process.env.HOME : process.cwd();

  if (!root) {
    console.error("Não consegui descobrir a sua pasta pessoal. Rode sem --global.");
    process.exit(1);
  }

  const target = join(root, ".claude", "skills", "rivocode-ui");

  try {
    mkdirSync(target, { recursive: true });
    cpSync(SKILL_SOURCE, target, { recursive: true });
  } catch (error) {
    console.error(`Não consegui escrever em ${target}.`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  if (existsSync(AGENT)) {
    const agentsDir = join(root, ".claude", "agents");
    mkdirSync(agentsDir, { recursive: true });
    cpSync(AGENT, join(agentsDir, "rivocode-ui.md"));
  }

  const where = global ? "para todos os seus projetos" : "neste projeto";
  console.log(`Skill instalada ${where}, em ${target}`);
  console.log(`Agent instalado em ${join(root, ".claude", "agents", "rivocode-ui.md")}`);
  console.log("O agente carrega sozinho quando você pedir uma tela.");
}

const [command, ...rest] = process.argv.slice(2);

if (command === "skill") {
  install(rest.includes("--global") || rest.includes("-g"));
} else if (command === "--help" || command === "-h" || command === undefined) {
  console.log(HELP.trim());
} else {
  console.error(`Não conheço "${command}".`);
  console.log(HELP.trim());
  process.exit(1);
}
