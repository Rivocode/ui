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

import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));

/** A skill viaja no pacote, ao lado do `dist`. */
const ORIGEM = resolve(AQUI, "../skill/SKILL.md");

const AJUDA = `
@rivocode/ui

  rivocode-ui skill            instala a skill neste projeto, em .claude/skills
  rivocode-ui skill --global   instala para todos os seus projetos, em ~/.claude

A skill ensina a biblioteca a um agente: o contrato, a escolha entre as pecas
parecidas, e os enderecos da documentacao crua.
`;

function instalar(global: boolean) {
  const raiz = global ? process.env.HOME : process.cwd();

  if (!raiz) {
    console.error("Nao consegui descobrir a sua pasta pessoal. Rode sem --global.");
    process.exit(1);
  }

  const destino = join(raiz, ".claude", "skills", "rivocode-ui");

  try {
    mkdirSync(destino, { recursive: true });
    copyFileSync(ORIGEM, join(destino, "SKILL.md"));
  } catch (erro) {
    console.error(`Nao consegui escrever em ${destino}.`);
    console.error(erro instanceof Error ? erro.message : erro);
    process.exit(1);
  }

  const onde = global ? "para todos os seus projetos" : "neste projeto";
  console.log(`Skill instalada ${onde}, em ${destino}/SKILL.md`);
  console.log("O agente carrega sozinho quando voce pedir uma tela.");
}

const [comando, ...resto] = process.argv.slice(2);

if (comando === "skill") {
  instalar(resto.includes("--global") || resto.includes("-g"));
} else if (comando === "--help" || comando === "-h" || comando === undefined) {
  console.log(AJUDA.trim());
} else {
  console.error(`Nao conheco "${comando}".`);
  console.log(AJUDA.trim());
  process.exit(1);
}
