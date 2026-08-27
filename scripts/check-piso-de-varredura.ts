/**
 * Guarda da guarda: varredura sem piso de quantidade.
 *
 * Em 27/08/2026 quatro verificacoes foram encontradas passando sem medir nada,
 * e a mais barata de repetir era esta: a lista de arquivos vem vazia e a
 * verificacao em cima dela fica verde. O `test/acentos.test.ts` foi ampliado
 * para os dois pacotes com `{src/**\/*.{ts,tsx},native/src/**\/*.{ts,tsx}}` -
 * chave ANINHADA, que o Glob do bun nao expande. Zero arquivo, zero acento
 * conferido, verde.
 *
 * Medindo o resto da arvore no mesmo dia, quebrando cada padrao de proposito
 * para ver quem ficava vermelho: onze varreduras de `scripts/` saiam com
 * codigo 0 lendo ZERO arquivo, entre elas o `check:contrast`, que anunciou
 * "Contraste ok em todos os temas" sem ter aberto um tema. Nos testes, seis
 * blocos passavam com a lista vazia.
 *
 * Um caso e pior do que os outros e vale nomear: o `check:comentarios`
 * declarava `.design-sync/previews/*.tsx` na lista de areas e varria zero
 * arquivo la desde sempre - o Glob do bun pula pasta oculta quando ela aparece
 * no padrao, a menos que se peca `dot`. A area estava escrita e nunca foi
 * lida, e nada acusava porque zero arquivo nao tem comentario em ingles.
 *
 * ## O que esta guarda cobra
 *
 * 1. **Em `scripts/`**: `new Glob(` so em `scripts/varredura.ts`. Quem varre
 *    chama `scanAtLeast(padrao, piso)`, que cobra o piso na mesma chamada -
 *    nao da para pedir os arquivos sem dizer quantos se espera. E a unica
 *    forma que resiste ao proximo script escrito com pressa.
 *
 * 2. **Em `test/` e `native/test/`**: todo `new Glob(` ou `readdirSync(`
 *    dentro de um bloco `test(...)` precisa de um piso NO MESMO bloco. Fora de
 *    bloco - varredura de topo de arquivo, ajudante compartilhado - o piso
 *    pode estar em qualquer lugar do arquivo.
 *
 * `readdirSync(` em `scripts/` fica de fora de proposito, e a razao foi
 * medida: os cinco usos de hoje comparam a contagem com um numero escrito a
 * mao - o digito do README, o da skill, a lista da vitrine -, e lista vazia
 * ali ja sai vermelha. Cobrar cerimonia de quem ja esta certo e como uma
 * guarda ruidosa comeca, e guarda ruidosa e desligada na segunda vez.
 */
import { scanAtLeast } from "./varredura";

