/**
 * A assinatura de cada peca nos dois pacotes, escrita uma vez e conferida.
 *
 * O `check:paridade` responde "existe no nativo?" e para ai. Quem porta uma
 * tela ja passou dessa pergunta: ele sabe que o `Meter` existe, e o que custa
 * a tarde e descobrir, uma peca de cada vez, que `format` la se chamava
 * `valueLabel`, que o `at` da `Timeline` deixou de aceitar `RelativeTime`, e
 * que o molde do `MaskedInput` troca de `9` para `#`.
 *
 * Nenhum desses seis casos estava escrito em lugar nenhum quando foram
 * medidos, em 28/08/2026, e os seis quebram o `tsc` na hora de portar. Erro de
 * compilacao acha o defeito; ele nao diz o que escrever no lugar. Esta tabela
 * diz.
 *
 * ## O que a guarda mede, e o que ela nao mede
 *
 * A judgment - qual prop do web corresponde a qual prop do nativo - e humana:
 * nenhum cruzamento de tipos descobre que `format` e `valueLabel` sao a mesma
 * intencao. O que a maquina confere e se a linha ainda descreve o codigo:
 *
 * 1. Prop citada de um lado tem que EXISTIR naquele lado.
 * 2. Linha que diz "so no web" tem que ter a prop AUSENTE no nativo, e
 *    vice-versa. Sem isto a tabela continuaria mandando reescrever uma chamada
 *    que ja porta.
 * 3. Linha de mesmo nome nos dois lados tem que ter assinatura DIFERENTE - por
 *    tipo ou por obrigatoriedade. Linha que descreve divergencia que acabou e
 *    ruido, e ruido e o comeco de tabela que ninguem le.
 * 4. Toda variante que existe de um lado so - prop de mesmo nome cujos
 *    literais divergem - tem que ter linha. Foi ela que pegou o `Spinner`,
 *    que ninguem tinha citado: o web fala `sm`/`md`/`lg` e o nativo fala
 *    `small`/`large`.
 * 5. Todo `classNames` do web que nao atravessa inteiro - a peca existe no
 *    nativo e la a prop falta, ou o conjunto de partes e outro - tem que ter
 *    linha `classNames`, e a nota tem que nomear cada parte que falta. Nasceu
 *    em 25/09/2026: vinte pecas nativas tinham o `classNames` do web faltando
 *    e nenhuma linha dizia, porque a guarda so cobrava cobertura de variante.
 *    Quem porta a tela escrevia `classNames={{ indicator }}` e descobria no
 *    `tsc`.
 *
 * As regras 4 e 5 sao as familias de divergencia que se derivam sozinhas, e
 * por isso as unicas cuja COBERTURA a guarda cobra.
 *
 * O que fica de fora, e de proposito: prop com nome diferente que ninguem
 * declarou aqui. Derivar isso seria adivinhar intencao, e o resultado seria
 * uma lista de excecao do tamanho do catalogo - as pecas comuns divergem em
 * quase toda prop, porque `defaultValue`, `render` e a metade controlada do
 * web simplesmente nao existem no toque. Essas regras gerais ja estao na prosa
 * da pagina; a tabela e para o que sobra.
 *
 * ## De onde saem os dois lados
 *
 * `apps/docs/src/component-props.json` (web) e `apps/docs/src/native-props.json`
 * (nativo), os dois gerados do compilador e comitados. O nativo precisa de
 * `examples/native` instalado para ser GERADO, e por isso ele e artefato: assim
 * a conferencia custa dois `JSON.parse` e cabe no gate. O cabecalho de
 * `scripts/props-do-catalogo-nativo.ts` conta por que nao da para gerar na
 * hora.
 *
 * Um limite herdado do catalogo do web, e vale saber antes de escrever linha:
 * `children`, `className`, `style` e `id` nunca aparecem la, e prop propria que
 * tem o mesmo nome de um atributo de DOM tambem nao - o `value` do `Clipboard`
 * e obrigatorio e nao esta no JSON. Prop assim nao serve de ancora, e a linha
 * se escreve pela outra ponta.
 *
 * Rodar de novo:
 *
 *   bun run gen:assinatura            escreve a secao em native.md
 *   bun run check:assinatura          so confere, para o gate
 */
import { readFileSync, writeFileSync } from "node:fs";

import { countAtLeast } from "./varredura";

const WEB_CATALOG = "apps/docs/src/component-props.json";
const NATIVE_CATALOG = "apps/docs/src/native-props.json";
const GUIDE = ".claude/skills/rivocode-ui/reference/native.md";
const SECTION_TITLE = "## A assinatura, prop a prop";

export type Row = {
  /**
   * A prop no web, ou `null` quando o dado nao entra por prop desse nome la -
   * composicao, filho, ou o atributo cru do elemento.
   */
  web: string | null;
  /** A prop no nativo, ou `null` quando ela nao existe la. */
  native: string | null;
  /** A celula da tabela: uma linha, minuscula, sem ponto final. */
  note: string;
};

export type Signature = {
  /** O nome da peca no nativo, quando ela muda de nome. */
  nativePiece?: string;
  rows: Row[];
};

export type Prop = { name: string; type: string; required: boolean };
export type Catalog = Record<string, { props: Prop[] }>;

/* --------------------------------------------------------------------------
 * O julgamento
 * ----------------------------------------------------------------------- */

