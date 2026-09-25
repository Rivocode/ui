/**
 * A paridade com o React Native, escrita uma vez e publicada em tres lugares.
 *
 * Quem planeja uma tela de celular precisa distinguir duas coisas que a doc
 * nao distinguia: "decidimos nao portar" e "ainda nao chegamos". A tabela
 * antiga listava o que traduz e nomeava quatro ausencias; as outras vinte e
 * tantas pecas simplesmente nao apareciam, e ausencia sem linha se le como
 * esquecimento do leitor, nao da biblioteca.
 *
 * O buraco maior era outro: a tabela vivia so no guia. Quem abre
 * `/componentes/meter` esta decidindo usar o Meter agora, e a informacao de
 * que ele nao existe no celular estava numa pagina que essa pessoa nao abriu.
 * Por isso a mesma fonte escreve os dois: a tabela do guia e a secao
 * "No React Native" de cada pagina de peca.
 *
 * Rodar de novo:
 *
 *   bun run scripts/paridade-nativo.ts            escreve
 *   bun run scripts/paridade-nativo.ts --check    so confere, para CI
 *
 * O modo `--check` falha em quatro situacoes, e as quatro sao silenciosas:
 *
 * 1. Peca do catalogo sem linha aqui - alguem publicou peca nova e a tabela
 *    ficou muda sobre ela.
 * 2. Linha aqui sem peca no catalogo - a tabela promete o que nao existe.
 * 3. Linha `traduz`/`vira` cujo nome nativo NAO esta em nenhum indice do
 *    pacote nativo - a tabela promete import que quebra.
 * 4. Linha `fila`/`nao` cujo nome JA esta num indice nativo - a peca portou e
 *    a doc continua mandando o leitor usar o substituto.
 *
 * A verdade e o codigo: `.design-sync/docs` e os indices nativos. O que
 * esta escrito abaixo e o julgamento - por que uma peca nao atravessa, e o que
 * usar no lugar -, e isso nenhum cruzamento de indices descobre sozinho.
 *
 * Os comentarios seguem o resto de `scripts/` e vao sem acento; **o texto que
 * sai daqui e prosa publicada e vai acentuado**. Nao troque um pelo outro: a
 * nota desta tabela aparece na pagina de cada peca.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { scanAtLeast } from "./varredura";

const DOCS = ".design-sync/docs";
/**
 * Os indices do pacote nativo - os SETE, e os seis de baixo nao sao detalhe.
 *
 * O formulario, o grafico, o copiar e o anexar moram em caminhos proprios
 * (`@rivocode/ui-native/form`, `/chart`, `/clipboard`, `/file-upload`) pela
 * mesma razao do web, onde o `Form` e o `ChartContainer` tambem nao saem de
 * `src/index.ts`: cada um deles tem um peer OPCIONAL atras - react-hook-form,
 * react-native-svg, expo-clipboard, expo-document-picker - e o metro resolve
 * import por arquivo. Dentro do indice principal, quem so quer um Button teria
 * de instalar os quatro.
 *
 * E um subcaminho por PEER, e nao um por assunto: o clipboard e o file-upload
 * dividiriam bem uma porta chamada `/expo`, e a conta de quem instala diz que
 * nao - quem copia a chave de acesso de uma NF-e nao anexa arquivo.
 *
 * O sexto, `/ai`, e a excecao escrita: nao tem peer. O que ele custa e peso,
 * e no celular peso e compilacao - o metro nao sacode arvore, e tudo o que o
 * indice da raiz alcanca entra no app de quem so queria um Button. A familia
 * de IA so serve a app que conversa com um modelo, e o caminho e o mesmo do
 * web, `@rivocode/ui/ai`.
 *
 * O setimo, `/dnd`, tambem nao tem peer, mas por outro motivo: no web ele
 * carrega o dnd-kit, e no celular o gesto e o `PanResponder` do core. O
 * caminho proprio existe para a linha de import ser a mesma nos dois pacotes
 * (`@rivocode/ui/dnd` e `@rivocode/ui-native/dnd`), e para a lista
 * reordenavel nao entrar no aparelho de quem so importa um Button.
 *
 * Medindo so o indice da raiz, o `--check` diria que o Form nao portou no dia
 * seguinte ao porte.
 */
const NATIVE_INDEXES = [
  "native/src/index.ts",
  "native/src/form/index.ts",
  "native/src/chart/index.ts",
  "native/src/clipboard/index.ts",
  "native/src/file-upload/index.ts",
  "native/src/ai/index.ts",
  "native/src/dnd/index.ts",
];

type State =
  /** Existe no nativo com o mesmo nome. A API quase nunca e a mesma. */
  | "traduz"
  /** Existe com outro nome, e o outro nome e a peca inteira. */
  | "vira"
  /** Nao existe ainda, e a intencao e que exista. */
  | "fila"
  /** Nao vai existir, e a razao esta na nota. */
  | "nao";

type Row = {
  state: State;
  /** O nome nativo, quando ele difere. Obrigatorio no estado `vira`. */
  native?: string;
  /** A celula da tabela: fragmento curto, minusculo, sem ponto final. */
  note: string;
  /**
   * O paragrafo da pagina da peca, quando a frase montada nao basta.
   * Escrito onde escolher errado custa caro.
   */
  page?: string;
};

/**
 * O `ButtonGroup` nao aparece na varredura de pecas de topo: a regra de
 * prefixo do site (`apps/docs/src/parts.ts`) o entrega a pagina do `Button`,
 * junto com `CardHeader` e `DialogFooter`. Mas ele e um controle proprio, com
 * decisao propria de nativo, e ficar de fora da tabela por um acidente de
 * grafia era exatamente o silencio que este arquivo existe para fechar.
 */
const PARTS_THAT_ARE_PIECES = new Set(["ButtonGroup"]);

/** Pecas que a regra de prefixo engoliria e nao deveria. Igual ao site. */
const AUTONOMAS = new Set([
  "AlertDialog",
  "CheckboxGroup",
  "InputGroup",
  "Menubar",
  "NavigationMenu",
  "RadioGroup",
  "ResizablePanelGroup",
  "ToggleGroup",
  "TableOfContents",
  "TreeSelect",
]);

/** Onde o prefixo aponta para o pai errado. Igual ao site. */
const PAI: Record<string, string> = {
  Tab: "Tabs",
  TabList: "Tabs",
  TabPanel: "Tabs",
  ChartTooltipContent: "ChartContainer",
  ChartLegendContent: "ChartContainer",
  InputPrefix: "InputGroup",
  InputSuffix: "InputGroup",
  InputAction: "InputGroup",
  Radio: "RadioGroup",
  ResizablePanel: "ResizablePanelGroup",
  ResizableHandle: "ResizablePanelGroup",
};