const SCAN = /new Glob\(|\breaddirSync\(/g;
const FLOOR = /toBeGreaterThan(?:OrEqual)?\(|\bscanAtLeast\(|\bcountAtLeast\(/;

const HELPER = "scripts/varredura.ts";

/**
 * O codigo sem as linhas de prosa.
 *
 * A limpeza e por LINHA, e nao por expressao regular de comentario, e a razao
 * foi medida: `new Glob("src/components/*.tsx")` tem `/*` dentro das aspas, e
 * `"native/src/**\/*.{ts,tsx}"` tem `*\/`. Um limpador que casa `/* ... *\/`
 * antes das aspas apaga tudo que existe entre os dois - foram 130 linhas de
 * `test/tokens.test.ts`, com a varredura sem piso que esta guarda veio pegar
 * bem no meio. A guarda saia verde escondendo o proprio caso.
 *
 * Linha que comeca por `//`, `*` ou `/*` e prosa. Como a chamada que
 * procuramos e codigo, e nao texto, isso basta - e nao tem como engolir
 * codigo por engano.
 */
const withoutProse = (code: string) =>
  code
    .split("\n")
    .map((line) => (/^\s*(\/\/|\*|\/\*)/.test(line) ? "" : line))
    .join("\n");

/**
 * Quem ainda escreve `new Glob(` a mao em `scripts/`, e o que impede.
 *
 * A lista so encolhe, como o `OUT` do `check:scripts`: entrada que nao acusa
 * mais e erro, e a guarda manda apagar a linha.
 */
const OUT: Record<string, string> = {
  "scripts/retratos.ts":
    "Varre `demo/*.tsx` atras dos marcadores `data-rc-shot`, e a vitrine esta em trabalho ativo desde 27/08/2026. Converter para `scanAtLeast` junto com a proxima mexida na vitrine - o piso natural e o numero de paginas de `demo/`.",
  "scripts/regressao-visual.ts":
    "Varre `demo/dist/*.png`, que so existe depois de `bun run shot`. Piso fixo ali ficaria vermelho em toda arvore limpa, e o script vive fora do gate pelo mesmo motivo (veja o `OUT` do `check:scripts`). O piso que faz sentido para ele e o numero de assinaturas comitadas, e quem ja cobra isso e o `check:retratos`.",
};

type Problem = string;

const problems: Problem[] = [];

const paid = new Set<string>();

for (const file of await scanAtLeast("scripts/**/*.ts", 20)) {
  if (file === HELPER) continue;

  const code = withoutProse(await Bun.file(file).text());
  const bare = [...code.matchAll(/new Glob\(/g)];

  if (bare.length === 0) continue;

  if (file in OUT) {
    paid.add(file);
    continue;
  }

  problems.push(
    `${file}  ${bare.length} chamada(s) cruas ao Glob, sem piso de quantidade.\n` +
      "    Troque por `scanAtLeast(padrao, piso)` de `./varredura`, que devolve a\n" +
      "    mesma lista e recusa a varredura curta demais. Se o piso nao fizer\n" +
      "    sentido para este script, a linha explicando por que vai no `OUT` desta\n" +
      "    guarda - e nao num comentario que so quem ja abriu o arquivo le.",
  );
}

const rotten = Object.keys(OUT).filter((file) => !paid.has(file));

if (rotten.length > 0) {
  problems.push(
    `${rotten.length} linha(s) do \`OUT\` que nao descrevem mais nada:\n` +
      rotten.map((file) => `    ${file}`).join("\n") +
      "\n\n    Ou o arquivo sumiu, ou ele ja passou a usar `scanAtLeast`. Apague a\n" +
      "    linha em scripts/check-piso-de-varredura.ts.",
  );
}

/**
 * Onde o piso vale para uma varredura, por posicao e nao por chave.
 *
 * Casar `{` com `}` parecia o obvio e nao serve: uma expressao regular com
 * chave dentro derruba a conta, e o bloco engolido vira o arquivo inteiro -
 * onde quase sempre existe um piso de outro teste. A guarda ficaria verde
 * sobre a varredura que ela veio pegar, que e a mesma familia de defeito que
 * ela guarda.
 *
 * O recorte lexical nao tem essa falha: do `test(` anterior ate o proximo. O
 * que vem antes do primeiro teste - varredura de topo de arquivo, ajudante
 * compartilhado - responde pelo arquivo todo, porque e ali que o piso dele
 * pode estar.
 */
function regionOf(code: string, at: number) {
  const starts = [...code.matchAll(/\b(?:test|it)(?:\.\w+)?\(\s*["'`]/g)].map((hit) => hit.index);

  const opened = starts.filter((start) => start < at).pop();
  if (opened === undefined) return code;

  const next = starts.find((start) => start > at) ?? code.length;
  return code.slice(opened, next);
}

for (const area of [
  ["test/**/*.{ts,tsx}", 60],
  ["native/test/**/*.{ts,tsx}", 20],
] as [area: string, floor: number][]) {
  for (const file of await scanAtLeast(area[0], area[1])) {
    const code = withoutProse(await Bun.file(file).text());

    for (const hit of code.matchAll(SCAN)) {
      const region = regionOf(code, hit.index);
      if (FLOOR.test(region)) continue;

      const line = code.slice(0, hit.index).split("\n").length;

      problems.push(
        `${file}:${line}  varredura \`${hit[0].slice(0, -1)}\` sem piso de quantidade` +
          `${region === code ? " no arquivo" : " no bloco de teste que a usa"}.\n` +
          "    Acrescente `expect(arquivos.length).toBeGreaterThan(n)` antes de\n" +
          "    percorrer a lista. Sem isso, padrao que parou de casar deixa a\n" +
          "    afirmacao verde sem ela ter aberto arquivo nenhum.",
      );
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} varredura(s) sem piso de quantidade:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "Piso e um numero folgado, e nao a contagem de hoje: ele separa 'a arvore" +
      "\nencolheu um pouco' de 'o padrao parou de casar'. Piso colado na contagem" +
      "\nfica vermelho toda vez que alguem apaga um arquivo, e guarda que reclama" +
      "\na toa e desligada na segunda vez.",
  );
  process.exit(1);
}

const excused = Object.keys(OUT)
  .map((file) => file.replace(/^scripts\/|\.ts$/g, ""))
  .join(", ");

console.log(
  "Toda varredura de `scripts/`, `test/` e `native/test/` declara quanto espera" +
    ` achar. Fora disso, por declaracao: ${excused} - a razao de cada um esta no` +
    " OUT desta guarda.",
);