export const SIGNATURES: Record<string, Signature> = {
  Alert: {
    rows: [
      {
        web: null,
        native: "title",
        note: "o título vira prop; no web ele é `AlertTitle` por filho",
      },
    ],
  },
  ActionBar: {
    rows: [
      {
        web: "position",
        native: null,
        note: "não há `sticky` nem `fixed`: a barra é sempre `absolute` sobre a lista, no pé da tela",
      },
      {
        web: null,
        native: "bottomInset",
        note: "a área segura de baixo entra por número, `useSafeAreaInsets().bottom`, porque o pacote não depende do `react-native-safe-area-context`",
      },
      {
        web: "finalFocus",
        native: null,
        note: "no toque não há foco de teclado para devolver quando a barra sai",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "sem `actions`: as ações são filhas diretas do painel, e `className` veste o mesmo painel de `bar`",
      },
    ],
  },
  AlertDialog: {
    rows: [
      {
        web: null,
        native: "title",
        note: "`title` e `description` viram props obrigatórias, no lugar de `AlertDialogTitle` e `AlertDialogDescription`",
      },
      {
        web: null,
        native: "actionLabel",
        note: "o botão que confirma é `actionLabel` mais `onAction`, e não um `AlertDialogClose` no rodapé",
      },
      {
        web: "open",
        native: "open",
        note: "`open` e `onOpenChange` são obrigatórios, e não fecha no toque fora",
      },
    ],
  },
  Accordion: {
    rows: [
      { web: null, native: "children", note: "a raiz só empilha; quem tem prop é o item" },
    ],
  },
  Autocomplete: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "`value` e `onValueChange` são obrigatórios, e o valor é sempre o texto (`string`)",
      },
      {
        web: "mode",
        native: null,
        note: "não há completar inline: a folha filtra as sugestões e a pessoa toca ou segue digitando",
      },
      {
        web: null,
        native: "label",
        note: "o nome do campo vira prop obrigatória, e é o título da folha; no web é o `aria-label` do `AutocompleteInput`",
      },
    ],
  },
  Avatar: {
    rows: [
      {
        web: "fallback",
        native: "fallback",
        note: "vira obrigatória: é ela que ocupa o lugar enquanto a foto baixa, e é ela que volta se a foto falhar",
      },
    ],
  },
  Banner: {
    rows: [
      {
        web: "description",
        native: "description",
        note: "`title` e `description` viram `string`: texto no nativo mora dentro de um `Text`",
      },
      {
        web: "icon",
        native: "icon",
        note: "sem ícone padrão, porque o pacote não traz ícone; a função recebe a cor do tom e o tamanho",
      },
    ],
  },
  Button: {
    rows: [
      {
        web: "size",
        native: "size",
        note: "`cta` não porta: alvo de toque não encolhe. Botão só de ícone é o `IconButton` nos dois lados",
      },
      { web: "shape", native: null, note: "sem pílula: o raio é o do token, igual em todo botão" },
    ],
  },
  Spoiler: {
    rows: [
      {
        web: null,
        native: "fadeOver",
        note: "o degradê é pintado na cor do fundo em que o bloco pousa, porque o toque não tem máscara",
      },
    ],
  },
  Tour: {
    rows: [
      {
        web: "open",
        native: "open",
        note: "vira obrigatório, com `onOpenChange`: não há `defaultOpen`",
      },
      {
        web: "step",
        native: "step",
        note: "vira obrigatório, com `onStepChange`: não há `defaultStep`, e é no `onStepChange` que a tela rola o alvo",
      },
      {
        web: "interactive",
        native: null,
        note: "o `Modal` é outra janela, e o toque não atravessa o recorte até o alvo",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "sem `spotlight`: o recorte é o vão entre as quatro faixas de `mask`, e não um nó",
      },
    ],
  },
  ImageViewer: {
    rows: [
      {
        web: "index",
        native: "index",
        note: "vira obrigatório, com `onIndexChange`: não há `defaultIndex`, e `null` é o fechado",
      },
    ],
  },
  IconButton: {
    rows: [
      { web: "shape", native: null, note: "sem pílula: o raio é o do token, igual em todo botão" },
      {
        web: "tooltip",
        native: null,
        note: "no toque não há pousar; ícone que não se lê sozinho pede `Button` com texto",
      },
      { web: "tooltipSide", native: null, note: "sai junto com o `tooltip`" },
    ],
  },
  Carousel: {
    rows: [
      {
        web: null,
        native: "items",
        note: "os slides vêm por `items` e `renderItem`, e não como filhos",
      },
      {
        web: "index",
        native: "index",
        note: "vira obrigatório, com `onIndexChange`: não há `defaultIndex`",
      },
      {
        web: "slidesPerView",
        native: "slidesPerView",
        note: 'só número: o objeto por largura e o `"auto"` não portam',
      },
      {
        web: "autoplay",
        native: null,
        note: "no toque a fileira que anda sozinha briga com o dedo; não há rotação nem pausa",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "sem `pause`, porque não há `autoplay`",
      },
    ],
  },
  Calendar: {
    rows: [
      {
        web: "mode",
        native: null,
        note: "só data única, que no web é o caminho sem `mode`: intervalo é o `DateRangePicker`, e várias datas soltas não portam",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "os nomes do `DayPicker`, só os que têm nó no mês desenhado à mão: sem `months`, `month`, `month_caption`, `week`, `outside`, `hidden`, os `range_*` de intervalo e os de animação",
      },
    ],
  },
  ChartGauge: {
    rows: [
      {
        web: "classNames",
        native: "classNames",
        note: "sem `arc`: o arco é um traço dentro do `Svg`, e o `react-native-svg` não recebe classe",
      },
    ],
  },
  ChartContainer: {
    rows: [
      {
        web: null,
        native: "children",
        note: "`children` é função e recebe `{ width, height, colors }`: não há `ResponsiveContainer` para medir por você, e a medida chega zerada no primeiro quadro",
      },
      {
        web: "empty",
        native: "empty",
        note: "`title` e `description` do vazio são `string`, e não `ReactNode`; o `icon` atravessa, e aceita também a função do `EmptyState` nativo",
      },
      {
        web: "errorTitle",
        native: "errorTitle",
        note: "`errorTitle`, `errorMessage` e `retryLabel` viram `string`",
      },
    ],
  },
  ChartDonut: {
    rows: [
      {
        web: "centerValue",
        native: "centerValue",
        note: "`centerValue` e `centerLabel` viram `string`",
      },
    ],
  },
  ChartRadial: {
    rows: [
      {
        web: "color",
        native: "color",
        note: "no web é qualquer cor de CSS; no nativo é papel de token (`chart-1`…`chart-8`), senão a peça fica surda ao tema",
      },
    ],
  },
  Checkbox: {
    rows: [
      {
        web: "parent",
        native: null,
        note: "o pai de um grupo se monta à mão, com `indeterminate` e o estado dos filhos: o `CheckboxGroup` nativo não tem `allValues`",
      },
      {
        web: null,
        native: "label",
        note: "o nome falado é `label`, no lugar do `aria-label`; sem `children` ele é obrigatório, e o tipo recusa a caixa sem os dois",
      },
    ],
  },
  Clipboard: {
    rows: [
      {
        web: null,
        native: "toast",
        note: "o aviso falado vem junto e `toast={false}` desliga: rótulo trocado sob o dedo não é reanunciado",
      },
    ],
  },
  QRCode: {
    rows: [
      {
        web: "classNames",
        native: "classNames",
        note: "só `logo`: `code` é o `Svg`, e o `react-native-svg` não recebe classe",
      },
    ],
  },
  PixCode: {
    rows: [
      {
        web: null,
        native: "renderCopy",
        note: "o botão de copiar vem de `@rivocode/ui-native/clipboard` por função; no web ele já vem dentro, e por isso o `PixCodeLabels` daqui não tem `copy` nem `copied`",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "sem `copy`: o botão é o que `renderCopy` devolve, e quem o escreve o veste",
      },
    ],
  },
  Code: {
    rows: [
      {
        web: null,
        native: "children",
        note: "`children` é `string`, e não `ReactNode`: o trecho é texto",
      },
    ],
  },
  Collapsible: {
    rows: [
      {
        web: null,
        native: "label",
        note: "o cabeçalho vira `label`, no lugar de `CollapsibleTrigger` e `CollapsiblePanel`",
      },
    ],
  },
  ColorPicker: {
    rows: [
      {
        web: "label",
        native: "label",
        note: "`label` é `string`: sem `ReactNode`, como em toda peça do nativo",
      },
    ],
  },
  Combobox: {
    rows: [
      {
        web: "items",
        native: "items",
        note: "`items` na raiz e obrigatória, rasa ou em grupos `{ label, items }`; sem `ComboboxItem` por filho",
      },
      {
        web: null,
        native: "label",
        note: "`label` é obrigatório: é ele que o leitor de tela anuncia, no lugar do `aria-label`",
      },
      {
        web: null,
        native: "searchPlaceholder",
        note: "a folha tem busca própria; `emptyMessage` é o texto de lista vazia",
      },
      { web: "filter", native: null, note: "o filtro é da peça e ignora acento; não se troca" },
    ],
  },
  ContextMenu: {
    nativePiece: "Menu",
    rows: [
      {
        web: null,
        native: "children",
        note: "o `ContextMenuTrigger` vira `children` do `Menu`, e o gesto é o toque longo, não o botão direito",
      },
      {
        web: null,
        native: "actions",
        note: "os itens viram `actions`, no lugar de `MenuItem` por filho, e a folha sobe de baixo",
      },
      {
        web: null,
        native: "title",
        note: "a folha tem cabeçalho obrigatório: sem ancoragem, é ele que diz do que o menu trata",
      },
      {
        web: "open",
        native: "open",
        note: "`open` e `onOpenChange` são obrigatórios, e `defaultOpen` não existe",
      },
    ],
  },
  DataTable: {
    nativePiece: "DataList",
    rows: [
      {
        web: "columns",
        native: "renderItem",
        note: "não há coluna: `renderItem` desenha a linha inteira",
      },
      { web: "rowKey", native: "keyExtractor", note: "mesmo papel, nome do React Native" },
      { web: "onRowClick", native: "onRowPress", note: "mesmo papel, nome do toque" },
      {
        web: "pageSize",
        native: null,
        note: "lista de celular rola: sem página, e `virtual`, `rowHeight` e `maxHeight` saem junto",
      },
      {
        web: null,
        native: "filterValue",
        note: "o `filter` só busca no que esta função devolve, porque não há coluna de onde tirar texto",
      },
      {
        web: "classNames",
        native: null,
        note: "a linha é o que `renderItem` devolve, e quem a escreve a veste: não há `table`, `head` nem `cell`",
      },
    ],
  },
  DatePicker: {
    rows: [
      {
        web: "disabledDays",
        native: null,
        note: "dia bloqueado avulso não porta: a faixa é `min`/`max`",
      },
      { web: "confirm", native: null, note: "a folha sempre confirma: escolher já fecha" },
      {
        web: null,
        native: "label",
        note: "`label` é obrigatório, e o campo não vive dentro de um `Field`",
      },
    ],
  },
  DateRangePicker: {
    rows: [{ web: "numberOfMonths", native: null, note: "um mês por folha, sempre" }],
  },
  DescriptionItem: {
    rows: [
      { web: "label", native: "label", note: "`label` é `string`, e o corpo continua sendo filho" },
    ],
  },
  Dialog: {
    rows: [
      {
        web: null,
        native: "title",
        note: "`title` é prop obrigatória e `description` é prop: sem `DialogTitle` e sem `DialogTrigger`",
      },
      {
        web: "open",
        native: "open",
        note: "`open` e `onOpenChange` são obrigatórios: quem abre é quem chama",
      },
    ],
  },
  Editable: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "`value` e `onValueChange` obrigatórios; quem abre é o toque longo, e há um `Cancelar` visível",
      },
    ],
  },
  EmptyState: {
    rows: [
      { web: "title", native: "title", note: "`title` e `description` são `string`" },
      {
        web: "icon",
        native: "icon",
        note: "aceita também uma função que recebe `color` e `size`, porque a cor não desce da `View` para o SVG",
      },
    ],
  },
  Field: {
    rows: [
      {
        web: null,
        native: "label",
        note: "`label`, `description` e `error` viram props: sem `FieldLabel`, `FieldDescription` e `FieldError`",
      },
    ],
  },
  Fieldset: {
    rows: [
      {
        web: null,
        native: "legend",
        note: "`legend` vira prop obrigatória, no lugar do `FieldsetLegend`",
      },
    ],
  },
  FileUpload: {
    rows: [
      {
        web: "onSelect",
        native: "onSelect",
        note: "o que volta é `PickedFile` com `uri` local, e não `File`: `size` pode faltar",
      },
      {
        web: "accept",
        native: "accept",
        note: "aceita lista, e fala MIME: é o que o seletor do sistema sabe filtrar",
      },
      {
        web: "label",
        native: "label",
        note: "`label` e `hint` são `string`, e a área de soltar vira um botão",
      },
    ],
  },
  FilterBar: {
    rows: [
      {
        web: "labels",
        native: "labels",
        note: "`labels.empty` é `string`, e `labels.scroll` não existe: quem rola é a lista",
      },
    ],
  },
  FilterChip: {
    rows: [
      { web: "value", native: "value", note: "`value` é `string`: a pílula não recebe elemento" },
    ],
  },
  Form: {
    rows: [
      {
        web: null,
        native: "children",
        note: '`children` é função e recebe `{ submit, isSubmitting }`: nada envia sozinho, porque não há `<form>` nem `type="submit"`',
      },
    ],
  },
  FormField: {
    rows: [
      {
        web: "label",
        native: "label",
        note: "`label` vira obrigatório e é `string`: é ele que vira `accessibilityLabel` no controle",
      },
      { web: "description", native: "description", note: "`description` é `string`" },
    ],
  },
  NotificationCenter: {
    rows: [
      {
        web: "open",
        native: "open",
        note: "vira obrigatório, com `onOpenChange`: não há `defaultOpen`",
      },
      {
        web: null,
        native: "icon",
        note: "o sino entra por `icon`, obrigatório, porque o pacote não traz ícone; a função recebe a cor do botão",
      },
      {
        web: "onItemClick",
        native: "onItemPress",
        note: "a linha não é link: sem `href` no item, quem navega é o router a partir do item recebido",
      },
      {
        web: "defaultFilter",
        native: null,
        note: "o filtro começa em `all`; `filter` com `onFilterChange` controla",
      },
      {
        web: "align",
        native: null,
        note: "a lista é sempre uma folha de baixo, e não um painel ancorado ao sino",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "sem `footer`: o “Carregar mais” fica direto na folha",
      },
    ],
  },
  Indicator: {
    rows: [
      {
        web: "label",
        native: "label",
        note: "`label` vira obrigatório: a pastilha é uma parada só do leitor de tela, e o que ela diz é a frase",
      },
    ],
  },
  Input: {
    rows: [
      { web: null, native: "font", note: "escolhe o papel de fonte, que o web resolve por classe" },
    ],
  },
  InputGroup: {
    rows: [
      {
        web: null,
        native: "prefix",
        note: "`prefix`, `suffix` e `actions` viram props: sem `InputPrefix`, `InputSuffix` e `InputAction`",
      },
      {
        web: null,
        native: "value",
        note: "a moldura desenha o próprio campo: `value` e `onValueChange` são dela, e não de um `Input` por dentro",
      },
      {
        web: null,
        native: "classNames",
        note: "as partes que no web são peças vestem pelo `classNames`, com o nome delas: `input`, `prefix`, `suffix` e `action`",
      },
    ],
  },
  Item: {
    rows: [
      {
        web: null,
        native: "title",
        note: "`title`, `description`, `media` e `actions` viram props: sem `ItemTitle`, `ItemDescription` e `ItemMedia`",
      },
      {
        web: "interactive",
        native: "onPress",
        note: "quem torna a linha tocável é o `onPress`, e não um booleano",
      },
    ],
  },
  Link: {
    rows: [
      {
        web: "render",
        native: "onPress",
        note: 'o link do router entra por callback, `onPress={() => router.push("/notas")}`: não há âncora para trocar',
      },
      {
        web: "underline",
        native: null,
        note: "o sublinhado é fixo: sem ponteiro, não existe o `hover`",
      },
    ],
  },
  Text: {
    rows: [
      {
        web: "render",
        native: null,
        note: "o elemento é sempre `Text`; o bloco é uma `View` em volta",
      },
      { web: null, native: "font", note: "escolhe o papel de fonte, que o web resolve por classe" },
    ],
  },
  MaskedInput: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "no web `value` é o texto COM máscara; no nativo é só dígito, e a máscara é do campo",
      },
    ],
  },
  Questionnaire: {
    rows: [
      {
        web: null,
        native: "items",
        note: "as perguntas vêm por `items`, com `type` `single`, `multiple` ou `text`, no lugar de `QuestionnaireItem` e das partes por filho",
      },
      {
        web: "item",
        native: "item",
        note: "vira obrigatório: a pergunta aberta é sempre controlada, junto com `onItemChange`",
      },
      { web: "defaultItem", native: null, note: "não há estado interno de pergunta aberta" },
      {
        web: null,
        native: "value",
        note: "as respostas são controladas; no web elas moram nos `<input>` do formulário",
      },
      {
        web: "onSubmit",
        native: "onSubmit",
        note: "vira obrigatório e recebe só as respostas: não há `FormData` fora do navegador",
      },
      {
        web: "shortcuts",
        native: null,
        note: "sem teclado físico, não há atalho de letra nem de número",
      },
      {
        web: null,
        native: "onStatusChange",
        note: "um só na raiz, com o `name` da pergunta; no web ele é de cada `QuestionnaireItem`",
      },
    ],
  },
  CurrencyInput: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "vira obrigatório, com `onValueChange`: não há `defaultValue`",
      },
    ],
  },
  PostalCodeField: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "vira obrigatório e são só os dígitos; no web aceita o texto com máscara",
      },
      { web: "defaultValue", native: null, note: "não há estado interno: o campo é controlado" },
    ],
  },
  Menu: {
    rows: [
      {
        web: null,
        native: "actions",
        note: "os itens viram `actions`, no lugar de `MenuItem` por filho, e a folha sobe de baixo",
      },
      {
        web: null,
        native: "title",
        note: "a folha tem cabeçalho obrigatório: sem ancoragem, é ele que diz do que o menu trata",
      },
      {
        web: null,
        native: "children",
        note: "não há `MenuTrigger`: `children` é a área que abre no toque longo, e o botão de três pontinhos é seu",
      },
      {
        web: "open",
        native: "open",
        note: "`open` e `onOpenChange` são obrigatórios, e `defaultOpen` não existe",
      },
      {
        web: null,
        native: "classNames",
        note: "o que no web é `MenuTrigger`, `MenuContent` e `MenuItem` veste pelo `classNames`: `trigger`, `content` e `item`",
      },
    ],
  },
  Meter: {
    rows: [
      { web: "label", native: "label", note: "`label` vira obrigatório e é `string`" },
    ],
  },
  NumberField: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "`value` é `number` e nunca `null`: o stepper sempre tem um número",
      },
      { web: "step", native: "step", note: 'sem `"any"`: o passo do stepper é um número' },
      {
        web: null,
        native: "label",
        note: "`label` é obrigatório: é ele que nomeia os dois botões de passo",
      },
    ],
  },
  OTPField: {
    rows: [
      {
        web: "mask",
        native: null,
        note: "sem esconder o dígito, e sem `autoSubmit`, `normalizeValue` e `validationType`",
      },
      {
        web: null,
        native: "label",
        note: "o nome falado é `label`, no lugar do `aria-label`; sem ele, o leitor diz quantos dígitos o código tem",
      },
    ],
  },
  PageHeader: {
    rows: [
      { web: "breadcrumb", native: null, note: "o caminho de volta é o botão de voltar do router" },
      { web: null, native: "badge", note: "a pastilha ao lado do título vira prop" },
      {
        web: "titleAs",
        native: null,
        note: "não há nível de título: o cabeçalho é uma parada só do leitor de tela",
      },
    ],
  },
  PasswordInput: {
    rows: [
      {
        web: "labels",
        native: "labels",
        note: "`labels.show` e `labels.hide` são obrigatórios juntos, porque o botão troca de nome com o estado",
      },
    ],
  },
  Popconfirm: {
    nativePiece: "AlertDialog",
    rows: [
      {
        web: "trigger",
        native: null,
        note: "não há ancoragem: você desenha o próprio botão e controla `open`",
      },
      {
        web: "onConfirm",
        native: "onAction",
        note: "só o nome muda: devolvendo promessa, o modal segura o botão em espera e fecha quando ela resolve",
      },
      { web: "confirmLabel", native: "actionLabel", note: "mesmo papel, e obrigatório" },
      {
        web: "description",
        native: "description",
        note: "vira `string` obrigatória: o modal não abre sem dizer o que se perde",
      },
      {
        web: "side",
        native: null,
        note: "`align`, `sideOffset` e `finalFocus` saem junto: o modal ocupa o meio da tela",
      },
      {
        web: "classNames",
        native: null,
        note: "o `AlertDialog` nativo não se veste por classe, nem pela raiz: `title`, `description`, `footer`, `confirm` e `cancel` são o desenho fixo do modal",
      },
    ],
  },
  Progress: {
    rows: [
      { web: "min", native: null, note: "a escala é 0 a 100, e `max` sai junto" },
      { web: "label", native: "label", note: "`label` vira obrigatório e é `string`" },
    ],
  },
  QueryBoundary: {
    rows: [
      {
        web: "empty",
        native: "empty",
        note: "`title` e `description` do vazio são `string`; o `icon` atravessa, e aceita também a função do `EmptyState` nativo",
      },
      {
        web: "errorTitle",
        native: "errorTitle",
        note: "`errorTitle`, `errorMessage` e `retryLabel` viram `string`",
      },
    ],
  },
  RivoProvider: {
    rows: [
      {
        web: "density",
        native: null,
        note: "a prop não existe: alvo de toque não encolhe, e `comfortable` é a única altura",
      },
      {
        web: "theme",
        native: "theme",
        note: "só `rivocode-dark`, `rivocode-light` e `system`: tema de cliente é decisão de BUILD",
      },
      {
        web: null,
        native: "fonts",
        note: "as fontes entram pelo provider, com `isFontLoaded` para segurar a tela até carregarem",
      },
      {
        web: "toastPosition",
        native: null,
        note: "o aviso sobe de baixo, e `scope` e `dir` saem junto",
      },
    ],
  },
  ScrollArea: {
    rows: [
      {
        web: null,
        native: "classNames",
        note: "só `footer`, a faixa presa embaixo da rolagem; o conteúdo que rola continua no `contentContainerClassName` da `ScrollView`",
      },
    ],
  },
  SearchInput: {
    rows: [
      {
        web: "onClear",
        native: null,
        note: 'o limpar é botão da própria peça, e ele chama `onValueChange("")`',
      },
      {
        web: "shortcut",
        native: null,
        note: "não há teclado para desenhar o `Kbd` dentro do campo",
      },
    ],
  },
  Select: {
    rows: [
      {
        web: "items",
        native: "items",
        note: "`items` na raiz e obrigatória, rasa ou em grupos `{ label, items }`; sem `SelectTrigger`, `SelectContent` e `SelectItem`",
      },
      {
        web: null,
        native: "label",
        note: "`label` é obrigatório: é ele que o leitor de tela anuncia",
      },
      {
        web: "value",
        native: "value",
        note: "o valor é `string` ou `string[]`, e não o item genérico do web",
      },
    ],
  },
  Sheet: {
    rows: [
      {
        web: "side",
        native: null,
        note: "só de baixo, que já era o modo estreito do web; `snapPoints` sai junto",
      },
      { web: null, native: "title", note: "`title` é prop obrigatória e `description` é prop" },
    ],
  },
  Rating: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "vira obrigatório: não há `defaultValue`, e sem `onValueChange` a peça só exibe",
      },
      {
        web: "icon",
        native: "icon",
        note: "é função, e recebe `{ color, size, filled }`: a cor não desce da `View` para o SVG",
      },
      {
        web: "name",
        native: null,
        note: "não há `<form>` para levar a nota num campo escondido",
      },
    ],
  },
  SignaturePad: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "vira obrigatório: não há `defaultValue`, e sem `onValueChange` a peça só exibe",
      },
      {
        web: "name",
        native: null,
        note: "não há `<form>` para levar o SVG num campo escondido",
      },
      {
        web: null,
        native: "onDrawingChange",
        note: "avisa o começo e o fim do traço, para a `ScrollView` em volta parar de rolar",
      },
      {
        web: null,
        native: "label",
        note: "o nome do grupo é `label`, no lugar do `aria-label`; sem ele vale `labels.group`",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "sem `baseline`: a linha de base é um traço dentro do `Svg`",
      },
    ],
  },
  Slider: {
    rows: [
      { web: "value", native: "value", note: "um valor só: `number`, e não `number[]`" },
      { web: "label", native: "label", note: "`label` vira obrigatório e é `string`" },
    ],
  },
  Sparkline: {
    rows: [
      {
        web: "variant",
        native: "variant",
        note: "`area` não porta: pede polígono preenchido, e o desenho nativo é `View`",
      },
      {
        web: "color",
        native: "color",
        note: "no web é qualquer cor de CSS; no nativo é papel de token",
      },
      { web: null, native: "height", note: "a altura é prop, porque não há CSS que a dê de fora" },
    ],
  },
  Stat: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "`value` é `string` já formatada, com `currencyShort` e os outros formatadores que a raiz exporta",
      },
      {
        web: "deltaVariant",
        native: null,
        note: "a variação é sempre texto com seta, sem a pastilha preenchida",
      },
      {
        web: "icon",
        native: null,
        note: "sem ícone, sem `footer`, sem `hint` e sem `actions`: o cartão é rótulo, valor e variação",
      },
    ],
  },
  Steps: {
    rows: [
      {
        web: "onStepClick",
        native: null,
        note: "só o modo estreito do web (texto e barra), e ele nunca foi clicável",
      },
    ],
  },
  Switch: {
    rows: [
      {
        web: "value",
        native: null,
        note: "não há formulário nativo para carregar valor: o estado é `checked`",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "só `label`: sem `thumb`, porque o polegar é do `Switch` da plataforma, que não recebe classe",
      },
      {
        web: null,
        native: "label",
        note: "o nome falado é `label`, no lugar do `aria-label`; sem `children` ele é obrigatório",
      },
    ],
  },
  Tabs: {
    rows: [
      {
        web: null,
        native: "items",
        note: "`items` na raiz, no lugar de `TabList`, `Tab` e `TabPanel`: é a caixinha segmentada, e o painel é seu",
      },
      { web: "value", native: "value", note: "o valor é `string`, e não o genérico do web" },
    ],
  },
  TimeField: {
    rows: [
      {
        web: null,
        native: "label",
        note: "`label` é obrigatório, e as setas viram dois botões de passo",
      },
    ],
  },
  TimePicker: {
    rows: [
      {
        web: null,
        native: "label",
        note: "`label` é obrigatório, e a folha tem duas colunas: NÃO embute o `TimeField`",
      },
      {
        web: "classNames",
        native: "classNames",
        note: "sem `field`: não há campo de digitar dentro do gatilho, e o gatilho é o `trigger`",
      },
    ],
  },
  Timeline: {
    rows: [
      {
        web: null,
        native: "items",
        note: "os eventos vêm por `items`, e não por `TimelineItem` filho",
      },
      {
        web: null,
        native: "label",
        note: "`label` diz o que a linha conta, e entra no anúncio de cada parada",
      },
    ],
  },
  TimelineItem: {
    nativePiece: "Timeline",
    rows: [
      {
        web: "at",
        native: null,
        note: "vira `items[].at` e é `string` já escrita: um `RelativeTime` vivo lá dentro deixaria o rótulo falado preso na hora em que montou",
      },
      {
        web: "tone",
        native: null,
        note: "`tone` e `pending` viram campos de `items[]`, e `by` e `title` também",
      },
      {
        web: "classNames",
        native: null,
        note: "o item vira `items[]`, sem classe por item: o `Timeline` nativo veste só pela raiz, sem `marker`, `content`, `title` nem `meta`",
      },
    ],
  },
  Tracker: {
    rows: [
      {
        web: "classNames",
        native: "classNames",
        note: "sem `label`: o nome da faixa é só o `accessibilityLabel` dela, sem texto escondido que se vista",
      },
    ],
  },
  Toggle: {
    rows: [
      {
        web: "value",
        native: null,
        note: "não há formulário nativo para carregar valor: o estado é `pressed`",
      },
    ],
  },
  ToggleGroup: {
    rows: [
      {
        web: null,
        native: "items",
        note: "`items` na raiz, no lugar de `Toggle` por filho; `multiple` continua igual",
      },
    ],
  },
  Tree: {
    rows: [
      {
        web: "expanded",
        native: null,
        note: "não há aberto: um nível por vez, e tocar num galho empurra o de dentro",
      },
      {
        web: "filter",
        native: null,
        note: "sem busca dentro da árvore; `emptyMessage` é o texto de nada encontrado",
      },
      {
        web: null,
        native: "label",
        note: "`label` é obrigatório: é ele que nomeia o nível para o leitor de tela",
      },
    ],
  },
  TreeSelect: {
    rows: [
      { web: "searchable", native: null, note: "sem busca na folha" },
      {
        web: null,
        native: "label",
        note: "`label` é obrigatório, e o rodapé traz a contagem do rascunho e o `Aplicar`",
      },
    ],
  },
  PromptInput: {
    rows: [
      {
        web: "value",
        native: "value",
        note: "obrigatório, junto com `onValueChange` e `onSubmit`: no nativo todo campo é controlado",
      },
      {
        web: "defaultValue",
        native: null,
        note: "sem estado próprio: quem limpa o campo depois do envio é quem chamou",
      },
    ],
  },
  Message: {
    rows: [
      {
        web: "copyValue",
        native: "onCopy",
        note: "o botão chama quem copia, porque o `expo-clipboard` mora em `@rivocode/ui-native/clipboard`",
      },
      {
        web: "error",
        native: "error",
        note: "`string`: texto no nativo mora dentro de um `Text`",
      },
    ],
  },
  Conversation: {
    rows: [
      {
        web: null,
        native: "items",
        note: "as mensagens vêm por `items`, `renderItem` e `keyExtractor`, e não por filhos; a ordem é a mesma, a mais nova por último",
      },
      {
        web: "empty",
        native: "empty",
        note: "`title` e `description` viram `string`, e o `icon` é a função que recebe a cor",
      },
    ],
  },
  ToolCall: {
    rows: [
      {
        web: "title",
        native: "title",
        note: "`string`, como o `error`: texto no nativo mora dentro de um `Text`",
      },
    ],
  },
  AILabel: {
    rows: [
      {
        web: "explanation",
        native: "explanation",
        note: "`string`, que vira a descrição da `Sheet` onde a explicação abre",
      },
      { web: "side", native: null, note: "a explicação abre numa `Sheet`, que não tem lado" },
    ],
  },
};

