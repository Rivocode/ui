#!/usr/bin/env node

/* ---------------------------------------------------------------------------
 * A linha de comando do pacote.
 *
 * Faz uma coisa so: instalar a skill que ensina esta biblioteca a um agente.
 *
 * Ela poderia ser um `curl` do site, e continua sendo, mas o comando tem uma
 * vantagem que o `curl` nao tem: ele copia a skill que veio **dentro da versao
 * instalada**. Um projeto preso no `0.2.0` recebe a skill do `0.2.0`, e nao a
 * do site, que fala de pecas que aquele projeto ainda nao tem.
 * ------------------------------------------------------------------------- */

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** A skill viaja no pacote, ao lado do `dist`; o agent, na pasta irma. */
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
    // A pasta inteira, e nao so o SKILL.md: o corpo da skill aponta para
    // `reference/`, e sem esses arquivos os links levam a lugar nenhum.
    cpSync(SKILL_SOURCE, target, { recursive: true });
  } catch (error) {
    console.error(`Não consegui escrever em ${target}.`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // O agent e o especialista que carrega a skill sozinho: quem delega uma
  // tela para ele nao precisa lembrar de pedir "use a skill".
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