const PARITY: Record<string, Row> = {
  Accordion: {
    state: "traduz",
    note: "cada `AccordionItem` guarda o próprio aberto; não há raiz controlada. Abre com a seta girando e o corpo em fade, e sem movimento quando o sistema pede para reduzir",
  },
  Alert: {
    state: "traduz",
    note: "`title` é prop e o corpo é filho; sem `AlertTitle`/`AlertDescription`",
  },
  AlertDialog: {
    state: "traduz",
    note: "`actionLabel` e `onAction` em vez de composição; não fecha no toque fora, como no web",
  },
  AspectRatio: { state: "traduz", note: "`ratio` numérico, igual" },
  Carousel: {
    state: "traduz",
    note: "sobre `FlatList` horizontal com `pagingEnabled`; a lista vem por `items` e `renderItem`, o `index` é controlado, e não há `autoplay`",
    page:
      "Traduz sobre a `FlatList` horizontal do core: com um slide por vez ela pagina pela " +
      "largura inteira (`pagingEnabled`), e com mais de um assenta de slide em slide " +
      "(`snapToInterval`). O arrasto é o do próprio sistema, e `onIndexChange` chega quando a " +
      "rolagem assenta.\n\n" +
      "**A lista vem por `items` e `renderItem`, e o `index` é controlado**, como em todo o " +
      "pacote nativo. `slidesPerView` é um número só: a largura do telefone não muda no meio " +
      'da tela, e o objeto por largura e o `"auto"` do web não atravessam.\n\n' +
      "**Não há `autoplay`.** No toque, a fileira que anda sozinha briga com o dedo que está " +
      "prestes a arrastar, e o botão de pausa ficaria a um polegar de distância do conteúdo " +
      'que se move. Sem os pontos, um contador "2 de 5" fica entre os botões, numa região ' +
      "viva educada que diz o slide novo ao leitor de tela.\n\n" +
      "```tsx\n" +
      "<Carousel\n" +
      '  label="Planos"\n' +
      "  items={planos}\n" +
      "  index={index}\n" +
      "  onIndexChange={setIndex}\n" +
      "  renderItem={(plano) => <Card>{plano.nome}</Card>}\n" +
      "/>\n" +
      "```",
  },
  Avatar: {
    state: "traduz",
    note: "`src` remoto pela `Image` do core; `fallback` é obrigatório, porque é ele que aparece enquanto a foto baixa e se ela falhar",
  },
  Badge: {
    state: "traduz",
    note: "os mesmos tons; o texto e filho; NAO tem `size`, porque no nativo so ha uma densidade",
    page:
      "Traduz nos tons e na pílula, e **sem o `size` do web**. Lá o `sm` existe para o selo " +
      "caber numa linha de `DataTable`, que é de mesa e encolhe com a densidade; aqui não há " +
      "linha que encolha: o `RivoProvider` nativo já declara que `comfortable` é a única " +
      "altura, porque alvo de toque não diminui, e um segundo tamanho seria a única peça do " +
      "pacote oferecendo o compacto que o pacote decidiu não ter.\n\n" +
      "E a prop custaria mais do que paga. Para casar com o web ela precisaria nascer em " +
      "`md`, o que aumentaria todo selo já publicado; nascer no tamanho de hoje faria " +
      '`size="md"` desenhar coisas diferentes nos dois pacotes, que é pior do que não ter a ' +
      "prop. O selo nativo é `text-xs`, fixo.",
  },
  Calendar: {
    state: "traduz",
    note: "mês desenhado à mão; valor ISO `aaaa-mm-dd`, exibição `dd/mm/aaaa`; o mês novo entra por fade",
  },
  Card: {
    state: "traduz",
    note: "com `CardHeader`, `CardTitle`, `CardDescription` e `CardContent` (sem `CardFooter`)",
  },
  ChartContainer: {
    state: "traduz",
    note:
      "vive em `@rivocode/ui-native/chart`; os quatro finais atravessam com os mesmos nomes, e o " +
      "desenho entra por função: não há Recharts, nem contentor que meça, nem `var(--color-série)`",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/chart`, com o mesmo arranjo do " +
      "formulário e pela mesma razão: o `react-native-svg` é peer **opcional**, e no celular ele não é só " +
      "bytes, é módulo nativo que o app precisa ligar e reconstruir.\n\n" +
      "**O que atravessa inteiro são os quatro finais.** `isLoading`, `isError`, `onRetry`, " +
      "`errorTitle`, `errorMessage`, `retryLabel`, `empty` e `data` têm os mesmos nomes e o mesmo sentido, e a espera desenha " +
      "as mesmas seis barras desiguais. Três diferenças de tipo, todas porque texto no nativo mora " +
      "dentro de um `Text`: `errorMessage`, `empty.title` e `empty.description` são `string`. O " +
      "`empty.icon` atravessa, e aceita também a função do `EmptyState` nativo. O botão de " +
      "tentar de novo fica **fora** do aviso: o `Alert` nativo tem título e corpo, e o corpo é uma " +
      "linha de texto.\n\n" +
      "**O que muda é o desenho.** No web a moldura embrulha um gráfico da Recharts, que mede o pai " +
      "sozinho e lê a cor de cada série em `var(--color-série)`. Aqui não há Recharts, não há " +
      "contentor que meça e não há variável viva. Então a moldura mede com `onLayout`, resolve as " +
      "cores do `config` e **entrega as duas coisas** a quem desenha, como o `Form` nativo entrega " +
      "o `submit`:\n\n" +
      "```tsx\n" +
      '<ChartContainer config={SERIES} data={meses} className="h-56">\n' +
      "  {({ width, height, colors }) => (\n" +
      "    <Svg width={width} height={height}>…</Svg>\n" +
      "  )}\n" +
      "</ChartContainer>\n" +
      "```\n\n" +
      "O `colors` do quadro é um **mapa pela chave do `config`**, e não um array: é o " +
      "`var(--color-série)` do web com outro veículo, e quem desenha pede a cor de `receita` " +
      "pelo nome, que é o que sobrevive a alguém reordenar o `config`. O array é o `PALETTE`, " +
      "e ele é array dos dois lados: é a ordem de sobra, de onde sai a cor de quem não " +
      "declarou `color`. A diferença é que aqui ele é **exportado**, porque sem variável viva " +
      "quem desenha à mão precisa alcançá-lo.\n\n" +
      "A medida chega **zerada no primeiro quadro** e verdadeira no seguinte: no telefone não " +
      "existe largura antes do layout. O `children` também aceita JSX comum, e é assim que " +
      "`ChartDonut` e `ChartRadial` ganham os quatro finais sem precisar de nada da moldura.\n\n" +
      "Duas regras a mais, as duas por causa do que não existe do lado de cá. O `config.color` pede " +
      "**papel de token** (`chart-1` a `chart-8`), e não cor de CSS: a cor que a peça recebe é o " +
      "valor final que vai para o desenho, e um hexadecimal escrito ali seria a única coisa da tela " +
      "surda ao tema do cliente. E o `label` só vale na forma de função: com filho em JSX quem " +
      "nomeia é a peça de dentro, e um `accessible` por cima dela fecharia a legenda da rosca numa " +
      "parada só do leitor de tela.\n\n" +
      "**O movimento vem em duas marcas, porque aqui não há `Line` nem `Bar` para a moldura " +
      "vestir.** `ChartBar` é a barra (`x`, `y`, `width`, `height`, `fill`, `radius`) e " +
      "`ChartLine` é a linha (`points` em px, `stroke`, `strokeWidth`, `baseline`), as duas no " +
      "mesmo caminho `/chart`. Na montagem elas entram (a barra cresce da base; a linha sobe " +
      "da `baseline`, ou do ponto mais baixo) e, quando o valor muda, andam até o novo com a " +
      "duração e a curva dos tokens (`duration-slow`, `ease`), pelo Reanimated sobre o " +
      "`react-native-svg`: a mesma decisão do web, de que o gráfico se desenha ao aparecer e " +
      'anda quando o dado muda. Com "reduzir movimento" elas nascem no lugar e saltam. A linha ' +
      "anda ponto a ponto " +
      "quando a contagem é a mesma de antes, e troca de uma vez quando não é. Quem desenha com " +
      "`Rect` e `Path` crus continua podendo, e fica parado.",
  },
  ChartDonut: {
    state: "traduz",
    note:
      "a legenda é o controle: sem dica para abrir no toque, tocar a linha acende a fatia e leva " +
      "nome e valor ao meio; `format` só aceita função, e as pontas saem retas",
    page:
      "Traduz, em `@rivocode/ui-native/chart`, com as mesmas props: `valueKey`, `nameKey`, " +
      "`config`, `thickness`, `legend`, `centerValue`, `centerLabel`. Duas mudanças de tipo: o " +
      "miolo é `string` e não `ReactNode`, e o `format` só aceita função, que é a decisão que o " +
      "`Meter` nativo já tinha tomado. Resolver nome de formatador arrasta o `Intl` inteiro para o " +
      "bundle do celular.\n\n" +
      "**O que muda de verdade é como se lê uma fatia.** No web o ponteiro pousa no anel, a dica " +
      "diz nome e valor, e o total sai de cena para os dois números não se empilharem. No toque não " +
      "existe pousar, e o gesto equivalente mora na **legenda**, não na fatia: tocar a linha acende " +
      "a fatia dela e manda nome e valor para o meio, no lugar exato onde o web põe a dica; tocar " +
      "de novo devolve o total.\n\n" +
      "A fatia não é o alvo, e a razão é aritmética: um anel de 190px tem cerca de 600px de " +
      "contorno para dividir entre até seis fatias, e a de 2% fica com doze (a mesma conta " +
      "que tirou a dica por quadrado do `Tracker`). A linha da legenda tem 44px e a largura da tela.\n\n" +
      "**E a leitura de tela não usa o truque do `Tracker`.** Lá os 90 períodos viraram uma parada " +
      "`adjustable` só, porque 90 paradas dentro de um cartão são um obstáculo. Aqui são no máximo " +
      "seis fatias (acima disso a rosca para de informar e barra deitada lê melhor), e seis " +
      "paradas com nome e valor são melhores que uma ajustável, porque cada uma é também o botão " +
      "que acende a fatia. Contagem diferente, saída diferente. Com `legend={false}` o desenho vira " +
      "imagem cujo nome carrega as fatias **e os valores**: sem legenda e sem dica, o dado ficaria " +
      "inalcançável.\n\n" +
      "Uma diferença de desenho, e ela é medida: as pontas das fatias saem **retas**. O " +
      "`cornerRadius` do web vem da Recharts, que recorta o canto de uma fatia preenchida; aqui a " +
      "fatia é um arco traçado, e a ponta redonda que o SVG oferece estende o traço em quase doze " +
      "graus para cada lado na espessura padrão: uma fatia de 5% apareceria como 11%.\n\n" +
      "O movimento é o do web: a rosca nasce pronta e, quando os dados mudam, cada fatia anda " +
      "do ângulo velho ao novo com a duração e a curva dos tokens, pelo Reanimated. Com " +
      '"reduzir movimento", a troca é seca.',
  },
  ChartRadial: {
    state: "traduz",
    note:
      "atravessa quase inteiro, porque nunca teve dica; `color` é papel de token e o nome sai do " +
      "que está escrito no meio, não só da porcentagem",
    page:
      "Traduz quase inteiro, em `@rivocode/ui-native/chart`, e é a peça de gráfico que menos muda: " +
      "**ela nunca teve dica**. O valor mora no meio do arco, em texto, desde o web. O que o dedo " +
      "faria aqui, o olho já fez. `value`, `max`, `sweep`, `variant` e `segments` atravessam " +
      "iguais, o arco em tracinhos incluído.\n\n" +
      "Duas mudanças de tipo, as mesmas da rosca: `centerValue` e `centerLabel` são `string`, e " +
      "`color` é papel de token (`chart-3`, `success`) e não cor de CSS.\n\n" +
      'O papel de acessibilidade é `image`, como o `role="img"` do web, e os dois vizinhos ' +
      "explicam por quê: o `Meter` nativo já tinha recusado `progressbar`, que faz o leitor de tela " +
      "anunciar indicador de progresso para uma medida que sobe e desce, e `adjustable`, que " +
      "prometeria que o gesto muda o valor. O nome carrega o número, então ouvir a peça é ouvir a " +
      "medida. Sem `label`, ele é montado do que está escrito no meio (o valor **e** a linha " +
      'de baixo), e não só a porcentagem como no web: "82 por cento" sozinho não diz por cento de quê.\n\n' +
      "O arco liso anda até o valor novo como no web, e nasce no lugar; o `segmented` acende os " +
      "tracinhos de uma vez, também como no web.",
  },
  ChartFunnel: {
    state: "traduz",
    note:
      "mesmas props, com `color` como papel de token e `format` só como função; cada etapa é uma " +
      "parada com nome, número e taxa na mesma frase",
    page:
      "Traduz, em `@rivocode/ui-native/chart`, e é a peça de gráfico que menos precisa do " +
      "`react-native-svg`: as barras são `View`, e a conta das taxas é a mesma função do web, " +
      "gerada em `native/src/shared/`. `valueKey`, `nameKey`, `align`, `formatRate`, " +
      "`rateLabel` e `overallLabel` atravessam iguais.\n\n" +
      "Duas mudanças de tipo, as mesmas da rosca: `color` é papel de token (`chart-2`) e não cor " +
      "de CSS, e `format` só aceita função. E uma de leitura: no web a peça é uma lista ordenada " +
      "e o leitor de tela lê o nome, o número e a taxa em pedaços; aqui **cada etapa é uma parada " +
      "só**, com os três na mesma frase (\"Cadastros: 400, 40% da etapa anterior\"), porque o " +
      "leitor de tela do celular anda de elemento em elemento e três paradas por etapa triplicariam " +
      "o caminho. Não há `label`: no toque não existe nome de lista, e o título do cartão faz esse " +
      "papel.\n\n" +
      "As barras crescem do zero ao aparecer e andam até a largura nova quando os dados mudam, " +
      'pelo Reanimated e com os tokens de movimento; com "reduzir movimento", nascem no lugar.',
  },
  ChartGauge: {
    state: "traduz",
    note:
      "atravessa quase inteiro, como o `ChartRadial`; a régua das faixas entra no nome acessível, " +
      "porque não há descrição separada no toque",
    page:
      "Traduz, em `@rivocode/ui-native/chart`, com as mesmas props: `value`, `max`, `bands`, " +
      "`sweep`, `centerValue`, `centerLabel`, `label`. As faixas são as mesmas, com `tone` " +
      "`success`, `warning` ou `danger`, e pintam os mesmos papéis `-text` do web: a medida do " +
      "arco sobre o trilho é a mesma nos dois lados, e está no mapa de contraste do nativo.\n\n" +
      "Duas mudanças de tipo, as da rosca e do arco: `centerValue` e `centerLabel` são `string`, " +
      "e `format` só aceita função. E uma de leitura: no web a régua das faixas vai numa " +
      "descrição separada, ligada por `aria-describedby`; o celular não tem esse canal, então " +
      "ela entra no fim do nome acessível (\"72 de 100, Atenção. Bom de 0 a 60; Atenção de 60 a " +
      '85; Crítico de 85 a 100"). O papel é `image`, pela mesma razão do `ChartRadial`.\n\n' +
      "O arco e o ponteiro andam juntos até o valor novo, pelo Reanimated, e nascem no lugar com " +
      '"reduzir movimento".',
  },
  ChartHeatmap: {
    state: "traduz",
    note:
      "a grade vira uma parada `adjustable` só, como o `Tracker`, e o dedo escolhe a célula; sem " +
      "dica, a leitura mora numa linha embaixo",
    page:
      "Traduz, em `@rivocode/ui-native/chart`, com as mesmas props: `rowKey`, `columnKey`, " +
      "`valueKey`, `rows`, `columns`, `domain`, `emptyLabel`, `legend`. A escala é a mesma, " +
      "cinco degraus de uma cor só, e os alfas vêm da mesma constante do web, gerada em " +
      "`native/src/shared/`. Zero pinta o primeiro degrau e a célula sem dado tem borda " +
      "tracejada, igual.\n\n" +
      "Duas mudanças de tipo: `color` é papel de token (`chart-3`) e `format` só aceita função.\n\n" +
      "**O que muda é como se lê uma célula.** No web o ponteiro pousa e a dica abre, e o leitor " +
      "de tela navega uma tabela escondida. No celular não há dica nem tabela: o dedo toca ou " +
      "arrasta sobre a grade e escolhe a célula debaixo dele, que ganha contorno, e a linha, a " +
      "coluna e o número aparecem escritos embaixo da grade. Para o leitor de tela a grade é " +
      "**uma parada `adjustable` só**, que anda célula a célula com o gesto de subir e descer, " +
      "a mesma decisão do `Tracker`: cento e sessenta e oito paradas dentro de um cartão seriam " +
      "um obstáculo, e o valor de cada uma vai inteiro no `accessibilityValue`.\n\n" +
      "Os rótulos de coluna aparecem no máximo seis, e não pela largura medida como no web: a " +
      "tela do celular é estreita sempre, e o rótulo que não aparece continua sendo dito na leitura.",
  },
  ChartTreemap: {
    state: "traduz",
    note:
      "cada categoria é um botão com nome, valor e fatia; tocar acende o contorno e escreve a " +
      "leitura embaixo, e a regra do rótulo que some é a mesma",
    page:
      "Traduz, em `@rivocode/ui-native/chart`, com as mesmas props: `valueKey`, `nameKey`, " +
      "`config`, `format`. A geometria é a mesma função do web (o *squarified*, gerado em " +
      "`native/src/shared/`), e a regra do rótulo também: nome e valor quando cabem os dois, só " +
      "o nome quando cabe uma linha, nada quando nem o nome cabe, e nada antes do `onLayout` " +
      "medir a caixa. A tinta a 30% com `fg` por cima é a mesma, e os dezesseis pares estão no " +
      "mapa de contraste do nativo.\n\n" +
      "Duas mudanças de tipo: o `config.color` é papel de token, como em toda a família, e " +
      "`format` só aceita função.\n\n" +
      "**O que muda é como se lê uma categoria.** Aqui são poucas (acima de uma dúzia o treemap " +
      "para de informar), e poucas categorias viram poucas paradas: cada retângulo é um botão com " +
      "nome, valor e fatia, a decisão da legenda da rosca e não a do `Tracker`. Tocar acende o " +
      "contorno e escreve a leitura embaixo, no lugar da dica do web; tocar de novo apaga. Por " +
      "isso não há `label`: o web o usa para nomear o grupo e a lista escondida, e no celular nem " +
      "um nem outro existe. O título do cartão faz esse papel.",
  },
  Checkbox: {
    state: "traduz",
    note: "`checked` e `onCheckedChange` **obrigatórios**; sem `defaultChecked` e sem `indeterminate`; o tique aparece crescendo ao marcar",
    page:
      "Traduz, com um porém que morde na primeira linha: no nativo o `Checkbox` é " +
      "**sempre controlado**. `checked` e `onCheckedChange` são obrigatórios, não há " +
      "`defaultChecked` e não há `indeterminate`: a caixa de selecionar-todas do web não " +
      "tem terceiro estado lá. Copiar `<Checkbox defaultChecked>ISS retido</Checkbox>` do " +
      "web não compila.",
  },
  CheckboxGroup: {
    state: "traduz",
    note: "`items` na raiz e `value: string[]`; `label` nomeia o conjunto, no lugar do `aria-label` do web",
    page:
      "Traduz com `items` na raiz e `value: string[]`, em vez de um `Checkbox` por filho, e " +
      "sem o `allValues`/`parent` do web, porque a caixa mestra de estado misto não tem " +
      "terceiro estado do lado de cá.\n\n" +
      "**O `label` é o `aria-label` do web com outro nome**, pelo mesmo motivo do " +
      "`RadioGroup`: a lista de caixas responde uma pergunta, e sem o nome do conjunto cada " +
      "caixa se apresenta sem dizer qual. Nomear liga junto o papel de lista, porque no React " +
      "Native não existe papel de `group` e uma `View` sem papel nenhum não carrega nome.",
  },
  Collapsible: {
    state: "traduz",
    note: "`label` no lugar de `CollapsibleTrigger` e `CollapsiblePanel`; o mesmo movimento do `Accordion`",
  },
  Combobox: {
    state: "traduz",
    note: "a lista abre numa folha com busca sem acento, e a folha sobe com o teclado; `items` na raiz, não `ComboboxItem` por filho",
  },
  DatePicker: {
    state: "traduz",
    note: "abre a folha com o mês; guarda ISO e exibe `dd/mm/aaaa`",
  },
  DescriptionList: {
    state: "traduz",
    note: "as bordas entram por `Children`: a utility de divisória do Tailwind não existe no RN",
  },
  Dialog: {
    state: "traduz",
    note: "`open`, `onOpenChange` e `title` como props; sem `DialogTrigger`. Abre em fade, e sem transição quando o sistema pede para reduzir movimento; o cartão sobe para o espaço acima do teclado",
  },
  ImageViewer: {
    state: "traduz",
    note: "sobre `Modal` e `FlatList` com `pagingEnabled`; `index` controlado, pinça pelo `PanResponder` do core, sem peer novo",
    page:
      "Traduz sobre o `Modal` do core, com as imagens numa `FlatList` horizontal com " +
      "`pagingEnabled`: deslizar troca de imagem, e o voltar do Android fecha. A grade de " +
      "miniaturas é a mesma, montada no `Grid` nativo, e cada miniatura é um `imagebutton` " +
      "com o `alt` como nome. O `index` é controlado, como em todo o pacote nativo: " +
      "`onIndexChange` recebe o índice ao abrir e ao navegar, e `null` ao fechar.\n\n" +
      "**A pinça sai do `PanResponder` do core, e não do react-native-gesture-handler.** " +
      "O pacote já exige o reanimated, mas não o gesture-handler, e um visualizador de imagem " +
      "não justifica um peer obrigatório a mais para todo app. Dois dedos aproximam até " +
      "`maxZoom`, um dedo arrasta a foto aproximada, e o toque duplo dobra e desfaz o zoom. " +
      "Com zoom, a fileira para de rolar: o dedo que arrasta a foto não troca de foto. Os " +
      "botões de mais, menos, anterior e próximo continuam lá, porque o leitor de tela não " +
      "faz pinça.\n\n" +
      "`caption` é `string`, a vizinha de cada lado é pedida antes por `Image.prefetch`, e o " +
      'contador "3 de 8" fica numa região viva que diz também o `alt` da imagem nova.\n\n' +
      "O palco é escuro nos dois esquemas, como no web: as cores saem de " +
      "`tokens.media`, e não do tema, então o `Modal` não clareia no tema claro nem no " +
      "tema de cliente. O controle desabilitado segue a regra do pacote, a camada " +
      "inteira a 50%.",
  },
  EmptyState: {
    state: "traduz",
    note: "`description` obrigatória, pelo mesmo motivo do web; `icon` e `illustration` nos dois lados",
    page:
      "Traduz, com `description` obrigatória pelo mesmo motivo do web, e com os dois espaços de " +
      "desenho: `icon` e `illustration`, os dois escondidos do leitor de tela.\n\n" +
      "**No React Native a cor não desce da `View` para o SVG**, então o `icon` aceita também " +
      "uma função, que recebe o `fg-subtle` do tema que pinta agora e os mesmos 32 do web:\n\n" +
      "```tsx\n" +
      "<EmptyState\n" +
      "  icon={({ color, size }) => <Search color={color} size={size} />}\n" +
      '  title="Nada encontrado para esse filtro"\n' +
      '  description="Tente ampliar o período ou limpar o filtro de status."\n' +
      "/>\n" +
      "```\n\n" +
      "A `illustration` não força nada, como no web: o tamanho é de quem desenha, e a cor vem " +
      "dos papéis de `useRivo().colors`, nunca de cor literal. `title` e `description` são " +
      "`string`, porque moram dentro de um `Text`.",
  },
  Field: {
    state: "traduz",
    note: "`label`, `description` e `error` como props; o erro vence a descrição, como no web, e o texto que chega depois entra por fade",
  },
  FilterBar: {
    state: "traduz",
    note: "rola na horizontal com o limpar ancorado FORA do que rola; a linha reservada e uma altura de alvo de toque; a borda com mais escondido vira regua de 1pt, e nao esmaecido",
    page:
      "Traduz, e é onde a peça vale mais: listagem no celular é onde filtro dói. As decisões " +
      "de desenho já tinham sido tomadas pensando em 390px, então quase tudo atravessa: rola " +
      "na horizontal, não quebra linha e não colapsa em `+3`.\n\n" +
      "**O limpar fica FORA do que rola.** Se ele rolasse junto, o controle que existe para " +
      "desfazer tudo seria o único que exige rolar até o fim para achar. Ele ancora à direita " +
      'da fileira, e o `size="sm"` do `Button` nativo já entrega o alvo de 44pt sozinho.\n\n' +
      "**A linha reservada passa a ser medida em dedo.** No web ela guarda a altura de " +
      "`--rc-control-sm`; aqui guarda 44pt, que é uma altura de alvo de toque. Não há token " +
      "de controle do lado de cá. A fileira tem a mesma altura vazia e cheia, pelo mesmo motivo do " +
      "`Tracker`: a tela não pode pular quando o primeiro filtro entra.\n\n" +
      "A região viva é um `Text` único que acumula as duas funções, em vez dos dois nós do web: " +
      "duplicar abriria um `gap` morto na fileira. **Limite de plataforma declarado:** " +
      "`accessibilityLiveRegion` é do Android; no iOS o anúncio automático não existe sem " +
      "`announceForAccessibility`, que nenhuma peça do catálogo usa hoje.\n\n" +
      "**RTL foi verificado, e a maior parte o próprio React Native resolve.** A fileira e a " +
      "ficha já são espelhadas pelo Yoga quando a locale é da direita para a esquerda, e o " +
      "repouso da rolagem já para na borda onde a leitura começa: inverter de novo seria o " +
      "erro clássico de espelhar duas vezes. O `contentOffset` que chega ao JavaScript é " +
      "sempre distância física a partir da esquerda, nos dois sentidos e nas duas " +
      "plataformas, então a régua marca o lado físico que tem conteúdo além dele, e não " +
      "troca de lado.\n\n" +
      "O que precisou de conta foi o valor de REPOUSO. O código guardava zero até chegar o " +
      "primeiro evento de rolagem: verdade em LTR, falso em RTL, onde o repouso é o fim do " +
      "conteúdo. No iOS o defeito durava para sempre enquanto ninguém arrastasse, porque em " +
      "repouso ele não emite evento nenhum, e a régua aparecia do lado errado.\n\n" +
      "**A borda esmaece no web; aqui ela é uma régua.** `mask-image` não existe no React " +
      "Native, e um esmaecido de verdade só sairia de duas formas. Um peer novo " +
      "(`expo-linear-gradient`, `MaskedView`), que uma barra de filtros não pode cobrar, " +
      "porque no celular peer é módulo nativo a ligar e reconstruir. Ou um gradiente pintado " +
      "NA cor da superfície de trás, que a peça não tem como saber: no tema escuro, `surface` " +
      "sobre `bg` vira um borrão claro por cima das fichas. O gradiente em si até estava ao " +
      "alcance, porque o `react-native-css` compila `linear-gradient` para o " +
      "`experimental_backgroundImage` que o RN traz de fábrica; o que falta é a máscara, e sem " +
      "ela não há alfa por pixel.\n\n" +
      "O que ficou: uma régua de 1pt em `border-strong` encostada na borda que tem conteúdo " +
      "escondido, que aparece e some sozinha conforme a rolagem, não custa largura nenhuma e " +
      "não come o arrasto que começa nela. É a mesma pista, mais dura, e é o mesmo `inset 1px` " +
      "com que o `DataTable` marca a coluna congelada no web.\n\n" +
      "Caem `classNames` por parte (não há `[&_li]` de que fugir sem DOM) e a parada de " +
      "tabulação do web, porque não há foco de teclado aqui.",
  },
  FilterChip: {
    state: "traduz",
    note: "a faixa de toque tem 44pt e a pilula pintada continua com 28; `size` muda o desenho, nunca o alvo",
    page:
      "Traduz, com o mesmo vocabulário do web: rótulo, valor e o botão de tirar, sem `tone`. " +
      "Filtro não é situação, e seis fichas coloridas viram semáforo onde nada significa nada." +
      "\n\n**O alvo cresce sem a ficha engordar.** A raiz é uma faixa de 44pt e a pílula " +
      "pintada é um filho absoluto dentro dela, então ela continua com 28pt como no web. O xis " +
      "herda os 44 verticais da faixa e ganha `hitSlop` horizontal.\n\n" +
      "A faixa foi esticada em vez de dar `hitSlop` vertical por uma razão de plataforma: **no " +
      "Android o toque fora dos limites do pai não é entregue**. Com a pílula de 28pt como pai " +
      "do botão, a folga acima e abaixo seria descartada justamente no aparelho onde mais falta " +
      "alvo. Consequência declarada: `size` muda só a pílula desenhada, nunca a altura da faixa: " +
      "o dedo não encolhe junto com a ficha.",
  },
  EventCalendar: {
    state: "nao",
    note: "grade de tempo e idioma de mesa; no telefone a resposta e a lista, e o mes e o `Calendar`",
    page:
      "Na fila, e a fila e por DESENHO de gesto, nao por tempo. Tres das quatro vistas portam: a " +
      "`agenda` vira `SectionList` (virtualizacao de fabrica, o mesmo argumento que tirou a " +
      "`VirtualList` do catalogo nativo), a `day` e uma coluna unica de 314px, que e coluna de " +
      "verdade, e a `month` sobrevive aos 51px por celula porque a celula so precisa mostrar que " +
      "existe alguma coisa e mais ou menos o que.\n\n" +
      "**A `week` nao porta.** Sete colunas em 358px dao 44,8px cada, e a coluna de semana existe " +
      "para mostrar hora e duracao. Em 44,8px ela mostra um retangulo colorido, que e o que a " +
      "`month` ja faz melhor e mais barato. O web tomou a mesma decisao para a propria tela " +
      'estreita: abaixo de `sm` a `week` some do seletor e `view="week"` resolve para `agenda`.\n\n' +
      "**A decisao foi tomada em 27/08/2026, e e nao.** Ela esteve em `FILA_DECLARADA` esperando " +
      "decisao de gesto; o desenho foi escrito, medido, e a conta dele decidiu contra a peca. " +
      "Esta em `docs/2026-08-27-event-calendar-nativo-desenho.md`, e continua valendo como " +
      "registro do que foi medido.\n\n" +
      "O custo nao se distribui por igual entre as vistas, e e isso que decide. A `agenda` e o " +
      "`month` sao baratos: um e lista, o outro e grade de mes, e os dois ja tem resposta no " +
      "pacote. A `day` e a `week` sao a peca inteira - o desenhador de tempo, o alvo de 44 " +
      "pontos sobre tarja de 12, o conflito entre deslizar para trocar de periodo e arrastar " +
      "para ler, e a maior parte das mil e duzentas linhas. Elas custam de 15 a 18% do pacote, " +
      "compiladas pelo metro no aplicativo de quem importa um `Button`, porque o nativo publica " +
      "FONTE.\n\n" +
      "E o que elas comprariam nao cabe na tela: sete colunas em 358px dao 44,8px cada, onde a " +
      "coluna de semana existe para mostrar hora e duracao. Grade de tempo e idioma de mesa - " +
      'ela responde "o que choca com o que", e essa pergunta se faz com o olho passeando, e ' +
      "nao com o dedo cobrindo o que ele toca.\n\n" +
      "**No telefone, a resposta e outra peca.** Compromisso por dia e lista, e a lista se monta " +
      "com o que ja existe. Data com valor - vencimento, prazo, entrega - e o `Calendar`, que " +
      "no nativo ja pinta por dia pelo `DayPaint`. Quem precisa de grade de tempo no celular " +
      "esta pedindo a tela de mesa num aparelho que nao a comporta.",
  },
  Gantt: {
    state: "nao",
    note: "cronograma é idioma de mesa; no telefone a tarefa por dia é lista, e o prazo é o `Calendar`",
    page:
      "Não porta, e é decisão, pela mesma conta que tirou o `EventCalendar` do celular. O " +
      "`Gantt` existe para mostrar duração e encadeamento lado a lado: a tabela à esquerda, a " +
      "escala à direita e a seta entre as duas. A 358px a tabela fica com o título e mais nada, " +
      "e a escala de semana mostra onze dias por tela; a seta de dependência liga barras que " +
      "quase nunca estão na mesma tela ao mesmo tempo. O que sobra é uma lista com retângulos " +
      "coloridos, e a lista sozinha diz isso melhor.\n\n" +
      "**A edição é o que fecha a conta.** O web já não arrasta com o dedo, porque a barra de " +
      "18px disputa o gesto com a rolagem de lado da própria moldura, e é o mesmo conflito que " +
      "a `week` do `EventCalendar` não resolveu. Um `Gantt` nativo sem arrastar seria uma " +
      "tabela cara; com arrastar, seria um gesto que a casa já mediu e recusou.\n\n" +
      "**No telefone, a resposta é outra peça.** A tarefa do dia é lista, montada com `Item` ou " +
      "`DataList`, com início, fim e responsável escritos; prazo com valor é o `Calendar`, que " +
      "pinta por dia pelo `DayPaint`; e o andamento de uma tarefa é o `Progress`. Remarcar é o " +
      "formulário com `DatePicker`, que é o que o dedo faz bem.",
  },
  Fieldset: { state: "traduz", note: "`legend` como prop" },
  Grid: {
    state: "traduz",
    note: "`columns`, `minItemWidth` em pontos e `gap`; a grade mede a própria largura para contar as colunas",
  },
  Input: {
    state: "traduz",
    note: "a borda acende no foco: não há `focus-visible` em tela de toque",
  },
  MaskedInput: {
    state: "traduz",
    note: "o valor chega limpo, sem pontuação; a máscara é do campo, o dado não a carrega",
  },
  CurrencyInput: {
    state: "traduz",
    note: "os mesmos centavos, a mesma digitação da direita e a mesma leitura do colado; o campo é controlado",
    page:
      "Traduz, com a mesma conta: o valor em centavos, a digitação que anda da direita para a " +
      "esquerda, o `-` que põe e tira o sinal e a leitura do texto colado moram num arquivo só, " +
      "compartilhado pelos dois pacotes. O campo é controlado, como todo o nativo: `value` e " +
      "`onValueChange` são obrigatórios.\n\n" +
      "O React Native não avisa quando a pessoa cola, então o campo lê a seleção de antes da " +
      "troca para saber o que entrou por cima. Com `allowNegative`, o teclado passa a ser o de " +
      "números e pontuação, que é o que tem o sinal no iPhone. Não há `name`: formulário " +
      "escondido não existe no celular.",
  },
  PostalCodeField: {
    state: "traduz",
    note: "a mesma `lookup` e os mesmos quatro finais; o valor são os dígitos, sem a pontuação",
    page:
      "Traduz, com a mesma `lookup`, o mesmo `onAddress` e os mesmos quatro finais, e com a " +
      "busca cancelada quando o CEP muda: a regra mora num arquivo só, compartilhado pelos " +
      "dois pacotes. O campo é controlado, como todo o nativo: `value` e `onValueChange` " +
      "recebem os dígitos, sem a pontuação.\n\n" +
      "O giro fica no fim do campo, o aviso embaixo dele, e cada troca de estado sai pelo " +
      "anúncio do leitor de tela do sistema. O \"Tentar de novo\" da falha de rede é um " +
      "botão de verdade, com alvo de toque inteiro.",
  },
  Questionnaire: {
    state: "traduz",
    note: "controlado, com as perguntas por `items` (`single`, `multiple`, `text`); os mesmos estados e os mesmos textos, sem atalho de teclado",
    page:
      "Traduz, uma pergunta por vez e com os mesmos estados: obrigatória não avança sem " +
      "resposta, opcional vale por resposta ou por pular, e o envio volta para a primeira " +
      "pergunta que falhou. A regra de validação e os textos moram num arquivo só, " +
      "compartilhado pelos dois pacotes, e `labels` troca os mesmos nomes.\n\n" +
      "A API é a do toque: tudo é controlado (`item` e `onItemChange`, `value` e " +
      "`onValueChange`), e as perguntas vêm por `items`, cada uma com `type` `single`, " +
      "`multiple` ou `text`, e `other` para o campo de resposta outra. Não há atalho de " +
      "letra, porque não há teclado físico; a troca de pergunta e o erro saem pelo anúncio " +
      "do leitor de tela do sistema, e a pergunta nova entra com os tokens de movimento.",
  },
  Tour: {
    state: "traduz",
    note: "sobre `Modal` e `measureInWindow`, com o alvo por ref; o balão é sempre folha, que sobe para o topo quando o alvo está embaixo, o passo é controlado e não há `interactive`",
    page:
      "Traduz sobre o `Modal` do core, sem peer novo: o alvo vem por ref e é medido por " +
      "`measureInWindow` quando o passo abre, e quatro faixas com o `overlay` do tema cercam o " +
      "recorte. O recorte desconta onde a raiz do `Modal` começa na janela, e por isso não cai " +
      "pela altura da barra de status no Android. O balão é sempre uma folha, que é o que o web " +
      "já faz abaixo de 640px, com o mesmo contador, os mesmos botões e os mesmos textos, que " +
      "moram num arquivo só, compartilhado pelos dois pacotes. A folha fica embaixo, e sobe para " +
      "o topo quando o alvo está na metade de baixo da tela, para não cobrir a barra de abas; lá " +
      "ela respeita `topInset`, a área segura de cima. Ref vazio, ou que não é uma `View` com " +
      "`measureInWindow`, pula o passo, com o mesmo aviso em desenvolvimento.\n\n" +
      "Três diferenças, e as três são do toque. O passo é controlado (`step` e `onStepChange` " +
      "obrigatórios), como todo o pacote nativo. Não há `interactive`: o `Modal` é outra janela, " +
      "e o toque não atravessa para a tela de trás. E não há rolagem sozinha, porque o React " +
      "Native não tem `scrollIntoView`: quem rola é a tela, no `onStepChange`, com " +
      "`scrollTo({ animated: false })` na `ScrollView`, e a peça mede de novo no quadro " +
      "seguinte. O voltar do Android pula o tour, como o `Esc` no web.",
  },
  Menu: {
    state: "traduz",
    note: "folha de baixo com `actions`, nunca popup ancorado; `children` abre no toque longo",
  },
  NumberField: {
    state: "traduz",
    note: "vira stepper (menos, valor, mais), que é o idioma do toque",
  },
  OTPField: {
    state: "traduz",
    note: "caixas visíveis, um campo escondido: teclado, autofill de SMS e leitor veem um só; o dígito aparece crescendo",
  },
  PageHeader: { state: "traduz", note: "`title`, `description`, `badge` e `actions` como props" },
  Progress: {
    state: "traduz",
    note: "`value` de 0 a 100 e `label`; sem `format`; a barra anda até o valor novo",
  },
  QueryBoundary: {
    state: "traduz",
    note: "mesmos nomes e mesma ordem; texto vira `string`, e nao ha `classNames` no pacote nativo",
    page:
      "Traduz com os mesmos nomes de prop e a mesma ordem: **erro vence carregando**, e vazio " +
      "só vale depois que a resposta chegou. O `children` também aceita função aqui, que é o " +
      "que justifica a peça existir: ela entrega o dado já sem `undefined`, e mata o `!` que a " +
      "tela escrevia.\n\n" +
      "Cinco diferenças de tipo, todas porque texto no nativo mora dentro de um `Text`: " +
      "`errorTitle`, `errorMessage`, `retryLabel`, `empty.title` e `empty.description` são `string`. " +
      "O `empty.icon` atravessa, e aceita também a função do `EmptyState` nativo, que entrega a cor " +
      "e o tamanho. É a mesma nota que o `ChartContainer` já carrega.\n\n" +
      "**`classNames` não porta, e a razão não é preguiça:** a prop existe no web para que " +
      "ninguém alcance o nó interno por `[&_div]` e acople a tela à árvore da peça. No React " +
      "Native não há seletor de descendente, então essa escotilha não existe e a prop não teria " +
      "o que evitar. O `className` veste os três finais, como no web.\n\n" +
      "O esqueleto genérico fica na peça, e não vem de quem chama: sem ele, `isLoading` sem " +
      "`skeleton` colapsaria a tela para altura zero e ela pularia quando o dado chegasse. No " +
      "celular isso dói mais, porque não há barra de rolagem nem indicador de rede para " +
      "explicar a espera.",
  },
  RadioGroup: {
    state: "traduz",
    note: "`items` na raiz; nao existe `Radio` solto; `label` nomeia o grupo, no lugar do `aria-label` do web; o ponto aparece crescendo",
    page:
      "Traduz com `items` na raiz: não há `Radio` solto para compor, e tudo é controlado.\n\n" +
      "**O `label` é o `aria-label` do web com outro nome.** A página de lá já cobrava: sem " +
      "nome, o grupo existe para o dedo e não para o leitor de tela. Aqui não havia como " +
      "cobrar, e o buraco era pior do que faltar a prop: o `forValue` do subcaminho de " +
      "formulário já entregava `accessibilityLabel`, mas o tipo é fechado e espalhamento em " +
      "JSX não confere propriedade excedente, então o nome era **descartado em silêncio com o " +
      "TypeScript verde**.\n\n" +
      "Ele não desenha nada: o texto visível é do `Field`, como no `Select` e no `Combobox`. " +
      "Dentro de um `FormField`, repita ali o mesmo texto do `label` dele.",
  },
  RivoProvider: {
    state: "traduz",
    note:
      "`theme` troca em runtime só entre os dois temas de casa, e tema de cliente é decisão " +
      "de BUILD; `density` não existe: alvo de toque não encolhe, e `comfortable` é a única " +
      "altura; e ganha `fonts`, que o web não tem",
    page:
      "Traduz, e ganha uma prop que no web não existe: `fonts`. No navegador as três " +
      "famílias chegam pelo CSS de tokens; no celular não há CSS de fonte, e carregar " +
      "arquivo de fonte é decisão do app, não da biblioteca. O app carrega com o " +
      "`expo-font` e declara os nomes uma vez (`<RivoProvider fonts={{ sans: 'Manrope', " +
      "display: 'Poppins', mono: 'JetBrainsMono' }}>`), e o catálogo inteiro passa a " +
      "vesti-los. Sem a prop, tudo sai na fonte do sistema e nada quebra. Passe junto o " +
      "`isFontLoaded={isLoaded}` do `expo-font`: nome de fonte ausente falha calado no " +
      "React Native, e é esse retorno que faz o provider avisar em `__DEV__`.\n\n" +
      "**`density` não existe aqui, e não é omissão de paridade.** Alvo de toque não " +
      "encolhe em tela de dedo: `comfortable` é a única altura, e a prop saiu da API.\n\n" +
      "**E `theme` troca a tela inteira apenas entre os dois temas de casa.** " +
      "`rivocode-dark`, `rivocode-light` e `system` trocam no mesmo quadro, porque as cores " +
      "foram compiladas como `light-dark()` e o provider só gira o esquema do `Appearance`. " +
      "Tema de cliente **não troca cor de classe nenhuma** em runtime: " +
      "o compilador do `react-native-css` crava o hex dentro da regra (`.bg-accent` vira " +
      '`{"backgroundColor":"#d4f34a"}`, literal), e nos 56 KB de CSS compilado não sobra uma ' +
      "ocorrência de `--`. Não existe variável viva para redefinir depois do build.\n\n" +
      "**O mapa de tema saiu do provider.** Ele alcançava só quem lê cor por JS " +
      "- `ChartDonut`, `ChartRadial`, o giro do `Button`, o trilho do `Switch` -, e saía " +
      "donut de um tema e botão de outro, lado a lado. Uma metade que discorda da outra é " +
      "pior do que nenhuma: o provider passou a resolver os 45 papéis lendo o CSS " +
      "compilado, uma classe `bg-` por papel, então contexto e classe dizem sempre a mesma " +
      "cor. A releitura acontece inclusive quando o app declara o esquema dentro de um " +
      "efeito, depois da montagem - antes disso a paleta era lida uma vez e congelava, e " +
      "saía meia tela num esquema e meia no outro. Com o mapa sem função, ele foi " +
      "removido: `theme` aceita só `rivocode-dark`, `rivocode-light` e `system`, e a prop " +
      "`scheme` saiu junto, porque era ela que escolhia o esquema do mapa.\n\n" +
      "**O caminho que funciona é o CSS do app, antes de compilar - e agora ele veste a " +
      "tela inteira, gráfico incluído:** sobrescreva os papéis " +
      "num `@theme` do seu `global.css`, depois do `@rivocode/ui-native/theme.css`, e rode " +
      "`npx rivocode-ui-native-css` de novo. Ele tem um teto de arquitetura: `light-dark()` " +
      "tem duas vagas, então são **dois temas por build**, um claro e um escuro. Um app de " +
      "um cliente cabe folgado; uma vitrine de cinco temas, como a do web, pede cinco " +
      "bundles. O [guia de temas](/temas) tem o passo a passo.",
  },
  SearchInput: { state: "traduz", note: "`value` e `onValueChange` obrigatórios" },
  Select: {
    state: "traduz",
    note: "poucas opções fixas; `items` e `label` na raiz, e a lista abre numa folha de baixo",
    page:
      "Traduz, e a forma de escrever é outra. No web o `Select` pede `items` na raiz **e** " +
      "as quatro partes (`SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`); no " +
      "nativo ele é uma tag só (`<Select items={…} value={…} onValueChange={…} " +
      'label="Período" />`), e a lista abre numa folha de baixo, que é o idioma da ' +
      "plataforma para escolher. O `label` é obrigatório: é por ele que o leitor de tela " +
      "anuncia o gatilho, papel que no web era do `SelectTrigger`.",
  },
  Separator: { state: "traduz", note: "só a linha horizontal" },
  Sheet: {
    state: "traduz",
    note: "só o comportamento de baixo, que já era o modo estreito do web; sobe deslizando, e sem transição quando o sistema pede para reduzir movimento; com campo dentro, a folha sobe junto com o teclado",
  },
  Skeleton: {
    state: "traduz",
    note: "mesma marca de lugar, mesmo token, e o mesmo pulso de 2 s; parado com reduzir movimento",
  },
  Rating: {
    state: "traduz",
    note: "um controle ajustável só para o leitor de tela, com `value` controlado; cada estrela tem 44pt de alvo, e o ícone entra por função",
    page:
      "Traduz, com os mesmos `max`, `allowHalf`, `clearable`, `readOnly` e `size`. O `value` é " +
      "controlado, como em todo o pacote nativo, e sem `onValueChange` a peça só exibe.\n\n" +
      "**Para o leitor de tela, as estrelas são um controle só.** No web a escolha é um " +
      "`radiogroup` com uma opção por estrela; aqui o grupo é `adjustable`, o mesmo contrato do " +
      "`Slider`: o VoiceOver e o TalkBack dizem \"Avaliação, 3 estrelas\", e o gesto de subir e " +
      "descer anda uma estrela (meia, com `allowHalf`). Cinco paradas de foco para uma nota " +
      "seriam cinco toques de navegação para chegar ao botão de enviar.\n\n" +
      "**O alvo de toque de cada estrela é sempre 44pt.** O `size` troca só o desenho. Com " +
      "`allowHalf`, o toque na metade de início da leitura dá a meia estrela: a da esquerda, " +
      "ou a da direita quando o aparelho lê da direita para a esquerda. O preenchimento também " +
      "começa desse lado, e o gesto de subir continua subindo a nota. Não há prévia: no toque " +
      "não existe pousar.\n\n" +
      "A estrela padrão é o caractere ★ na cor do tema, porque o pacote não traz ícone. Para " +
      "outro desenho, a função recebe a cor já resolvida, o tamanho e a camada: " +
      "`icon={({ color, size }) => <Heart color={color} fill={color} size={size} />}`.\n\n" +
      "```tsx\n" +
      "<Rating value={nota} onValueChange={setNota} allowHalf />\n" +
      "```",
  },
  SignaturePad: {
    state: "traduz",
    note:
      "vive em `@rivocode/ui-native/chart`, porque desenha com o `react-native-svg`; o traço é o mesmo " +
      "arquivo do web, o gesto é o `PanResponder`, e o PNG fica de fora por não haver canvas",
    page:
      "Traduz, no caminho `@rivocode/ui-native/chart`: o papel é desenhado com o " +
      "`react-native-svg`, que já é o peer desse caminho, e a regra da casa é **um subcaminho por " +
      "peer**, e não um por assunto. Quem só usa um `Button` não passa a precisar do SVG por causa " +
      "da assinatura.\n\n" +
      "**O traço é o mesmo dos dois lados, linha por linha.** A suavização por curvas, a espessura " +
      "que varia com a velocidade e com a pressão, o nome digitado em cursiva e o SVG exportado " +
      "moram em `src/shared/` e atravessam por espelho: a assinatura feita no celular abre igual no " +
      "web, com o mesmo `value`. O gesto é o `PanResponder` do core, que não cede o toque para a " +
      "rolagem no meio do traço; `onDrawingChange` avisa quando o dedo começa e termina, para a " +
      "`ScrollView` em volta desligar o `scrollEnabled`. A força do toque, quando o aparelho a " +
      "mede, entra como pressão.\n\n" +
      "**Exporta só o SVG.** `signatureToSvg` sai daqui com a tinta do token, escura nos dois " +
      "temas; o PNG não porta, porque o React Native não tem canvas. Quem precisa de imagem " +
      "rasteriza o SVG no servidor, ou captura a área com uma biblioteca de captura de tela. O " +
      "`value` é controlado, não há `name` (formulário escondido não existe no celular), e o modo " +
      "de digitar o nome continua lá: a cursiva padrão é a Snell Roundhand no iOS e a `cursive` no " +
      "Android.\n\n" +
      "```tsx\n" +
      "import { SignaturePad } from '@rivocode/ui-native/chart'\n\n" +
      "<SignaturePad\n" +
      "  value={assinatura}\n" +
      "  onValueChange={setAssinatura}\n" +
      "  onDrawingChange={(desenhando) => setRolagem(!desenhando)}\n" +
      "/>\n" +
      "```",
  },
  Slider: {
    state: "traduz",
    note: "anda por gesto e responde às ações do leitor de tela; um valor só, e `label` obrigatório",
  },
  Sparkline: {
    state: "traduz",
    note: "`line` e `bar` valem nos dois lados; `area` fica de fora (pede polígono preenchido, e o desenho nativo é `View`)",
    page:
      "Traduz: o `@rivocode/ui-native` exporta `Sparkline`, e ela é o que o slot `chart` do " +
      "`Stat` nativo esperava. Ela é desenhada com `View`, sem SVG, e isso decide o que " +
      'atravessa: `variant="line"` e `variant="bar"` significam a mesma coisa nos dois ' +
      "mundos, e **`area` não porta**: área quer polígono preenchido, que `View` não faz. " +
      "Duas outras diferenças, ambas deliberadas: o traço desenha 2px em vez de 1,5 (a 1,5 " +
      "ele desaparece na tela do telefone sob luz) e a largura vem do pai, com a altura em " +
      "`height`. **Sem `label` ela é escondida do leitor de tela de propósito**: uma linha " +
      'sem descrição não diz nada a quem não a vê, e anunciar "imagem" seria pior do que ' +
      "calar. E ela entra **só esmaecendo**, como no web, em `duration-base`: não se desenha " +
      'nem anda na troca de dados, e com "reduzir movimento" aparece parada.',
  },
  Spinner: { state: "traduz", note: "`small` e `large`, os dois tamanhos do `ActivityIndicator`" },
  Stack: {
    state: "traduz",
    note: "mesmas props, menos `render`; o vão é a escala confortável, porque no toque não há densidade compacta",
  },
  Stat: {
    state: "traduz",
    note: "`value` já formatado, `delta` numérico, e o slot `chart` que a `Sparkline` nativa preenche",
  },
  Switch: {
    state: "traduz",
    note: "`checked` e `onCheckedChange` obrigatórios; o trilho é o do sistema, pintado por token, e o pino desliza pela animação da própria plataforma",
  },
  Tabs: {
    state: "traduz",
    note: "só a caixinha segmentada, por `items`; seção de página é trabalho do router nativo; o fundo da ativa desliza entre as abas",
    page:
      "Traduz pela metade, de propósito. O `Tabs` nativo é **só** a caixinha " +
      '(`variant="segmented"` no web): `items`, `value`, `onValueChange`, sem `TabList`, ' +
      "`Tab` nem `TabPanel`. Aba que troca a seção da página não é peça no celular (é tab " +
      "bar do router), e insistir numa aba desenhada por cima disso dá duas navegações " +
      "concorrentes na mesma tela.",
  },
  Textarea: {
    state: "traduz",
    note: "`rows` e a altura inicial e o campo cresce; `onChangeText`, como o `Input`, e nao `onValueChange`",
    page:
      "Traduz: `rows` é a altura inicial e o campo cresce com o conteúdo, como no web, que " +
      "também não tem variante de tamanho.\n\n" +
      "**`onChangeText`, e não `onValueChange`, e isso é o par e não o desvio.** No catálogo " +
      "nativo `onValueChange` é de quem é dono do valor: `Select`, `Combobox`, `Slider`, " +
      "`Calendar`, `MaskedInput`, `SearchInput`, `InputGroup`, todas leem o texto cru e " +
      "entregam outra coisa. `Input` e `Textarea` não entregam outra coisa: são o `TextInput` " +
      "da plataforma com a borda da casa, e o `TextInput` chama `onChangeText` com a string.\n\n" +
      "A regra é essa, e vale para as duas: **campo cru fala `onChangeText`; peça que " +
      "transforma o valor fala `onValueChange`**. Dar `onValueChange` só ao `Textarea` " +
      "quebraria o par com o `Input`, que é o que o `Field` alterna sem a tela mudar de " +
      "contrato, e deixaria o `forText` (o quarto adaptador do `@rivocode/ui-native/form`, " +
      "que existe exatamente para esses dois) certo para um e errado para o outro.",
  },

  Autocomplete: {
    state: "vira",
    native: "Combobox",
    note: "e **não** aceita valor fora da lista: a folha escolhe, não digita",
    page:
      "No React Native quem cobre este caso é o `Combobox`, com uma perda que precisa " +
      "entrar na sua decisão: ele **não aceita valor fora da lista**. O que o " +
      "`Autocomplete` tem de próprio, que é deixar a pessoa escrever o que não está " +
      "cadastrado, não existe lá. Se o campo precisa aceitar o inédito, no celular ele é um " +
      "`Input` seu com sugestões, e não esta peça.",
  },
  DataTable: {
    state: "vira",
    native: "DataList",
    note: "`filter` e `selectable` portam com o mesmo nome; ordenar e `pageSize` ficam de fora por desenho",
    page:
      "Vira `DataList`. Tabela não existe no celular: o que atravessa é a máquina de " +
      "estados (carregando, erro, vazio, dados) na mesma ordem, com o erro vencendo o " +
      "carregando e o vazio valendo só depois que a resposta chegou. Os textos desses finais se " +
      "configuram com os nomes do web: `errorTitle`, `errorMessage`, `retryLabel` e " +
      "`noResultsMessage`, todos `string` porque texto aqui mora dentro de um `Text`. Só o " +
      "padrão de `errorTitle` difere: aqui não há, porque o aviso da lista nasceu de uma linha " +
      "só, e essa linha é a `errorMessage`. Dos quatro opt-in " +
      "daqui, dois portam com o mesmo nome de prop (`filter` e `selectable`) e **dois não " +
      "portam por desenho**: ordenação e `pageSize`. Cabeçalho clicável não existe sem " +
      'cabeçalho, e no celular ordenar é um `Menu` de "ordenar por" que a tela monta em ' +
      "cima da lista. No lugar das colunas, `renderItem`. E por isso o `filter` quer um " +
      "`filterValue`, já que ninguém consegue ler texto de dentro do JSX que você devolve.",
  },
  ToastViewport: {
    state: "vira",
    native: "useToast",
    note: "não se monta nada: o `RivoProvider` já traz a fiação, e o hook é o mesmo. O aviso sobe e desce com as durações do web, e aparece parado quando o sistema pede para reduzir movimento",
  },

  QRCode: {
    state: "traduz",
    note:
      "vive em `@rivocode/ui-native/chart`, porque desenha com o `react-native-svg`; o codificador é o " +
      "mesmo, a tinta e o papel são fixos e não há `classNames`",
    page:
      "Traduz, no caminho `@rivocode/ui-native/chart`: o código é desenhado com o " +
      "`react-native-svg`, e a regra da casa é **um subcaminho por peer**, e não um por assunto. " +
      "Desenhar com `View` custaria centenas de caixas por código, uma por trecho de módulos " +
      "escuros, e o Pix de uma cobrança passa de dois mil módulos.\n\n" +
      "**O codificador é o mesmo dos dois lados, linha por linha**: ele mora em `src/shared/` e " +
      "atravessa por espelho, então versão, máscara e correção de erro não divergem. O teste " +
      "do nativo rasteriza o caminho que a peça desenha e o decodifica de volta, como o do web.\n\n" +
      "As cores **não** saem do tema: os módulos são `tokens.code[\"code-ink\"]` e o papel " +
      "`tokens.code[\"code-paper\"]`, escuro sobre claro nos dois esquemas, numa placa de canto " +
      "arredondado. Não passam pelo CSS do app nem pelo `colors` do `RivoProvider`, então " +
      "nenhum `@theme` de cliente inverte o código sem querer. " +
      "`level`, `size` e `logo` têm o mesmo contrato do web: com `logo` o nível nasce H, e com outro " +
      "nível a marca não aparece. Não há `classNames`: veste só pela raiz, como toda peça daqui.\n\n" +
      "```tsx\n" +
      "import { QRCode } from '@rivocode/ui-native/chart'\n\n" +
      '<QRCode value={link} label="QR Code para consultar a nota 4813" />\n' +
      "```",
  },
  PixCode: {
    state: "traduz",
    note:
      "vive em `@rivocode/ui-native/chart`, junto do `QRCode`; o copiar entra por `renderCopy`, " +
      "porque o `Clipboard` mora em outro caminho",
    page:
      "Traduz, no caminho `@rivocode/ui-native/chart`, porque o QR é o `QRCode` nativo, " +
      "desenhado com o `react-native-svg`. As funções puras (`buildPixPayload`, " +
      "`parsePixPayload` e `isValidPixKey`) saem da raiz: não pedem peer nenhum, e o arquivo é " +
      "o mesmo do web, pelo espelho do código compartilhado. O valor sai formatado sem `Intl`, " +
      "igual nos dois lados.\n\n" +
      "**O copiar entra por `renderCopy`.** O `Clipboard` nativo mora em " +
      "`@rivocode/ui-native/clipboard` por causa do `expo-clipboard`, e a regra da casa é " +
      "**um subcaminho por peer**: se a peça o importasse, quem desenha um QR teria de instalar " +
      "o módulo de área de transferência. A função recebe o copia e cola e só é chamada quando " +
      "há o que copiar (nem carregando, nem expirado, nem com o CRC errado), então o botão some " +
      "junto com o código. O texto é `selectable` de todo jeito, e o toque longo copia mesmo sem o botão.\n\n" +
      "```tsx\n" +
      "import { PixCode } from '@rivocode/ui-native/chart'\n" +
      "import { Clipboard } from '@rivocode/ui-native/clipboard'\n\n" +
      "<PixCode\n" +
      "  payload={cobranca.pixCopiaECola}\n" +
      '  renderCopy={(payload) => <Clipboard value={payload}>Copiar código</Clipboard>}\n' +
      "/>\n" +
      "```",
  },
  Clipboard: {
    state: "traduz",
    note:
      "vive em `@rivocode/ui-native/clipboard`; a confirmação é dupla: o botão troca de nome e um " +
      "aviso fala, porque rótulo trocado debaixo do dedo não é reanunciado",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/clipboard`, com o mesmo arranjo do `form` " +
      "e do `chart` e pela mesma razão: o `expo-clipboard` é peer **opcional**, e no celular ele não é " +
      "só bytes, é módulo nativo que o app liga e reconstrói (`npx expo install expo-clipboard`). " +
      "Ele tem caminho **separado** do `FileUpload` de propósito: quem põe um botão de copiar ao " +
      "lado da chave de acesso de uma NF-e não anexa arquivo nenhum, e um índice comum aos dois " +
      "cobraria os dois.\n\n" +
      "**A confirmação passa a ser dupla, e no web bastava uma.** A regra não muda: copiar é a " +
      "ação sem resultado visível, e sem confirmação a pessoa toca de novo por dúvida. O que muda " +
      "é por onde ela chega. O botão continua trocando o ícone e o nome acessível, como lá; e a " +
      "peça dispara **também** um aviso, porque aqui trocar o `accessibilityLabel` de um " +
      "`Pressable` que já está sob o foco **não é reanunciado** nem pelo VoiceOver nem pelo " +
      "TalkBack: quem não vê o ícone virar visto não ficaria sabendo de nada. O aviso que o " +
      '`RivoProvider` já monta mora num `accessibilityLiveRegion="polite"`, e é o único canal ' +
      "desta tela que fala sozinho. `toast={false}` desliga, para a tela que copia várias coisas " +
      "seguidas e não quer uma pilha de avisos.\n\n" +
      "**Quando não copiou, nada é confirmado**, como no web: o `setStringAsync` do Expo devolve " +
      "`false` quando a área de transferência recusa (o caso do passe web, fora de contexto " +
      "seguro), e no iOS e no Android ele sempre resolve `true`.\n\n" +
      "Sem `children` o botão é só o ícone, e aí o alvo é 44px cheios, sem depender de `hitSlop` " +
      "para chegar lá. O ícone é desenhado com `View`, como o olho do `PasswordInput`.",
  },
  Code: {
    state: "traduz",
    note:
      "o trecho quebra linha junto com a frase que o cerca, e o toque longo copia (`selectable`); " +
      "a rolagem própria é do `CodeBlock`, que continua fora",
    page:
      "Traduz, e ele vai dentro de um `Text`: `Abra o <Code>app.json</Code>` quebra linha junto " +
      "com a frase que o cerca. **A rolagem horizontal que a fila prometia nunca foi deste " +
      "lado:** barra de rolagem dentro de um parágrafo é armadilha para o dedo que rola a tela, " +
      "e quem precisa dela é o `CodeBlock` (retorno de API, linha de log), que é outra peça e " +
      "ainda não portou. O argumento é o inverso do daqui: lá quebrar um JSON no meio muda o que " +
      "está escrito, e aqui quebrar um caminho longo no meio é o certo, porque a alternativa é " +
      "esticar a tela inteira. O corpo da letra não é escrito: o `Text` aninhado herda o do texto " +
      "de fora, que é o que o `0.9em` do web dizia. E `selectable` vem ligado, porque o toque " +
      "longo é o gesto nativo para copiar. No Android quem seleciona é o `Text` de fora, e ali " +
      "é ele que precisa carregar a prop.",
  },
  ColorPicker: {
    state: "traduz",
    note:
      "sai na raiz; controlada, e sem seta: cada amostra é um alvo de 44px com o desenho de 32 " +
      "por dentro, e são seis por linha, não dez",
    page:
      "Traduz, e sai pelo índice da raiz: não há peer nenhum atrás dela. As duas entradas do web " +
      "atravessam inteiras: as **amostras**, para escolher olhando, e o **campo hexadecimal**, " +
      "para quem já tem o valor no manual da marca. O `normalizeColor` é o mesmo dos dois lados, " +
      "linha por linha: `#0f8`, `BFDD3A` e `  #D4F34A  ` saem todos como seis dígitos minúsculos " +
      "com cerquilha.\n\n" +
      "**Três coisas mudam, e as três saem do dedo.** É controlada, sem `defaultValue`, como toda " +
      "peça daqui. **Não há navegação por seta** (nem `Home`, nem `End`, nem uma única parada de " +
      "tabulação), e por isso `columns` deixa de ser o passo das setas e passa a ser só o " +
      "desenho: o padrão cai de dez para **seis por linha**, porque dez alvos de 44px com vão de " +
      "8 dariam 512px numa tela de 390. E cada amostra é um alvo de **44px com o desenho colorido " +
      "de 32 por dentro**: a grade de cores bonita e pequena demais para o polegar é o defeito " +
      "clássico desta peça. A marca do escolhido continua sendo **por fora**, pela mesma razão do " +
      "web: símbolo desenhado sobre a amostra fica ilegível em metade das cores possíveis, e não " +
      "há token que garanta contraste contra um valor que a pessoa inventou.\n\n" +
      '**O campo pede o teclado alfanumérico comum** (`keyboardType="default"`), e não o ' +
      "numérico: hexadecimal tem `a` a `f` e uma cerquilha, e nenhum teclado de números traz as " +
      'duas coisas. O que ele desliga é o que o sistema faria por conta: `autoCapitalize="none"` ' +
      "para `bfdd3a` não virar `Bfdd3a`, e `autoCorrect={false}` para o corretor não trocar seis " +
      "letras sem sentido pela palavra mais parecida.\n\n" +
      "Quem não vê a cor a ouve por dois caminhos: o `accessibilityState.checked` de cada amostra, " +
      "e o texto do próprio campo, que tem nome próprio (`Código hexadecimal da cor`). O retrato " +
      "ao lado dele sai do leitor de tela: ele repete em cor o que o campo diz em texto, e cor " +
      "não se ouve. Com `hideInput`, o estado da amostra fica sendo o único canal.\n\n" +
      "O `classNames` por parte não porta: como todas as peças daqui, ela veste só pela raiz.",
  },
  DateRangePicker: {
    state: "traduz",
    note: "um mês numa folha, com as duas pontas na mesma grade; a peça ordena os toques, e o intervalo invertido deixou de existir",
    page:
      "Traduz, com um desenho só: **um mês, numa folha de baixo, com a faixa pintada na " +
      "própria grade**. Os dois meses lado a lado do web não cabem (390px partidos ao meio " +
      "dão 27px de célula, e o alvo de toque mínimo é 44), e dois `DatePicker` em sequência, " +
      "que era o que esta tabela mandava fazer até agora, perdem justamente o que faz a peça " +
      "existir: as duas pontas na mesma grade, com os dias do meio pintados. **A validação de " +
      "fim-antes-do-começo deixou de ser sua**: tocar 20 e depois 5 devolve 5 a 20, porque a " +
      "peça ordena as duas pontas em vez de descartar o primeiro toque, e o `Aplicar` fica " +
      "desligado enquanto falta a segunda. Por isso o tipo mudou: o `DateRange` daqui tem " +
      "`from` e `to` **obrigatórios**, os dois como ISO `aaaa-mm-dd`, e o vazio é `null`. O " +
      "intervalo pela metade, que no web sai no `onValueChange` entre os dois cliques para o " +
      "resumo do filtro acompanhar, não sai daqui: sob uma folha não há tela atrás para " +
      "acompanhar nada: quem quiser acompanhar lê o resumo que a própria folha escreve " +
      "acima do mês. Sem `confirm`: a folha sempre confirma, porque o toque fora dela é o " +
      "gesto de desistir e não pode valer como aplicar.",
  },
  Editable: {
    state: "traduz",
    note:
      "quem abre é o toque **longo**, o retorno do teclado confirma e há um `Cancelar` visível: " +
      "sair do campo não salva, ao contrário do web",
    page:
      "Traduz, com os dois gestos trocados. E os dois eram a peça inteira no web, então vale ler " +
      "antes de portar a tela.\n\n" +
      "**Quem abre é o toque longo**, e não o toque. É o gesto que o sistema já usa para agir " +
      "sobre um texto, e a escolha é defensiva: num painel de leitura o dedo encosta em tudo " +
      "enquanto rola, e com o toque curto abrindo o campo o teclado subia sozinho a cada " +
      "esbarrão. Para quem usa leitor de tela o gesto não existe, então a peça declara também " +
      'uma ação de acessibilidade `longpress` chamada "Editar", que aparece no rotor.\n\n' +
      "**Sair do campo não salva.** No web, clicar fora confirma; aqui não há clicar fora: há o " +
      "teclado que se esconde, e o próprio `Cancelar` tira o foco do campo antes de rodar, então " +
      "um `blur` que salvasse salvaria o rascunho no caminho de cancelá-lo. Nada sai daqui sem " +
      "confirmação explícita (o botão de retorno do teclado) e nada se perde sem o `Cancelar`, " +
      "que é visível ao lado do campo porque sem Escape não existe saída invisível.\n\n" +
      "O resto é o contrato de sempre: `value` e `onValueChange` **obrigatórios**, sem " +
      "`defaultValue`, e `label` obrigatório. Fechada, a peça anuncia `label` e valor juntos, " +
      'porque "Nome do cliente" sozinho manda a pessoa abrir a edição só para descobrir o que ' +
      "há lá dentro.",
  },
  FileUpload: {
    state: "traduz",
    note:
      "vive em `@rivocode/ui-native/file-upload`; a área de soltar vira um botão, porque no " +
      "celular não há soltar; o `accept` fala MIME e o tamanho sai formatado sem `Intl`",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/file-upload`: o `expo-document-picker` é " +
      "peer **opcional** e módulo nativo (`npx expo install expo-document-picker`), e tem caminho " +
      "separado do `Clipboard` pela mesma conta: a regra da casa é **um subcaminho por peer**, e " +
      "não um por assunto. O que não muda é o principal: **a peça continua não conhecendo rede**. " +
      "Ela valida `accept` e `maxSize` na entrada, entrega os aceitos em `onSelect` e os recusados " +
      "em `onReject`, cada recusa com o motivo pronto para um aviso.\n\n" +
      "**A área de soltar vira um botão, e isso é a peça inteira mudando de forma.** No celular " +
      "não há arrastar: nada pode ser solto em lugar nenhum, e o retângulo tracejado de 96px do " +
      'web é, letra por letra, o idioma de "solte aqui": desenhá-lo numa tela de toque promete ' +
      "um gesto que o aparelho não tem. Tirado o soltar, o que sobra daquela caixa é um botão com " +
      "muito espaço vazio em volta: **o espaço era o alvo de soltar, e não a affordance**. Então " +
      "sobra o botão, numa altura de controle. E a altura que ele devolve é da **lista**, que é " +
      "onde o arquivo aparece, sobe, falha e é removido. O `hint` continua existindo, e entra no " +
      "nome falado do botão pelo mesmo motivo que no web ele mora dentro do `<button>`: quem ouve " +
      'a tela precisa saber "XML ou PDF, até 5 MB" antes de abrir o seletor, e não depois de ser ' +
      "recusado.\n\n" +
      "**O `accept` fala MIME.** O seletor do Expo filtra por tipo (`text/xml`, `image/*`), e não " +
      "por extensão: um `.xml` mandado para lá não casaria nada e abriria o diálogo vazio. Então " +
      "a extensão com ponto continua valendo (na validação de volta, contra o nome do arquivo), " +
      "mas não vai para o sistema. E o que volta não é um `File`: é um `PickedFile` " +
      "(`uri`, `name`, `size?`, `mimeType?`), com o `uri` local que o app usa para subir. **O " +
      "`size` pode faltar**, porque nem todo provedor de arquivo do Android o informa, e por isso " +
      "`maxSize` só recusa o que conseguiu medir. Fechar o seletor devolve `canceled` e nenhum " +
      "callback dispara, como fechar a janela do seletor do web.\n\n" +
      "`FileUploadList` e `FileUploadItem` atravessam com o mesmo contrato (`progress` de 0 a " +
      '100 vira barra anunciada, `error` vence o progresso e oferece "Tentar de novo"), com duas ' +
      "diferenças de plataforma: o corte do nome é `numberOfLines`, que lá é prop e não classe, e " +
      'o tamanho sai formatado **sem `Intl`** ("47,1 KB", com a vírgula escrita à mão), pela ' +
      "mesma razão que o `Meter` nativo não tem `format`.",
  },
  Form: {
    state: "traduz",
    note: 'vive em `@rivocode/ui-native/form`; o `Form` entrega o `submit` em vez de esperar um `type="submit"`, e há um adaptador a mais, o `forText`',
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/form`, com o mesmo arranjo do web e pela " +
      "mesma razão: o `react-hook-form` é peer opcional. O `useZodForm` é idêntico, linha por " +
      "linha, porque não há navegador nele.\n\n" +
      "**O que muda é quem dispara o envio.** No React Native não existe `<form>`, não existe " +
      '`type="submit"` e não existe Enter que envie: nada é implícito. Então o `Form` ' +
      "entrega o envio a quem desenha o botão (`children` pode ser uma função que recebe " +
      "`{ submit, isSubmitting }`), e continua aceitando JSX comum para quando o botão mora " +
      "fora, numa barra fixa no rodapé da tela.\n\n" +
      "**E muda a ponte com o controle.** No web o `Field` da Base UI liga rótulo, ajuda e " +
      "erro a qualquer controle que esteja dentro, pelo contexto; aqui não há contexto nenhum: " +
      "o `Field` nativo desenha um `Text` em cima e outro embaixo, e o controle do meio não " +
      "fica sabendo de nada. Por isso o campo que o `FormField` entrega leva duas coisas a " +
      "mais, `accessibilityLabel` e `invalid`, e os adaptadores as põem no controle: sem " +
      "isso, um `TextInput` sob um rótulo fica **sem nome nenhum** para o leitor de tela. O " +
      "`label` do `FormField` é obrigatório aqui pela mesma razão.\n\n" +
      "Os adaptadores são quatro. `forValue`, `forChecked` e `forDate` têm o nome e o " +
      "trabalho do web. O `forDate` agora converte o vazio para `null` e fala ISO, que é o " +
      "que o `DatePicker` e o `DateRangePicker` nativos pedem. O quarto é só daqui: " +
      "`forText`, para `Input` e `Textarea`, porque o `TextInput` chama `onChangeText` com a " +
      "string crua e não com um evento: espalhar o campo nele guardaria no formulário um " +
      "objeto de evento que não existe. Ele leva o `ref` junto, e aí o `form.setFocus()` " +
      "funciona de verdade: `TextInput` tem `focus()`.",
  },
  NotificationCenter: {
    state: "traduz",
    note: "a lista abre numa `Sheet`; `open` é controlado, o sino entra por `icon`, e a linha chama `onItemPress` no lugar do `href`",
    page:
      "Traduz, com a lista numa `Sheet` que sobe de baixo, que é o que o web já faz no " +
      "celular. `items`, `unreadCount`, `onMarkRead`, `onMarkAllRead`, o filtro, `hasMore`, " +
      "`onLoadMore`, `isLoadingMore`, `isLoading` e `labels` têm o mesmo nome e o mesmo " +
      "sentido, e os textos saem da mesma fonte.\n\n" +
      "**`open` é controlado**, com `onOpenChange`, como em todo o pacote nativo. **O sino " +
      "entra por `icon`**, porque o pacote não traz ícone, e a forma que pinta na cor do " +
      "botão é a função: `icon={({ color, size }) => <Bell color={color} size={size} />}`.\n\n" +
      "**A linha não é link.** No celular quem navega é o router, então a notificação não " +
      "tem `href`: `onItemPress` recebe o item e decide para onde ir. Abrir continua " +
      "contando como ler, e a folha fecha.\n\n" +
      "A contagem é o nome do botão (\"3 notificações não lidas\"), e quando ela muda o " +
      "leitor de tela ouve a frase nova pelo anúncio do sistema.\n\n" +
      "```tsx\n" +
      "<NotificationCenter\n" +
      "  items={notificacoes}\n" +
      "  open={aberto}\n" +
      "  onOpenChange={setAberto}\n" +
      "  icon={sino}\n" +
      "  onItemPress={abrir}\n" +
      "  onMarkRead={marcar}\n" +
      "/>\n" +
      "```",
  },
  Indicator: {
    state: "traduz",
    note: "`label` é obrigatório: a pastilha é uma parada só do leitor de tela, e o que ela diz é a frase, nunca o número",
    page:
      "Traduz, e o que muda é quem carrega o nome acessível. No web o número é escondido do " +
      "leitor e um texto só para ele entra ao lado; no nativo a pastilha inteira é UM elemento " +
      "de acessibilidade, e o `label` (aqui obrigatório) é o que ele anuncia. O leitor lê o " +
      'filho ("Notificações, botão") e a pastilha em seguida ("3 notificações"), e nunca um ' +
      '"3" solto entre os dois. Embrulhar filho e pastilha num elemento só resolveria a ' +
      "leitura e quebraria o toque, porque o botão de dentro deixaria de ser alcançável. O " +
      "anel que separa a pastilha do que está embaixo vira borda da cor do fundo: `ring` não " +
      "existe no React Native, e borda ali ocupa por dentro da caixa.",
  },
  InputGroup: {
    state: "traduz",
    note: "`prefix`, `suffix` e `actions` são props e a moldura desenha o próprio campo; sem `size`",
    page:
      "Traduz, e a forma muda junto: no web a moldura é composição (`InputGroup` por fora, " +
      "`Input`, `InputPrefix` e `InputAction` por dentro) e ela desarma a borda do campo com " +
      "um seletor de descendente. Esse seletor não existe no React Native, e quem escrevesse a " +
      "mesma árvore lá ganharia duas bordas encaixadas sem jeito de apagar a de dentro. Por " +
      "isso a moldura nativa desenha o campo: `value`, `onValueChange`, `prefix`, `suffix` e " +
      "`actions` são props dela. Não há `size`: altura de controle é única no nativo, porque " +
      "alvo de toque não encolhe.",
  },
  Item: {
    state: "traduz",
    note: "`title`, `description`, `media` e `actions` como props; o corte com reticências é `numberOfLines`, que lá é prop e não classe",
    page:
      "Traduz, e não concorre com o `DataList`: ele resolve os quatro finais de uma consulta e " +
      "devolve cada linha ao `renderItem` sem opinião sobre o que há dentro dela. O `Item` é " +
      "esse dentro, e serve igualmente à lista de duas escolhas numa folha, que consulta " +
      "nenhuma tem. A composição do web (`ItemMedia`, `ItemContent`, `ItemTitle`, " +
      "`ItemDescription`, `ItemActions`) vira quatro props, pela mesma regra do `PageHeader`: " +
      "os lugares são sempre os mesmos, e prop nenhuma deixa trocar a ordem das colunas sem " +
      "querer. Com `onPress` a linha inteira vira alvo, com 44px de altura mínima, mas quando " +
      "há `actions`, o alvo passa a ser só a área de texto, senão o `Pressable` acessível por " +
      "cima engoliria o botão da direita como parada do leitor de tela. Dentro de um `DataList` " +
      "com `onRowPress`, não passe `onPress`: um `Pressable` dentro do outro segura o toque no " +
      "de dentro, e a linha responderia aqui e nunca lá.",
  },
  Meter: {
    state: "traduz",
    note: "sem `format`: resolver nome de formatador custaria o `Intl` no bundle do celular, e o texto vai pronto em `valueLabel`; a barra anda até o valor novo",
    page:
      "Portado. A diferença é o texto do valor: no web ele sai de `format`, e no nativo vai " +
      "pronto em `valueLabel`: trazer a tabela de formatadores custaria o `Intl` num bundle " +
      "de celular. O papel de acessibilidade também muda, e por uma razão: o React Native " +
      "não tem equivalente de `meter`, então a peça se anuncia como texto com valor, e nunca " +
      "como `progressbar`, que é justamente o erro que ela existe para evitar.",
  },
  PasswordInput: {
    state: "traduz",
    note: "o botão troca de nome com o estado (`labels.show`/`labels.hide`), e sair do campo esconde de novo",
  },
  RelativeTime: {
    state: "traduz",
    note: "o relógio porta, com passo por unidade e refeitura ao voltar do fundo; sem `Intl`, o texto é sempre numérico",
    page:
      "Traduz com relógio e tudo: receber o texto pronto teria sido mais barato de escrever e " +
      "teria devolvido o problema para a tela, que é de onde ele veio. O passo acompanha a " +
      "unidade, como no web: trinta segundos enquanto conta minuto, uma hora quando já conta " +
      "dia, e nunca um segundo. A hora anda de cinco em cinco minutos, e não de um em um: a " +
      'diferença entre "há 1 hora" e "há 2 horas" não vale um timer por minuto vezes as ' +
      "linhas montadas. Duas coisas são só daqui. O texto se refaz ao voltar do fundo, porque " +
      'enquanto o app dorme o timer do JS não corre e a tela reabriria dizendo "há 2 minutos" ' +
      "três horas depois. E o texto é sempre numérico: o `Intl.RelativeTimeFormat` não existe " +
      'no Hermes, o plural vai escrito à mão, e onde o web diz "ontem" o nativo diz "há 1 ' +
      'dia". O `cutoff` e o `now` são os mesmos, e a data que ele mostra sai no formato do ' +
      "`formatDate`. O que não atravessa é o instante exato: no web ele mora no `title` do " +
      "`<time>`, e no toque não há `title` nem onde pousar o ponteiro. Quando a data exata " +
      "importa, ela precisa estar escrita na tela.",
  },
  Steps: {
    state: "traduz",
    note: "só o modo estreito do web (texto e barra), e por isso sem `onStepClick`; o `useWizard()` atravessa inteiro; a barra anda e o passo novo entra por fade",
    page:
      'Traduz, e o que porta é **o modo estreito que o web já desenhava**: a linha "Passo 2 ' +
      'de 4", o título do passo e a barra de progresso. A régua de bolinhas não atravessa ' +
      "porque ela já tinha sido medida e reprovada abaixo de 640px: cinco passos numa faixa " +
      'de 390px dão 60px de rótulo por passo, e "Conferir os itens" vira "Confe…" cinco ' +
      "vezes seguidas. A descrição, que o modo estreito do web esconde por falta de largura, " +
      "aparece: aqui o passo atual é o único na tela.\n\n" +
      "Por isso não há `onStepClick`: ele só existia na régua larga, e sem bolinha não há o " +
      "que tocar. Voltar é o botão do `WizardFooter`, e pular passo continua sendo o `goTo`.\n\n" +
      "O `useWizard()` atravessa **inteiro e idêntico**: é `useState` e três contas de " +
      "índice, sem DOM e sem media query. Deixar o passo para o router nativo seria trocar um " +
      "estado de tela por cinco rotas, e um assistente não é navegação: os passos partilham " +
      "um formulário só, o back do aparelho não pode perder o que já foi digitado, e " +
      '"Conferir" não é um endereço que alguém deva abrir direto. Quem quiser uma rota por ' +
      "passo continua podendo, porque o `goTo` aceita o índice que o router mandar. O " +
      "`WizardFooter` empilha sempre, na ordem escrita (voltar em cima, avançar embaixo, " +
      "onde o polegar está), e o `w-full` de cada botão, que no web chega por seletor de " +
      "filho, aqui é o `alignItems: stretch` padrão do React Native.",
  },
  TagsInput: {
    state: "traduz",
    note: "Enter e separador digitado fecham a ficha; o Backspace com o campo vazio não porta; a ficha nova entra crescendo e a que sai some por fade",
    page:
      "Traduz, com um gesto a menos. O Enter fecha a ficha e o separador digitado também, mas " +
      "ele é lido no texto, e não na tecla, porque o `onKeyPress` do Android não chega para o " +
      "teclado do sistema. É esse mesmo evento que faltava para o Backspace com o campo vazio " +
      "tirar a última ficha, e por isso ele não porta: no celular a ficha se tira pelo xis, que " +
      "já precisava existir para o dedo. O resto é igual: a peça é controlada, a repetida não " +
      "entra duas vezes e sair do campo fecha o que estava meio escrito.",
  },
  TimeField: {
    state: "traduz",
    note: "digita com mascara e teclado numerico; as setas viram dois botoes de passo, no molde do `NumberField`",
    page:
      "Traduz, e continua sendo o campo de DIGITAR: quem marca ponto escreve `0800` mais " +
      "rápido do que abre painel, e o teclado numérico do sistema é o idioma disso.\n\n" +
      '**As regras de valor atravessam inteiras.** `"HH:MM"` em 24h, vazio é `""`, e só hora ' +
      "completa avisa quem escuta. `25:99` não é consertado em silêncio para `23:59`: marca " +
      "inválido na mesma tecla e volta ao último válido ao sair. Consertar calado é pior, " +
      'porque ninguém confere valor que o campo "aceitou". O `step` governa os passos e as ' +
      "opções, nunca a validação, então `14:07` com `step={30}` continua sendo hora legítima.\n\n" +
      "**Os dois lados ganharam o botão de passo, e o nativo chegou primeiro.** Seta não existe " +
      "no toque, e `step` precisava continuar significando alguma coisa; em vez de inventar " +
      "gesto, a peça vestiu o molde que a casa já tem para passo no dedo, `[−][campo][+]` do " +
      "`NumberField`. O web tinha o mesmo buraco num telefone, e o adotou depois: lá os botões " +
      "só aparecem abaixo de 640px, porque na mesa a seta já é a porta e não ocupa pixel. Aqui " +
      "eles estão sempre, porque mesa não existe. Os dois chamam o mesmo cálculo, então pousam " +
      "na mesma grade a partir da meia-noite; a diferença é o alvo, 48pt aqui contra 44 lá.\n\n" +
      "Caem `defaultValue` (aqui tudo é controlado), `name` (formulário escondido não existe no " +
      "React Native) e `size` (o `Input` nativo não tem vocabulário de tamanho).",
  },
  TimePicker: {
    state: "traduz",
    note: "gatilho mais folha de baixo com duas colunas; NAO embute o TimeField, ao contrario do web",
    page:
      "Traduz como gatilho mais **folha de baixo**, que é a decisão da casa para painel no " +
      "celular. Duas colunas roláveis pela mesma razão do web, que pesa mais aqui: `step={5}` " +
      "numa lista única são 288 linhas para rolar com o polegar. Cada opção tem 48pt, acima dos " +
      "44pt exigidos, e a coluna rola até a hora escolhida a cada abertura.\n\n" +
      "**A diferença de estrutura, e ela não é estética:** no web o relógio mora DENTRO do " +
      "campo; aqui não. Um `TextInput` dentro de um `Pressable` engole o toque do pai, e o " +
      "gatilho precisa ser um alvo único para o leitor de tela. Todo picker nativo da casa " +
      "(`DatePicker`, `DateRangePicker`, `Select`, `Combobox`, `TreeSelect`) já é gatilho mais " +
      "folha, e a divisão sai mais limpa do que no web: `TimeField` é digitação, `TimePicker` é " +
      "toque.\n\n" +
      "A hora não fecha a folha e preserva o minuto; o minuto fecha. O `labels` perde `open` e " +
      "`title`, porque aqui o `label` obrigatório já nomeia o gatilho E titula a folha, o " +
      "mesmo arranjo do `DateRangePicker`.",
  },
  Timeline: {
    state: "traduz",
    note:
      "os eventos vêm por `items`, com `tone` e `pending` em cada um; `at` é texto pronto, e cada " +
      "evento é uma parada só do leitor de tela, com a posição escrita no rótulo",
    page:
      "Traduz, com a lista por `items`: cada evento leva `title`, `at`, `by`, `description`, " +
      "`tone` e `pending`, e a composição do `TimelineItem` não atravessa (a mesma regra do " +
      "`RadioGroup` e do `Select`). **O carimbo é texto, e não um `RelativeTime`**: cada evento é " +
      "uma parada só do leitor de tela e o rótulo dela é montado a partir desse texto, então um " +
      "relógio vivo lá dentro continuaria andando na tela enquanto o rótulo ficaria preso na hora " +
      "em que montou. E trilha de auditoria não pode dizer duas horas diferentes. Para o " +
      "carimbo, `formatDate`. **A ordem, que o `<ol>` do web entrega de graça, vai escrita**: não " +
      'existe papel de item de lista no React Native, então cada evento anuncia "3 de 5: Nota ' +
      'autorizada, 12/03 às 14:22, por Ana Duarte", uma frase com o que mudou, quando e por ' +
      "quem, em vez de três paradas de VoiceOver que não dizem o assunto. E nada é tocável: uma " +
      "trilha se lê, e o marcador de 9px nunca seria alvo de dedo. Quem quer abrir o detalhe de " +
      "um evento põe um `Item` com `onPress`.",
  },
  Tracker: {
    state: "traduz",
    note: "a faixa inteira é um alvo só: o dedo arrasta e o período lido aparece na linha de baixo; `label` de cada ponto é `string`",
    page:
      "Traduz, e os dois lados chegaram ao mesmo desenho: **a faixa inteira é um alvo só**. " +
      "O nativo chegou primeiro por necessidade, e o web o seguiu. Lá cada ponto montava um " +
      "`Tooltip`, e tooltip é portal: 365 dias eram 365 portais montados para que no máximo um " +
      "aparecesse. Aqui nem essa saída existia, porque dica se abre ao pousar o ponteiro, e " +
      "trocar cada quadrado por um `Pressable` também não resolveria: 90 períodos em 358px dão " +
      "4px por quadrado, seis vezes menos que o alvo de toque mínimo.\n\n" +
      "**O que não atravessa é o balão.** No web a leitura sai num `Tooltip` único que segue " +
      "ponteiro e teclado; aqui ela mora numa linha fixa embaixo da faixa. O dedo pousa e " +
      "arrasta, uma marca fina acompanha, e o período lido aparece nessa linha, que existe desde " +
      "o primeiro quadro, " +
      "mostrando o período mais recente: o espaço fica reservado, a tela não pula no primeiro " +
      'toque, e o mais recente é o que a pergunta "piorou ontem?" quer ler primeiro.\n\n' +
      "A leitura de tela também muda de forma. A lista escondida com os 365 textos, que no " +
      "web é barata, aqui seriam 365 paradas de VoiceOver dentro de um cartão; a faixa é uma " +
      "parada só, do tipo ajustável (o mesmo contrato do `Slider`), e cada passo anuncia o " +
      "texto de um período. Nenhum dado fica inalcançável e nenhum vira obstáculo. Por isso o " +
      "`label` de cada ponto é `string`, e não `ReactNode`: ele vai inteiro para o valor " +
      "acessível da faixa, e de um `ReactNode` não há como ler o texto de volta.",
  },
  VirtualList: {
    state: "nao",
    note: "a plataforma ja virtualiza: `FlatList` e `FlashList` fazem isto de fabrica",
    page:
      "Não porta, e não é fila: **a plataforma já resolve**. A `FlatList` do React Native " +
      "virtualiza de fábrica, e o `DataList` daqui já a usa por baixo. Uma peça nossa por cima " +
      "seria embrulho de embrulho, e cobraria manutenção para reimplementar o que o sistema " +
      "entrega, com pior desempenho, porque a `FlatList` roda parte do trabalho fora da ponte " +
      "de JavaScript.\n\n" +
      "O que o web tinha de próprio, e que a `FlatList` não dá sozinha, são os quatro finais e a " +
      "contagem honesta para o leitor de tela. Os dois já estão no `DataList`: use ele para " +
      "lista longa que veio de consulta, e a `FlatList` crua para lista longa que você já tem " +
      "na mão.",
  },
  Popconfirm: {
    state: "vira",
    native: "AlertDialog",
    note: "vira `AlertDialog`; no celular a confirmacao e modal e NAO cancela ao tocar fora",
    page:
      "Vira `AlertDialog`. Painel ancorado não é idioma de toque: uma pergunta de 20rem presa " +
      "a um botão de lixeira encostado na borda direita a 390px sai da tela ou tapa a linha que " +
      "se vai apagar. O próprio web já reconhece isso: abaixo de 640px o `Popconfirm` deixa de " +
      "ser painel e vira folha de baixo, que é exatamente o que o nativo tem.\n\n" +
      "**Uma diferença de contrato, e ela é deliberada:** no web dispensar CANCELA (`Esc`, " +
      "clique fora e o botão, os três chamam `onCancel`), porque ali o gesto distraído leva ao " +
      "resultado seguro. O `AlertDialog` nativo não fecha ao tocar fora, como o do web também " +
      "não. Então a saída no celular é o botão de cancelar, escrito e visível: sem Escape não " +
      "há saída invisível, e é a mesma regra que o `Editable` segue.\n\n" +
      "A ação em curso porta: quem devolve promessa em `onAction` ganha o mesmo botão em espera " +
      "e a mesma trava contra o segundo toque.",
  },
  Tree: {
    state: "traduz",
    note:
      "um nível por vez, empilhado: tocar num galho empurra o nível de dentro e o cabeçalho " +
      "mostra o caminho e volta; sem recuo, sem busca",
    page:
      "Traduz, e a regra sobrevive inteira: **quem vale é a folha**. Marcar um galho marca todas " +
      "as folhas debaixo dele, e o que sai em `onValueChange` é sempre uma lista de folhas.\n\n" +
      "**O desenho é que não porta.** No web os níveis abertos aparecem ao mesmo tempo, um recuo " +
      "por nível; a 390px o terceiro nível começa depois do meio da tela e o nome do nó cabe em " +
      "quatro letras. A peça fica ilegível justamente onde ela é mais útil. Aqui é **um nível " +
      "por vez**: tocar num galho empurra o nível de dentro, e o cabeçalho mostra o caminho " +
      '("Financeiro › Contas a pagar", cortado pela frente, porque o pedaço que importa é o ' +
      "último) e volta um nível.\n\n" +
      "Duas consequências do empilhamento. **O galho tem dois alvos**: tocar no nome entra, e a " +
      'caixa ao lado marca o galho inteiro: com um alvo só não havia como marcar "Financeiro" ' +
      "sem visitar as sete folhas de dentro. E **não há estado misto na caixa**, porque o " +
      '`Checkbox` nativo não tem: o galho meio marcado aparece com a caixa vazia e um "2 de 7 ' +
      'escolhidos" embaixo do nome (texto, que se lê e se ouve, no lugar de um tracinho que só ' +
      "se vê).\n\n" +
      "Fora, por decisão: `filter` (buscar dentro de árvore achata os níveis, e lista achatada " +
      "com busca já é o `Combobox`), `expanded`/`onExpandedChange` (não há aberto e fechado, há " +
      "o nível onde o dedo está) e o `label` do nó, que aqui é `string`. Ele é montado dentro do " +
      "rótulo falado e do caminho, e de um `ReactNode` não há como ler o texto de volta.",
  },
  TreeSelect: {
    state: "traduz",
    note:
      "o `Tree` dentro de uma folha, com a contagem do rascunho e o `Aplicar` no rodapé; sair " +
      "pela lateral desiste",
    page:
      "Traduz: é o `Tree` nativo dentro da folha de baixo, com a mesma navegação por níveis. E " +
      "por isso ele resolve o que os dois `Select` encadeados, que esta página mandava usar, " +
      "nunca resolveram: a profundidade não é fixa, e o segundo `Select` só sabia existir depois " +
      "que alguém escolhia no primeiro.\n\n" +
      "**O rodapé é a metade que o web não precisa ter.** No desktop o painel fica ao lado do " +
      "gatilho, e o gatilho conta quantos foram; sob uma folha não há gatilho à vista, então a " +
      "contagem vive no rodapé, junto do `Aplicar`, e ela conta o **rascunho**, que é o único " +
      'número que responde "quantos eu já marquei?" enquanto a pessoa ainda está marcando. O ' +
      "texto sai do mesmo resumo do `Select` e do `Combobox`, de propósito.\n\n" +
      "**Sair pela lateral desiste**, e o `Aplicar` é a única porta que confirma, a mesma " +
      "divisão do `DateRangePicker`: o toque no fundo escurecido é o gesto de quem se " +
      "arrependeu, e ele não pode valer como aplicar. Sem `searchable`, pela razão que está na " +
      "página do `Tree`.",
  },

  Breadcrumb: {
    state: "nao",
    note: "o caminho de volta é o botão de voltar do router",
    page:
      "Não porta. O caminho até onde a pessoa está é, no celular, o botão de voltar do " +
      "router mais o título da tela. Desenhar uma trilha por cima disso duplica a " +
      "navegação e come a largura que o título precisa.",
  },
  Button: {
    state: "traduz",
    note: "contrato controlado; `hitSlop` no `sm`, porque 32px de alvo não se toca sem ajuda. Afunda de leve no toque, e não afunda quando o sistema pede para reduzir movimento",
  },

  IconButton: {
    state: "traduz",
    note: "`accessibilityLabel` obrigatório no lugar do `label`; o `sm` ganha `hitSlop` até 44pt de alvo; sem `tooltip`, porque no toque não há pousar",
    page:
      "Traduz, com o nome obrigatório do mesmo jeito: lá ele é `accessibilityLabel`, que é o " +
      "nome que o React Native já usa, e o tipo recusa o botão sem ele.\n\n" +
      "**O alvo de toque nunca fica abaixo de 44pt.** `md` é o quadrado de 44 e `lg` o de 48; " +
      "o `sm` desenha 32 e ganha `hitSlop` de 6 nos quatro lados, que devolve os 44 sem " +
      "crescer o desenho. As variantes são as do `Button` nativo (`primary`, `secondary`, " +
      "`ghost`, `destructive`), lidas das mesmas classes: `outline` e `shape` não atravessam, " +
      "pelo mesmo motivo de lá.\n\n" +
      "**Não há `tooltip`.** A dica aparece ao pousar o ponteiro, e no toque não existe pousar. " +
      "Se o ícone não se lê sozinho, o botão pede texto: use `Button`.\n\n" +
      "O ícone entra como filho, e a forma que pinta na cor da variante é a função, porque a " +
      "cor não desce da `View` para o SVG:\n\n" +
      "```tsx\n" +
      '<IconButton accessibilityLabel="Excluir nota" variant="ghost" onPress={excluir}>\n' +
      "  {({ color, size }) => <Trash2 color={color} size={size} />}\n" +
      "</IconButton>\n" +
      "```",
  },

  Banner: {
    state: "traduz",
    note: "`title` e `description` em texto; o ícone é opcional e entra por função, porque o pacote não traz ícone",
    page:
      "Traduz, com os mesmos quatro tons, o mesmo `title`, `description`, `actions` e " +
      "`onDismiss`, e o xis com o mesmo nome acessível (\"Fechar aviso\"). `title` e " +
      "`description` são `string`, porque texto no nativo mora dentro de um `Text`.\n\n" +
      "**A urgência sai por região viva.** `danger` e `warning` saem com " +
      '`accessibilityRole="alert"` e anúncio imediato; `info` e `success` saem em região viva ' +
      "educada, que espera a frase terminar. É a mesma divisão do `role` do web.\n\n" +
      "**O ícone não vem sozinho.** O pacote nativo não traz biblioteca de ícones, então o " +
      "`icon` é opcional e a forma que pinta na cor do tom é a função: " +
      "`icon={({ color, size }) => <TriangleAlert color={color} size={size} />}`. As ações " +
      "ficam embaixo do texto, que é onde cabem na largura do telefone.",
  },

  ActionBar: {
    state: "traduz",
    note: "o mesmo `count`, `onClear` e a mesma frase; gruda acima da área segura de baixo, que entra por `bottomInset`",
    page:
      "Traduz, com o mesmo `count`, o mesmo `onClear` e a mesma frase no plural certo. As " +
      "ações entram como filhas, e o texto dos botões é o do `Button` nativo.\n\n" +
      "**Ela gruda acima da área segura de baixo.** O pacote não depende do " +
      "`react-native-safe-area-context`, então a altura da barra do sistema entra por " +
      "`bottomInset`: `bottomInset={useSafeAreaInsets().bottom}`. A barra fica por cima da " +
      "lista, em `absolute`, e quem a monta deixa o respiro no fim da lista para a última " +
      "linha não ficar embaixo dela.\n\n" +
      "**A contagem é anunciada.** A frase sai pelo anúncio do leitor de tela do sistema, e " +
      "a barra entra subindo e sai descendo com os tokens de movimento, sem deslize quando o " +
      "sistema pede para reduzir movimento.",
  },

  Toggle: { state: "traduz", note: "`pressed` e `onPressedChange`" },

  ToggleGroup: {
    state: "traduz",
    note: "`items` na raiz; `multiple` para vários, o mesmo nome e o mesmo sentido do web",
  },

  ButtonGroup: {
    state: "nao",
    note: "`Tabs` e `ToggleGroup` cobrem o caso; botão encostado em botão vira um alvo só no dedo",
  },
  Command: {
    state: "nao",
    note: "paleta de comandos é gesto de mesa: um campo, uma lista e o teclado",
    page:
      "Não porta. A paleta de comandos é um gesto de mesa (abre por atalho, anda por seta, " +
      "confirma por Enter), e nenhuma das três coisas existe no toque. No celular a porta " +
      "equivalente é a tela de busca do router, com o campo no topo e o resultado levando " +
      "direto para a tela.",
  },
  ContextMenu: {
    state: "vira",
    native: "Menu",
    note: "o toque longo é o botão direito do celular: a área alvo vai como `children` do `Menu`",
    page:
      "Vira `Menu`, e não peça nova: o menu do botão direito é, no celular, o toque longo, e " +
      "quem abre a folha de ações já é o `Menu`. Passe a área alvo como `children` dele — o " +
      "que no web é o `ContextMenuTrigger` — e ela chama `onOpenChange(true)` no toque longo, " +
      "com `triggerClassName` para o layout que os filhos exigem. Quem navega por leitor de " +
      "tela entra pela mesma porta: a área expõe a ação `longpress`, que o VoiceOver e o " +
      "TalkBack oferecem no menu de ações, então o gesto nunca é o único caminho.",
  },
  CookieConsent: {
    state: "nao",
    note: "app não tem cookie; o consentimento de rastreio no celular é o aviso da plataforma, o App Tracking Transparency no iOS",
    page:
      "Não porta, por decisão. Aplicativo não tem cookie de navegador para pedir licença: o " +
      "consentimento de rastreio no celular é o aviso da própria plataforma, o App Tracking " +
      "Transparency no iOS, pedido pelo `expo-tracking-transparency`, e a declaração de dados " +
      "na loja no Android. Um painel desenhado pela biblioteca por cima disso seria um segundo " +
      "pedido para a mesma coisa.\n\n" +
      "Se o app abre páginas web num `WebView`, o aviso é o da página, que roda o " +
      "`@rivocode/ui` do web.",
  },
  Kbd: {
    state: "nao",
    note: "não há teclado para desenhar",
    page:
      "Não porta. A peça desenha uma tecla, e o celular não tem teclado físico para a tecla " +
      "representar: `⌘K` numa tela de toque promete um gesto que não existe. O que no web " +
      "é atalho, no celular é um botão visível.",
  },
  Menubar: {
    state: "nao",
    note: "idioma de mesa; navegação nativa é tab bar e drawer do router",
  },
  NavigationMenu: {
    state: "nao",
    note: "idioma de mesa; navegação nativa é tab bar e drawer do router",
  },
  Pagination: {
    state: "nao",
    note: "lista de celular rola; escolher o número da página é gesto de mesa",
  },
  Popover: {
    state: "nao",
    note: "painel ancorado que o próprio dedo cobre: use `Sheet`",
    page:
      "Não porta. O painel ancorado ao gatilho é um problem de tela estreita antes de ser " +
      "um problem de toque: ele nasce debaixo do dedo que o abriu e não tem para onde " +
      "fugir. No React Native o equivalente é o `Sheet`, que sobe de baixo e não disputa " +
      "espaço com nada.",
  },
  PreviewCard: {
    state: "nao",
    note: "aparece ao pousar o ponteiro, e não há pousar no toque",
  },
  ScrollArea: {
    state: "traduz",
    note:
      "a barra continua a do sistema; o que a peça traz no celular é o teclado: rola até o campo " +
      "em foco e prende um `footer` que sobe com ele",
    page:
      "Traduz, e muda de assunto no caminho. No web a peça existe pela **barra**: a do sistema " +
      "ocupa largura no Windows e desenha diferente em cada plataforma. No celular a barra é do " +
      "sistema e fica sendo, e o problema de rolagem que dói é outro: **o teclado cobre o campo**. " +
      "Formulário no fim da tela some debaixo dele, e o botão de enviar fica escondido até alguém " +
      "fechar o teclado para achá-lo.\n\n" +
      "Então o `ScrollArea` nativo é a tela de formulário. Por baixo é o `KeyboardAwareScrollView` " +
      "da `react-native-keyboard-controller`: ao focar um campo, a rolagem anda até ele parar " +
      "`bottomOffset` pontos acima do teclado (16 por padrão), no mesmo quadro em que o teclado " +
      "sobe, nos dois sistemas. O toque num item da lista não fecha o teclado " +
      '(`keyboardShouldPersistTaps="handled"`).\n\n' +
      "```tsx\n" +
      "<ScrollArea\n" +
      '  contentContainerClassName="gap-4 p-5"\n' +
      "  footer={<Button onPress={emitir}>Emitir nota</Button>}\n" +
      ">\n" +
      '  <Field label="Descrição">…</Field>\n' +
      "</ScrollArea>\n" +
      "```\n\n" +
      "O `footer` é a ação presa embaixo da rolagem, e ele **sobe junto com o teclado**: o botão " +
      "de enviar fica sempre à vista. A altura dele entra na conta de onde o campo em foco para, " +
      'então nenhum campo fica escondido atrás do botão. Com o "reduzir movimento" ligado, o ' +
      "rodapé pula direto para cima do teclado em vez de acompanhá-lo; a rolagem até o campo " +
      "continua, porque sem ela o campo fica coberto.\n\n" +
      "Não há `horizontal`: fila de cartões que rola de lado é `ScrollView` puro, e não tem campo " +
      "para o teclado cobrir. A `react-native-keyboard-controller` é peer do pacote, e o " +
      "`KeyboardProvider` que ela pede já vem dentro do `RivoProvider`.",
  },
  TableOfContents: {
    state: "nao",
    note: "tela de app não tem índice lateral: texto longo no celular vira seções numa lista que abre cada uma, ou `Tabs`",
    page:
      "Não porta, por decisão. O índice da página é idioma de mesa: ele mora numa coluna ao " +
      "lado do texto, e no celular não há coluna ao lado. Texto longo numa tela de app se " +
      "divide antes de chegar ao índice: cada seção vira uma tela do router aberta a partir " +
      "de uma lista, ou uma aba do `Tabs`, e o título da tela diz onde a pessoa está.\n\n" +
      "O leitor de tela também já tem o próprio índice: o rotor do VoiceOver e os controles " +
      "de leitura do TalkBack pulam de título em título em qualquer `Text` com " +
      "`accessibilityRole=\"header\"`, que é o que o `Heading` do pacote nativo escreve.",
  },
  ScrollToTop: {
    state: "nao",
    note: "a plataforma já dá: o toque na barra de status no iOS e o toque de novo na aba do router sobem a lista",
    page:
      "Não porta, por decisão: o celular já sobe a lista de fábrica. No iOS, tocar na barra " +
      "de status leva ao topo a `ScrollView` e a `FlatList` da tela (é o `scrollsToTop`, " +
      "ligado por padrão), e no Expo Router e no React Navigation tocar de novo na aba em " +
      "que a pessoa já está faz o mesmo, com o `useScrollToTop(ref)` na lista. Um botão " +
      "flutuante por cima disso seria um terceiro caminho para o mesmo gesto, cobrindo o " +
      "canto onde mora a ação principal da tela.\n\n" +
      "Não há foco a devolver: a navegação por toque não tem um Tab que continue do fim da " +
      "página.",
  },
  Affix: {
    state: "nao",
    note: "a plataforma já dá: um irmão da `ScrollView` com `position: absolute` não rola com ela, e o que gruda ao rolar é o `stickyHeaderIndices` da lista",
    page:
      "Não porta, por decisão: no React Native, grudar é o comportamento de fábrica. Não " +
      "existe janela que rola; quem rola é a `ScrollView` ou a `FlatList`, e uma `View` com " +
      "`position: absolute` escrita ao lado dela, e não dentro, fica parada na tela enquanto a " +
      "lista corre por baixo. Não há portal a abrir nem `transform` de ancestral a escapar.\n\n" +
      "Para o título que gruda enquanto a lista rola, a lista já tem `stickyHeaderIndices` e " +
      "`stickySectionHeadersEnabled`. E a ação que acompanha a tela inteira embaixo é o " +
      "`ActionBar`, que traduz e já desconta a área segura por `bottomInset`.",
  },
  AppShell: {
    state: "nao",
    note: "o esqueleto do app no celular é o router: tab bar, drawer e a barra de título da pilha",
    page:
      "Não porta, por decisão. No celular o esqueleto da aplicação não é desenhado pela " +
      "biblioteca de componentes: é o router (Expo Router, React Navigation) que monta a tab " +
      "bar, o drawer, a barra de título de cada tela e a área segura, com o gesto de voltar, " +
      "o histórico e o estado de cada aba de graça. Uma casca nossa por cima disso seria um " +
      "segundo esqueleto disputando as mesmas bordas da tela.\n\n" +
      "O que a casca do web resolve para a acessibilidade também já vem do sistema: o " +
      "VoiceOver e o TalkBack anunciam a tab bar e o título da tela, e não existe link de " +
      "pular para quem navega pelo toque. O topo de cada tela continua sendo o `PageHeader`, " +
      "que traduz.",
  },
  Sidebar: {
    state: "nao",
    note: "idioma de mesa; navegação nativa é tab bar e drawer do router",
    page:
      "Não porta. A barra lateral é o esqueleto de navegação de uma tela larga; no celular " +
      "quem faz esse papel é a tab bar e o drawer do router (Expo Router, React " +
      "Navigation), que trazem gesto de borda, histórico e estado de aba de graça. Uma " +
      "gaveta desenhada à mão por cima disso perde os três.",
  },
  ResizablePanelGroup: {
    state: "nao",
    note: "painel que se arrasta para dividir a largura é idioma de mesa; no celular cada área é uma tela do router, ou uma folha por cima",
    page:
      "Não porta, pela mesma razão do `Splitter`, que no web é montado por cima desta família. " +
      "Três colunas que se redimensionam pedem uma tela larga e um ponteiro fino: no celular " +
      "em pé não há largura para dividir, e arrastar uma linha de 1px com o dedo não é gesto " +
      "que exista. As áreas viram telas do router (Expo Router, React Navigation), e o painel " +
      "que recolhe vira `Sheet`. O layout guardado por `autoSaveId` não tem o que guardar lá.",
  },
  Splitter: {
    state: "nao",
    note: "duas áreas lado a lado não cabem em tela estreita; no celular a lista e o detalhe são duas telas do router",
  },
  Table: {
    state: "nao",
    note: "não há tabela no celular; a consulta vira `DataList`",
  },
  Toolbar: {
    state: "nao",
    note: "superfície de edição de mesa: uma parada de tabulação e navegação por seta, que o toque não tem",
  },
  Container: {
    state: "nao",
    note: "o celular já é mais estreito que o menor passo; o respiro lateral é o padding da tela, dentro da área segura",
    page:
      "Não porta, e não é fila. O `Container` limita a largura de uma página que pode ter " +
      "1920px, e o menor passo dele, `sm`, tem 36rem: mais largo que qualquer celular em pé. " +
      "No toque ele seria só um respiro lateral, e o respiro de uma tela nativa não é de uma " +
      "peça, é da tela: um `View` com `px-4` dentro da área segura, ou o " +
      "`contentContainerClassName` do `ScrollArea`. Para arrumar o que vai dentro, " +
      "`Stack` e `Grid` portam.",
  },
  Tooltip: {
    state: "nao",
    note: "hover não existe no toque; o rótulo precisa estar na tela",
    page:
      "Não porta, e não há substituto: a dica aparece ao pousar o ponteiro, e no toque não " +
      "existe pousar. O que no web era um ícone com dica vira, no celular, um ícone com " +
      "rótulo escrito ao lado, ou um `accessibilityLabel`, que resolve para o leitor de " +
      "tela e não resolve para quem enxerga.",
  },
  Heading: {
    state: "traduz",
    note: '`level` e `size` com os mesmos nomes e a mesma escala; sai como `Text` com `accessibilityRole="header"`, e o leitor de tela do celular não anuncia o nível',
    page:
      "Traduz, com os mesmos `level`, `size` e `truncate` do web, e o mesmo tamanho para cada " +
      'nível quando `size` não vem. Sai como `Text` com `accessibilityRole="header"`, na família ' +
      "`display` do provider.\n\n" +
      "**O nível não é anunciado.** O VoiceOver e o TalkBack dizem “cabeçalho” e param aí: não " +
      "há `h1` a `h6` no toque. O `level` continua obrigatório mesmo assim, por dois motivos: " +
      "ele decide o tamanho quando `size` não vem, e a tela porta do web sem reescrever a " +
      "chamada.",
  },
  Link: {
    state: "traduz",
    note: '`Text` com `accessibilityRole="link"`; o toque abre o `href` pelo `Linking`, e `onPress` é o lugar do `render` do web, para o router',
    page:
      'Traduz, como um `Text` com `accessibilityRole="link"`, e por isso vai dentro da frase ' +
      'como no web: `<Text>Veja o <Link href="…">espelho</Link>.</Text>` quebra linha junto ' +
      "com o texto em volta. `tone` tem os mesmos quatro valores, e o sublinhado é fixo.\n\n" +
      "**Quem navega é o `onPress`, e não um `render`.** Não há âncora no React Native para " +
      "trocar pela do router, então a composição do web vira callback: " +
      '`onPress={() => router.push("/notas")}`. Sem `onPress`, o toque abre o `href` pelo ' +
      "`Linking`, que é o caminho para `https:`, `mailto:` e `tel:`.\n\n" +
      "**`external` desenha a seta e avisa pela dica**, a `accessibilityHint`, que o leitor " +
      "de tela lê depois do nome; o texto é o `externalLabel`, e o padrão é “Abre fora do app.”. " +
      "Quando o filho é texto puro, o nome acessível é ele, sem a seta. Não há `underline`: " +
      "no toque não existe passar por cima, e o sublinhado é sempre o do texto corrido.",
  },
  Text: {
    state: "traduz",
    note: "o mesmo `Text` que as outras peças vestem, com `size`, `tone`, `weight`, `truncate` e `lineClamp`; sem eles, herda do `Text` de fora",
    page:
      "Traduz, e o `Text` nativo é o mesmo primitivo que as outras peças do pacote já " +
      "vestem, agora com `size`, `tone`, `weight`, `truncate` e `lineClamp`, os mesmos nomes " +
      "e os mesmos valores do web. `truncate` e `lineClamp` viram `numberOfLines`.\n\n" +
      "**Sem as props novas, ele herda, como no web.** Um `Text` dentro de outro `Text` leva " +
      "o corpo e a cor do de fora, e é isso que faz o trecho em negrito no meio da frase " +
      "funcionar. A diferença está no topo: o React Native não herda cor de `View`, então o " +
      "parágrafo de fora sem `tone` sai na cor padrão do aparelho, e não na do tema. Passe " +
      "`tone` no `Text` de fora.\n\n" +
      "Não há `render`: o elemento do celular é sempre `Text`, e o bloco é uma `View` em volta.",
  },
  Highlight: {
    state: "traduz",
    note: "sobre o `Text`, com o mesmo `query` e a mesma regra sem acento; `markClassName` no lugar do `classNames.mark`",
    page:
      "Traduz, sobre o `Text` do pacote, com o mesmo `query` e a mesma regra sem acento. Cada " +
      "trecho achado é um `Text` aninhado com o mesmo fundo cheio `warning`, a tinta `warning-fg` e o " +
      "peso semibold, e o de fora aceita todas as props do `Text` (`size`, `tone`, `weight`, " +
      "`lineClamp`).\n\n" +
      "No lugar do `classNames.mark` do web, a classe de cada trecho vai em `markClassName`. O " +
      "`matchesSearch` também sai do pacote nativo, para o filtro e o destaque usarem a mesma " +
      "regra.",
  },
  Spoiler: {
    state: "traduz",
    note: "os mesmos `maxHeight`, `expanded` e `labels`; o degradê é pintado na cor de `fadeOver`, porque não há máscara",
    page:
      "Traduz, com os mesmos `maxHeight`, `expanded`, `defaultExpanded`, `onExpandedChange` e " +
      "`labels`, e o mesmo botão que só aparece quando o conteúdo estoura. O botão diz o estado " +
      "por `accessibilityState.expanded`.\n\n" +
      "**Recolhido, o leitor de tela ouve que o texto está cortado.** O `overflow` esconde só " +
      "da vista, e o TalkBack e o VoiceOver leem o bloco inteiro. Então o conteúdo recolhido " +
      "vira um elemento só para o leitor, com a dica \"Texto cortado. Toque em Ler mais para " +
      "ver o resto.\"; aberto, a dica sai. Link dentro do bloco recolhido não recebe foco " +
      "próprio até abrir.\n\n" +
      "**O degradê é pintado, e não máscara.** O React Native não tem máscara sem dependência " +
      "nova, então os últimos 40 pontos recebem faixas na cor do fundo, com opacidade " +
      "crescente. A cor sai de `fadeOver` (`bg`, `surface` ou `surface-raised`, `bg` sem a " +
      "prop): ponha o fundo em que o bloco pousa, senão o degradê aparece como uma faixa. Não " +
      "há `classNames`: o `className` vai na raiz.",
  },
  TransferList: {
    state: "traduz",
    note: "as duas listas empilham, cada uma com os próprios botões de mover; os mesmos `items`, `value` e `labels`",
    page:
      "Traduz, com os mesmos `items`, `value`, `onValueChange`, `searchable`, `disabled` e " +
      "`labels`, e as mesmas frases de contagem e de anúncio.\n\n" +
      "**As listas empilham, e cada uma tem os próprios botões.** No telefone não há largura " +
      "para duas colunas com botões no meio: a lista de cima é a de disponíveis, a de baixo a " +
      "de escolhidos, e cada uma fecha com “Mover selecionados para …” e “Mover todos para …”. " +
      "Cada linha é uma caixa de marcar com alvo de 44 pontos, e a lista rola por dentro a " +
      "partir de 288 pontos. O anúncio sai pelo leitor de tela do sistema.",
  },
  PromptInput: {
    state: "traduz",
    note: "vive em `@rivocode/ui-native/ai`; controlado (`value` e `onValueChange` obrigatórios), e o envio é só pelo botão, porque o Enter do teclado do celular quebra a linha",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/ai`, com os mesmos `streaming`, " +
      "`onStop`, `attachments`, `actions`, `maxLength`, `showCount`, `labels` e os mesmos " +
      'nomes acessíveis ("Mensagem", "Enviar mensagem", "Parar resposta").\n\n' +
      "**O contador chega pelo campo.** A dica (`labels.hint`) e a contagem por extenso " +
      "(`labels.count`) vão no `accessibilityHint` do campo, e o número visível fica fora da " +
      "árvore de acessibilidade. Ao bater no `maxLength`, o leitor de tela anuncia " +
      "`labels.limit`, uma vez por chegada ao teto. A dica padrão fala da tecla de retorno, " +
      "que aqui quebra a linha.\n\n" +
      "**É controlado.** `value` e `onValueChange` são obrigatórios, como todo campo do " +
      "pacote, e quem limpa o campo depois do `onSubmit` é quem chamou.\n\n" +
      "**O envio é só pelo botão.** No teclado do celular, a tecla de retorno de um campo de " +
      "várias linhas quebra a linha, e é isso que a pessoa espera dela; não há Shift para " +
      "separar os dois gestos. O campo cresce até `maxRows` linhas (6, sem a prop) e rola por " +
      "dentro.",
  },
  Message: {
    state: "traduz",
    note: "vive em `@rivocode/ui-native/ai`; `onCopy` no lugar do `copyValue`, porque copiar precisa do `expo-clipboard`, que mora em outro caminho",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/ai`, com o mesmo `role`, o mesmo " +
      "alinhamento, o mesmo `author`, `avatar`, `streaming`, `onRetry`, `actions` e `error`. " +
      "Em `streaming` a mensagem anuncia `busy` e esconde as ações, como no web.\n\n" +
      "**Copiar é seu.** O web copia sozinho pelo `copyValue`; aqui a peça tem `onCopy`, " +
      "porque a área de transferência do celular é o `expo-clipboard`, peer que mora em " +
      "`@rivocode/ui-native/clipboard` e que o caminho de IA não pode cobrar de quem não " +
      "copia nada. Texto solto em `children` vira `Text` no corpo da casa; nó entra como " +
      "veio, para quem renderiza markdown.",
  },
  Conversation: {
    state: "traduz",
    note: "vive em `@rivocode/ui-native/ai`; a lista vem por `items`, `renderItem` e `keyExtractor`, sobre uma `FlatList` invertida",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/ai`, sobre uma `FlatList` invertida: " +
      "o fim da conversa é o começo da lista, então quem está lá continua lá quando o texto " +
      "cresce, sem conta nenhuma. Rolar para cima mostra o mesmo botão \"Ir para o fim\", e a " +
      "lista segura a posição de leitura enquanto a mensagem nova chega embaixo.\n\n" +
      "**A lista vem por `items`**, como todo o pacote: `renderItem` desenha uma mensagem e " +
      "`keyExtractor` dá a chave. A ordem é a do web (a mais nova por último), e a inversão " +
      "é da peça. O `empty` com `suggestions` e o `onSuggestion` atravessam com os mesmos " +
      "nomes.",
  },
  ToolCall: {
    state: "traduz",
    note: "vive em `@rivocode/ui-native/ai`; os mesmos cinco estados com marca e texto, a entrada e a saída em fonte mono, e aprovar e recusar fora do painel",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/ai`, com os mesmos `name`, `status`, " +
      "`input`, `output`, `error`, `onApprove`, `onReject`, `labels`, `defaultOpen`, `open` e " +
      "`onOpenChange`. `title` e `error` são `string`, porque texto no nativo mora dentro de " +
      "um `Text`.\n\n" +
      "**Cor continua não sendo o único sinal.** O pacote não traz ícone, então cada estado " +
      "sai com uma marca de texto (○, ✓, ✕, !) antes do nome, e `running` ganha o giro. O " +
      "gatilho diz o nome da ferramenta e o estado ao leitor de tela.",
  },
  AILabel: {
    state: "traduz",
    note: "vive em `@rivocode/ui-native/ai`; a explicação abre numa `Sheet`, e não num painel ancorado, e é `string`",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/ai`, com os mesmos `text`, `label`, " +
      "`tone`, `size`, `explanation` e `title`.\n\n" +
      "**A explicação abre numa `Sheet`.** O painel ancorado ao selo ficaria embaixo do dedo " +
      "que tocou nele, a mesma razão por que o `Popover` não porta. Por isso não há `side`, e " +
      "`explanation` é `string`: ela vira a descrição da folha.",
  },
  SortableList: {
    state: "traduz",
    note: "vive em `@rivocode/ui-native/dnd`, sem peer: o gesto é o `PanResponder` do core, e só a alça arrasta; o leitor de tela move por ações, um passo por vez",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/dnd`, com os mesmos `items`, `getKey`, " +
      "`renderItem`, `onReorder`, `getLabel`, `handle`, `orientation`, `disabled` e `labels`.\n\n" +
      "**Sem peer novo.** O gesto é o `PanResponder` do React Native, o mesmo do `Slider`, e " +
      "não o react-native-gesture-handler: arrastar pela alça, num eixo só, é um gesto que o " +
      "core resolve sozinho. A alça tem 44pt e segura o gesto até o dedo sair (ela não cede à " +
      "rolagem da tela no meio do arrasto), e o resto da linha continua rolando a lista, como " +
      "na alça de reordenar do iOS. Por isso, no celular, **só a alça arrasta**: com a linha " +
      "inteira como alça, todo toque para rolar viraria um arrasto.\n\n" +
      "**O leitor de tela não arrasta: ele move.** Cada alça traz duas ações, \"Mover para " +
      "cima\" e \"Mover para baixo\" (ou esquerda e direita, na horizontal), e cada uma anda um " +
      "passo e anuncia a posição nova com o mesmo texto do web: \"Item Nota 1043 movido para a " +
      "posição 3 de 8\". O arrasto também anuncia ao pegar, a cada posição e ao soltar.\n\n" +
      "Durante o arrasto uma cópia do item segue o dedo por cima da lista, e os vizinhos abrem " +
      "espaço com a duração `base` dos tokens, sem movimento quando o sistema pede para " +
      "reduzir. `handleProps` são o gesto e as ações, para espalhar numa `View` sua com " +
      "`handle={false}`.",
  },
  Kanban: {
    state: "nao",
    note: "o quadro é idioma de mesa: a 390px cabe uma coluna, e levar o cartão a outra é um menu \"Mover para\", e não um arrasto",
    page:
      "Não porta, e não é fila: é decisão. **O quadro existe para o olho ver as colunas lado a " +
      "lado**, e a 390px cabe uma. Arrastar um cartão para a coluna ao lado quer dizer segurar " +
      "o dedo enquanto a fileira rola por baixo dele até uma coluna que ainda não está na tela, " +
      "e o dedo que arrasta é o mesmo que precisaria rolar. No navegador do celular o " +
      "`Kanban` do web continua de pé, com a fileira rolando uma coluna por vez e o cartão " +
      "saindo do lugar só depois de o dedo segurá-lo, mas é o recurso de quem abriu uma tela de " +
      "mesa no telefone, e não o desenho de um aplicativo.\n\n" +
      "**No telefone, cada coluna é uma lista, e mudar de coluna é uma ação.** As colunas viram " +
      "`Tabs` (ou seções de uma `DataList`), a ordem dentro da coluna é a `SortableList` de " +
      "`@rivocode/ui-native/dnd`, e cada cartão ganha um `Menu` com \"Mover para\" e o nome das " +
      "outras colunas. É o mesmo `onMove({ itemId, from, to, index })` do web do lado de quem " +
      "guarda o estado, e é o caminho que o leitor de tela já faria de qualquer jeito.",
  },
  RichTextEditor: {
    state: "nao",
    note: "editar texto formatado no toque é outro motor (WebView ou biblioteca nativa, com peer de módulo nativo) e a barra é superfície de mesa; o celular escreve com `Textarea` e lê o que o web salvou com `RichTextView`",
    page:
      "Não porta, por decisão, e não é fila: a pergunta que faltaria decidir não é de gesto, " +
      "é de motor.\n\n" +
      "**O editor do web não atravessa.** Ele é o Tiptap sobre o ProseMirror, que vive do " +
      "`contenteditable` do navegador, e o React Native não tem `contenteditable`. As duas " +
      "saídas são outro produto: um `WebView` com o mesmo editor dentro, que traz o " +
      "`react-native-webview` como peer de módulo nativo, teclado e seleção que não são os " +
      "do sistema, e texto que o leitor de tela lê pelo caminho da página e não pelo do " +
      "app; ou uma biblioteca de texto rico nativa, que não lê nem escreve o mesmo " +
      "documento. Nenhuma das duas é a mesma peça com outra API.\n\n" +
      "**E a barra é superfície de mesa.** Ela é uma `Toolbar`, que também não porta: uma " +
      "parada de tabulação com seta entre os botões, sobre uma seleção feita com o ponteiro. " +
      "No toque, formatar um trecho é selecionar com o dedo que cobre o trecho, e quinze " +
      "botões não cabem acima do teclado.\n\n" +
      "**No celular, a resposta é dividir o trabalho.** O que se escreve no telefone é texto " +
      "curto, e o campo é o `Textarea`. O que foi escrito formatado no web se lê com o " +
      "`RichTextView`, que porta sem peer e lê o mesmo HTML e o mesmo JSON.",
  },
  RichTextView: {
    state: "traduz",
    note: "no índice principal, sem `WebView` e sem peer: o mesmo leitor do web monta cada bloco como `View` e cada marca como `Text`, e o link abre pelo `Linking`",
    page:
      "Traduz, no índice principal `@rivocode/ui-native`, com os mesmos `value` e `empty`. " +
      "Lê o HTML do `onValueChange` e o JSON do `onJsonChange` do `RichTextEditor` pelo " +
      "**mesmo leitor do web**, que é código puro compartilhado entre os dois pacotes: não " +
      "há `WebView`, não há peer, e nada do conteúdo executa.\n\n" +
      "Cada bloco vira `View` e cada marca vira `Text` aninhado: o título é o `Heading` (e " +
      "se anuncia como cabeçalho), a lista numerada começa do `start` salvo, a citação sai no " +
      "tom apagado com a borda à esquerda, o bloco de código em fonte mono e selecionável, e " +
      "o link é o `Link`, que abre pelo `Linking` e só com `http`, `https`, `mailto`, `tel` " +
      "ou endereço relativo.\n\n" +
      "**Não mora num subcaminho.** No web ele sai de `@rivocode/ui/editor` porque divide o " +
      "caminho com o editor; no celular não há editor, então não há peer a separar, e a peça " +
      "vive junto do `Text`.",
  },
};

/* --------------------------------------------------------------------------
 * O que existe hoje, medido
 * ----------------------------------------------------------------------- */

/** As pecas com pagina propria no site, pela mesma regra de prefixo dele. */
/**
 * A fila do nativo, declarada peca por peca - e ela SO ENCOLHE.
 *
 * A fila chegou a zero em 26/08/2026 e voltou a encher no mesmo dia, quando
 * sete pecas novas entraram no web de uma vez. Fila que cresce calada e o
 * comeco do pacote nativo virar promessa: cada peca parece atraso temporario,
 * e um ano depois sao vinte "temporarias". A regra passa a ser construir os
 * dois lados juntos, e o que nao der para construir junto tem que ser DITO
 * aqui, com o motivo, na hora.
 *
 * Entrada nova nesta lista e decisao consciente, e nao despacho: escreva por
 * que a peca nao pode nascer nos dois lados no mesmo dia. Entrada que nao
 * acusa mais e erro, e a guarda manda apagar a linha - e o que impede a lista
 * de virar o lugar onde a fila mora para sempre.
 */
const FILA_DECLARADA: Record<string, string> = {};

async function catalogPieces() {
  const pages = (await scanAtLeast("*.md", 150, { cwd: DOCS })).map((file) =>
    file.replace(/\.md$/, ""),
  );

  const parte = (nome: string) => {
    if (AUTONOMAS.has(nome) || PARTS_THAT_ARE_PIECES.has(nome)) return false;
    const nomeado = PAI[nome];
    if (nomeado) return pages.includes(nomeado);

    for (const outro of pages) {
      if (outro === nome || !nome.startsWith(outro)) continue;
      if (!/^[A-Z]/.test(nome.slice(outro.length))) continue;
      return true;
    }
    return false;
  };

  return pages.filter((nome) => !parte(nome));
}

/**
 * O que `native/src/index.ts` exporta de verdade.
 *
 * Duas pessoas portam pecas enquanto isto roda, entao a lista e sempre a de
 * agora - e por isso o `--check` existe: no minuto em que uma peca da fila
 * aparece aqui, a doc que manda usar o substituto passa a mentir.
 */
function exportadosNoNativo() {
  const names = new Set<string>();

  for (const index of NATIVE_INDEXES) {
    const fonte = readFileSync(index, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");

    for (const block of fonte.matchAll(/export \{([\s\S]*?)\} from/g)) {
      for (const cru of block[1]!.split(",")) {
        const parte = cru.trim();
        if (!parte || parte.startsWith("type ")) continue;
        names.add(
          parte
            .split(/\s+as\s+/)
            .pop()!
            .trim(),
        );
      }
    }
  }

  return names;
}

/* --------------------------------------------------------------------------
 * O texto
 * ----------------------------------------------------------------------- */

const SYMBOL: Record<State, string> = {
  traduz: "✔ traduz",
  vira: "✔ vira",
  fila: "○ na fila",
  nao: "✕ não porta",
};

const nativeName = (piece: string, row: Row) => row.native ?? piece;

function stateCell(piece: string, row: Row) {
  if (row.state === "vira") return `✔ vira \`${nativeName(piece, row)}\``;
  return SYMBOL[row.state];
}

function table(pieces: string[]) {
  const rows = [
    "| Peça | No React Native | O que saber antes de contar com ela |",
    "| --- | --- | --- |",
  ];

  for (const piece of pieces) {
    const row = PARITY[piece]!;
    rows.push(`| \`${piece}\` | ${stateCell(piece, row)} | ${row.note} |`);
  }

  return rows.join("\n");
}

/** "a, b e c" - com virgula ate o penultimo, como se escreve lista em prosa. */
function inWords(items: string[]) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

function scoreboard(pieces: string[], _native: Set<string>, measured: string) {
  const conta = (state: State) => pieces.filter((p) => PARITY[p]!.state === state).length;

  return (
    `**${pieces.length} peças no catálogo do web, medidas contra ` +
    `${inWords(NATIVE_INDEXES.map((file) => `\`${file}\``))} em ${measured}:** ` +
    `${conta("traduz")} traduzem com o mesmo nome, ${conta("vira")} traduzem com outro, ` +
    `${conta("fila")} estão na fila e ${conta("nao")} não portam por decisão. ` +
    "A coluna do meio separa as duas ausências, que é a distinção que a tabela existe " +
    "para fazer: `○` muda com o tempo, `✕` não muda. E `✔` não quer dizer copiar e " +
    "colar: a seção acima explica por quê."
  );
}

/** O paragrafo que entra na pagina da peca, quando nao ha um escrito a mao. */
function pageParagraph(piece: string, row: Row) {
  if (row.page) return row.page;

  const native = nativeName(piece, row);

  if (row.state === "traduz") {
    return (
      `Traduz: o \`@rivocode/ui-native\` exporta \`${native}\` - ${row.note}. ` +
      "A API não é a mesma do web (no nativo tudo é controlado), e a " +
      "[tabela de paridade](/react-native) diz o que muda peça a peça."
    );
  }

  if (row.state === "vira") {
    return (
      `No React Native esta peça é \`${native}\` - ${row.note}. ` +
      "A [tabela de paridade](/react-native) tem o resto do catálogo."
    );
  }

  if (row.state === "fila") {
    return (
      `Ainda não portado - ${row.note}. ` +
      "É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa " +
      "as duas."
    );
  }

  return (
    `Não porta, por decisão - ${row.note}. ` +
    "Não é fila: não vai existir. A [tabela de paridade](/react-native) diz o porquê de " +
    "cada uma."
  );
}

