/**
 * A receita de instalacao do `@rivocode/ui-native` escrita nos dois guias, a
 * partir do `native/scripts/init.mjs`.
 *
 * Ate 07/10/2026 ela morava em tres lugares escritos a mao: o `RECIPE` do
 * init, a secao Instalacao do `native/README.md` e a do guia do site. O
 * conserto daquele dia (o `react-native-css@rc` e o `lightningcss` fixo) teve
 * de ser feito nos tres, e os dois textos ja nao concordavam entre si antes
 * dele: um contava sete arquivos, o outro cinco, e o `global.css` do site nao
 * tinha as quatro linhas `@source not inline(...)` sem as quais o compilador
 * nativo morre. So o init era conferido, pelo `check:receita`, contra o
 * `examples/native`.
 *
 * Aqui o que e FATO sai do init e entra nos guias entre marcadores
 * `<!-- receita:<id> -->` e `<!-- /receita:<id> -->`: a linha de instalacao,
 * o que o comando imprime num app recem-criado (rodando o `plan` de verdade
 * num app de mentira), o conteudo de cada arquivo que ele escreve e as chaves
 * de JSON. A prosa que explica o porque continua escrita a mao, em volta.
 *
 * Rodar sem argumento reescreve os blocos. Quem confere e o `check:receita`,
 * que importa `guideProblems` daqui: o bloco desatualizado, o marcador que
 * falta e o valor da receita copiado a mao para FORA de um bloco, que seria a
 * segunda copia sem conferencia de novo.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { countAtLeast } from "./varredura";

export const GUIDES = ["native/README.md", "apps/docs/src/content/react-native.md"];

const INIT = "native/scripts/init.mjs";

type Step = { name: string; action: string; note: string };
type JsonItem = {
  name: string;
  kind: string;
  path?: string[] | ((root: string) => string[]);
  value?: unknown;
};

const recipe = (await import(`${import.meta.dir}/../${INIT}`)) as {
  SPEC: string;
  INSTALL: string[];
  CSS_ENGINE: string;
  POSTCSS_PLUGINS: string[];
  BROWSERSLIST: string[];
  LIGHTNINGCSS: string;
  REQUIRED_PEERS: string[];
  RECIPE: JsonItem[];
  overridePath: (root: string) => string[];
  plan: (root: string) => Step[];
  missingPeers: (root: string) => string[];
  headline: (root: string) => string;
  stepLine: (step: Step) => string;
  peersLine: () => string;
  postcssConfig: () => string;
  metroConfig: () => string;
  globalCss: (spec?: string) => string;
  nativewindEnv: () => string;
};

/**
 * O que o comando imprime num app do Expo recem-criado: `app.json` nascendo
 * em `light`, como no template, e os peers obrigatorios ja no `package.json`.
 * O app e de verdade, numa pasta temporaria, e o `plan` e o mesmo do comando.
 */
