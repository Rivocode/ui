/**
 * Guarda de idioma no comentario.
 *
 * A irma do `check:nomes`, e a metade que faltava. Aquela cobra o lado do
 * identificador - ingles, sempre. Este cobra o outro: comentario, JSDoc e texto
 * de interface em portugues, que e onde o portugues serve.
 *
 * A regra estava escrita desde sempre, no `CLAUDE.md` e no topo do
 * `check-nomes-em-ingles.ts`, e nada a cobrava. Entao quatro areas inteiras
 * foram escritas em ingles sem que ninguem fosse avisado: `apps/docs/src/**`,
 * `src/chart/chart-axis.tsx`, `src/lib/format.ts` e `scripts/acentuar.ts`. Nao
 * foi descuido de uma tarde - sao centenas de linhas, e o arquivo que explica a
 * ACENTUACAO DO PORTUGUES abria com um paragrafo em ingles. Regra que so mora
 * na documentacao e sugestao.
 *
 * ## Por que ela consegue perguntar "isto e ingles?"
 *
 * Nao consegue, e nao tenta. Adivinhar idioma por vocabulario e o caminho do
 * falso positivo: metade do vocabulario tecnico daqui e ingles de propria
 * vontade - `overflow`, `sticky`, `flex`, `viewport`, `tooltip` -, e um
 * comentario perfeitamente portugues que cite `min-width` seria acusado.
 * Guarda que grita a toa e desligada na semana seguinte.
 *
 * O que ela olha e a CLASSE FECHADA: artigo, pronome, preposicao, verbo de
 * ligacao. `the`, `this`, `which`, `because`, `would`, `without`. Sao poucas,
 * nao crescem, ninguem as inventa, e nenhuma delas e nome de propriedade de
 * CSS, de metodo de API ou de pacote. Uma frase em ingles nao passa duas linhas
 * sem usar varias; uma frase em portugues nao usa nenhuma.
 *
 * Duas palavras DIFERENTES no mesmo comentario e o corte. Uma so seria o
 * `// so no Safari`, ou o nome de um pacote. Duas ja e sintaxe inglesa.
 *
 * Medido antes de entrar no gate: 322 arquivos, 19 comentarios acusados, todos
 * ingles de verdade, nenhum falso positivo.
 */
import { Glob } from "bun";

/** As mesmas areas do `check:nomes`: tudo que e codigo nosso. */
const AREAS = [
  "src/**/*.{ts,tsx}",
  "scripts/**/*.ts",
  "test/**/*.{ts,tsx}",
  "demo/*.tsx",
  "native/src/**/*.{ts,tsx}",
  "apps/docs/src/**/*.{ts,tsx}",
  "apps/docs/*.ts",
  ".design-sync/previews/*.tsx",
];

/**
 * A classe fechada do ingles.
 *
 * Escolhidas por uma pergunta so: esta palavra pode aparecer sozinha, fora de
 * uma frase, como nome de coisa? `list`, `row`, `name`, `code` e `width` podem,
 * e por isso ficaram de fora por mais uteis que parecessem. `the` e `whether`
 * nao podem, e e disso que a guarda vive.
 */
const ENGLISH =
  /\b(?:the|this|that|which|because|would|should|there|these|those|when|while|with|from|into|their|they|them|whether|without|instead|already|rather|about|though|although|before|after|between|every|another|anything|nothing|something|itself|themselves|is|are|was|were|been|being|have|has|had|does|did|what|why|how|who|whose|only|also|just|even|still|than|then|here)\b/gi;

/**
 * O que fala SOBRE o ingles.
 *
 * Esta guarda carrega a lista de palavras inglesas como dado, e o `check:nomes`
 * carrega a explicacao de por que `pagina` vazou para a doc. Acusa-los seria a
 * guarda mordendo a propria lista.
 */
const DICTIONARIES = /check-comentarios-em-portugues|check-nomes-em-ingles/;

/**
 * A divida que ficou para depois.
 *
 * Os dois arquivos onde o ingles ainda mora, escritos com endereco em vez de
 * escondidos atras de uma guarda desligada. Sao o resto da mesma divida das
 * quatro areas: `apps/docs/src/**`, `chart-axis.tsx`, `format.ts` e
 * `acentuar.ts` foram traduzidos na mesma passagem que criou este arquivo, e
 * estes dois nao porque outra mao estava dentro deles na mesma hora.
 *
 * Ela so encolhe: entrada que nao acusa mais e erro, e a guarda manda apagar a
 * linha - senao a lista vira o lugar onde o ingles passa a morar.
 */
const DEBT = new Set(["apps/docs/src/pages/home.tsx", "apps/docs/vite.config.ts"]);

/**
 * Tira do comentario o que e codigo citado.
 *
 * `` `overflow: hidden` `` e um bloco ```tsx dentro de um JSDoc sao ingles de
 * propria vontade, e sao exatamente onde o vocabulario tecnico aparece. Sem
 * este corte, um exemplo de uso dentro do JSDoc entraria na conta pelo que ele
 * demonstra, e nao pelo que a prosa diz.
 */
const withoutCode = (comment: string) =>
  comment.replace(/```[\s\S]*?```/g, " ").replace(/`[^`\n]*`/g, " ");

const found: string[] = [];
const paid = new Set<string>();

for (const area of AREAS) {
  for await (const file of new Glob(area).scan(".")) {
    if (DICTIONARIES.test(file)) continue;

    const text = await Bun.file(file).text();

    for (const hit of text.matchAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g)) {
      const words = [
        ...new Set((withoutCode(hit[0]).match(ENGLISH) ?? []).map((word) => word.toLowerCase())),
      ];
      if (words.length < 2) continue;

      if (DEBT.has(file)) {
        paid.add(file);
        continue;
      }

      const line = text.slice(0, hit.index!).split("\n").length;
      const opening = hit[0].replace(/\s+/g, " ").slice(0, 72);
      found.push(`  ${file}:${line}  (${words.slice(0, 4).join(", ")})\n    ${opening}`);
    }
  }
}

if (found.length > 0) {
  console.error(`${found.length} comentario(s) em ingles:\n`);
  for (const item of found) console.error(item);
  console.error(
    "\nA biblioteca escreve para a tela em portugues e programa em ingles." +
      "\nO identificador vai em ingles; o comentario e o JSDoc, nao - e o JSDoc" +
      "\nde prop sai na tabela de props que o site publica." +
      "\n\nPortugues SEM acento no comentario; o texto que vai para a tela leva.",
  );
  process.exit(1);
}

const stale = [...DEBT].filter((item) => !paid.has(item));
if (stale.length > 0) {
  console.error(`${stale.length} linha(s) de divida que nao acusam mais nada:\n`);
  for (const item of stale) console.error(`  "${item}",`);
  console.error(
    "\nO arquivo foi traduzido, e a divida foi paga. Apague essa(s) linha(s) do" +
      "\n`DEBT` em scripts/check-comentarios-em-portugues.ts - lista de excecao" +
      "\nque nao encolhe vira o lugar onde o ingles se esconde.",
  );
  process.exit(1);
}

console.log(`Todo comentario em portugues, fora as ${DEBT.size} dividas ja declaradas.`);