const SECTION_TITLE = "## No React Native";

/**
 * Troca a secao se ela ja existe, acrescenta no fim se nao existe.
 *
 * A troca vai por funcao, e nao por string: a nota do `InputGroup` escrevia
 * `R$` e o `$` seguinte era lido como referencia de captura pelo `replace` -
 * o arquivo inteiro apareceu no meio da tabela, sem erro nenhum.
 */
function withNativeSection(markdown: string, paragraph: string) {
  const section = `${SECTION_TITLE}\n\n${paragraph}\n`;
  const existing = /\n## No React Native\n[\s\S]*?(?=\n## |$)/;

  if (existing.test(markdown)) return markdown.replace(existing, () => `\n${section}`);
  return `${markdown.replace(/\s*$/, "")}\n\n${section}`;
}

/**
 * Troca o corpo de uma secao de um guia, do titulo ate o proximo `## `.
 *
 * O guia continua sendo escrito a mao; o que este arquivo possui e o miolo
 * desta secao, e so ele.
 */
function withReplacedSection(markdown: string, title: string, body: string) {
  const target = new RegExp(`(^|\\n)${title}\\n[\\s\\S]*?(?=\\n## |$)`);
  if (!target.test(markdown)) {
    throw new Error(
      `Nao achei a secao "${title}". Ela e o lugar onde a tabela e publicada:\n` +
        "escreva o titulo no arquivo, ou corrija o titulo aqui.",
    );
  }
  return markdown.replace(target, (_, before: string) => `${before}${title}\n\n${body}\n`);
}