/* --------------------------------------------------------------------------
 * A medida
 * ----------------------------------------------------------------------- */

const nativeNameOf = (piece: string) => SIGNATURES[piece]?.nativePiece ?? piece;

/** Os literais de uma uniao de string, ou `undefined` quando o tipo nao e isso. */
export function literals(type: string): Set<string> | undefined {
  const found = new Set<string>();

  for (const part of type.split("|")) {
    const clean = part.trim();
    if (clean === "undefined" || clean === "null") continue;
    if (!/^"[^"]*"$/.test(clean)) return undefined;
    found.add(clean);
  }

  return found.size > 0 ? found : undefined;
}

/**
 * As variantes que existem de um lado so.
 *
 * E a unica familia de divergencia que se deriva sozinha: prop de mesmo nome
 * nos dois lados, com uniao de literais dos dois lados, e os conjuntos
 * diferentes. Por isso e a unica cuja cobertura a guarda cobra.
 */
export function variantGaps(web: Catalog, native: Catalog) {
  const gaps: { piece: string; prop: string; onlyWeb: string[]; onlyNative: string[] }[] = [];

  for (const piece of Object.keys(web).sort()) {
    const other = native[nativeNameOf(piece)];
    if (!other) continue;

    for (const prop of web[piece]!.props) {
      const twin = other.props.find((one) => one.name === prop.name);
      if (!twin) continue;

      const here = literals(prop.type);
      const there = literals(twin.type);
      if (!here || !there) continue;

      const onlyWeb = [...here].filter((one) => !there.has(one)).sort();
      const onlyNative = [...there].filter((one) => !here.has(one)).sort();
      if (!onlyWeb.length && !onlyNative.length) continue;

      gaps.push({ piece, prop: prop.name, onlyWeb, onlyNative });
    }
  }

  return gaps;
}

