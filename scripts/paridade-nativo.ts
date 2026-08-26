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

type Estado =
  /** Existe no nativo com o mesmo nome. A API quase nunca e a mesma. */
  | "traduz"
  /** Existe com outro nome, e o outro nome e a peca inteira. */
  | "vira"
  /** Nao existe ainda, e a intencao e que exista. */
  | "fila"
  /** Nao vai existir, e a razao esta na nota. */
  | "nao";

type Linha = {
  estado: Estado;
  /** O nome nativo, quando ele difere. Obrigatorio no estado `vira`. */
  nativo?: string;
  /** A celula da tabela: fragmento curto, minusculo, sem ponto final. */
  nota: string;
  /**
   * O paragrafo da pagina da peca, quando a frase montada nao basta.
   * Escrito onde escolher errado custa caro.
   */
  pagina?: string;
};

/**
 * O `ButtonGroup` nao aparece na varredura de pecas de topo: a regra de
 * prefixo do site (`apps/docs/src/parts.ts`) o entrega a pagina do `Button`,
 * junto com `CardHeader` e `DialogFooter`. Mas ele e um controle proprio, com
 * decisao propria de nativo, e ficar de fora da tabela por um acidente de
 * grafia era exatamente o silencio que este arquivo existe para fechar.
 */
const PARTE_QUE_E_PECA = new Set(["ButtonGroup"]);

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

