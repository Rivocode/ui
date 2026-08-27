#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  type Finding,
  MAP_ROLES,
  type ThemeMap,
  checkThemeCss,
  checkThemeMap,
  readTokens,
  resolveTokens,
} from "./lib/contrast";
import { type ThemeReport, checkThemes, reportOf, themeBlocks } from "./lib/theme-check";
import { THEME_ROLES } from "./tokens/theme-roles";

const HERE = dirname(fileURLToPath(import.meta.url));

const SKILL_SOURCE = resolve(HERE, "../skill");
const AGENT = resolve(HERE, "../agent/rivocode-ui.md");
const PACKAGE = resolve(HERE, "../package.json");

const HELP = `
@rivocode/ui

  rivocode-ui skill                    instala a skill neste projeto, em .claude/skills
  rivocode-ui skill --global           instala para todos os seus projetos, em ~/.claude

  rivocode-ui check-theme <css...>     confere os papéis e mede o contraste do seu tema
  rivocode-ui check-theme <mapa.ts>    o mesmo, no mapa que o React Native veste
  rivocode-ui check-theme <...> --json a mesma conferência, em JSON, para o seu CI

A skill ensina a biblioteca a um agente: o contrato, a escolha entre as peças
parecidas, e os endereços da documentação crua.

O check-theme faz duas perguntas, nessa ordem. Primeiro se o tema declara todos
os papéis que a biblioteca espera — a falta de um não é erro de compilação: o
build passa, e quem descobre é a tela. Depois, se os pares que carregam texto,
fronteira de controle e objeto gráfico chegam ao mínimo da WCAG, com o alfa
composto sobre o fundo em que ele é desenhado. É a mesma conta e a mesma tabela
de pares que o design system cobra de si mesmo.

A extensão diz qual das duas formas de tema você escreveu: \`.css\` é a camada 3
do web, e o comando junta as declarações por seletor; \`.ts\`, \`.mjs\` ou \`.js\`
é o mapa com \`light\` e \`dark\` que o RivoProvider do @rivocode/ui-native
recebe, e o comando importa o módulo. São dois formatos do mesmo tema, e um
comando só para os dois — dois CLIs divergiriam na primeira correção que só um
deles recebesse.
`;

function version() {
  try {
    return (JSON.parse(readFileSync(PACKAGE, "utf8")) as { version: string }).version;
  } catch {
    return "?";
  }
}

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

function wrap(text: string, indent: string) {
  const lines: string[] = [];
  let line = indent;

  for (const word of text.split(" ")) {
    if (line.length + word.length + 1 > 88 && line.trim().length > 0) {
      lines.push(line);
      line = indent;
    }
    line += line === indent ? word : ` ${word}`;
  }

  lines.push(line);
  return lines;
}

function count(many: number, one: string, some: string) {
  return `${many} ${many === 1 ? one : some}`;
}

function human(reports: ThemeReport[]) {
  const lines: string[] = [];

  for (const theme of reports) {
    lines.push("");
    lines.push(`${theme.selector}   (${theme.files.join(", ")})`);

    if (theme.missing.length === 0) {
      lines.push(`  ${theme.declared} dos ${theme.required} papéis. Tema completo.`);
      continue;
    }

    const holes = theme.missing.length;
    lines.push(
      `  ${theme.declared} dos ${theme.required} papéis. ${holes === 1 ? "Falta 1" : `Faltam ${holes}`}.`,
    );

    for (const [silent, title] of [
      [true, "QUEBRA CALADA, e é por isso que ninguém reporta:"],
      [false, "QUEBRA VISÍVEL, na tela que usa o papel:"],
    ] as const) {
      const group = theme.missing.filter((role) => role.silent === silent);
      if (group.length === 0) continue;

      lines.push("");
      lines.push(`  ${title}`);

      for (const role of group) {
        lines.push("");
        lines.push(`    ${role.role}`);
        lines.push(...wrap(role.effect, "      "));
        if (role.note) {
          lines.push(...wrap(`Papel novo na ${role.version}: ${role.note}`, "      "));
        }
        if (role.meant) {
          lines.push(
            ...wrap(
              `Você declarou ${role.meant}, parecido demais para ser outra coisa: é este papel com um dedo errado.`,
              "      ",
            ),
          );
        }
      }
    }
  }

  const short = reports.filter((theme) => theme.missing.length > 0);
  const holes = short.reduce((total, theme) => total + theme.missing.length, 0);

  lines.push("");

  if (short.length === 0) {
    const required = [...new Set(reports.map((theme) => theme.required))]
      .sort((one, other) => one - other)
      .join(" e ");
    lines.push(
      `${count(reports.length, "tema completo", "temas completos")}, contra os ` +
        `${required} papéis do @rivocode/ui ${version()}.`,
    );
  } else {
    lines.push(
      `${count(holes, "papel faltando", "papéis faltando")} em ${short.length} de ` +
        `${count(reports.length, "tema", "temas")}, no @rivocode/ui ${version()}.`,
    );
    lines.push(
      "Nenhum deles é erro de compilação: o tsc passa, o build passa, e a tela sai errada.",
    );
  }

  return lines.join("\n");
}