/** As pecas que perdem `size` no nativo. Derivado, e por isso escrito por maquina. */
export function sizeGone(web: Catalog, native: Catalog) {
  return Object.keys(web)
    .sort()
    .filter((piece) => {
      const other = native[nativeNameOf(piece)];
      if (!other) return false;
      if (!web[piece]!.props.some((prop) => prop.name === "size")) return false;
      return !other.props.some((prop) => prop.name === "size");
    });
}

/** As partes de um `classNames`, pela forma `Partial<Record<...>>` ou pelo objeto literal. */
export function parts(type: string): Set<string> | undefined {
  const record = /^Partial<Record<(.+), string>>$/.exec(type.trim());
  if (record) return literals(record[1]!);

  const object = /^\{(.*)\}$/.exec(type.trim());
  if (!object) return undefined;

  const names = [...object[1]!.matchAll(/(\w+)\?:/g)].map((match) => `"${match[1]}"`);
  return names.length > 0 ? new Set(names) : undefined;
}

/**
 * As pecas cujo `classNames` nao atravessa inteiro.
 *
 * Segunda familia que se deriva sozinha: o web tem `classNames`, a peca existe
 * no nativo, e la ou a prop falta, ou o conjunto de partes e outro. Quem porta
 * a tela escreve `classNames={{ indicator: ... }}` e descobre no `tsc`.
 */