const PARIDADE: Record<string, Linha> = {
  // ---------------------------------------------------------------- traduzem
  Accordion: {
    estado: "traduz",
    nota: "cada `AccordionItem` guarda o próprio aberto; não há raiz controlada",
  },
  Alert: {
    estado: "traduz",
    nota: "`title` é prop e o corpo é filho; sem `AlertTitle`/`AlertDescription`",
  },
  AlertDialog: {
    estado: "traduz",
    nota: "`actionLabel` e `onAction` em vez de composição; não fecha no toque fora, como no web",
  },
  AspectRatio: { estado: "traduz", nota: "`ratio` numérico, igual" },
  Avatar: {
    estado: "traduz",
    nota: "só `fallback`, as iniciais: imagem remota ainda não entra",
  },
  Badge: { estado: "traduz", nota: "os mesmos tons; o texto é filho" },
  Button: {
    estado: "traduz",
    nota: "contrato controlado; `hitSlop` no `sm`, porque 32px de alvo não se toca sem ajuda",
  },
  Calendar: {
    estado: "traduz",
    nota: "mês desenhado à mão; valor ISO `aaaa-mm-dd`, exibição `dd/mm/aaaa`",
  },
  Card: {
    estado: "traduz",
    nota: "com `CardHeader`, `CardTitle`, `CardDescription` e `CardContent` — sem `CardFooter`",
  },
  Checkbox: {
    estado: "traduz",
    nota: "`checked` e `onCheckedChange` **obrigatórios**; sem `defaultChecked` e sem `indeterminate`",
    pagina:
      "Traduz, com um porém que morde na primeira linha: no nativo o `Checkbox` é " +
      "**sempre controlado**. `checked` e `onCheckedChange` são obrigatórios, não há " +
      "`defaultChecked` e não há `indeterminate` — a caixa de selecionar-todas do web não " +
      "tem terceiro estado lá. Copiar `<Checkbox defaultChecked>ISS retido</Checkbox>` do " +
      "web não compila.",
  },
  CheckboxGroup: {
    estado: "traduz",
    nota: "`items` na raiz e `value: string[]`, em vez de um `Checkbox` por filho",
  },
  Collapsible: {
    estado: "traduz",
    nota: "`label` no lugar de `CollapsibleTrigger` e `CollapsiblePanel`",
  },
  Combobox: {
    estado: "traduz",
    nota: "a lista abre numa folha com busca sem acento; `items` na raiz, não `ComboboxItem` por filho",
  },
  DatePicker: {
    estado: "traduz",
    nota: "abre a folha com o mês; guarda ISO e exibe `dd/mm/aaaa`",
  },
  DescriptionList: {
    estado: "traduz",
    nota: "as bordas entram por `Children`: a utility de divisória do Tailwind não existe no RN",
  },
  Dialog: {
    estado: "traduz",
    nota: "`open`, `onOpenChange` e `title` como props; sem `DialogTrigger`",
  },
  EmptyState: { estado: "traduz", nota: "`description` obrigatória, pelo mesmo motivo do web" },
  Field: {
    estado: "traduz",
    nota: "`label`, `description` e `error` como props; o erro vence a descrição, como no web",
  },
  Fieldset: { estado: "traduz", nota: "`legend` como prop" },
  Input: {
    estado: "traduz",
    nota: "a borda acende no foco — não há `focus-visible` em tela de toque",
  },
  MaskedInput: {
    estado: "traduz",
    nota: "o valor é só dígitos; a máscara é do campo, o dado não a carrega",
  },
  Menu: {
    estado: "traduz",
    nota: "folha de baixo com `actions`, nunca popup ancorado",
  },
  NumberField: {
    estado: "traduz",
    nota: "vira stepper — menos, valor, mais —, que é o idioma do toque",
  },
  OTPField: {
    estado: "traduz",
    nota: "caixas visíveis, um campo escondido: teclado, autofill de SMS e leitor veem um só",
  },
  PageHeader: { estado: "traduz", nota: "`title`, `description`, `badge` e `actions` como props" },
  Progress: { estado: "traduz", nota: "`value` de 0 a 100 e `label`; sem `format`" },
  RadioGroup: {
    estado: "traduz",
    nota: "`items` na raiz; não existe `Radio` solto para compor",
  },
  RivoProvider: {
    estado: "traduz",
    nota: "mesmo contrato de `theme`; `density` existe por paridade, e `comfortable` é a única altura — alvo de toque não encolhe",
  },
  SearchInput: { estado: "traduz", nota: "`value` e `onValueChange` obrigatórios" },
  Select: {
    estado: "traduz",
    nota: "poucas opções fixas; `items` e `label` na raiz, e a lista abre numa folha de baixo",
    pagina:
      "Traduz, e a forma de escrever é outra. No web o `Select` pede `items` na raiz **e** " +
      "as quatro partes (`SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`); no " +
      "nativo ele é uma tag só — `<Select items={…} value={…} onValueChange={…} " +
      'label="Período" />` —, e a lista abre numa folha de baixo, que é o idioma da ' +
      "plataforma para escolher. O `label` é obrigatório: é por ele que o leitor de tela " +
      "anuncia o gatilho, papel que no web era do `SelectTrigger`.",
  },
  Separator: { estado: "traduz", nota: "só a linha horizontal" },
  Sheet: {
    estado: "traduz",
    nota: "só o comportamento de baixo, que já era o modo estreito do web",
  },
  Skeleton: { estado: "traduz", nota: "mesma marca de lugar, mesmo token" },
  Slider: {
    estado: "traduz",
    nota: "anda por gesto e responde às ações do leitor de tela; um valor só, e `label` obrigatório",
  },
  Sparkline: {
    estado: "traduz",
    nota: "`line` e `bar` valem nos dois lados; `area` fica de fora (pede polígono preenchido, e o desenho nativo é `View`)",
    pagina:
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
  Spinner: { estado: "traduz", nota: "`small` e `large`, os dois tamanhos do `ActivityIndicator`" },
  Stat: {
    estado: "traduz",
    nota: "`value` já formatado, `delta` numérico, e o slot `chart` que a `Sparkline` nativa preenche",
  },
  Switch: {
    estado: "traduz",
    nota: "`checked` e `onCheckedChange` obrigatórios; o trilho é o do sistema, pintado por token",
  },
  Tabs: {
    estado: "traduz",
    nota: "só a caixinha segmentada, por `items`; seção de página é trabalho do router nativo",
    pagina:
      "Traduz pela metade, de propósito. O `Tabs` nativo é **só** a caixinha " +
      '(`variant="segmented"` no web): `items`, `value`, `onValueChange`, sem `TabList`, ' +
      "`Tab` nem `TabPanel`. Aba que troca a seção da página não é peça no celular — é tab " +
      "bar do router —, e insistir numa aba desenhada por cima disso dá duas navegações " +
      "concorrentes na mesma tela.",
  },
  Textarea: { estado: "traduz", nota: "`rows` é a altura inicial; o campo cresce com o conteúdo" },
  Toggle: { estado: "traduz", nota: "`pressed` e `onPressedChange`" },
  ToggleGroup: {
    estado: "traduz",
    nota: "`items` na raiz; `multiple` para vários, o mesmo nome e o mesmo sentido do web",
  },

  // ------------------------------------------------ traduzem com outro nome
  Autocomplete: {
    estado: "vira",
    nativo: "Combobox",
    nota: "e **não** aceita valor fora da lista: a folha escolhe, não digita",
    pagina:
      "No React Native quem cobre este caso é o `Combobox` — com uma perda que precisa " +
      "entrar na sua decisão: ele **não aceita valor fora da lista**. O que o " +
      "`Autocomplete` tem de próprio, que é deixar a pessoa escrever o que não está " +
      "cadastrado, não existe lá. Se o campo precisa aceitar o inédito, no celular ele é um " +
      "`Input` seu com sugestões, e não esta peça.",
  },
  DataTable: {
    estado: "vira",
    nativo: "DataList",
    nota: "`filter` e `selectable` portam com o mesmo nome; ordenar e `pageSize` ficam de fora por desenho",
    pagina:
      "Vira `DataList`. Tabela não existe no celular: o que atravessa é a máquina de " +
      "estados — carregando, erro, vazio, dados — na mesma ordem, com o erro vencendo o " +
      "carregando e o vazio valendo só depois que a resposta chegou. Dos quatro opt-in " +
      "daqui, dois portam com o mesmo nome de prop (`filter` e `selectable`) e **dois não " +
      "portam por desenho**: ordenação e `pageSize`. Cabeçalho clicável não existe sem " +
      "cabeçalho, e no celular ordenar é um `Menu` de \"ordenar por\" que a tela monta em " +
      "cima da lista. No lugar das colunas, `renderItem` — e por isso o `filter` quer um " +
      "`filterValue`, já que ninguém consegue ler texto de dentro do JSX que você devolve.",
  },
  ToastViewport: {
    estado: "vira",
    nativo: "useToast",
    nota: "não se monta nada: o `RivoProvider` já traz a fiação, e o hook é o mesmo",
  },

  // ------------------------------------------------------------------ na fila
  ChartContainer: {
    estado: "fila",
    nota: "a Recharts é DOM e não atravessa; a `Sparkline` nativa é o único desenho de dado que existe hoje",
  },
  ChartDonut: { estado: "fila", nota: "depende de um gráfico nativo que ainda não existe" },
  ChartRadial: { estado: "fila", nota: "depende de um gráfico nativo que ainda não existe" },
  Clipboard: { estado: "fila", nota: "precisa do `expo-clipboard`, e dependência é escolha do app" },
  Code: {
    estado: "fila",
    nota: "código em tela estreita quer rolagem horizontal própria, e isso ainda não foi resolvido",
  },
  DateRangePicker: {
    estado: "fila",
    nota: "dois `DatePicker` até lá — e a validação de fim-antes-do-começo passa a ser sua",
  },
  Editable: {
    estado: "fila",
    nota: "o texto que vira campo depende de foco e de Escape; no toque ele quer outro gesto, ainda não desenhado",
  },
  FileUpload: {
    estado: "fila",
    nota: "precisa do `expo-document-picker`; entra quando houver app dono da dependência",
  },
  Form: {
    estado: "fila",
    nota: "o `react-hook-form` roda no nativo; o que falta é o `FormField` que liga o campo ao controle",
    pagina:
      "Ainda não portado — e falta menos do que parece. O `react-hook-form` roda no React " +
      "Native sem adaptação, e o `useZodForm` é o mesmo Zod. O que não atravessou foi o " +
      "`FormField` daqui, que liga o `Field` ao controle e põe rótulo, descrição e erro no " +
      "lugar certo. Até lá, `Controller` na mão em volta do `Field` nativo, passando o " +
      "`error` do `formState.errors` — o `Field` nativo já sabe que o erro vence a " +
      "descrição.",
  },
  Indicator: {
    estado: "fila",
    nota: "a contagem por cima do ícone ainda é `View` posicionada na mão",
  },
  InputGroup: {
    estado: "fila",
    nota: "sem moldura: prefixo e sufixo ainda são composição sua em volta do `Input`",
  },
  Item: {
    estado: "fila",
    nota: "a linha de lista é o `renderItem` do `DataList`, escrito à mão",
  },
  Meter: {
    estado: "fila",
    nota: "use `Progress` até lá — sabendo que o leitor vai anunciar carregamento para uma medida que não carrega",
    pagina:
      "Ainda não portado. Até lá, `Progress` — sabendo o que se paga por isso: o `Progress` " +
      'nativo anuncia `progressbar`, e o leitor de tela lê "carregando" para uma medida que ' +
      "não carrega. Espaço em disco a 80% vira uma tarefa que nunca termina. Se a medida é " +
      "o assunto da tela, escreva o número em texto ao lado da barra: o texto é verdadeiro " +
      "nos dois mundos.",
  },
  PasswordInput: {
    estado: "fila",
    nota: "o `Input` aceita `secureTextEntry`; o olho que revela e o nome do botão pela ação ainda são seus",
  },
  RelativeTime: {
    estado: "fila",
    nota: "o texto é seu, e não há relógio que se atualize sozinho",
  },
  Steps: { estado: "fila", nota: "a régua de passos e o `useWizard()` não atravessaram" },
  TagsInput: { estado: "fila", nota: "a ficha que se escreve ainda não tem peça nativa" },
  Timeline: { estado: "fila", nota: "o que aconteceu, em ordem, ainda é composição sua" },
  Tracker: { estado: "fila", nota: "a faixa de quadradinhos por período ainda não porta" },
  Tree: {
    estado: "fila",
    nota: "hierarquia em tela estreita quer navegação por níveis, e a peça que faz isso ainda não existe",
  },
  TreeSelect: {
    estado: "fila",
    nota: "escolher dentro de árvore vira folha com níveis; até lá, dois `Select` encadeados",
  },

  // --------------------------------------------------------------- não portam
  Breadcrumb: {
    estado: "nao",
    nota: "o caminho de volta é o botão de voltar do router",
    pagina:
      "Não porta. O caminho até onde a pessoa está é, no celular, o botão de voltar do " +
      "router mais o título da tela — desenhar uma trilha por cima disso duplica a " +
      "navegação e come a largura que o título precisa.",
  },
  ButtonGroup: {
    estado: "nao",
    nota: "`Tabs` e `ToggleGroup` cobrem o caso; botão encostado em botão vira um alvo só no dedo",
  },
  Command: {
    estado: "nao",
    nota: "paleta de comandos é gesto de mesa: um campo, uma lista e o teclado",
    pagina:
      "Não porta. A paleta de comandos é um gesto de mesa — abre por atalho, anda por seta, " +
      "confirma por Enter — e nenhuma das três coisas existe no toque. No celular a porta " +
      "equivalente é a tela de busca do router, com o campo no topo e o resultado levando " +
      "direto para a tela.",
  },
  ContextMenu: {
    estado: "nao",
    nota: "não precisa de peça nova: precisa de `longPress` no `Menu`, que ele ainda não aceita",
    pagina:
      "Não porta como peça, e não é por falta de caso de uso: o menu do botão direito é, no " +
      "celular, o toque longo. O que falta é um `longPress` no `Menu` nativo, que hoje só " +
      "abre por `open`/`onOpenChange` — até lá, chame `onOpenChange(true)` no `onLongPress` " +
      "do seu próprio `Pressable`. Peça nova aqui seria um segundo `Menu` com outro nome.",
  },
  Kbd: {
    estado: "nao",
    nota: "não há teclado para desenhar",
    pagina:
      "Não porta. A peça desenha uma tecla, e o celular não tem teclado físico para a tecla " +
      "representar — `⌘K` numa tela de toque promete um gesto que não existe. O que no web " +
      "é atalho, no celular é um botão visível.",
  },
  Menubar: {
    estado: "nao",
    nota: "idioma de mesa; navegação nativa é tab bar e drawer do router",
  },
  NavigationMenu: {
    estado: "nao",
    nota: "idioma de mesa; navegação nativa é tab bar e drawer do router",
  },
  Pagination: {
    estado: "nao",
    nota: "lista de celular rola; escolher o número da página é gesto de mesa",
  },
  Popover: {
    estado: "nao",
    nota: "painel ancorado que o próprio dedo cobre — use `Sheet`",
    pagina:
      "Não porta. O painel ancorado ao gatilho é um problema de tela estreita antes de ser " +
      "um problema de toque: ele nasce debaixo do dedo que o abriu e não tem para onde " +
      "fugir. No React Native o equivalente é o `Sheet`, que sobe de baixo e não disputa " +
      "espaço com nada.",
  },
  PreviewCard: {
    estado: "nao",
    nota: "aparece ao pousar o ponteiro, e não há pousar no toque",
  },
  ScrollArea: {
    estado: "nao",
    nota: "rolagem é da plataforma: `ScrollView` e `FlatList`, com a barra que o sistema desenha",
  },
  Sidebar: {
    estado: "nao",
    nota: "idioma de mesa; navegação nativa é tab bar e drawer do router",
    pagina:
      "Não porta. A barra lateral é o esqueleto de navegação de uma tela larga; no celular " +
      "quem faz esse papel é a tab bar e o drawer do router (Expo Router, React " +
      "Navigation), que trazem gesto de borda, histórico e estado de aba de graça. Uma " +
      "gaveta desenhada à mão por cima disso perde os três.",
  },
  Splitter: {
    estado: "nao",
    nota: "duas áreas lado a lado não cabem em tela estreita; no celular a lista e o detalhe são duas telas do router",
  },
  Table: {
    estado: "nao",
    nota: "não há tabela no celular; a consulta vira `DataList`",
  },
  Toolbar: {
    estado: "nao",
    nota: "superfície de edição de mesa: uma parada de tabulação e navegação por seta, que o toque não tem",
  },
  Tooltip: {
    estado: "nao",
    nota: "hover não existe no toque; o rótulo precisa estar na tela",
    pagina:
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
async function pecasDoCatalogo() {
  const paginas: string[] = [];
  for await (const arquivo of new Glob("*.md").scan(DOCS)) {
    paginas.push(arquivo.replace(/\.md$/, ""));
  }
  paginas.sort();

  const parte = (nome: string) => {
    if (AUTONOMAS.has(nome) || PARTE_QUE_E_PECA.has(nome)) return false;
    const nomeado = PAI[nome];
    if (nomeado) return paginas.includes(nomeado);

    for (const outro of paginas) {
      if (outro === nome || !nome.startsWith(outro)) continue;
      if (!/^[A-Z]/.test(nome.slice(outro.length))) continue;
      return true;
    }
    return false;
  };

  return paginas.filter((nome) => !parte(nome));
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

  const nomes = new Set<string>();
  for (const bloco of fonte.matchAll(/export \{([\s\S]*?)\} from/g)) {
    for (const cru of bloco[1]!.split(",")) {
      const parte = cru.trim();
      if (!parte || parte.startsWith("type ")) continue;
      nomes.add(parte.split(/\s+as\s+/).pop()!.trim());
    }
  }
  return nomes;
}

/* --------------------------------------------------------------------------
 * O texto
 * ----------------------------------------------------------------------- */

const SIMBOLO: Record<Estado, string> = {
  traduz: "✔ traduz",
  vira: "✔ vira",
  fila: "○ na fila",
  nao: "✕ não porta",
};

const nomeNativo = (peca: string, linha: Linha) => linha.nativo ?? peca;

function celulaDeEstado(peca: string, linha: Linha) {
  if (linha.estado === "vira") return `✔ vira \`${nomeNativo(peca, linha)}\``;
  return SIMBOLO[linha.estado];
}

function tabela(pecas: string[]) {
  const linhas = [
    "| Peça | No React Native | O que saber antes de contar com ela |",
    "| --- | --- | --- |",
  ];

  for (const peca of pecas) {
    const linha = PARIDADE[peca]!;
    linhas.push(`| \`${peca}\` | ${celulaDeEstado(peca, linha)} | ${linha.nota} |`);
  }

  return linhas.join("\n");
}

function placar(pecas: string[], nativo: Set<string>) {
  const conta = (estado: Estado) => pecas.filter((p) => PARIDADE[p]!.estado === estado).length;

  return (
    `**${pecas.length} peças no catálogo do web, medidas contra ` +
    `\`native/src/index.ts\` em ${new Date().toISOString().slice(0, 10)}:** ` +
    `${conta("traduz")} traduzem com o mesmo nome, ${conta("vira")} traduzem com outro, ` +
    `${conta("fila")} estão na fila e ${conta("nao")} não portam por decisão. ` +
    "A coluna do meio separa as duas ausências, que é a distinção que a tabela existe " +
    "para fazer: `○` muda com o tempo, `✕` não muda. E `✔` não quer dizer copiar e " +
    "colar — a seção acima explica por quê."
  );
}

/** O paragrafo que entra na pagina da peca, quando nao ha um escrito a mao. */
function paragrafoDaPagina(peca: string, linha: Linha) {
  if (linha.pagina) return linha.pagina;

  const nativo = nomeNativo(peca, linha);

  if (linha.estado === "traduz") {
    return (
      `Traduz: o \`@rivocode/ui-native\` exporta \`${nativo}\` — ${linha.nota}. ` +
      "A API não é a mesma do web (no nativo tudo é controlado), e a " +
      "[tabela de paridade](/react-native) diz o que muda peça a peça."
    );
  }

  if (linha.estado === "vira") {
    return (
      `No React Native esta peça é \`${nativo}\` — ${linha.nota}. ` +
      "A [tabela de paridade](/react-native) tem o resto do catálogo."
    );
  }

  if (linha.estado === "fila") {
    return (
      `Ainda não portado — ${linha.nota}. ` +
      "É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa " +
      "as duas."
    );
  }

  return (
    `Não porta, por decisão — ${linha.nota}. ` +
    "Não é fila: não vai existir. A [tabela de paridade](/react-native) diz o porquê de " +
    "cada uma."
  );
}

const TITULO_DA_SECAO = "## No React Native";

/**
 * Troca a secao se ela ja existe, acrescenta no fim se nao existe.
 *
 * A troca vai por funcao, e nao por string: a nota do `InputGroup` escrevia
 * `R$` e o `$` seguinte era lido como referencia de captura pelo `replace` -
 * o arquivo inteiro apareceu no meio da tabela, sem erro nenhum.
 */
function comSecaoDeNativo(markdown: string, paragrafo: string) {
  const secao = `${TITULO_DA_SECAO}\n\n${paragrafo}\n`;
  const existente = /\n## No React Native\n[\s\S]*?(?=\n## |$)/;

  if (existente.test(markdown)) return markdown.replace(existente, () => `\n${secao}`);
  return `${markdown.replace(/\s*$/, "")}\n\n${secao}`;
}

/**
 * Troca o corpo de uma secao de um guia, do titulo ate o proximo `## `.
 *
 * O guia continua sendo escrito a mao; o que este arquivo possui e o miolo
 * desta secao, e so ele.
 */
function comSecaoTrocada(markdown: string, titulo: string, corpo: string) {
  const alvo = new RegExp(`(^|\\n)${titulo}\\n[\\s\\S]*?(?=\\n## |$)`);
  if (!alvo.test(markdown)) {
    throw new Error(
      `Nao achei a secao "${titulo}". Ela e o lugar onde a tabela e publicada:\n` +
        "escreva o titulo no arquivo, ou corrija o titulo aqui.",
    );
  }
  return markdown.replace(alvo, (_, antes: string) => `${antes}${titulo}\n\n${corpo}\n`);
}

const GUIAS = [
  { arquivo: "apps/docs/src/content/react-native.md", titulo: "## A paridade, peça por peça" },
  {
    arquivo: ".claude/skills/rivocode-ui/reference/native.md",
    titulo: "## A paridade, peça por peça",
  },
];

/* --------------------------------------------------------------------------
 * Rodar
 * ----------------------------------------------------------------------- */

const conferir = process.argv.includes("--check");
const pecas = await pecasDoCatalogo();
const nativo = exportadosNoNativo();
const problemas: string[] = [];

for (const peca of pecas) {
  if (!PARIDADE[peca]) {
    problemas.push(
      `\`${peca}\` tem pagina no catalogo e nao tem linha na tabela de paridade.\n` +
        "    Peca sem linha se le como esquecimento do leitor: escreva o estado dela em\n" +
        "    scripts/paridade-nativo.ts.",
    );
  }
}

for (const peca of Object.keys(PARIDADE)) {
  if (!pecas.includes(peca)) {
    problemas.push(
      `\`${peca}\` tem linha na tabela de paridade e nao tem pagina no catalogo.\n` +
        "    A tabela esta prometendo peca que nao existe.",
    );
    continue;
  }

  const linha = PARIDADE[peca]!;
  const nome = nomeNativo(peca, linha);
  const existe = nativo.has(nome);

  if ((linha.estado === "traduz" || linha.estado === "vira") && !existe) {
    problemas.push(
      `\`${peca}\` esta como "${celulaDeEstado(peca, linha)}" e \`${nome}\` nao sai de\n` +
        `    ${NATIVE_INDEX}. A tabela promete um import que quebra.`,
    );
  }

  if ((linha.estado === "fila" || linha.estado === "nao") && existe) {
    problemas.push(
      `\`${peca}\` esta como "${celulaDeEstado(peca, linha)}" e \`${nome}\` JA sai de\n` +
        `    ${NATIVE_INDEX}. A peca portou: promova a linha, senao a doc segue\n` +
        "    mandando usar o substituto.",
    );
  }
}

if (problemas.length > 0) {
  console.error(`${problemas.length} divergencia(s) entre a tabela de paridade e o codigo:\n`);
  for (const problema of problemas) console.error(`  ${problema}\n`);
  process.exit(1);
}

const corpoDaSecao = `${placar(pecas, nativo)}\n\n${tabela(pecas)}`;
const desatualizados: string[] = [];

for (const guia of GUIAS) {
  const antes = readFileSync(guia.arquivo, "utf8");
  const depois = comSecaoTrocada(antes, guia.titulo, corpoDaSecao);
  if (antes === depois) continue;
  if (!conferir) writeFileSync(guia.arquivo, depois);
  desatualizados.push(guia.arquivo);
}

for (const peca of pecas) {
  const caminho = `${DOCS}/${peca}.md`;
  const antes = readFileSync(caminho, "utf8");
  const depois = comSecaoDeNativo(antes, paragrafoDaPagina(peca, PARIDADE[peca]!));
  if (antes === depois) continue;
  if (!conferir) writeFileSync(caminho, depois);
  desatualizados.push(caminho);
}

if (conferir) {
  if (desatualizados.length > 0) {
    console.error(`${desatualizados.length} arquivo(s) fora da tabela de paridade:\n`);
    for (const arquivo of desatualizados) console.error(`  ${arquivo}`);
    console.error("\nRode `bun run scripts/paridade-nativo.ts` e comite o resultado.");
    process.exit(1);
  }
  console.log(`${pecas.length} pecas conferidas: a tabela e as paginas dizem a mesma coisa.`);
} else {
  console.log(
    `${pecas.length} pecas na tabela; ${desatualizados.length} arquivo(s) reescrito(s).\n` +
      `Indice nativo medido agora: ${nativo.size} exportacoes.`,
  );
}