const GUIDES = [
  { file: "apps/docs/src/content/react-native.md", title: "## A paridade, peça por peça" },
  {
    file: ".claude/skills/rivocode-ui/reference/native.md",
    title: "## A paridade, peça por peça",
  },
];

/* --------------------------------------------------------------------------
 * Rodar
 * ----------------------------------------------------------------------- */

const checking = process.argv.includes("--check");
const pieces = await catalogPieces();
const native = exportadosNoNativo();
const problems: string[] = [];

for (const [piece, row] of Object.entries(PARITY)) {
  if (!row.note.includes("\n")) continue;

  problems.push(
    `a nota de \`${piece}\` tem quebra de linha, e nota e CELULA de tabela.\n` +
      "    Markdown fecha a tabela na primeira quebra: da linha seguinte em diante tudo\n" +
      "    vira prosa corrida com os pipes a mostra, e o resto da pagina se desmancha.\n" +
      "    Aconteceu em 27/08 e foi ver na tela publicada. A prosa longa vai no `page`,\n" +
      "    que e paragrafo; a `note` cabe em uma linha ou nao cabe.",
  );
}

for (const piece of pieces) {
  if (!PARITY[piece]) {
    problems.push(
      `\`${piece}\` tem pagina no catalogo e nao tem linha na tabela de paridade.\n` +
        "    Peca sem linha se le como esquecimento do leitor: escreva o estado dela em\n" +
        "    scripts/paridade-nativo.ts.",
    );
  }
}