export function slotGaps(web: Catalog, native: Catalog) {
  const gaps: { piece: string; absent: boolean; onlyWeb: string[]; onlyNative: string[] }[] = [];

  for (const piece of Object.keys(web).sort()) {
    const other = native[nativeNameOf(piece)];
    if (!other) continue;

    const here = web[piece]!.props.find((prop) => prop.name === "classNames");
    if (!here) continue;

    const twin = other.props.find((prop) => prop.name === "classNames");
    if (!twin) {
      gaps.push({ piece, absent: true, onlyWeb: [], onlyNative: [] });
      continue;
    }

    const mine = parts(here.type);
    const theirs = parts(twin.type);
    if (!mine || !theirs) continue;

    const onlyWeb = [...mine].filter((one) => !theirs.has(one)).sort();
    const onlyNative = [...theirs].filter((one) => !mine.has(one)).sort();
    if (!onlyWeb.length && !onlyNative.length) continue;

    gaps.push({ piece, absent: false, onlyWeb, onlyNative });
  }

  return gaps;
}

export function validate(
  signatures: Record<string, Signature>,
  web: Catalog,
  native: Catalog,
): string[] {
  const problems: string[] = [];
  const covered = new Set<string>();
  // A frase de `size` embaixo da tabela e DERIVADA, e uma linha a mao dizendo o
  // mesmo e a copia que vai divergir dela: a lista mede, a linha nao.
  const gone = new Set(sizeGone(web, native));

  for (const [piece, signature] of Object.entries(signatures)) {
    const nativePiece = signature.nativePiece ?? piece;
    const here = web[piece];
    const there = native[nativePiece];

    if (!here) {
      problems.push(
        `\`${piece}\` tem linha de assinatura e nao esta no catalogo do web.\n` +
          "    Ou a peca saiu, ou o nome mudou. A tabela esta descrevendo o que nao existe.",
      );
      continue;
    }

    if (!there) {
      problems.push(
        `\`${piece}\` aponta para \`${nativePiece}\` no nativo, que nao esta no catalogo de la.\n` +
          "    Confira o `nativePiece` da linha, ou a peca deixou de ser exportada.",
      );
      continue;
    }

    if (signature.rows.length === 0) {
      problems.push(
        `\`${piece}\` tem entrada sem nenhuma linha.\n` +
          "    Entrada vazia nao diz nada e nao e conferida: apague, ou escreva a linha.",
      );
      continue;
    }

    const seen = new Set<string>();

    for (const row of signature.rows) {
      const address = `\`${piece}\` (${row.web ?? "—"} → ${row.native ?? "—"})`;

      if (row.note.includes("\n")) {
        problems.push(
          `${address} tem quebra de linha na nota, e nota e CELULA de tabela.\n` +
            "    Markdown fecha a tabela na primeira quebra e o resto da pagina se desmancha.",
        );
      }

      if (row.web === null && row.native === null) {
        problems.push(
          `${address} nao cita prop nenhuma dos dois lados.\n` +
            "    Linha assim nao e conferivel: escreva ao menos uma ponta.",
        );
        continue;
      }

      const key = `${row.web ?? ""}>${row.native ?? ""}`;
      if (seen.has(key)) {
        problems.push(`${address} esta escrita duas vezes na mesma peca.`);
      }
      seen.add(key);

      const onWeb = row.web === null ? undefined : here.props.find((p) => p.name === row.web);
      const onNative =
        row.native === null ? undefined : there.props.find((p) => p.name === row.native);

      if (row.web !== null && !onWeb) {
        problems.push(
          `${address}: \`${piece}\` nao tem a prop \`${row.web}\` no web.\n` +
            `    O catalogo do web lista: ${here.props.map((p) => p.name).join(", ") || "(nenhuma)"}.\n` +
            "    Prop que nao existe mais ensina uma chamada que nao compila.",
        );
      }

      if (row.native !== null && !onNative) {
        problems.push(
          `${address}: \`${nativePiece}\` nao tem a prop \`${row.native}\` no nativo.\n` +
            `    O catalogo do nativo lista: ${there.props.map((p) => p.name).join(", ") || "(nenhuma)"}.\n` +
            "    Se a peca acabou de mudar, rode `bun run gen:props:nativo` antes.",
        );
      }

      // Linha que diz "so de um lado" tem que ter a prop AUSENTE do outro. Sem
      // isto a tabela manda reescrever uma chamada que ja atravessa igual.
      if (row.web !== null && row.native === null) {
        if (there.props.some((p) => p.name === row.web)) {
          problems.push(
            `${address}: a linha diz que \`${row.web}\` nao existe no nativo, e \`${nativePiece}\` TEM essa prop.\n` +
              "    Ou a peca portou depois que a linha foi escrita, ou a linha nasceu errada.\n" +
              "    A prop atravessa: apague a linha, ou reescreva o que muda nela.",
          );
        }
      }

      if (row.native !== null && row.web === null) {
        if (here.props.some((p) => p.name === row.native)) {
          problems.push(
            `${address}: a linha trata \`${row.native}\` como coisa do nativo, e \`${piece}\` TEM essa prop no web.\n` +
              "    Escreva a linha pelas duas pontas, ou apague.",
          );
        }
      }

      if (row.web !== null && row.native !== null && row.web !== row.native) {
        if (there.props.some((p) => p.name === row.web)) {
          problems.push(
            `${address}: a linha diz que \`${row.web}\` virou \`${row.native}\`, e \`${nativePiece}\` tem as DUAS.\n` +
              "    Renomeacao que nao aconteceu: confira qual das duas e a de verdade.",
          );
        }
        if (here.props.some((p) => p.name === row.native)) {
          problems.push(
            `${address}: a linha diz que \`${row.web}\` virou \`${row.native}\`, e \`${piece}\` tem as DUAS no web.\n` +
              "    Renomeacao que nao aconteceu.",
          );
        }
      }

      // Mesmo nome dos dois lados so vira linha quando a assinatura DIFERE.
      if (row.web !== null && row.web === row.native && onWeb && onNative) {
        const same = onWeb.type === onNative.type && onWeb.required === onNative.required;
        if (same) {
          problems.push(
            `${address}: \`${row.web}\` tem a MESMA assinatura nos dois lados (\`${onWeb.type}\`).\n` +
              "    A divergencia que a linha descrevia acabou: apague a linha.\n" +
              "    Tabela com linha que nao vale mais e o comeco de tabela que ninguem le.",
          );
        }
      }

      if (row.web === "size" && row.native === null && gone.has(piece)) {
        problems.push(
          `${address}: a frase derivada embaixo da tabela ja diz que \`${piece}\` perde \`size\`.\n` +
            "    Linha a mao repetindo dado derivado e a copia que envelhece: apague a linha.",
        );
      }

      covered.add(`${piece}.${row.web ?? row.native}`);
      if (row.native !== null) covered.add(`${piece}.${row.native}`);
    }
  }

  for (const gap of variantGaps(web, native)) {
    if (covered.has(`${gap.piece}.${gap.prop}`)) continue;

    const missing = [
      gap.onlyWeb.length ? `so no web: ${gap.onlyWeb.join(", ")}` : "",
      gap.onlyNative.length ? `so no nativo: ${gap.onlyNative.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("; ");

    problems.push(
      `\`${gap.piece}.${gap.prop}\` tem variante que existe de um lado so (${missing}),\n` +
        "    e nenhuma linha diz isso. Quem porta a tela escreve a variante que conhece e\n" +
        "    descobre no `tsc`, uma de cada vez. Escreva a linha em SIGNATURES.",
    );
  }

  for (const gap of slotGaps(web, native)) {
    const row = signatures[gap.piece]?.rows.find((one) => one.web === "classNames");

    if (!row) {
      const what = gap.absent
        ? "e o nativo nao tem `classNames`"
        : `e as partes divergem (${[
            gap.onlyWeb.length ? `so no web: ${gap.onlyWeb.join(", ")}` : "",
            gap.onlyNative.length ? `so no nativo: ${gap.onlyNative.join(", ")}` : "",
          ]
            .filter(Boolean)
            .join("; ")})`;
      problems.push(
        `\`${gap.piece}.classNames\` existe no web ${what},\n` +
          "    e nenhuma linha diz isso. Quem porta a tela escreve a parte que conhece e\n" +
          "    descobre no `tsc`. Escreva a linha `classNames` em SIGNATURES, ou porte a prop.",
      );
      continue;
    }

    const unnamed = [...gap.onlyWeb, ...gap.onlyNative]
      .map((part) => part.slice(1, -1))
      .filter((part) => !row.note.includes(`\`${part}\``));
    if (unnamed.length > 0) {
      problems.push(
        `\`${gap.piece}\` (classNames): a nota nao nomeia ${unnamed.map((part) => `\`${part}\``).join(", ")}.\n` +
          "    Parte que falta de um lado se escreve pelo nome, com o motivo, para quem porta nao procurar.",
      );
    }
  }

  return problems;
}

/* --------------------------------------------------------------------------
 * O texto
 * ----------------------------------------------------------------------- */

function inWords(items: string[]) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

export function section(web: Catalog, native: Catalog): string {
  const pieces = Object.keys(SIGNATURES).sort();
  const rows = pieces.reduce((sum, piece) => sum + SIGNATURES[piece]!.rows.length, 0);
  const gone = sizeGone(web, native);

  const intro =
    `**${rows} divergências de assinatura em ${pieces.length} peças.** As duas regras acima ` +
    "(tudo controlado, lista por `items`) valem em todo o catálogo; o que está aqui é o que " +
    "sobra delas — prop que muda de nome, tipo que muda de forma, e variante que existe de um " +
    "lado só. `—` quer dizer que não há prop equivalente daquele lado. Todas as três colunas " +
    "são conferidas contra os dois pacotes por `bun run check:assinatura`.";

  const table = [
    "| Peça | No web | No React Native | O que muda na chamada |",
    "| --- | --- | --- | --- |",
  ];

  for (const piece of pieces) {
    const signature = SIGNATURES[piece]!;
    const nativePiece = signature.nativePiece;
    const name = nativePiece ? `\`${piece}\` → \`${nativePiece}\`` : `\`${piece}\``;

    for (const row of signature.rows) {
      const left = row.web === null ? "—" : `\`${row.web}\``;
      const right = row.native === null ? "—" : `\`${row.native}\``;
      table.push(`| ${name} | ${left} | ${right} | ${row.note} |`);
    }
  }

  const size =
    `Fora da tabela, uma perda que se repete: **${gone.length} peças perdem \`size\` no ` +
    `nativo** — ${inWords(gone.map((piece) => `\`${piece}\``))}. Alvo de toque não encolhe, e ` +
    "`comfortable` é a única altura. Esta lista é medida a cada geração, e não escrita à mão.";

  return `${intro}\n\n${table.join("\n")}\n\n${size}`;
}

function withReplacedSection(markdown: string, title: string, body: string) {
  const target = new RegExp(`(^|\\n)${title}\\n[\\s\\S]*?(?=\\n## |$)`);
  if (!target.test(markdown)) {
    throw new Error(
      `Nao achei a secao "${title}" em ${GUIDE}. Ela e o lugar onde a tabela e publicada:\n` +
        "escreva o titulo no arquivo, ou corrija o titulo aqui.",
    );
  }
  return markdown.replace(target, (_, before: string) => `${before}${title}\n\n${body}\n`);
}