const CSS = ".css";
const MODULE = new Set([".ts", ".mts", ".cts", ".js", ".mjs", ".cjs"]);

function contrastHuman(findings: Finding[]) {
  const lines = ["", "Contraste, agora que os papéis estão todos lá:"];
  for (const finding of findings) lines.push(finding.line);

  const bad = findings.filter((finding) => !finding.ok);
  lines.push("");

  if (bad.length === 0) {
    lines.push(
      "Todo par acima do mínimo: 4,5:1 para texto e 7:1 para o corpo (WCAG 1.4.3), " +
        "3:1 para fronteira de controle e objeto gráfico (1.4.11).",
    );
    return lines.join("\n");
  }

  lines.push(
    `${count(bad.length, "par abaixo do mínimo", "pares abaixo do mínimo")}, ` +
      `no @rivocode/ui ${version()}.`,
  );
  lines.push(
    "O alfa foi composto sobre o fundo em que ele é desenhado antes de medir: é " +
      "o que o olho vê, e medir a cor crua responde a pergunta errada.",
  );

  if (bad.some((finding) => finding.line.includes("não resolveu"))) {
    lines.push(
      "Os valores que não resolveram não foram medidos. A conta lê hexadecimal de " +
        "3, 4, 6 e 8 dígitos, rgb(), rgba(), hsl(), hsla(), hwb(), lab(), lch(), " +
        "oklab(), oklch() e color() nos espaços predefinidos do CSS, e converte " +
        "tudo para sRGB antes de medir — a paleta do Tailwind 4 entra direto. " +
        "Ficam de fora color-mix(), que é conta e não cor, e nome de cor da CSS " +
        "como rebeccapurple. Esses saem sem medida, e o que não se mede não se promete.",
    );
  }

  return lines.join("\n");
}

function cssSources(files: string[]) {
  const sources: Array<{ file: string; css: string }> = [];

  for (const file of files) {
    try {
      sources.push({ file, css: readFileSync(file, "utf8") });
    } catch {
      console.error(`Não consegui ler ${file}.`);
      process.exit(1);
    }
  }

  return sources;
}

async function themeMaps(files: string[]) {
  const maps: Array<{ file: string; name: string; map: ThemeMap }> = [];

  for (const file of files) {
    let loaded: Record<string, unknown>;

    try {
      loaded = (await import(pathToFileURL(resolve(file)).href)) as Record<string, unknown>;
    } catch (error) {
      console.error(`Não consegui carregar ${file}.`);
      console.error(error instanceof Error ? error.message : error);
      console.error(
        "Para ler um mapa escrito em TypeScript o Node precisa ser 22.18 ou mais novo. " +
          "Num Node anterior, aponte para um .mjs que exporte o mesmo objeto.",
      );
      process.exit(1);
    }

    const found = Object.entries(loaded).filter(
      ([, value]) =>
        typeof value === "object" && value !== null && "light" in value && "dark" in value,
    );

    if (found.length === 0) {
      console.error(`Nenhum mapa de tema em ${file}.`);
      console.error(
        "Um mapa é um objeto exportado com `light` e `dark`, cada um com os papéis " +
          "de cor. É o que `bun run gen:native --tema` escreve, e é o que o " +
          "RivoProvider do @rivocode/ui-native recebe.",
      );
      process.exit(1);
    }

    for (const [name, value] of found) maps.push({ file, name, map: value as ThemeMap });
  }

  return maps;
}

