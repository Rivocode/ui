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
 * 3. Linha `traduz`/`vira` cujo nome nativo NAO esta em `native/src/index.ts`
 *    - a tabela promete import que quebra.
 * 4. Linha `fila`/`nao` cujo nome JA esta no indice nativo - a peca portou e
 *    a doc continua mandando o leitor usar o substituto.
 *
 * A verdade e o codigo: `.design-sync/docs` e `native/src/index.ts`. O que
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
const NATIVE_INDEX = "native/src/index.ts";

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
  // ---------------------------------------------------------------- traduzem
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

  // ------------------------------------------------ traduzem com outro nome
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
      "carregando e o vazio valendo só after que a resposta chegou. Dos quatro opt-in " +
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

  // ------------------------------------------------------------------ na fila
  ChartContainer: {
    state: "fila",
    note: "a Recharts é DOM e não atravessa; a `Sparkline` nativa é o único desenho de dado que existe hoje",
  },
  ChartDonut: { state: "fila", note: "depende de um gráfico nativo que ainda não existe" },
  ChartRadial: { state: "fila", note: "depende de um gráfico nativo que ainda não existe" },
  Clipboard: { state: "fila", note: "precisa do `expo-clipboard`, e dependência é escolha do app" },
  Code: {
    state: "fila",
    note: "código em tela estreita quer rolagem horizontal própria, e isso ainda não foi resolvido",
  },
  ColorPicker: {
    state: "fila",
    note: "a grade de amostras atravessa, e o campo hexadecimal também; falta escrever a peça",
    page:
      "Ainda não portado, e o que falta é trabalho e não decisão: a grade de amostras é uma " +
      "lista de `Pressable` com `accessibilityRole=\"radio\"`, e o campo hexadecimal é um " +
      "`Input` com `autoCapitalize=\"none\"`. Até lá, um `Sheet` com a paleta do cliente em " +
      "botões resolve o caso comum — escolher entre os tons que a marca já tem.",
  },
  DateRangePicker: {
    state: "fila",
    note: "dois `DatePicker` até lá — e a validação de fim-antes-do-começo passa a ser sua",
  },
  Editable: {
    state: "fila",
    note: "o texto que vira campo depende de foco e de Escape; no toque ele quer outro gesto, ainda não desenhado",
  },
  FileUpload: {
    state: "fila",
    note: "precisa do `expo-document-picker`; entra quando houver app dono da dependência",
  },
  Form: {
    state: "fila",
    note: "o `react-hook-form` roda no nativo; o que falta é o `FormField` que liga o campo ao controle",
    page:
      "Ainda não portado — e falta menos do que parece. O `react-hook-form` roda no React " +
      "Native sem adaptação, e o `useZodForm` é o mesmo Zod. O que não atravessou foi o " +
      "`FormField` daqui, que liga o `Field` ao controle e põe rótulo, descrição e erro no " +
      "lugar certo. Até lá, `Controller` na mão em volta do `Field` nativo, passando o " +
      "`error` do `formState.errors` — o `Field` nativo já sabe que o erro vence a " +
      "descrição.",
  },
  Indicator: {
    state: "fila",
    note: "a contagem por cima do ícone ainda é `View` posicionada na mão",
  },
  InputGroup: {
    state: "fila",
    note: "sem moldura: prefixo e sufixo ainda são composição sua em volta do `Input`",
  },
  Item: {
    state: "fila",
    note: "a linha de lista é o `renderItem` do `DataList`, escrito à mão",
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
    state: "fila",
    note: "o `Input` aceita `secureTextEntry`; o olho que revela e o nome do botão pela ação ainda são seus",
  },
  RelativeTime: {
    state: "fila",
    note: "o texto é seu, e não há relógio que se atualize sozinho",
  },
  Steps: { state: "fila", note: "a régua de passos e o `useWizard()` não atravessaram" },
  TagsInput: { state: "fila", note: "a ficha que se escreve ainda não tem peça nativa" },
  Timeline: { state: "fila", note: "o que aconteceu, em ordem, ainda é composição sua" },
  Tracker: { state: "fila", note: "a faixa de quadradinhos por período ainda não porta" },
  Tree: {
    state: "fila",
    note: "hierarquia em tela estreita quer navegação por níveis, e a peça que faz isso ainda não existe",
  },
  TreeSelect: {
    state: "fila",
    note: "escolher dentro de árvore vira folha com níveis; até lá, dois `Select` encadeados",
  },

  // --------------------------------------------------------------- não portam
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
  const fonte = readFileSync(NATIVE_INDEX, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");

  const names = new Set<string>();
  for (const block of fonte.matchAll(/export \{([\s\S]*?)\} from/g)) {
    for (const cru of block[1]!.split(",")) {
      const parte = cru.trim();
      if (!parte || parte.startsWith("type ")) continue;
      names.add(parte.split(/\s+as\s+/).pop()!.trim());
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

function scoreboard(pieces: string[], _native: Set<string>) {
  const conta = (state: State) => pieces.filter((p) => PARITY[p]!.state === state).length;

  return (
    `**${pieces.length} peças no catálogo do web, medidas contra ` +
    `\`native/src/index.ts\` em ${new Date().toISOString().slice(0, 10)}:** ` +
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
      `\`${piece}\` esta como "${stateCell(piece, row)}" e \`${name}\` nao sai de\n` +
        `    ${NATIVE_INDEX}. A tabela promete um import que quebra.`,
    );
  }

  if ((row.state === "fila" || row.state === "nao") && existe) {
    problems.push(
      `\`${piece}\` esta como "${stateCell(piece, row)}" e \`${name}\` JA sai de\n` +
        `    ${NATIVE_INDEX}. A peca portou: promova a linha, senao a doc segue\n` +
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