for (const piece of Object.keys(PARITY)) {
  if (!pieces.includes(piece)) {
    problems.push(
      `\`${piece}\` tem linha na tabela de paridade e nao tem pagina no catalogo.\n` +
        "    A tabela esta prometendo peca que nao existe.",
    );
    continue;
  }

  const row = PARITY[piece]!;
  const nome = nativeName(piece, row);
  const existe = native.has(nome);

  if ((row.state === "traduz" || row.state === "vira") && !existe) {
    problems.push(
      `\`${piece}\` esta como "${stateCell(piece, row)}" e \`${nome}\` nao sai de\n` +
        `    ${NATIVE_INDEXES.join(" nem ")}. A tabela promete um import que quebra.`,
    );
  }

  if ((row.state === "fila" || row.state === "nao") && existe) {
    problems.push(
      `\`${piece}\` esta como "${stateCell(piece, row)}" e \`${nome}\` JA sai de\n` +
        `    ${NATIVE_INDEXES.join(" ou ")}. A peca portou: promova a linha, senao a doc segue\n` +
        "    mandando usar o substituto.",
    );
  }
}

for (const piece of pieces) {
  if (PARITY[piece]?.state !== "fila") continue;
  if (piece in FILA_DECLARADA) continue;

  problems.push(
    `\`${piece}\` entrou na fila do nativo sem estar declarada em FILA_DECLARADA.\n` +
      "    Peca web nova nasce nos dois lados no mesmo dia. Se esta nao pode, escreva\n" +
      "    o motivo em FILA_DECLARADA - a fila so cresce por decisao escrita.",
  );
}

