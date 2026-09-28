/**
 * Guarda da promessa do README: peca que o catalogo tem e o README nao cita.
 *
 * O `check:pecas` ja confere o DIGITO - o README abre o catalogo dizendo "90
 * pecas." e falha se o numero envelhecer. O digito estava certo e a lista
 * abaixo dele nao: das 90 pecas, 49 apareciam em algum lugar do arquivo e 41
 * nao apareciam em lugar nenhum. Um numero verdadeiro em cima de uma lista que
 * cobre pouco mais da metade e pior que um numero errado, porque nada acusa e
 * o leitor confia nos dois.
 *
 * Esta e a primeira guarda de uma familia nova aqui. As outras conferem
 * numero, caminho, cor, contraste, export; nenhuma conferia se uma lista
 * escrita a mao cobre o que ela promete cobrir.
 *
 * ## A decisao, porque ela nao e obvia
 *
 * A tabela do README nao e o indice, e isso e escolha, e nao atraso. O
 * README e a pagina que o npm mostra: o trabalho dele e instalar alguem e
 * dizer a diferenca entre as pecas que se parecem - `Switch` contra
 * `Checkbox`, `Progress` contra `Meter`, `Accordion` contra `Collapsible`.
 * Cada peca ganha UMA linha curta na tabela da familia, e nao a pagina dela:
 * a linha diz de quem ela se distingue, e so. O indice de verdade e gerado,
 * mora em `/llms.txt` e nunca envelhece, e duplica-lo a mao seria criar o
 * segundo catalogo escrito a mao deste repositorio - o primeiro anunciou 55
 * pecas quando ja eram 83.
 *
 * Entao a guarda cobra duas coisas diferentes, e as duas vem da mesma decisao:
 *
 *   1. **A frase.** O paragrafo que abre o catalogo tem que dizer que a tabela
 *      NAO e o indice, e apontar onde o indice esta. Enquanto a frase mentir,
 *      a lista de baixo nao tem como estar certa.
 *   2. **A cobertura.** Toda peca do catalogo esta citada no README, ou tem
 *      linha em `OUT_OF_README` dizendo POR QUE nao esta. As duas respostas
 *      valem; o silencio, nao. E o mesmo acordo do `check:demo` e do
 *      `check:scripts`: a guarda nao consegue julgar se a peca merece linha,
 *      mas consegue exigir que alguem tenha julgado.
 *
 * `OUT_OF_README` **so encolhe**, como o `SEM_VITRINE` da vitrine e o `OUT`
 * dos scripts: peca que passou a ser citada e erro, e a guarda manda apagar a
 * linha. Lista de excecao que nao encolhe vira o lugar onde a divida mora sem
 * incomodar ninguem.
 *
 * A busca e por limite de palavra, pelo mesmo motivo do `check:demo`: `Card`
 * esta dentro de `CardHeader` e `Button` esta dentro de `ButtonGroup`. Sem o
 * limite, o `ButtonGroup` - que de fato nao esta citado - passaria verde para
 * sempre por causa das oito aparicoes de `Button`.
 *
 * Citada quer dizer em qualquer lugar do arquivo, e nao so na tabela. O
 * `RivoProvider` e o `MaskedInput` tem secao propria e nao tem linha de tabela,
 * e cobrar a tabela obrigaria a guarda a entender o desenho do README - que
 * muda - em vez do que ela sabe conferir: se o nome aparece para quem le.
 */
import { readdirSync } from "node:fs";

import { findParent } from "../apps/docs/src/parts";

const DOCS = ".design-sync/docs";
const README = "README.md";

/**
 * O que a frase de abertura do catalogo tem que dizer.
 *
 * Sao dois pedacos porque sao duas promessas: uma diz o que a tabela NAO e, a
 * outra diz onde esta o que ela nao e. Faltando qualquer uma, o leitor sai
 * achando que leu o catalogo inteiro.
 */