function transcript(): string {
  const base = mkdtempSync(join(tmpdir(), "receita-nos-guias-"));
  const root = join(base, "meu-app");

  try {
    mkdirSync(root);
    const dependencies = Object.fromEntries(recipe.REQUIRED_PEERS.map((name) => [name, "*"]));
    writeFileSync(join(root, "package.json"), `${JSON.stringify({ name: "meu-app", dependencies }, null, 2)}\n`);
    writeFileSync(
      join(root, "app.json"),
      `${JSON.stringify({ expo: { name: "meu-app", userInterfaceStyle: "light" } }, null, 2)}\n`,
    );

    if (recipe.missingPeers(root).length > 0) {
      throw new Error("o app de mentira do transcrito ficou sem os peers obrigatorios");
    }

    const steps = recipe.plan(root);
    return [recipe.headline(root), "", ...steps.map(recipe.stepLine), "", recipe.peersLine()].join("\n");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

function inline(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((one) => JSON.stringify(one)).join(", ")}]`;
  return JSON.stringify(value);
}

function nested(path: string[], value: unknown): string {
  const [head, ...rest] = path;
  return rest.length === 0 ? `"${head}": ${inline(value)}` : `"${head}": { ${nested(rest, value)} }`;
}

function jsonKeys(file: string): string {
  const items = recipe.RECIPE.filter((item) => item.kind === "json" && item.name === file);
  countAtLeast(`chave de \`${file}\` na receita`, items.length, 1);

  const root = mkdtempSync(join(tmpdir(), "receita-chaves-"));

  try {
    return items
      .map((item) => {
        const path = typeof item.path === "function" ? item.path(root) : item.path!;
        return nested(path, item.value);
      })
      .join(",\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const MANAGERS: [string, string | undefined][] = [
  ["npm e bun", undefined],
  ["yarn", "yarn.lock"],
  ["pnpm", "pnpm-lock.yaml"],
];

function overrideKeys(): string {
  const base = mkdtempSync(join(tmpdir(), "receita-override-"));

  try {
    return MANAGERS.map(([who, lock], at) => {
      const root = join(base, String(at));
      mkdirSync(root);
      if (lock) writeFileSync(join(root, lock), "");
      return `- ${who}: \`${recipe.overridePath(root).join(".")}\``;
    }).join("\n");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

function fenced(lang: string, body: string): string {
  return `\`\`\`${lang}\n${body.replace(/\n+$/, "")}\n\`\`\``;
}

export const BLOCKS: Record<string, () => string> = {
  install: () => fenced("sh", recipe.INSTALL.join("\n")),
  transcript: () => fenced("", transcript()),
  "postcss.config.mjs": () => fenced("js", recipe.postcssConfig()),
  "metro.config.js": () => fenced("js", recipe.metroConfig()),
  "global.css": () => fenced("css", recipe.globalCss(recipe.SPEC)),
  "nativewind-env.d.ts": () => fenced("ts", recipe.nativewindEnv()),
  "app.json": () => fenced("json", jsonKeys("app.json")),
  "package.json": () => fenced("json", jsonKeys("package.json")),
  override: overrideKeys,
};

const TAG = "receita";
const MARKER = new RegExp(
  `^([ \\t]*)<!-- ${TAG}:([\\w.-]+) -->\\n[\\s\\S]*?\\n[ \\t]*<!-- \\/${TAG}:\\2 -->$`,
  "gm",
);

function indent(text: string, pad: string): string {
  return text
    .split("\n")
    .map((line) => (line === "" ? line : `${pad}${line}`))
    .join("\n");
}

export function rewrite(text: string, rendered: Record<string, string>): { text: string; ids: string[] } {
  const ids: string[] = [];
  const out = text.replace(MARKER, (whole, pad: string, id: string) => {
    ids.push(id);
    const body = rendered[id];
    if (body === undefined) return whole;
    return `${pad}<!-- ${TAG}:${id} -->\n${indent(body, pad)}\n${pad}<!-- /${TAG}:${id} -->`;
  });
  return { text: out, ids };
}

function outside(text: string): string {
  return text.replace(MARKER, "");
}

/**
 * Valores da receita que so podem aparecer DENTRO de um bloco. Fora dele sao
 * copia a mao, e foi copia a mao que deixou os guias para tras.
 */
function strays(): string[] {
  return [recipe.LIGHTNINGCSS, ...recipe.BROWSERSLIST];
}

function installProblems(): string[] {
  const problems: string[] = [];
  const line = recipe.INSTALL.join("\n");
  const words = new Set(line.split(/\s+/).map((word) => word.replace(/@[^@/]+$/, "")));
  const wanted = [
    ...recipe.REQUIRED_PEERS.filter((name) => name !== "react" && name !== "react-native"),
    recipe.CSS_ENGINE,
    ...recipe.POSTCSS_PLUGINS,
    recipe.SPEC,
  ];

  for (const name of wanted) {
    if (!words.has(name)) {
      problems.push(
        `${INIT}: o \`INSTALL\` nao instala \`${name}\`.\n` +
          "    E peer obrigatorio, motor de CSS ou plugin do PostCSS da receita, e a linha" +
          "\n    que os guias mandam copiar sairia sem ele.",
      );
    }
  }

  return problems;
}

export function guideProblems(): string[] {
  const rendered = Object.fromEntries(Object.entries(BLOCKS).map(([id, render]) => [id, render()]));
  const problems = installProblems();

  for (const file of GUIDES) {
    const before = readFileSync(file, "utf8");
    const { text: after, ids } = rewrite(before, rendered);

    countAtLeast(`bloco da receita em \`${file}\``, ids.length, Object.keys(BLOCKS).length);

    for (const id of Object.keys(BLOCKS)) {
      if (!ids.includes(id)) {
        problems.push(`${file}: falta o bloco \`<!-- receita:${id} -->\`.`);
      }
    }

    for (const id of ids) {
      if (!(id in BLOCKS)) {
        problems.push(`${file}: o bloco \`<!-- receita:${id} -->\` nao existe em BLOCKS.`);
      }
    }

    if (after !== before) {
      problems.push(
        `${file}: os blocos da receita nao dizem o que o ${INIT} diz.\n` +
          "    Rode `bun run scripts/receita-nos-guias.ts` e comite o resultado.",
      );
    }

    const loose = outside(before);
    for (const value of strays()) {
      if (loose.includes(value)) {
        problems.push(
          `${file}: \`${value}\` aparece fora de um bloco \`<!-- receita:... -->\`.\n` +
            "    E valor da receita copiado a mao, e envelhece calado no proximo conserto." +
            "\n    Aponte para o bloco em vez de repetir o numero.",
        );
      }
    }
  }

  return problems;
}

if (import.meta.main) {
  const rendered = Object.fromEntries(Object.entries(BLOCKS).map(([id, render]) => [id, render()]));
  let changed = 0;

  for (const file of GUIDES) {
    const before = readFileSync(file, "utf8");
    const { text: after } = rewrite(before, rendered);
    if (after === before) continue;
    writeFileSync(file, after);
    changed += 1;
    console.log(`reescrito: ${file}`);
  }

  console.log(`${changed} guia(s) reescrito(s) a partir de ${INIT}.`);
}
