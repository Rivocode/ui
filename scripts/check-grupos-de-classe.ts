/**
 * Guarda de seletor morto: quem consome um grupo que ninguem declara.
 *
 * O SidebarGroup escondia o titulo com `group-data-[collapsed]/barra:hidden`, e
 * nao existia nenhum `group/barra` na biblioteca - a raiz declarava
 * `group/sidebar`. Era uma renomeacao feita pela metade, e a coluna encolhida
 * de 3,5rem continuou vazando "CATA" por semanas.
 *
 * O detalhe que faz esta guarda existir: a varredura de classe orfa nao pega
 * isso. A classe existe e gera CSS - o seletor e que nunca casa. Achar exige
 * comparar o nome do grupo declarado com o consumido, que e outra pergunta.
 *
 * O mesmo vale para `peer/x`, pela mesma razao.
 *
 * O sentido inverso tambem reprova: grupo declarado que ninguem consome. Em
 * 25/09/2026 o `group/sidebar` da raiz da `Sidebar` estava ali sem consumidor
 * nenhum - o recolhido passou a ser decidido pelo contexto - e a guarda o
 * contava entre os "todos com quem declare", anunciando 8 seletores ao lado de
 * 9 nomes. Declaracao sem consumo e a mesma renomeacao pela metade, vista da
 * outra ponta, e e o nome que o proximo consumidor vai achar e usar errado.
 */
import { scanAtLeast } from "./varredura";

const AREAS: [area: string, floor: number][] = [
  ["src/**/*.{ts,tsx}", 80],
  ["native/src/**/*.{ts,tsx}", 60],
];

/** `group/sidebar`, `peer/campo`. */
const DECLARED = /\b(group|peer)\/([a-zA-Z][\w-]*)/g;

/** `group-data-[collapsed]/sidebar:hidden`, `peer-checked/campo:block`. */
const CONSUMED = /\b(group|peer)-[a-z][\w-]*(?:-\[[^\]]*\])?\/([a-zA-Z][\w-]*)/g;

const declared = new Map<string, Set<string>>();
const consumed = new Map<string, { file: string; line: number }[]>();

for (const [area, floor] of AREAS) {
  for (const file of await scanAtLeast(area, floor)) {
    const code = await Bun.file(file).text();

    code.split("\n").forEach((line, index) => {
      for (const [, kind, name] of line.matchAll(DECLARED)) {
        const key = `${kind}/${name}`;
        const files = declared.get(key) ?? new Set<string>();
        files.add(file);
        declared.set(key, files);
      }

      for (const [, kind, name] of line.matchAll(CONSUMED)) {
        const key = `${kind}/${name}`;
        consumed.set(key, [...(consumed.get(key) ?? []), { file, line: index + 1 }]);
      }
    });
  }
}

const orphans = [...consumed.entries()].filter(([key]) => !declared.has(key));
const unused = [...declared.entries()].filter(([key]) => !consumed.has(key));

if (declared.size < 5) {
  console.error(
    `So ${declared.size} grupo(s) declarado(s) em ${AREAS.map(([area]) => area).join(" e ")}.` +
      "\nA biblioteca tem mais que isso: a expressao ou a varredura parou de ler.",
  );
  process.exit(1);
}

if (orphans.length > 0) {
  console.error(`${orphans.length} seletor(es) de grupo sem quem declare:\n`);
  for (const [key, uses] of orphans) {
    console.error(`  ${key}  usado em:`);
    for (const use of uses) console.error(`    ${use.file}:${use.line}`);
  }
  console.error(
    `\nDeclarados hoje: ${[...declared.keys()].sort().join(", ")}` +
      "\nA classe existe e gera CSS; o que esta morto e o seletor, e nada reclama.",
  );
}

if (unused.length > 0) {
  console.error(`${unused.length} grupo(s) declarado(s) que ninguem consome:\n`);
  for (const [key, files] of unused) {
    console.error(`  ${key}  declarado em: ${[...files].sort().join(", ")}`);
  }
  console.error(
    "\nE a outra metade da mesma renomeacao: o nome ficou na raiz e o consumidor" +
      "\nmudou ou sumiu. Apague a declaracao, ou encontre o seletor que devia casar com ela.",
  );
}

if (orphans.length > 0 || unused.length > 0) process.exit(1);

console.log(
  `${declared.size} grupo(s) declarado(s), e cada um com quem consome e cada consumo com` +
    ` quem declare (${[...declared.keys()].sort().join(", ")}).`,
);