const HONEST = [
  { text: "não é o índice", why: "a tabela precisa dizer que nao e o catalogo inteiro" },
  {
    text: "https://ds.rivocode.com.br/llms.txt",
    why: "e para onde vai quem quer a lista completa, e ela e gerada",
  },
];

/**
 * A mesma fonte do `check:pecas` e do `check:demo`.
 *
 * `.design-sync/docs/` menos as partes, e o `findParent` de
 * `apps/docs/src/parts.ts` e quem decide o que e parte - o mesmo que a barra
 * lateral do site usa. Tres guardas contam peca, e contar diferente e o comeco
 * de toda contagem errada deste repositorio.
 */
function catalogPieces() {
  const names = readdirSync(DOCS)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""))
    .sort();

  return names.filter((name) => !findParent(name, names));
}

/**
 * As pecas que o README nao cita, e o motivo de cada uma.
 *
 * O motivo e para quem for decidir se ainda vale ficar de fora, entao ele diz o
 * que IMPEDE, e nao que esta faltando. A lista chegou a ter 37 linhas - peca
 * que a irma cobria, grafico, nicho e divida de verdade - e zerou em
 * 25/09/2026, quando cada uma ganhou linha na tabela da familia dela. Zerar
 * mostrou que o argumento de "nicho" nao se sustentava: uma linha curta na
 * tabela custa menos que o paragrafo que justificava a ausencia.
 */
const OUT_OF_README: Record<string, string> = {};

const pieces = catalogPieces();
const readme = await Bun.file(README).text();

const problems: string[] = [];

for (const { text, why } of HONEST) {
  if (readme.includes(text)) continue;

  problems.push(
    `${README} nao diz mais "${text}", na frase que abre o catalogo.\n` +
      `    ${why}.\n` +
      "    A tabela cobre uma parte das pecas de proposito, e a frase e o unico lugar\n" +
      "    onde isso esta escrito. Sem ela, o leitor toma a tabela pelo catalogo.",
  );
}

const cited: string[] = [];
const declared: string[] = [];

for (const piece of pieces) {
  const named = new RegExp(`\\b${piece}\\b`);

  if (named.test(readme)) {
    cited.push(piece);

    if (OUT_OF_README[piece]) {
      problems.push(
        `\`${piece}\` esta em OUT_OF_README e JA e citada no ${README}.\n` +
          "    A divida foi paga: apague a linha dela da lista. Excecao que nao encolhe\n" +
          "    vira o lugar onde a peca invisivel se esconde.",
      );
    }
    continue;
  }

  if (OUT_OF_README[piece]) {
    declared.push(piece);
    continue;
  }

  problems.push(
    `\`${piece}\` nao aparece em lugar nenhum do ${README}.\n` +
      "    Ou ela ganha linha na tabela da familia dela - e a tabela diz a diferenca\n" +
      "    entre ela e a vizinha parecida, que e o trabalho do README -, ou ganha linha\n" +
      "    em OUT_OF_README, em scripts/check-cobertura-do-readme.ts, dizendo o que a\n" +
      "    impede. As duas respostas valem; o silencio, nao.",
  );
}

for (const piece of Object.keys(OUT_OF_README)) {
  if (!pieces.includes(piece)) {
    problems.push(
      `\`${piece}\` esta em OUT_OF_README e nao e peca do catalogo.\n` +
        `    Ou o nome mudou, ou a pagina em ${DOCS} sumiu. Apague ou corrija a linha:\n` +
        "    entrada morta faz a lista parecer maior do que a divida.",
    );
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problema(s) na cobertura do ${README}:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "O digito ja tem guarda desde que o README anunciou 55 pecas tendo 83. Esta\n" +
      "guarda cuida do que vem depois do digito: a lista embaixo dele cobria 49 das\n" +
      "90, e um numero verdadeiro em cima de uma lista pela metade nao acusa nada.",
  );
  process.exit(1);
}

console.log(
  `${cited.length} de ${pieces.length} pecas citadas no ${README}, e ${declared.length} ` +
    "declaradas fora, com o motivo de cada uma.",
);
