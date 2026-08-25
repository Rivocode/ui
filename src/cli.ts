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

const AQUI = dirname(fileURLToPath(import.meta.url));

/** A skill viaja no pacote, ao lado do `dist`; o agent, na pasta irma. */
const ORIGEM = resolve(AQUI, "../skill");
const AGENT = resolve(AQUI, "../agent/rivocode-ui.md");

const AJUDA = `
@rivocode/ui

  rivocode-ui skill            instala a skill neste projeto, em .claude/skills
  rivocode-ui skill --global   instala para todos os seus projetos, em ~/.claude

A skill ensina a biblioteca a um agente: o contrato, a escolha entre as pecas
parecidas, e os enderecos da documentacao crua.
`;

function instalar(global: boolean) {
  const root = global ? process.env.HOME : process.cwd();

  if (!root) {
    console.error("Nao consegui descobrir a sua pasta pessoal. Rode sem --global.");
    process.exit(1);
  }

  const destino = join(root, ".claude", "skills", "rivocode-ui");

  try {
    mkdirSync(destino, { recursive: true });
    // A pasta inteira, e nao so o SKILL.md: o corpo da skill aponta para
    // `reference/`, e sem esses arquivos os links levam a lugar nenhum.
    cpSync(ORIGEM, destino, { recursive: true });
  } catch (erro) {
    console.error(`Nao consegui escrever em ${destino}.`);
    console.error(erro instanceof Error ? erro.message : erro);
    process.exit(1);
  }

  // O agent e o especialista que carrega a skill sozinho: quem delega uma
  // tela para ele nao precisa lembrar de pedir "use a skill".
  if (existsSync(AGENT)) {
    const agentes = join(root, ".claude", "agents");
    mkdirSync(agentes, { recursive: true });
    cpSync(AGENT, join(agentes, "rivocode-ui.md"));
  }

  const onde = global ? "para todos os seus projetos" : "neste projeto";
  console.log(`Skill instalada ${onde}, em ${destino}`);
  console.log(`Agent instalado em ${join(root, ".claude", "agents", "rivocode-ui.md")}`);
  console.log("O agente carrega sozinho quando voce pedir uma tela.");
}

const [command, ...resto] = process.argv.slice(2);

if (command === "skill") {
  instalar(resto.includes("--global") || resto.includes("-g"));
} else if (command === "--help" || command === "-h" || command === undefined) {
  console.log(AJUDA.trim());
} else {
  console.error(`Nao conheco "${command}".`);
  console.log(AJUDA.trim());
  process.exit(1);
}