/* --------------------------------------------------------------------------
 * Rodar
 * ----------------------------------------------------------------------- */

if (import.meta.main) {
  const checking = process.argv.includes("--check");

  const web = JSON.parse(readFileSync(WEB_CATALOG, "utf8")) as Catalog;
  const native = JSON.parse(readFileSync(NATIVE_CATALOG, "utf8")) as Catalog;

  countAtLeast(`pecas em ${WEB_CATALOG}`, Object.keys(web).length, 150);
  countAtLeast(`pecas em ${NATIVE_CATALOG}`, Object.keys(native).length, 60);

  const problems = validate(SIGNATURES, web, native);

  if (problems.length > 0) {
    console.error(`${problems.length} divergencia(s) entre a tabela de assinatura e o codigo:\n`);
    for (const problem of problems) console.error(`  ${problem}\n`);
    console.error(
      "A tabela vive em scripts/assinatura-nativa.ts e e publicada em\n" +
        `${GUIDE}. Ela e o que quem porta uma tela le em vez de abrir a fonte:\n` +
        "linha errada la custa mais do que linha nenhuma.",
    );
    process.exit(1);
  }

  const before = readFileSync(GUIDE, "utf8");
  const after = withReplacedSection(before, SECTION_TITLE, section(web, native));
  const rows = Object.values(SIGNATURES).reduce((sum, one) => sum + one.rows.length, 0);

  if (checking) {
    if (before !== after) {
      console.error(`${GUIDE} esta fora da tabela de assinatura.`);
      console.error("Rode `bun run gen:assinatura` e comite o resultado.");
      process.exit(1);
    }
    console.log(
      `${rows} divergencias de assinatura conferidas contra os dois catalogos, ` +
        `em ${Object.keys(SIGNATURES).length} pecas.`,
    );
  } else {
    if (before !== after) writeFileSync(GUIDE, after);
    console.log(`${GUIDE}: ${rows} divergencias em ${Object.keys(SIGNATURES).length} pecas.`);
  }
}
