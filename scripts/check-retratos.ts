/**
 * Guarda do retrato de secao: peca cuja FORMA ninguem esta medindo.
 *
 * A trilha do `Progress` saiu quadrada num app de verdade, e quem descobriu foi
 * a pessoa que usa a biblioteca, mandando uma captura de tela. Os 1101 testes
 * passaram, o `tsc` passou, e o `bun run visual` passou - porque nada disso
 * enxerga canto. Foi medido antes de esta guarda existir, trocando
 * `rounded-pill` por `rounded-none` no `Progress` e refotografando a vitrine:
 *
 *   pagina inteira, grade 24x24    0 de 576 quadrados, pior 0
 *   coluna da secao, grade 24x24   0 de 576 quadrados, pior 3
 *   bloco da secao, celula de 8px  4 quadrados, pior 19
 *
 * A trilha quadrada mexe em 146 pixels de 9,4 milhoes - 0,0015% do retrato.
 * Media de cinza de um quadrado de 103x158 pixels apaga isso por definicao, e
 * a mesma media num quadrado de 8x8 nao apaga. O que separa cego de vidente
 * aqui nao e o numero de quadrados da grade, e o TAMANHO do quadrado em pixels
 * de tela; e o unico jeito de ter quadrado pequeno sem guardar cento e
 * quarenta mil numeros por retrato e a moldura ser uma secao, e nao uma pagina.
 *
 * Seis capturas seguidas da mesma arvore, medidas em 27/08/2026: 43 dos 44
 * retratos sairam identicos pixel a pixel nas seis, e entre eles as doze
 * molduras de secao. Para essas, o piso de ruido nao muda com a celula menor -
 * o que muda e a sensibilidade a mudanca de verdade. A frase antiga afirmava
 * isso de TODAS as molduras, e falava de duas capturas; o retrato de PAGINA em
 * largura de celular nao cabia nela.
 *
 * O quadragesimo quarto era `paleta-celular`, e ele piscava: em uma das seis
 * rodadas deu 1 de 576 quadrados, pior 5, contra um `NOISE` de 4, e nas outras
 * cinco deu zero. A diferenca eram 76 pixels de 2,24 milhoes, numa barra de 2
 * por 38 pixels em x 74, y 1151 - o CURSOR DE TEXTO do campo de busca do
 * `Command`, que a `demo/paleta.tsx` abre com `autoFocus` no quadro de tema
 * claro. Cursor pisca, e foto de coisa que pisca sai conforme a fase; o resto
 * da pagina saiu igual nas seis.
 *
 * O mesmo cursor aparece no `paleta` de mesa, e la ele nao acusa: a mesma barra
 * de 2 por 38 pixels cai num quadrado de 103 por 93 e vale menos de dois niveis
 * de cinza, e na largura de celular cai num quadrado de 41 por 93 e vale cinco.
 * Nao sao dois defeitos, e o mesmo medido com quadrado duas vezes e meia mais
 * estreito - por isso a mesa fica em silencio enquanto a celular acende.
 *
 * Subir o `NOISE` para 6 calaria o alarme e calaria junto toda mudanca desse
 * tamanho nos 44 retratos - a trilha quadrada do `Progress` marcava so 3 numa
 * moldura de pagina, e passaria a nao marcar nada. Entao a saida foi congelar a
 * fonte da oscilacao, e nao cegar a guarda: `demo/paleta.html` pinta o cursor
 * de transparente. Dez capturas depois disso deram 0 pixel de diferenca nas
 * duas larguras, e contra o retrato antigo o unico que mudou foi o cursor, nos
 * mesmos 76 pixels.
 *
 * Esta guarda nao tira retrato: ela nao pode, porque o `shot.ts` chama o Chrome
 * num caminho fixo do macOS e a CI e ubuntu. Ela cobra a DECLARACAO, como o
 * `check:scripts` e o `check:demo` fazem - secao declarada em
 * `scripts/retratos.ts` tem que ter marcador `data-rc-shot` na pagina do demo e
 * assinatura comitada em `demo/assinaturas.json`. E o que impede o retrato de
 * secao de voltar a ser ad-hoc: declarar sem fotografar falha o gate no mesmo
 * dia, e nao meses depois, que foi como as tres assinaturas de pagina
 * envelheceram em silencio antes do `check:scripts`.
 */
import { SECTIONS, SIGNATURES, isSection, markers, shotName, slug } from "./retratos";

const problems: string[] = [];

const found = await markers();

const orphans = SECTIONS.filter((section) => !found.get(section.page)?.has(section.name));

if (orphans.length > 0) {
  problems.push(
    `${orphans.length} secao(oes) declarada(s) sem marcador na vitrine:\n` +
      orphans.map(({ page, name }) => `    demo/${page}.tsx  ${name}`).join("\n") +
      "\n\n    O endereco do retrato e o `data-rc-shot` do demo. Sem ele o Chrome" +
      "\n    fotografa uma pagina de erro, e a assinatura guarda o erro.",
  );
}

const stored: Record<string, number[]> = await Bun.file(SIGNATURES)
  .json()
  .catch(() => ({}));

const missing = SECTIONS.filter((section) => !stored[shotName(section)]);

if (missing.length > 0) {
  problems.push(
    `${missing.length} secao(oes) declarada(s) sem assinatura comitada:\n` +
      missing.map((section) => `    ${shotName(section)}`).join("\n") +
      "\n\n    Rode `bun run shot` e depois `bun run visual --aceitar`, com o" +
      "\n    olho nos PNG de `demo/dist/` antes de aceitar. Declaracao sem" +
      "\n    retrato e a promessa que a proxima regressao vai cobrar.",
  );
}

const declared = new Set(SECTIONS.map(shotName));
const rotten = Object.keys(stored).filter((name) => isSection(name) && !declared.has(name));

if (rotten.length > 0) {
  problems.push(
    `${rotten.length} assinatura(s) de secao que ninguem declara mais:\n` +
      rotten.map((name) => `    ${name}`).join("\n") +
      "\n\n    Ou volta para `SECTIONS` em scripts/retratos.ts, ou sai de" +
      "\n    demo/assinaturas.json. Retrato que ninguem tira nao guarda nada.",
  );
}

const thin = SECTIONS.filter((section) => {
  const signature = stored[shotName(section)];
  return signature && signature.length - 2 !== (signature[0] ?? 0) * (signature[1] ?? 0);
});

if (thin.length > 0) {
  problems.push(
    `${thin.length} assinatura(s) de secao com tamanho que nao fecha:\n` +
      thin.map((section) => `    ${shotName(section)}`).join("\n") +
      "\n\n    Os dois primeiros numeros sao colunas e linhas, e o resto sao as" +
      "\n    medias. Regrave com `bun run shot && bun run visual --aceitar`.",
  );
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

const cells = SECTIONS.reduce((sum, section) => sum + (stored[shotName(section)]?.length ?? 0), 0);
const pieces = [...new Set(SECTIONS.map((section) => `${section.page}/${slug(section.name)}`))];

console.log(
  `${SECTIONS.length} retratos de secao sobre ${pieces.length} area(s), ${cells} quadrados` +
    ` guardados. Marcadores no demo: ${[...found.values()].reduce((sum, set) => sum + set.size, 0)}` +
    " - qualquer um deles vira retrato com uma linha em scripts/retratos.ts.",
);
