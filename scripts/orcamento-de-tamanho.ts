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
 * Uma peca importada sozinha da raiz, empacotada com as dependencias de
 * terceiro DENTRO e so os peers de fora. `mark` e um texto que so a peca
 * escreve, e que nenhum modulo que ela importa escreve: o pacote medido tem
 * que conte-lo, senao o numero e de um arquivo vazio.
 *
 * As pecas de dependencia pesada tem folga de 5%, e nao de 10%: o numero
 * delas e grande, e 10% de 120 KB sao 12 KB - uma Combobox inteira entrou no
 * Calendar, medido, e coube nos 10% sem acusar. O que ninguem decide (versao
 * do minificador, ajuste de classe) mexe em centenas de bytes, e as
 * dependencias estao presas pelo bun.lock.
 */
export type AlonePiece = { name: string; piece: string; mark: string; headroom?: number };

export const ALONE: AlonePiece[] = [
  { name: "Button sozinho", piece: "Button", mark: "motion-safe:active:scale-[0.985]" },
  { name: "Calendar sozinho", piece: "Calendar", mark: "calc((100vw_-_3.5rem)/7)", headroom: 1.05 },
  { name: "DatePicker sozinho", piece: "DatePicker", mark: "Escolher data", headroom: 1.05 },
  { name: "DataTable sozinho", piece: "DataTable", mark: "[data-rc-keep-row]", headroom: 1.05 },
  { name: "EventCalendar sozinho", piece: "EventCalendar", mark: "bg-surface px-3 py-2", headroom: 1.05 },
];

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
    limit: 24_400,
    why: "Subiu em 26/09/2026 de 21,2 para 21,7 KB medidos (limite com folga de 10%) com o vazio dos graficos e a dica da rosca fora do buraco: o `empty` com EmptyState na rosca, no funil, no mapa e na grade de calor, o aviso de sem dados do ChartContainer, o anel de fundo e o posicionamento da dica da rosca, e o nome seguro da variavel de cor da serie. Subiu em 24/09/2026 de 10,7 para 19,7 KB com os quatro graficos sem Recharts da 0.18.0: ChartTreemap 4,1 KB (o layout squarified), ChartHeatmap 4,0, ChartGauge 2,3 e ChartFunnel 1,9. Antes, 10,7 KB: o vestir da Recharts, que e peer opcional e fica fora. O peso da Recharts e o motivo de este codigo morar num subcaminho e nao no indice da raiz (`check:chart`).",
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
  "Calendar sozinho": {
    limit: 89_700,
    why: "83,4 KB, e 257,9 KB minificados, com as dependencias DENTRO e so os peers de fora. Medido em 07/10/2026, quando a linha nasceu: o react-day-picker com o date-fns e o @date-fns/tz, e o Select da Base UI com o posicionamento do floating-ui, que o mes e o ano do cabecalho abrem desde o de019bc (26/09/2026). Antes desse commit este numero era 32,3 KB (109,1 KB minificados): o Select sozinho custou 51 KB em gzip, +158%, e o `.` acusou so 384 B, porque as entradas do exports contam o codigo proprio e deixam as dependencias de fora. Esta linha existe para o proximo peso assim ficar vermelho no commit que o traz. O bundler e o do bun, que poda a Base UI menos que o do Vite: o numero e para comparar consigo mesmo, e nao com o que um app real mede.",
  },
  "DatePicker sozinho": {
    limit: 115_500,
    why: "107,4 KB, e 330,6 KB minificados, com as dependencias DENTRO e so os peers de fora. Medido em 07/10/2026: o Calendar inteiro (react-day-picker, date-fns e o Select da Base UI do mes e do ano) mais o CalendarPanel, que abre em Popover na mesa e em Drawer no toque - e os dois trazem o Dialog e o posicionamento da Base UI. Antes do de019bc era 95,5 KB: o Select do Calendar custou 12 KB aqui, menos que no Calendar porque o floating-ui ja vinha pelo Popover.",
  },
  "DataTable sozinho": {
    limit: 52_900,
    why: "49,2 KB, e 157,6 KB minificados, com as dependencias DENTRO e so os peers de fora. Medido em 07/10/2026: a @tanstack/react-table (o core e o store, a maior parte), a @tanstack/react-virtual da rolagem virtual, o Checkbox da Base UI da selecao de linha, e a Pagination, o Alert, o EmptyState e o Skeleton da casa. Sem Popover nem Select: se o floating-ui aparecer aqui, alguma parte da tabela passou a abrir camada.",
  },
  "EventCalendar sozinho": {
    limit: 131_700,
    why: "122,4 KB, e 379,3 KB minificados, com as dependencias DENTRO e so os peers de fora. Medido em 07/10/2026, e e a peca mais pesada da raiz: o Calendar inteiro (react-day-picker, date-fns e o Select da Base UI do mes e do ano), o CalendarPanel com Popover e Drawer, o Tooltip, o ToggleGroup da troca de vista, e as vistas de mes, semana e dia. Antes do de019bc era 110,7 KB: o Select do Calendar custou 12 KB aqui.",
  },
};
