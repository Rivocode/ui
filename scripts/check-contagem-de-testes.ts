/**
 * Guarda da contagem de testes que a home exibe.
 *
 * Dos quatro numeros da vitrine, tres saem do catalogo em tempo de build e
 * envelhecem sozinhos; o dos testes era o unico cravado a mao, e por isso o
 * unico que mentia. Ja mentiu duas vezes: ficou em 292 depois de a suite
 * passar de 292, e em 348 enquanto ela chegava a 552. Ninguem viu porque
 * numero errado nao quebra build - ele so fica ali, na primeira tela que
 * alguem le antes de decidir adotar a biblioteca, alegando menos garantia do
 * que a que existe.
 *
 * O caminho obvio - contar no build do site - nao serve: a contagem so existe
 * depois de a suite rodar, e por um digito o deploy da Vercel pagaria a suite
 * inteira a cada push. Entao o numero fica versionado na propria home, e quem
 * o mantem honesto e esta guarda, que roda no `bun run check` junto com as
 * outras.
 *
 * O que o numero significa: a suite da raiz inteira, `test/` (web) e
 * `native/test/`. E o mesmo `bun test` que o check roda no fim, e por isso o
 * rotulo na home fala das duas metades.
 */
import { $ } from "bun";

/**
 * As duas pastas da suite, e so elas.
 *
 * Sem o escopo, a guarda contava a ARVORE DE TRABALHO: qualquer pasta de
 * rascunho na raiz com um `*.test.tsx` entrava na conta. Em 27/08 uma bancada
 * de auditoria com tres arquivos fez a guarda pedir `TESTS = 1081` quando a
 * suite rastreada tinha 1074, e quem obedecesse gravaria na home um numero
 * inventado por um diretorio que nem esta no git. E o incidente que esta
 * guarda existe para impedir, cometido pela propria guarda.
 *
 * As duas pastas sao as que o JSDoc do topo sempre declarou como significado
 * do numero. O codigo e que nao dizia isso.
 */
const SUITES = ["test/", "native/test/"];

const HOME_FILE = "apps/docs/src/pages/home.tsx";
const HOME_CONST = "TESTS";

/**
 * Conta sem executar.
 *
 * `-t` com um padrao que nao casa com nada faz o bun percorrer os arquivos,
 * declarar cada teste e pular todos - ele responde "skipping N tests", que e
 * exatamente o N que queremos, por uma fracao do tempo da suite (~2s contra
 * ~9s). Importa porque esta guarda entra numa corrente que ja termina em `bun
 * test`: cobrar a suite duas vezes seria pagar caro para conferir um digito.
 *
 * O bun sai com codigo de erro quando o filtro nao casa - o que aqui e o caso
 * esperado, e nao falha - e escreve a linha no stderr.
 */
async function countSkipping() {
  const run = await $`bun test ${SUITES} -t ___sem-correspondencia___`.nothrow().quiet();
  const output = run.stderr.toString() + run.stdout.toString();

  const tests = /skipping (\d+) tests?/.exec(output);
  const files = /Searched (\d+) files?/.exec(output);
  if (!tests || !files) return undefined;

  return { tests: Number(tests[1]), files: Number(files[1]) };
}

/**
 * O plano B: rodar a suite de verdade e ler o rodape dela.
 *
 * A frase que o modo acima le e do relatorio de um filtro vazio, e nao um
 * contrato do bun - uma versao nova pode reescreve-la. Se isso acontecer,
 * a guarda fica lenta antes de ficar errada, que e a ordem certa: uma guarda
 * que passa a nao encontrar o que procura e pior do que uma que demora.
 */
async function countRunning() {
  const run = await $`bun test ${SUITES}`.nothrow().quiet();
  const output = run.stderr.toString() + run.stdout.toString();

  const total = /Ran (\d+) tests? across (\d+) files?/.exec(output);
  if (!total) return undefined;

  return { tests: Number(total[1]), files: Number(total[2]) };
}

const counted = (await countSkipping()) ?? (await countRunning());

if (!counted) {
  console.error("Nao consegui contar os testes: o `bun test` mudou o formato do relatorio.");
  console.error(
    "\nAjuste as duas expressoes em scripts/check-contagem-de-testes.ts para o" +
      "\ntexto novo. Enquanto isso, o numero da home fica sem quem o confira.",
  );
  process.exit(1);
}

const home = await Bun.file(HOME_FILE).text();
const declared = new RegExp(`^const ${HOME_CONST} = (\\d+)$`, "m").exec(home);

if (!declared) {
  console.error(`Nao achei \`const ${HOME_CONST} = <numero>\` em ${HOME_FILE}.`);
  console.error(
    "\nA guarda encontra o numero por essa linha exata. Se ele mudou de nome ou" +
      "\nde forma, ela para de conferir sem reclamar - que e como o digito velho" +
      "\nsobreviveu antes.",
  );
  process.exit(1);
}

const written = Number(declared[1]);

if (written !== counted.tests) {
  console.error(
    `A home anuncia ${written} testes, e a suite da raiz tem ${counted.tests}` +
      ` em ${counted.files} arquivos.\n`,
  );
  console.error(`Regrave em ${HOME_FILE}:\n\n  const ${HOME_CONST} = ${counted.tests}\n`);
  console.error(
    "E a primeira coisa que alguem le sobre o quanto a biblioteca e testada:" +
      "\ndeixar o digito velho e prometer menos - ou mais - do que existe.",
  );
  process.exit(1);
}

console.log(`${counted.tests} testes em ${counted.files} arquivos, e e o numero que a home exibe.`);