async function checkTheme(args: string[]) {
  const json = args.includes("--json");
  const files = args.filter((argument) => !argument.startsWith("-"));
  const unknown = args.filter((argument) => argument.startsWith("-") && argument !== "--json");

  if (unknown.length > 0) {
    console.error(`Não conheço ${unknown.join(", ")}. O check-theme aceita só --json.`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error("Diga qual tema eu leio: rivocode-ui check-theme tema-acme.css");
    console.error(
      "Passe TODOS os arquivos que formam o tema de uma vez: o comando junta as declarações por seletor, e o que ele não leu conta como faltando.",
    );
    process.exit(1);
  }

  const strange = files.filter((file) => extname(file) !== CSS && !MODULE.has(extname(file)));

  if (strange.length > 0) {
    console.error(`Não sei ler ${strange.join(", ")}.`);
    console.error(
      "A extensão diz qual forma de tema é: .css para a camada 3 do web, ou .ts, .mjs e .js para o mapa com `light` e `dark` do React Native.",
    );
    process.exit(1);
  }

  const sources = cssSources(files.filter((file) => extname(file) === CSS));
  const maps = await themeMaps(files.filter((file) => MODULE.has(extname(file))));

  const reports: ThemeReport[] = checkThemes(sources, THEME_ROLES);
  const mapRoles = MAP_ROLES.map((role) => `--rc-${role}`);

  for (const { file, name, map } of maps) {
    for (const scheme of ["light", "dark"] as const) {
      const present = new Set(Object.keys(map[scheme]).map((role) => `--rc-${role}`));
      const report = reportOf(`${name} / ${scheme}`, [file], present, mapRoles);
      if (report) reports.push(report);
    }
  }

  if (reports.length === 0) {
    console.error(`Nenhum bloco de tema em ${files.join(", ")}.`);
    console.error(
      'Um bloco vira tema quando declara pelo menos um papel `--rc-`, como `[data-rc-theme="acme"] { --rc-bg: ... }`. Sem isso eu ficaria verde sem ter olhado nada, que é a falha que este comando existe para evitar.',
    );
    process.exit(1);
  }

  const broken = reports.some((theme) => theme.missing.length > 0);

  // A ordem e a decisao: papel faltando primeiro, porque medir o contraste de
  // um papel que nao existe nao diz nada - a conta cairia no valor herdado, e o
  // numero sairia bonito por acidente.
  if (broken) {
    if (json) {
      console.log(JSON.stringify({ version: version(), ok: false, themes: reports }, undefined, 2));
    } else {
      console.log(human(reports));
    }
    process.exit(1);
  }

  const findings: Finding[] = [];

  const lookup = readTokens(sources.map((source) => source.css).join("\n"));
  for (const block of themeBlocks(sources)) {
    if (!reports.some((theme) => theme.selector === block.selector)) continue;
    findings.push(...checkThemeCss(block.selector, resolveTokens(block.tokens, lookup)));
  }

  for (const { file, name, map } of maps) {
    findings.push(...checkThemeMap(`${file}:${name}`, map));
  }

  const failed = findings.some((finding) => !finding.ok);

  if (json) {
    console.log(
      JSON.stringify(
        { version: version(), ok: !failed, themes: reports, contrast: findings },
        undefined,
        2,
      ),
    );
  } else {
    console.log(human(reports));
    console.log(contrastHuman(findings));
  }

  if (failed) process.exit(1);
}

const [command, ...rest] = process.argv.slice(2);

if (command === "skill") {
  install(rest.includes("--global") || rest.includes("-g"));
} else if (command === "check-theme") {
  await checkTheme(rest);
} else if (command === "--help" || command === "-h" || command === undefined) {
  console.log(HELP.trim());
} else {
  console.error(`Não conheço "${command}".`);
  console.log(HELP.trim());
  process.exit(1);
}
