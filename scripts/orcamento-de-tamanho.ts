/**
 * O orcamento de tamanho do pacote, em bytes de gzip, com o motivo de cada
 * numero. Quem confere e o `check:tamanho` (`scripts/check-tamanho-do-pacote.ts`).
 *
 * Todo limite nasceu como o medido em 24/09/2026 mais 10%, arredondado para
 * cima na centena de bytes. Os 10% sao a folga do que ninguem decide: o
 * minificador e o gzip mudam de versao - a CI roda `bun-version: latest` -, e
 * um ajuste de classe numa peca mexe em dezenas de bytes. Acima disso o
 * crescimento e escolha, e escolha se escreve aqui.
 *
 * Para subir um limite de proposito: no MESMO commit que fez crescer, troque o
 * `limit` pelo numero que a guarda sugere (o medido mais 10%) e reescreva o
 * `why` dizendo o que entrou e por que vale o peso. O piso vale ao contrario:
 * medida abaixo de 80% do limite reprova, e o limite desce no commit que
 * encolheu.
 */
export type Budget = { limit: number; why: string };

/**
 * A linha do tree-shaking. `mark` e uma classe que so o `Button` escreve: o
 * pacote medido tem que conte-la, senao o numero e de um arquivo vazio.
 */
export const BUTTON_ALONE = {
  name: "Button sozinho",
  mark: "motion-safe:active:scale-[0.985]",
};

export const BUDGET: Record<string, Budget> = {
  ".": {
    limit: 159_900,
    why: "Subiu em 24/09/2026 de 113,9 para 141,9 KB, com as treze pecas da 0.18.0; medido por peca, com as dependencias de fora: Gantt 18,2 KB (datas, rolagem virtual e setas de dependencia, sem peer - fica na raiz porque, com o tree-shaking, so paga quem importa), SignaturePad 6,0, TransferList 5,8, Tour 4,6, ScrollToTop 3,4, TableOfContents 2,5, Affix 1,4, Spoiler 1,1 e Highlight 0,9. Antes: 113,9 KB em 153 arquivos: as pecas do indice da raiz, sem dependencia nenhuma - Base UI, TanStack, react-day-picker e tailwind-merge sao de quem instala e ficam de fora da conta. Quase ninguem baixa isto inteiro; e o teto de quem importa tudo, e o que cresce a cada peca nova. Peca nova que custa mais que uns 2 KB em gzip merece a pergunta de se nao e subcaminho.",
  },
  "./styles.css": {
    limit: 20_200,
    why: "18,2 KB: a CSS que o Tailwind gera das classes das pecas, mais os tokens dos dois temas e das duas densidades. Todo mundo baixa ela inteira, em toda tela, e por isso o limite e o mais apertado em proporcao ao que entrega. Em 25/09/2026 ela tinha chegado a 19,4 KB (98% do limite) e desceu 1,3 KB sem mudar um pixel dos 56 retratos: 0,8 KB do espaco em branco que o `compactCss` (scripts/compactar-css.ts) tira - o `--minify` do Tailwind foi medido e recusado, porque quantiza o alfa das cores e mudou a borda do Gantt -, e 0,4 KB de catorze regras que nenhuma peca usa: o scanner lia como classe o `filter(` de array, o `\"resize\"` de evento, o `\"table\"` de tag e o `outline` de nome de variante, e o `.filter`, o `.blur` e o `.invert` arrastavam treze `@property`. Elas saem pelo `@source not inline` de src/styles.css, e o `check:classes` acusa se uma delas virar classe de verdade.",
  },
  "./form": {
    limit: 2_700,
    why: "2,3 KB: a ponte com o react-hook-form e o zod, que sao peers opcionais e nao entram na conta. O subcaminho e pequeno de proposito - quem nao usa formulario nao paga nem isto.",
  },
  "./chart": {
    limit: 21_700,
    why: "Subiu em 24/09/2026 de 10,7 para 19,7 KB com os quatro graficos sem Recharts da 0.18.0: ChartTreemap 4,1 KB (o layout squarified), ChartHeatmap 4,0, ChartGauge 2,3 e ChartFunnel 1,9. Antes, 10,7 KB: o vestir da Recharts, que e peer opcional e fica fora. O peso da Recharts e o motivo de este codigo morar num subcaminho e nao no indice da raiz (`check:chart`).",
  },
  "./ai": {
    limit: 13_700,
    why: "Subiu em 26/09/2026 de 11,7 para 12,1 KB com o contexto de camada (src/lib/layer.tsx), que as pecas flutuantes de que o subcaminho depende passaram a ler para abrir acima de quem as abriu - um Select dentro de um Dialog abria escondido atras dele. Antes, 10,9 KB: as pecas de conversa com modelo. Subcaminho sem peer, separado pelo peso: quem nao tem tela de IA nao paga os 10 KB.",
  },
  "./dnd": {
    limit: 11_400,
    why: "Subiu em 26/09/2026 de 9,7 para 10,1 KB com o contexto de camada (src/lib/layer.tsx): o cartao arrastado do Kanban le o degrau de quem o contem e passa por cima do Dialog ou da Sheet onde o quadro mora. Antes, 9,1 KB: o arrastar e soltar sobre o dnd-kit, que e peer opcional e fica fora da conta.",
  },
  "./editor": {
    limit: 19_900,
    why: "17,6 KB: a barra, os comandos e o `RichTextView` sobre o Tiptap 3, que e peer opcional e fica fora.",
  },
  "Button sozinho": {
    limit: 13_900,
    why: "12,3 KB, e 36,9 KB minificados, com as dependencias DENTRO e so os peers de fora: o Button, o `cn` com o tailwind-merge (a maior parte), o `useRender` da Base UI e o cva. Antes do `unbundle` no tsdown.config.ts este numero era 129 KB, porque o indice unico arrastava a Base UI inteira. Se ele pular para a casa das centenas, o tree-shaking quebrou de novo - e o `sideEffects` do package.json e o primeiro lugar a olhar.",
  },
};