for (const piece of Object.keys(FILA_DECLARADA)) {
  if (PARITY[piece]?.state === "fila") continue;

  problems.push(
    `\`${piece}\` esta em FILA_DECLARADA e nao esta mais na fila.\n` +
      "    A lista so encolhe: apague a linha.",
  );
}

if (problems.length > 0) {
  console.error(`${problems.length} divergencia(s) entre a tabela de paridade e o codigo:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  process.exit(1);
}

const TODAY = new Date().toISOString().slice(0, 10);
const MEASURED = /(?<= em )\d{4}-\d{2}-\d{2}(?=:\*\*)/;
const sectionBody = (measured: string) =>
  `${scoreboard(pieces, native, measured)}\n\n${table(pieces)}`;
const outdated: string[] = [];

for (const guide of GUIDES) {
  const before = readFileSync(guide.file, "utf8");
  const kept = MEASURED.exec(before)?.[0];
  if (kept && before === withReplacedSection(before, guide.title, sectionBody(kept))) continue;
  const after = withReplacedSection(before, guide.title, sectionBody(TODAY));
  if (before === after) continue;
  if (!checking) writeFileSync(guide.file, after);
  outdated.push(guide.file);
}

for (const piece of pieces) {
  const path = `${DOCS}/${piece}.md`;
  const before = readFileSync(path, "utf8");
  const after = withNativeSection(before, pageParagraph(piece, PARITY[piece]!));
  if (before === after) continue;
  if (!checking) writeFileSync(path, after);
  outdated.push(path);
}

if (checking) {
  if (outdated.length > 0) {
    console.error(`${outdated.length} arquivo(s) fora da tabela de paridade:\n`);
    for (const file of outdated) console.error(`  ${file}`);
    console.error("\nRode `bun run scripts/paridade-nativo.ts` e comite o resultado.");
    process.exit(1);
  }
  console.log(`${pieces.length} pecas conferidas: a tabela e as paginas dizem a mesma coisa.`);
} else {
  console.log(
    `${pieces.length} pecas na tabela; ${outdated.length} arquivo(s) reescrito(s).\n` +
      `Indice nativo medido agora: ${native.size} exportacoes.`,
  );
}
