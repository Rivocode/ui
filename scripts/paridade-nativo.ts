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
import { Glob } from "bun";

const DOCS = ".design-sync/docs";
/**
 * Os indices do pacote nativo - os CINCO, e os quatro de baixo nao sao detalhe.
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
 * Medindo so o indice da raiz, o `--check` diria que o Form nao portou no dia
 * seguinte ao porte.
 */
const NATIVE_INDEXES = [
  "native/src/index.ts",
  "native/src/form/index.ts",
  "native/src/chart/index.ts",
  "native/src/clipboard/index.ts",
  "native/src/file-upload/index.ts",
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
  "ToggleGroup",
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
};

const PARITY: Record<string, Row> = {
  Accordion: {
    state: "traduz",
    note: "cada `AccordionItem` guarda o próprio aberto; não há raiz controlada",
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
  Avatar: {
    state: "traduz",
    note: "só `fallback`, as iniciais: imagem remota ainda não entra",
  },
  Badge: { state: "traduz", note: "os mesmos tons; o texto é filho" },
  Button: {
    state: "traduz",
    note: "contrato controlado; `hitSlop` no `sm`, porque 32px de alvo não se toca sem ajuda",
  },
  Calendar: {
    state: "traduz",
    note: "mês desenhado à mão; valor ISO `aaaa-mm-dd`, exibição `dd/mm/aaaa`",
  },
  Card: {
    state: "traduz",
    note: "com `CardHeader`, `CardTitle`, `CardDescription` e `CardContent` — sem `CardFooter`",
  },
  ChartContainer: {
    state: "traduz",
    note:
      "vive em `@rivocode/ui-native/chart`; os quatro finais atravessam com os mesmos nomes, e o " +
      "desenho entra por função — não há Recharts, nem contentor que meça, nem `var(--color-série)`",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/chart` — o mesmo arranjo do formulário, e " +
      "pela mesma razão: o `react-native-svg` é peer **opcional**, e no celular ele não é só " +
      "bytes, é módulo nativo que o app precisa ligar e reconstruir.\n\n" +
      "**O que atravessa inteiro são os quatro finais.** `isLoading`, `isError`, `onRetry`, " +
      "`errorTitle`, `errorMessage`, `empty` e `data` têm os mesmos nomes e o mesmo sentido, e a espera desenha " +
      "as mesmas seis barras desiguais. Três diferenças de tipo, todas porque texto no nativo mora " +
      "dentro de um `Text`: `errorMessage`, `empty.title` e `empty.description` são `string`, e " +
      "`empty.icon` não existe, porque o `EmptyState` nativo ainda não tem esse slot. O botão de " +
      "tentar de novo fica **fora** do aviso: o `Alert` nativo tem título e corpo, e o corpo é uma " +
      "linha de texto.\n\n" +
      "**O que muda é o desenho.** No web a moldura embrulha um gráfico da Recharts, que mede o pai " +
      "sozinho e lê a cor de cada série em `var(--color-série)`. Aqui não há Recharts, não há " +
      "contentor que meça e não há variável viva — então a moldura mede com `onLayout`, resolve as " +
      "cores do `config` e **entrega as duas coisas** a quem desenha, como o `Form` nativo entrega " +
      "o `submit`:\n\n" +
      "```tsx\n" +
      "<ChartContainer config={SERIES} data={meses} className=\"h-56\">\n" +
      "  {({ width, height, colors }) => (\n" +
      "    <Svg width={width} height={height}>…</Svg>\n" +
      "  )}\n" +
      "</ChartContainer>\n" +
      "```\n\n" +
      "A medida chega **zerada no primeiro quadro** e verdadeira no seguinte: no telefone não " +
      "existe largura antes do layout. O `children` também aceita JSX comum, e é assim que " +
      "`ChartDonut` e `ChartRadial` ganham os quatro finais sem precisar de nada da moldura.\n\n" +
      "Duas regras a mais, as duas por causa do que não existe do lado de cá. O `config.color` pede " +
      "**papel de token** (`chart-1` a `chart-8`), e não cor de CSS: a cor que a peça recebe é o " +
      "valor final que vai para o desenho, e um hexadecimal escrito ali seria a única coisa da tela " +
      "surda ao tema do cliente. E o `label` só vale na forma de função — com filho em JSX quem " +
      "nomeia é a peça de dentro, e um `accessible` por cima dela fecharia a legenda da rosca numa " +
      "parada só do leitor de tela.",
  },
  ChartDonut: {
    state: "traduz",
    note:
      "a legenda é o controle: sem dica para abrir no toque, tocar a linha acende a fatia e leva " +
      "nome e valor ao meio; `format` só aceita função, e as pontas saem retas",
    page:
      "Traduz, em `@rivocode/ui-native/chart`, com as mesmas props — `valueKey`, `nameKey`, " +
      "`config`, `thickness`, `legend`, `centerValue`, `centerLabel`. Duas mudanças de tipo: o " +
      "miolo é `string` e não `ReactNode`, e o `format` só aceita função, que é a decisão que o " +
      "`Meter` nativo já tinha tomado — resolver nome de formatador arrasta o `Intl` inteiro para o " +
      "bundle do celular.\n\n" +
      "**O que muda de verdade é como se lê uma fatia.** No web o ponteiro pousa no anel, a dica " +
      "diz nome e valor, e o total sai de cena para os dois números não se empilharem. No toque não " +
      "existe pousar, e o gesto equivalente mora na **legenda**, não na fatia: tocar a linha acende " +
      "a fatia dela e manda nome e valor para o meio, no lugar exato onde o web põe a dica; tocar " +
      "de novo devolve o total.\n\n" +
      "A fatia não é o alvo, e a razão é aritmética: um anel de 190px tem cerca de 600px de " +
      "contorno para dividir entre até seis fatias, e a de 2% fica com doze — a mesma conta que " +
      "tirou a dica por quadrado do `Tracker`. A linha da legenda tem 44px e a largura da tela.\n\n" +
      "**E a leitura de tela não usa o truque do `Tracker`.** Lá os 90 períodos viraram uma parada " +
      "`adjustable` só, porque 90 paradas dentro de um cartão são um obstáculo. Aqui são no máximo " +
      "seis fatias — acima disso a rosca para de informar e barra deitada lê melhor —, e seis " +
      "paradas com nome e valor são melhores que uma ajustável, porque cada uma é também o botão " +
      "que acende a fatia. Contagem diferente, saída diferente. Com `legend={false}` o desenho vira " +
      "imagem cujo nome carrega as fatias **e os valores**: sem legenda e sem dica, o dado ficaria " +
      "inalcançável.\n\n" +
      "Uma diferença de desenho, e ela é medida: as pontas das fatias saem **retas**. O " +
      "`cornerRadius` do web vem da Recharts, que recorta o canto de uma fatia preenchida; aqui a " +
      "fatia é um arco traçado, e a ponta redonda que o SVG oferece estende o traço em quase doze " +
      "graus para cada lado na espessura padrão — uma fatia de 5% apareceria como 11%.",
  },
  ChartRadial: {
    state: "traduz",
    note:
      "atravessa quase inteiro, porque nunca teve dica; `color` é papel de token e o nome sai do " +
      "que está escrito no meio, não só da porcentagem",
    page:
      "Traduz quase inteiro, em `@rivocode/ui-native/chart`, e é a peça de gráfico que menos muda: " +
      "**ela nunca teve dica**. O valor mora no meio do arco, em texto, desde o web — o que o dedo " +
      "faria aqui, o olho já fez. `value`, `max`, `sweep`, `variant` e `segments` atravessam " +
      "iguais, o arco em tracinhos incluído.\n\n" +
      "Duas mudanças de tipo, as mesmas da rosca: `centerValue` e `centerLabel` são `string`, e " +
      "`color` é papel de token (`chart-3`, `success`) e não cor de CSS.\n\n" +
      "O papel de acessibilidade é `image`, como o `role=\"img\"` do web, e os dois vizinhos " +
      "explicam por quê: o `Meter` nativo já tinha recusado `progressbar`, que faz o leitor de tela " +
      "anunciar indicador de progresso para uma medida que sobe e desce, e `adjustable`, que " +
      "prometeria que o gesto muda o valor. O nome carrega o número, então ouvir a peça é ouvir a " +
      "medida. Sem `label`, ele é montado do que está escrito no meio — o valor **e** a linha de " +
      "baixo, e não só a porcentagem como no web: \"82 por cento\" sozinho não diz por cento de quê.",
  },
  Checkbox: {
    state: "traduz",
    note: "`checked` e `onCheckedChange` **obrigatórios**; sem `defaultChecked` e sem `indeterminate`",
    page:
      "Traduz, com um porém que morde na primeira linha: no nativo o `Checkbox` é " +
      "**sempre controlado**. `checked` e `onCheckedChange` são obrigatórios, não há " +
      "`defaultChecked` e não há `indeterminate` — a caixa de selecionar-todas do web não " +
      "tem terceiro estado lá. Copiar `<Checkbox defaultChecked>ISS retido</Checkbox>` do " +
      "web não compila.",
  },
  CheckboxGroup: {
    state: "traduz",
    note: "`items` na raiz e `value: string[]`, em vez de um `Checkbox` por filho",
  },
  Collapsible: {
    state: "traduz",
    note: "`label` no lugar de `CollapsibleTrigger` e `CollapsiblePanel`",
  },
  Combobox: {
    state: "traduz",
    note: "a lista abre numa folha com busca sem acento; `items` na raiz, não `ComboboxItem` por filho",
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
    note: "`open`, `onOpenChange` e `title` como props; sem `DialogTrigger`",
  },
  EmptyState: { state: "traduz", note: "`description` obrigatória, pelo mesmo motivo do web" },
  Field: {
    state: "traduz",
    note: "`label`, `description` e `error` como props; o erro vence a descrição, como no web",
  },
  Fieldset: { state: "traduz", note: "`legend` como prop" },
  Input: {
    state: "traduz",
    note: "a borda acende no foco — não há `focus-visible` em tela de toque",
  },
  MaskedInput: {
    state: "traduz",
    note: "o valor é só dígitos; a máscara é do campo, o dado não a carrega",
  },
  Menu: {
    state: "traduz",
    note: "folha de baixo com `actions`, nunca popup ancorado",
  },
  NumberField: {
    state: "traduz",
    note: "vira stepper — menos, valor, mais —, que é o idioma do toque",
  },
  OTPField: {
    state: "traduz",
    note: "caixas visíveis, um campo escondido: teclado, autofill de SMS e leitor veem um só",
  },
  PageHeader: { state: "traduz", note: "`title`, `description`, `badge` e `actions` como props" },
  Progress: { state: "traduz", note: "`value` de 0 a 100 e `label`; sem `format`" },
  RadioGroup: {
    state: "traduz",
    note: "`items` na raiz; não existe `Radio` solto para compor",
  },
  RivoProvider: {
    state: "traduz",
    note: "mesmo contrato de `theme`; `density` existe por paridade, e `comfortable` é a única altura — alvo de toque não encolhe",
  },
  SearchInput: { state: "traduz", note: "`value` e `onValueChange` obrigatórios" },
  Select: {
    state: "traduz",
    note: "poucas opções fixas; `items` e `label` na raiz, e a lista abre numa folha de baixo",
    page:
      "Traduz, e a forma de escrever é outra. No web o `Select` pede `items` na raiz **e** " +
      "as quatro partes (`SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`); no " +
      "nativo ele é uma tag só — `<Select items={…} value={…} onValueChange={…} " +
      'label="Período" />` —, e a lista abre numa folha de baixo, que é o idioma da ' +
      "plataforma para escolher. O `label` é obrigatório: é por ele que o leitor de tela " +
      "anuncia o gatilho, papel que no web era do `SelectTrigger`.",
  },
  Separator: { state: "traduz", note: "só a linha horizontal" },
  Sheet: {
    state: "traduz",
    note: "só o comportamento de baixo, que já era o modo estreito do web",
  },
  Skeleton: { state: "traduz", note: "mesma marca de lugar, mesmo token" },
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
      "atravessa: `variant=\"line\"` e `variant=\"bar\"` significam a mesma coisa nos dois " +
      "mundos, e **`area` não porta** — área quer polígono preenchido, que `View` não faz. " +
      "Duas outras diferenças, ambas deliberadas: o traço desenha 2px em vez de 1,5 (a 1,5 " +
      "ele desaparece na tela do telefone sob luz) e a largura vem do pai, com a altura em " +
      "`height`. **Sem `label` ela é escondida do leitor de tela de propósito**: uma linha " +
      'sem descrição não diz nada a quem não a vê, e anunciar "imagem" seria pior do que ' +
      "calar.",
  },
  Spinner: { state: "traduz", note: "`small` e `large`, os dois tamanhos do `ActivityIndicator`" },
  Stat: {
    state: "traduz",
    note: "`value` já formatado, `delta` numérico, e o slot `chart` que a `Sparkline` nativa preenche",
  },
  Switch: {
    state: "traduz",
    note: "`checked` e `onCheckedChange` obrigatórios; o trilho é o do sistema, pintado por token",
  },
  Tabs: {
    state: "traduz",
    note: "só a caixinha segmentada, por `items`; seção de página é trabalho do router nativo",
    page:
      "Traduz pela metade, de propósito. O `Tabs` nativo é **só** a caixinha " +
      '(`variant="segmented"` no web): `items`, `value`, `onValueChange`, sem `TabList`, ' +
      "`Tab` nem `TabPanel`. Aba que troca a seção da página não é peça no celular — é tab " +
      "bar do router —, e insistir numa aba desenhada por cima disso dá duas navegações " +
      "concorrentes na mesma tela.",
  },
  Textarea: { state: "traduz", note: "`rows` é a altura inicial; o campo cresce com o conteúdo" },
  Toggle: { state: "traduz", note: "`pressed` e `onPressedChange`" },
  ToggleGroup: {
    state: "traduz",
    note: "`items` na raiz; `multiple` para vários, o mesmo nome e o mesmo sentido do web",
  },

  Autocomplete: {
    state: "vira",
    native: "Combobox",
    note: "e **não** aceita valor fora da lista: a folha escolhe, não digita",
    page:
      "No React Native quem cobre este caso é o `Combobox` — com uma perda que precisa " +
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
      "estados — carregando, erro, vazio, dados — na mesma ordem, com o erro vencendo o " +
      "carregando e o vazio valendo só depois que a resposta chegou. Os textos desses finais se " +
      "configuram com os nomes do web: `errorTitle`, `errorMessage` e `noResultsMessage`. Só o " +
      "padrão de `errorTitle` difere — aqui não há, porque o aviso da lista nasceu de uma linha " +
      "só, e essa linha é a `errorMessage`. Dos quatro opt-in " +
      "daqui, dois portam com o mesmo nome de prop (`filter` e `selectable`) e **dois não " +
      "portam por desenho**: ordenação e `pageSize`. Cabeçalho clicável não existe sem " +
      "cabeçalho, e no celular ordenar é um `Menu` de \"ordenar por\" que a tela monta em " +
      "cima da lista. No lugar das colunas, `renderItem` — e por isso o `filter` quer um " +
      "`filterValue`, já que ninguém consegue ler texto de dentro do JSX que você devolve.",
  },
  ToastViewport: {
    state: "vira",
    native: "useToast",
    note: "não se monta nada: o `RivoProvider` já traz a fiação, e o hook é o mesmo",
  },

  Clipboard: {
    state: "traduz",
    note:
      "vive em `@rivocode/ui-native/clipboard`; a confirmação é dupla — o botão troca de nome e um " +
      "aviso fala, porque rótulo trocado debaixo do dedo não é reanunciado",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/clipboard` — o mesmo arranjo do `form` e do " +
      "`chart`, e pela mesma razão: o `expo-clipboard` é peer **opcional**, e no celular ele não é " +
      "só bytes, é módulo nativo que o app liga e reconstrói (`npx expo install expo-clipboard`). " +
      "Ele tem caminho **separado** do `FileUpload` de propósito: quem põe um botão de copiar ao " +
      "lado da chave de acesso de uma NF-e não anexa arquivo nenhum, e um índice comum aos dois " +
      "cobraria os dois.\n\n" +
      "**A confirmação passa a ser dupla, e no web bastava uma.** A regra não muda — copiar é a " +
      "ação sem resultado visível, e sem confirmação a pessoa toca de novo por dúvida. O que muda " +
      "é por onde ela chega. O botão continua trocando o ícone e o nome acessível, como lá; e a " +
      "peça dispara **também** um aviso, porque aqui trocar o `accessibilityLabel` de um " +
      "`Pressable` que já está sob o foco **não é reanunciado** nem pelo VoiceOver nem pelo " +
      "TalkBack: quem não vê o ícone virar visto não ficaria sabendo de nada. O aviso que o " +
      "`RivoProvider` já monta mora num `accessibilityLiveRegion=\"polite\"`, e é o único canal " +
      "desta tela que fala sozinho. `toast={false}` desliga, para a tela que copia várias coisas " +
      "seguidas e não quer uma pilha de avisos.\n\n" +
      "**Quando não copiou, nada é confirmado**, como no web: o `setStringAsync` do Expo devolve " +
      "`false` quando a área de transferência recusa — o caso do passe web, fora de contexto " +
      "seguro —, e no iOS e no Android ele sempre resolve `true`.\n\n" +
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
      "e quem precisa dela é o `CodeBlock` — retorno de API, linha de log —, que é outra peça e " +
      "ainda não portou. O argumento é o inverso do daqui: lá quebrar um JSON no meio muda o que " +
      "está escrito, e aqui quebrar um caminho longo no meio é o certo, porque a alternativa é " +
      "esticar a tela inteira. O corpo da letra não é escrito: o `Text` aninhado herda o do texto " +
      "de fora, que é o que o `0.9em` do web dizia. E `selectable` vem ligado, porque o toque " +
      "longo é o gesto nativo para copiar — no Android quem seleciona é o `Text` de fora, e ali " +
      "é ele que precisa carregar a prop.",
  },
  ColorPicker: {
    state: "traduz",
    note:
      "sai na raiz; controlada, e sem seta — cada amostra é um alvo de 44px com o desenho de 32 " +
      "por dentro, e são seis por linha, não dez",
    page:
      "Traduz, e sai pelo índice da raiz: não há peer nenhum atrás dela. As duas entradas do web " +
      "atravessam inteiras — as **amostras**, para escolher olhando, e o **campo hexadecimal**, " +
      "para quem já tem o valor no manual da marca. O `normalizeColor` é o mesmo dos dois lados, " +
      "linha por linha: `#0f8`, `BFDD3A` e `  #D4F34A  ` saem todos como seis dígitos minúsculos " +
      "com cerquilha.\n\n" +
      "**Três coisas mudam, e as três saem do dedo.** É controlada, sem `defaultValue`, como toda " +
      "peça daqui. **Não há navegação por seta** — nem `Home`, nem `End`, nem uma única parada de " +
      "tabulação —, e por isso `columns` deixa de ser o passo das setas e passa a ser só o " +
      "desenho: o padrão cai de dez para **seis por linha**, porque dez alvos de 44px com vão de " +
      "8 dariam 512px numa tela de 390. E cada amostra é um alvo de **44px com o desenho colorido " +
      "de 32 por dentro** — a grade de cores bonita e pequena demais para o polegar é o defeito " +
      "clássico desta peça. A marca do escolhido continua sendo **por fora**, pela mesma razão do " +
      "web: símbolo desenhado sobre a amostra fica ilegível em metade das cores possíveis, e não " +
      "há token que garanta contraste contra um valor que a pessoa inventou.\n\n" +
      "**O campo pede o teclado alfanumérico comum** (`keyboardType=\"default\"`), e não o " +
      "numérico: hexadecimal tem `a` a `f` e uma cerquilha, e nenhum teclado de números traz as " +
      "duas coisas. O que ele desliga é o que o sistema faria por conta — `autoCapitalize=\"none\"` " +
      "para `bfdd3a` não virar `Bfdd3a`, e `autoCorrect={false}` para o corretor não trocar seis " +
      "letras sem sentido pela palavra mais parecida.\n\n" +
      "Quem não vê a cor a ouve por dois caminhos: o `accessibilityState.checked` de cada amostra, " +
      "e o texto do próprio campo, que tem nome próprio (`Código hexadecimal da cor`). O retrato " +
      "ao lado dele sai do leitor de tela — ele repete em cor o que o campo diz em texto, e cor " +
      "não se ouve. Com `hideInput`, o estado da amostra fica sendo o único canal.\n\n" +
      "O `classNames` por parte não porta: como todas as peças daqui, ela veste só pela raiz.",
  },
  DateRangePicker: {
    state: "traduz",
    note: "um mês numa folha, com as duas pontas na mesma grade; a peça ordena os toques, e o intervalo invertido deixou de existir",
    page:
      "Traduz, com um desenho só: **um mês, numa folha de baixo, com a faixa pintada na " +
      "própria grade**. Os dois meses lado a lado do web não cabem — 390px partidos ao meio " +
      "dão 27px de célula, e o alvo de toque mínimo é 44 —, e dois `DatePicker` em sequência, " +
      "que era o que esta tabela mandava fazer até agora, perdem justamente o que faz a peça " +
      "existir: as duas pontas na mesma grade, com os dias do meio pintados. **A validação de " +
      "fim-antes-do-começo deixou de ser sua**: tocar 20 e depois 5 devolve 5 a 20, porque a " +
      "peça ordena as duas pontas em vez de descartar o primeiro toque, e o `Aplicar` fica " +
      "desligado enquanto falta a segunda. Por isso o tipo mudou: o `DateRange` daqui tem " +
      "`from` e `to` **obrigatórios**, os dois como ISO `aaaa-mm-dd`, e o vazio é `null`. O " +
      "intervalo pela metade, que no web sai no `onValueChange` entre os dois cliques para o " +
      "resumo do filtro acompanhar, não sai daqui: sob uma folha não há tela atrás para " +
      "acompanhar nada — quem quiser acompanhar lê o resumo que a própria folha escreve " +
      "acima do mês. Sem `confirm`: a folha sempre confirma, porque o toque fora dela é o " +
      "gesto de desistir e não pode valer como aplicar.",
  },
  Editable: {
    state: "traduz",
    note:
      "quem abre é o toque **longo**, o retorno do teclado confirma e há um `Cancelar` visível — " +
      "sair do campo não salva, ao contrário do web",
    page:
      "Traduz, com os dois gestos trocados — e os dois eram a peça inteira no web, então vale ler " +
      "antes de portar a tela.\n\n" +
      "**Quem abre é o toque longo**, e não o toque. É o gesto que o sistema já usa para agir " +
      "sobre um texto, e a escolha é defensiva: num painel de leitura o dedo encosta em tudo " +
      "enquanto rola, e com o toque curto abrindo o campo o teclado subia sozinho a cada " +
      "esbarrão. Para quem usa leitor de tela o gesto não existe, então a peça declara também " +
      "uma ação de acessibilidade `longpress` chamada \"Editar\", que aparece no rotor.\n\n" +
      "**Sair do campo não salva.** No web, clicar fora confirma; aqui não há clicar fora — há o " +
      "teclado que se esconde, e o próprio `Cancelar` tira o foco do campo antes de rodar, então " +
      "um `blur` que salvasse salvaria o rascunho no caminho de cancelá-lo. Nada sai daqui sem " +
      "confirmação explícita (o botão de retorno do teclado) e nada se perde sem o `Cancelar`, " +
      "que é visível ao lado do campo porque sem Escape não existe saída invisível.\n\n" +
      "O resto é o contrato de sempre: `value` e `onValueChange` **obrigatórios**, sem " +
      "`defaultValue`, e `label` obrigatório — fechada, a peça anuncia `label` e valor juntos, " +
      "porque \"Nome do cliente\" sozinho manda a pessoa abrir a edição só para descobrir o que " +
      "há lá dentro.",
  },
  FileUpload: {
    state: "traduz",
    note:
      "vive em `@rivocode/ui-native/file-upload`; a área de soltar vira um botão, porque no " +
      "celular não há soltar — o `accept` fala MIME e o tamanho sai formatado sem `Intl`",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/file-upload` — o `expo-document-picker` é " +
      "peer **opcional** e módulo nativo (`npx expo install expo-document-picker`), e tem caminho " +
      "separado do `Clipboard` pela mesma conta: a regra da casa é **um subcaminho por peer**, e " +
      "não um por assunto. O que não muda é o principal: **a peça continua não conhecendo rede**. " +
      "Ela valida `accept` e `maxSize` na entrada, entrega os aceitos em `onSelect` e os recusados " +
      "em `onReject`, cada recusa com o motivo pronto para um aviso.\n\n" +
      "**A área de soltar vira um botão, e isso é a peça inteira mudando de forma.** No celular " +
      "não há arrastar: nada pode ser solto em lugar nenhum, e o retângulo tracejado de 96px do " +
      "web é, letra por letra, o idioma de \"solte aqui\" — desenhá-lo numa tela de toque promete " +
      "um gesto que o aparelho não tem. Tirado o soltar, o que sobra daquela caixa é um botão com " +
      "muito espaço vazio em volta: **o espaço era o alvo de soltar, e não a affordance**. Então " +
      "sobra o botão, numa altura de controle — e a altura que ele devolve é da **lista**, que é " +
      "onde o arquivo aparece, sobe, falha e é removido. O `hint` continua existindo, e entra no " +
      "nome falado do botão pelo mesmo motivo que no web ele mora dentro do `<button>`: quem ouve " +
      "a tela precisa saber \"XML ou PDF, até 5 MB\" antes de abrir o seletor, e não depois de ser " +
      "recusado.\n\n" +
      "**O `accept` fala MIME.** O seletor do Expo filtra por tipo (`text/xml`, `image/*`), e não " +
      "por extensão: um `.xml` mandado para lá não casaria nada e abriria o diálogo vazio. Então " +
      "a extensão com ponto continua valendo — na validação de volta, contra o nome do arquivo —, " +
      "mas não vai para o sistema. E o que volta não é um `File`: é um `PickedFile` " +
      "(`uri`, `name`, `size?`, `mimeType?`), com o `uri` local que o app usa para subir. **O " +
      "`size` pode faltar**, porque nem todo provedor de arquivo do Android o informa, e por isso " +
      "`maxSize` só recusa o que conseguiu medir. Fechar o seletor devolve `canceled` e nenhum " +
      "callback dispara, como fechar a janela do seletor do web.\n\n" +
      "`FileUploadList` e `FileUploadItem` atravessam com o mesmo contrato — `progress` de 0 a " +
      "100 vira barra anunciada, `error` vence o progresso e oferece \"Tentar de novo\" —, com duas " +
      "diferenças de plataforma: o corte do nome é `numberOfLines`, que lá é prop e não classe, e " +
      "o tamanho sai formatado **sem `Intl`** (\"47,1 KB\", com a vírgula escrita à mão), pela " +
      "mesma razão que o `Meter` nativo não tem `format`.",
  },
  Form: {
    state: "traduz",
    note: "vive em `@rivocode/ui-native/form`; o `Form` entrega o `submit` em vez de esperar um `type=\"submit\"`, e há um adaptador a mais, o `forText`",
    page:
      "Traduz, no caminho próprio `@rivocode/ui-native/form` — o mesmo arranjo do web, e pela " +
      "mesma razão: o `react-hook-form` é peer opcional. O `useZodForm` é idêntico, linha por " +
      "linha, porque não há navegador nele.\n\n" +
      "**O que muda é quem dispara o envio.** No React Native não existe `<form>`, não existe " +
      "`type=\"submit\"` e não existe Enter que envie: nada é implícito. Então o `Form` " +
      "entrega o envio a quem desenha o botão — `children` pode ser uma função que recebe " +
      "`{ submit, isSubmitting }` —, e continua aceitando JSX comum para quando o botão mora " +
      "fora, numa barra fixa no rodapé da tela.\n\n" +
      "**E muda a ponte com o controle.** No web o `Field` da Base UI liga rótulo, ajuda e " +
      "erro a qualquer controle que esteja dentro, pelo contexto; aqui não há contexto nenhum " +
      "— o `Field` nativo desenha um `Text` em cima e outro embaixo, e o controle do meio não " +
      "fica sabendo de nada. Por isso o campo que o `FormField` entrega leva duas coisas a " +
      "mais, `accessibilityLabel` e `invalid`, e os adaptadores as põem no controle: sem " +
      "isso, um `TextInput` sob um rótulo fica **sem nome nenhum** para o leitor de tela. O " +
      "`label` do `FormField` é obrigatório aqui pela mesma razão.\n\n" +
      "Os adaptadores são quatro. `forValue`, `forChecked` e `forDate` têm o nome e o " +
      "trabalho do web — o `forDate` agora converte o vazio para `null` e fala ISO, que é o " +
      "que o `DatePicker` e o `DateRangePicker` nativos pedem. O quarto é só daqui: " +
      "`forText`, para `Input` e `Textarea`, porque o `TextInput` chama `onChangeText` com a " +
      "string crua e não com um evento — espalhar o campo nele guardaria no formulário um " +
      "objeto de evento que não existe. Ele leva o `ref` junto, e aí o `form.setFocus()` " +
      "funciona de verdade: `TextInput` tem `focus()`.",
  },
  Indicator: {
    state: "traduz",
    note: "`label` é obrigatório: a pastilha é uma parada só do leitor de tela, e o que ela diz é a frase, nunca o número",
    page:
      "Traduz, e o que muda é quem carrega o nome acessível. No web o número é escondido do " +
      "leitor e um texto só para ele entra ao lado; no nativo a pastilha inteira é UM elemento " +
      "de acessibilidade, e o `label` — aqui obrigatório — é o que ele anuncia. O leitor lê o " +
      "filho (\"Notificações, botão\") e a pastilha em seguida (\"3 notificações\"), e nunca um " +
      "\"3\" solto entre os dois. Embrulhar filho e pastilha num elemento só resolveria a " +
      "leitura e quebraria o toque, porque o botão de dentro deixaria de ser alcançável. O " +
      "anel que separa a pastilha do que está embaixo vira borda da cor do fundo: `ring` não " +
      "existe no React Native, e borda ali ocupa por dentro da caixa.",
  },
  InputGroup: {
    state: "traduz",
    note: "`prefix`, `suffix` e `actions` são props e a moldura desenha o próprio campo; sem `size`",
    page:
      "Traduz, e a forma muda junto: no web a moldura é composição — `InputGroup` por fora, " +
      "`Input`, `InputPrefix` e `InputAction` por dentro — e ela desarma a borda do campo com " +
      "um seletor de descendente. Esse seletor não existe no React Native, e quem escrevesse a " +
      "mesma árvore lá ganharia duas bordas encaixadas sem jeito de apagar a de dentro. Por " +
      "isso a moldura nativa desenha o campo: `value`, `onValueChange`, `prefix`, `suffix` e " +
      "`actions` são props dela. Não há `size` — altura de controle é única no nativo, porque " +
      "alvo de toque não encolhe.",
  },
  Item: {
    state: "traduz",
    note: "`title`, `description`, `media` e `actions` como props; o corte com reticências é `numberOfLines`, que lá é prop e não classe",
    page:
      "Traduz, e não concorre com o `DataList`: ele resolve os quatro finais de uma consulta e " +
      "devolve cada linha ao `renderItem` sem opinião sobre o que há dentro dela — o `Item` é " +
      "esse dentro, e serve igualmente à lista de duas escolhas numa folha, que consulta " +
      "nenhuma tem. A composição do web (`ItemMedia`, `ItemContent`, `ItemTitle`, " +
      "`ItemDescription`, `ItemActions`) vira quatro props, pela mesma regra do `PageHeader`: " +
      "os lugares são sempre os mesmos, e prop nenhuma deixa trocar a ordem das colunas sem " +
      "querer. Com `onPress` a linha inteira vira alvo, com 44px de altura mínima — mas quando " +
      "há `actions`, o alvo passa a ser só a área de texto, senão o `Pressable` acessível por " +
      "cima engoliria o botão da direita como parada do leitor de tela. Dentro de um `DataList` " +
      "com `onRowPress`, não passe `onPress`: um `Pressable` dentro do outro segura o toque no " +
      "de dentro, e a linha responderia aqui e nunca lá.",
  },
  Meter: {
    state: "traduz",
    note: "sem `format`: resolver nome de formatador custaria o `Intl` no bundle do celular, e o texto vai pronto em `valueLabel`",
    page:
      "Portado. A diferença é o texto do valor: no web ele sai de `format`, e no nativo vai " +
      "pronto em `valueLabel` — trazer a tabela de formatadores custaria o `Intl` num bundle " +
      "de celular. O papel de acessibilidade também muda, e por uma razão: o React Native " +
      "não tem equivalente de `meter`, então a peça se anuncia como texto com valor, e nunca " +
      "como `progressbar` — que é justamente o erro que ela existe para evitar.",
  },
  PasswordInput: {
    state: "traduz",
    note: "o botão troca de nome com o estado (`labels.show`/`labels.hide`), e sair do campo esconde de novo",
  },
  RelativeTime: {
    state: "traduz",
    note: "o relógio porta, com passo por unidade e refeitura ao voltar do fundo; sem `Intl`, o texto é sempre numérico",
    page:
      "Traduz com relógio e tudo — receber o texto pronto teria sido mais barato de escrever e " +
      "teria devolvido o problema para a tela, que é de onde ele veio. O passo acompanha a " +
      "unidade, como no web: trinta segundos enquanto conta minuto, uma hora quando já conta " +
      "dia, e nunca um segundo. A hora anda de cinco em cinco minutos, e não de um em um: a " +
      "diferença entre \"há 1 hora\" e \"há 2 horas\" não vale um timer por minuto vezes as " +
      "linhas montadas. Duas coisas são só daqui. O texto se refaz ao voltar do fundo, porque " +
      "enquanto o app dorme o timer do JS não corre e a tela reabriria dizendo \"há 2 minutos\" " +
      "três horas depois. E o texto é sempre numérico: o `Intl.RelativeTimeFormat` não existe " +
      "no Hermes, o plural vai escrito à mão, e onde o web diz \"ontem\" o nativo diz \"há 1 " +
      "dia\". O `cutoff` e o `now` são os mesmos, e a data que ele mostra sai no formato do " +
      "`formatDate`. O que não atravessa é o instante exato: no web ele mora no `title` do " +
      "`<time>`, e no toque não há `title` nem onde pousar o ponteiro — quando a data exata " +
      "importa, ela precisa estar escrita na tela.",
  },
  Steps: {
    state: "traduz",
    note: "só o modo estreito do web — texto e barra —, e por isso sem `onStepClick`; o `useWizard()` atravessa inteiro",
    page:
      "Traduz, e o que porta é **o modo estreito que o web já desenhava**: a linha \"Passo 2 " +
      "de 4\", o título do passo e a barra de progresso. A régua de bolinhas não atravessa " +
      "porque ela já tinha sido medida e reprovada abaixo de 640px — cinco passos numa faixa " +
      "de 390px dão 60px de rótulo por passo, e \"Conferir os itens\" vira \"Confe…\" cinco " +
      "vezes seguidas. A descrição, que o modo estreito do web esconde por falta de largura, " +
      "aparece: aqui o passo atual é o único na tela.\n\n" +
      "Por isso não há `onStepClick`: ele só existia na régua larga, e sem bolinha não há o " +
      "que tocar. Voltar é o botão do `WizardFooter`, e pular passo continua sendo o `goTo`.\n\n" +
      "O `useWizard()` atravessa **inteiro e idêntico** — é `useState` e três contas de " +
      "índice, sem DOM e sem media query. Deixar o passo para o router nativo seria trocar um " +
      "estado de tela por cinco rotas, e um assistente não é navegação: os passos partilham " +
      "um formulário só, o back do aparelho não pode perder o que já foi digitado, e " +
      "\"Conferir\" não é um endereço que alguém deva abrir direto. Quem quiser uma rota por " +
      "passo continua podendo, porque o `goTo` aceita o índice que o router mandar. O " +
      "`WizardFooter` empilha sempre, na ordem escrita — voltar em cima, avançar embaixo, " +
      "onde o polegar está —, e o `w-full` de cada botão, que no web chega por seletor de " +
      "filho, aqui é o `alignItems: stretch` padrão do React Native.",
  },
  TagsInput: {
    state: "traduz",
    note: "Enter e separador digitado fecham a ficha; o Backspace com o campo vazio não porta",
    page:
      "Traduz, com um gesto a menos. O Enter fecha a ficha e o separador digitado também — mas " +
      "ele é lido no texto, e não na tecla, porque o `onKeyPress` do Android não chega para o " +
      "teclado do sistema. É esse mesmo evento que faltava para o Backspace com o campo vazio " +
      "tirar a última ficha, e por isso ele não porta: no celular a ficha se tira pelo xis, que " +
      "já precisava existir para o dedo. O resto é igual — a peça é controlada, a repetida não " +
      "entra duas vezes e sair do campo fecha o que estava meio escrito.",
  },
  Timeline: {
    state: "traduz",
    note:
      "os eventos vêm por `items`, com `tone` e `pending` em cada um; `at` é texto pronto, e cada " +
      "evento é uma parada só do leitor de tela, com a posição escrita no rótulo",
    page:
      "Traduz, com a lista por `items`: cada evento leva `title`, `at`, `by`, `description`, " +
      "`tone` e `pending`, e a composição do `TimelineItem` não atravessa — a mesma regra do " +
      "`RadioGroup` e do `Select`. **O carimbo é texto, e não um `RelativeTime`**: cada evento é " +
      "uma parada só do leitor de tela e o rótulo dela é montado a partir desse texto, então um " +
      "relógio vivo lá dentro continuaria andando na tela enquanto o rótulo ficaria preso na hora " +
      "em que montou — e trilha de auditoria não pode dizer duas horas diferentes. Para o " +
      "carimbo, `formatDate`. **A ordem, que o `<ol>` do web entrega de graça, vai escrita**: não " +
      "existe papel de item de lista no React Native, então cada evento anuncia \"3 de 5: Nota " +
      "autorizada, 12/03 às 14:22, por Ana Duarte\" — uma frase com o que mudou, quando e por " +
      "quem, em vez de três paradas de VoiceOver que não dizem o assunto. E nada é tocável: uma " +
      "trilha se lê, e o marcador de 9px nunca seria alvo de dedo — quem quer abrir o detalhe de " +
      "um evento põe um `Item` com `onPress`.",
  },
  Tracker: {
    state: "traduz",
    note: "a faixa inteira é um alvo só: o dedo arrasta e o período lido aparece na linha de baixo; `label` de cada ponto é `string`",
    page:
      "Traduz, e os dois lados chegaram ao mesmo desenho: **a faixa inteira é um alvo só**. " +
      "O nativo chegou primeiro por necessidade, e o web o seguiu — lá cada ponto montava um " +
      "`Tooltip`, e tooltip é portal: 365 dias eram 365 portais montados para que no máximo um " +
      "aparecesse. Aqui nem essa saída existia, porque dica se abre ao pousar o ponteiro, e " +
      "trocar cada quadrado por um `Pressable` também não resolveria: 90 períodos em 358px dão " +
      "4px por quadrado, seis vezes menos que o alvo de toque mínimo.\n\n" +
      "**O que não atravessa é o balão.** No web a leitura sai num `Tooltip` único que segue " +
      "ponteiro e teclado; aqui ela mora numa linha fixa embaixo da faixa. O dedo pousa e " +
      "arrasta, uma marca fina acompanha, e o período lido aparece nessa linha, que existe desde " +
      "o primeiro quadro, " +
      "mostrando o período mais recente: o espaço fica reservado, a tela não pula no primeiro " +
      "toque, e o mais recente é o que a pergunta \"piorou ontem?\" quer ler primeiro.\n\n" +
      "A leitura de tela também muda de forma. A lista escondida com os 365 textos, que no " +
      "web é barata, aqui seriam 365 paradas de VoiceOver dentro de um cartão; a faixa é uma " +
      "parada só, do tipo ajustável — o mesmo contrato do `Slider` —, e cada passo anuncia o " +
      "texto de um período. Nenhum dado fica inalcançável e nenhum vira obstáculo. Por isso o " +
      "`label` de cada ponto é `string`, e não `ReactNode`: ele vai inteiro para o valor " +
      "acessível da faixa, e de um `ReactNode` não há como ler o texto de volta.",
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
      "quatro letras — a peça fica ilegível justamente onde ela é mais útil. Aqui é **um nível " +
      "por vez**: tocar num galho empurra o nível de dentro, e o cabeçalho mostra o caminho " +
      "(\"Financeiro › Contas a pagar\", cortado pela frente, porque o pedaço que importa é o " +
      "último) e volta um nível.\n\n" +
      "Duas consequências do empilhamento. **O galho tem dois alvos**: tocar no nome entra, e a " +
      "caixa ao lado marca o galho inteiro — com um alvo só não havia como marcar \"Financeiro\" " +
      "sem visitar as sete folhas de dentro. E **não há estado misto na caixa**, porque o " +
      "`Checkbox` nativo não tem: o galho meio marcado aparece com a caixa vazia e um \"2 de 7 " +
      "escolhidos\" embaixo do nome — texto, que se lê e se ouve, no lugar de um tracinho que só " +
      "se vê.\n\n" +
      "Fora, por decisão: `filter` (buscar dentro de árvore achata os níveis, e lista achatada " +
      "com busca já é o `Combobox`), `expanded`/`onExpandedChange` (não há aberto e fechado, há " +
      "o nível onde o dedo está) e o `label` do nó, que aqui é `string` — ele é montado dentro do " +
      "rótulo falado e do caminho, e de um `ReactNode` não há como ler o texto de volta.",
  },
  TreeSelect: {
    state: "traduz",
    note:
      "o `Tree` dentro de uma folha, com a contagem do rascunho e o `Aplicar` no rodapé; sair " +
      "pela lateral desiste",
    page:
      "Traduz: é o `Tree` nativo dentro da folha de baixo, com a mesma navegação por níveis — e " +
      "por isso ele resolve o que os dois `Select` encadeados, que esta página mandava usar, " +
      "nunca resolveram: a profundidade não é fixa, e o segundo `Select` só sabia existir depois " +
      "que alguém escolhia no primeiro.\n\n" +
      "**O rodapé é a metade que o web não precisa ter.** No desktop o painel fica ao lado do " +
      "gatilho, e o gatilho conta quantos foram; sob uma folha não há gatilho à vista, então a " +
      "contagem vive no rodapé, junto do `Aplicar` — e ela conta o **rascunho**, que é o único " +
      "número que responde \"quantos eu já marquei?\" enquanto a pessoa ainda está marcando. O " +
      "texto sai do mesmo resumo do `Select` e do `Combobox`, de propósito.\n\n" +
      "**Sair pela lateral desiste**, e o `Aplicar` é a única porta que confirma — a mesma " +
      "divisão do `DateRangePicker`: o toque no fundo escurecido é o gesto de quem se " +
      "arrependeu, e ele não pode valer como aplicar. Sem `searchable`, pela razão que está na " +
      "página do `Tree`.",
  },

  Breadcrumb: {
    state: "nao",
    note: "o caminho de volta é o botão de voltar do router",
    page:
      "Não porta. O caminho até onde a pessoa está é, no celular, o botão de voltar do " +
      "router mais o título da tela — desenhar uma trilha por cima disso duplica a " +
      "navegação e come a largura que o título precisa.",
  },
  ButtonGroup: {
    state: "nao",
    note: "`Tabs` e `ToggleGroup` cobrem o caso; botão encostado em botão vira um alvo só no dedo",
  },
  Command: {
    state: "nao",
    note: "paleta de comandos é gesto de mesa: um campo, uma lista e o teclado",
    page:
      "Não porta. A paleta de comandos é um gesto de mesa — abre por atalho, anda por seta, " +
      "confirma por Enter — e nenhuma das três coisas existe no toque. No celular a porta " +
      "equivalente é a tela de busca do router, com o campo no topo e o resultado levando " +
      "direto para a tela.",
  },
  ContextMenu: {
    state: "nao",
    note: "não precisa de peça nova: precisa de `longPress` no `Menu`, que ele ainda não aceita",
    page:
      "Não porta como peça, e não é por falta de caso de uso: o menu do botão direito é, no " +
      "celular, o toque longo. O que falta é um `longPress` no `Menu` nativo, que hoje só " +
      "abre por `open`/`onOpenChange` — até lá, chame `onOpenChange(true)` no `onLongPress` " +
      "do seu próprio `Pressable`. Peça nova aqui seria um segundo `Menu` com outro nome.",
  },
  Kbd: {
    state: "nao",
    note: "não há teclado para desenhar",
    page:
      "Não porta. A peça desenha uma tecla, e o celular não tem teclado físico para a tecla " +
      "representar — `⌘K` numa tela de toque promete um gesto que não existe. O que no web " +
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
    note: "painel ancorado que o próprio dedo cobre — use `Sheet`",
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
    state: "nao",
    note: "rolagem é da plataforma: `ScrollView` e `FlatList`, com a barra que o sistema desenha",
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
  Tooltip: {
    state: "nao",
    note: "hover não existe no toque; o rótulo precisa estar na tela",
    page:
      "Não porta, e não há substituto: a dica aparece ao pousar o ponteiro, e no toque não " +
      "existe pousar. O que no web era um ícone com dica vira, no celular, um ícone com " +
      "rótulo escrito ao lado — ou um `accessibilityLabel`, que resolve para o leitor de " +
      "tela e não resolve para quem enxerga.",
  },
};

/* --------------------------------------------------------------------------
 * O que existe hoje, medido
 * ----------------------------------------------------------------------- */

/** As pecas com pagina propria no site, pela mesma regra de prefixo dele. */
async function catalogPieces() {
  const pages: string[] = [];
  for await (const file of new Glob("*.md").scan(DOCS)) {
    pages.push(file.replace(/\.md$/, ""));
  }
  pages.sort();

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
        names.add(parte.split(/\s+as\s+/).pop()!.trim());
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

function scoreboard(pieces: string[], _native: Set<string>) {
  const conta = (state: State) => pieces.filter((p) => PARITY[p]!.state === state).length;

  return (
    `**${pieces.length} peças no catálogo do web, medidas contra ` +
    `${inWords(NATIVE_INDEXES.map((file) => `\`${file}\``))} em ${new Date().toISOString().slice(0, 10)}:** ` +
    `${conta("traduz")} traduzem com o mesmo nome, ${conta("vira")} traduzem com outro, ` +
    `${conta("fila")} estão na fila e ${conta("nao")} não portam por decisão. ` +
    "A coluna do meio separa as duas ausências, que é a distinção que a tabela existe " +
    "para fazer: `○` muda com o tempo, `✕` não muda. E `✔` não quer dizer copiar e " +
    "colar — a seção acima explica por quê."
  );
}

/** O paragrafo que entra na pagina da peca, quando nao ha um escrito a mao. */
function pageParagraph(piece: string, row: Row) {
  if (row.page) return row.page;

  const native = nativeName(piece, row);

  if (row.state === "traduz") {
    return (
      `Traduz: o \`@rivocode/ui-native\` exporta \`${native}\` — ${row.note}. ` +
      "A API não é a mesma do web (no nativo tudo é controlado), e a " +
      "[tabela de paridade](/react-native) diz o que muda peça a peça."
    );
  }

  if (row.state === "vira") {
    return (
      `No React Native esta peça é \`${native}\` — ${row.note}. ` +
      "A [tabela de paridade](/react-native) tem o resto do catálogo."
    );
  }

  if (row.state === "fila") {
    return (
      `Ainda não portado — ${row.note}. ` +
      "É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa " +
      "as duas."
    );
  }

  return (
    `Não porta, por decisão — ${row.note}. ` +
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

if (problems.length > 0) {
  console.error(`${problems.length} divergencia(s) entre a tabela de paridade e o codigo:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  process.exit(1);
}

const sectionBody = `${scoreboard(pieces, native)}\n\n${table(pieces)}`;
const outdated: string[] = [];

for (const guide of GUIDES) {
  const before = readFileSync(guide.file, "utf8");
  const after = withReplacedSection(before, guide.title, sectionBody);
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
