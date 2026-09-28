/**
 * Guarda da lista escrita a mao que instala a skill.
 *
 * A skill nao e um arquivo, e uma pasta: um `SKILL.md` e os arquivos de
 * `reference/` que o agente abre quando o trabalho pede. Quem instala pelo
 * pacote recebe a pasta inteira, porque o `build:skill` copia um diretorio e
 * diretorio nao esquece arquivo. Quem instala pelo site recebe o que estiver
 * escrito no laco de `apps/docs/src/content/skill.md`, e laco escrito a mao
 * esquece.
 *
 * Esqueceu. O laco listava sete nomes e a pasta tinha oito: faltava
 * justamente `native`, o arquivo mais novo. Quem seguiu a doc ficou com a skill
 * incompleta e sem nenhum aviso - o `curl` devolve zero em todos os sete, a
 * pasta parece pronta, e o agente so descobre que nao tem a referencia do React
 * Native quando alguem pede uma tela nativa e ele inventa uma. O modo de falhar
 * e o pior que existe: silencioso na instalacao e visivel semanas depois, num
 * lugar que ninguem liga ao comando que rodou.
 *
 * O conserto foi a mao, no mesmo dia, e e por isso que esta guarda existe: o
 * que se conserta a mao volta a quebrar na proxima referencia nova, pelo mesmo
 * caminho e pelo mesmo motivo. A pasta e a fonte, e os dois textos que a
 * repetem tem que citar todos os arquivos dela - o indice do `SKILL.md`, que e
 * como o agente sabe que o arquivo existe, e o laco do site, que e como o
 * arquivo chega ao disco.
 *
 * Zero excecao, e nao ha lista de excecao aqui de proposito: arquivo em
 * `reference/` que nao deve ser instalado nao deve estar em `reference/`.
 */
import { readdirSync } from "node:fs";

const REFERENCE = ".claude/skills/rivocode-ui/reference";
const SKILL = ".claude/skills/rivocode-ui/SKILL.md";
const PAGE = "apps/docs/src/content/skill.md";

const files = readdirSync(REFERENCE)
  .filter((file) => file.endsWith(".md"))
  .map((file) => file.replace(/\.md$/, ""))
  .sort();

const skill = await Bun.file(SKILL).text();
const page = await Bun.file(PAGE).text();

const problems: string[] = [];

if (files.length === 0) {
  problems.push(
    `${REFERENCE} esta vazia.\n` +
      "    Ou o caminho mudou, ou a pasta sumiu. Guarda que nao tem o que conferir\n" +
      "    fica verde para sempre, que e o estado que ela existe para evitar.",
  );
}

const linked = new Set([...skill.matchAll(/reference\/([\w-]+)\.md/g)].map(([, name]) => name!));

const loop = /for\s+f\s+in\s+([\w\s-]+?);\s*do/.exec(page);

if (!loop) {
  problems.push(
    `${PAGE}: nao achei o laco que baixa a \`reference/\`, no formato \`for f in a b c; do\`.\n` +
      "    Sem ele esta guarda para de conferir sem reclamar, e o laco volta a ficar\n" +
      "    desatualizado do mesmo jeito. Se a forma do comando mudou, ajuste a guarda junto.",
  );
}

const looped = new Set(loop ? loop[1]!.trim().split(/\s+/) : []);

for (const name of files) {
  if (!linked.has(name)) {
    problems.push(
      `\`${name}.md\` nao aparece no indice de ${SKILL}.\n` +
        `    O agente so abre o que o indice cita: sem a linha, o arquivo viaja junto e\n` +
        "    nunca e lido. Acrescente a linha na tabela de assuntos.",
    );
  }

  if (loop && !looped.has(name)) {
    problems.push(
      `\`${name}\` nao esta no laco de ${PAGE}.\n` +
        "    Quem instala pelo site fica sem este arquivo, e o `curl` nao reclama:\n" +
        "    a pasta parece pronta e a skill esta incompleta. Acrescente o nome ao laco.",
    );
  }
}

for (const name of linked) {
  if (!files.includes(name)) {
    problems.push(
      `${SKILL} aponta para \`reference/${name}.md\`, que nao existe.\n` +
        "    Ou o arquivo foi renomeado, ou foi apagado. Link morto no indice manda o\n" +
        "    agente abrir o que nao ha, e ele segue sem a referencia que precisava.",
    );
  }
}

for (const name of looped) {
  if (!files.includes(name)) {
    problems.push(
      `O laco de ${PAGE} baixa \`${name}.md\`, que nao existe em ${REFERENCE}.\n` +
        "    O `curl -f` sai com erro no meio da instalacao e o resto da pasta nao chega.\n" +
        "    Apague o nome do laco.",
    );
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problema(s) na lista da skill:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "A pasta `reference/` e a fonte. O indice do SKILL.md e o laco do site sao\n" +
      "copias escritas a mao dela, e copia escrita a mao envelhece calada: o laco\n" +
      "ja instalou sete de oito arquivos, e o que faltou foi o mais novo.",
  );
  process.exit(1);
}

console.log(
  `${files.length} arquivos em ${REFERENCE}, todos no indice do SKILL.md e no laco do site: ` +
    `${files.join(", ")}.`,
);
