#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

export type Severity = "critico" | "serio" | "moderado" | "menor";

export type Rule = {
  /** The rule's short name, the same one the suppression comment and the judgment JSON cite. */
  id: string;
  /** The severity, which decides the weight in the score. */
  severity: Severity;
  /** `mecanica` comes from the script; `julgamento` only comes in through the JSON the agent writes. */
  kind: "mecanica" | "julgamento";
  /** `arquivo` weighs on the file's score; `projeto` is deducted straight from the final score. */
  scope: "arquivo" | "projeto";
  /** The rule in one sentence, as it appears in the report. */
  title: string;
  /** What to write instead. */
  fix: string;
  /** The documentation passage the rule came from. */
  source: string;
};

export type Finding = {
  /** The rule's `id`. */
  rule: string;
  /** The file path, relative to the audit root. */
  file: string;
  /** The line, counted from 1. */
  line: number;
  /** What was found, with the excerpt. */
  message: string;
};

export type Dismissal = {
  /** The `id` of the dismissed finding's rule. */
  rule: string;
  /** The dismissed finding's file. */
  file: string;
  /** The dismissed finding's line. */
  line: number;
  /** Why the finding does not hold. Without a reason, the dismissal is not accepted. */
  reason: string;
};

export type SourceFile = {
  /** The path, which appears in the report. */
  path: string;
  /** The file's text. */
  source: string;
};

export type AuditInput = {
  /** The screen files. */
  files: SourceFile[];
  /** The app's `package.json` files, from the closest to the monorepo root's, to check the optional peers. */
  manifests?: SourceFile[];
  /** The judgment findings the agent wrote. */
  findings?: Finding[];
  /** The mechanical findings the agent dismissed, each with its reason. */
  dismissals?: Dismissal[];
};

export type FileScore = {
  /** The file path. */
  file: string;
  /** `web` or `native`, by what the file imports. */
  platform: Platform;
  /** The file's score, from 0 to 100. */
  score: number;
  /** How many findings weighed on the score. */
  findings: number;
};

export type Report = {
  /** The final score, from 0 to 100. */
  score: number;
  /** The score's band, in words. */
  verdict: string;
  /** The score of each audited file, in path order. */
  files: FileScore[];
  /** The files read and left out, for having neither JSX nor a library import. */
  skipped: string[];
  /** The findings that weighed, in file, line and rule order. */
  findings: Finding[];
  /** The findings a suppression comment or a dismissal took out of the count. */
  waived: (Finding & { reason: string })[];
  /** What could not be checked or was refused: missing manifest, finding for a file outside the audit. */
  notes: string[];
};

type Platform = "web" | "native";

export const WEIGHTS: Record<Severity, number> = { critico: 10, serio: 5, moderado: 3, menor: 1 };
export const CAP = 3;

const SEVERITY_LABEL: Record<Severity, string> = {
  critico: "critical",
  serio: "serious",
  moderado: "moderate",
  menor: "minor",
};

export const RULES: Rule[] = [
  {
    id: "cor-literal",
    severity: "critico",
    kind: "mecanica",
    scope: "arquivo",
    title: "Literal color instead of a theme role",
    fix: "Use the role: `bg-surface`, `text-fg-muted`, `border-border`, `text-danger-text`, `bg-accent` with `text-accent-fg`. In native, a series color comes from `PALETTE`.",
    source: "SKILL.md, What never to do; convencoes.md, The vocabulary",
  },
  {
    id: "nome-acessivel",
    severity: "critico",
    kind: "mecanica",
    scope: "arquivo",
    title: "Control without an accessible name",
    fix: "`IconButton` with `label`, in both packages. An icon-only button is `IconButton`, and not `Button` with an icon inside.",
    source: "reference/a11y.md, Accessible name; reference/components.md, Icon-only button",
  },
  {
    id: "z-index-numerico",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Numeric z-index",
    fix: "`z-[var(--rc-z-sticky)]` for what sticks on scroll, `z-[var(--rc-z-base)]` to go back to the plane. The middle steps belong to the pieces.",
    source: "SKILL.md, What never to do; convencoes.md, eight stacking steps",
  },
  {
    id: "peca-reescrita",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Piece rewritten by hand when it exists in the catalog",
    fix: "The catalog piece the message names. The choice table in `reference/components.md` breaks ties between neighbors.",
    source: "SKILL.md, Check whether the piece already exists; reference/components.md",
  },
  {
    id: "campo-sem-rotulo",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Field without a label",
    fix: "`Field` with `FieldLabel`, or the field inside `FormField` with `label`. In native, `Field` with `label`. `placeholder` is a format example, not a label.",
    source: "reference/a11y.md, why placeholder does not work; reference/texto.md, Label",
  },
  {
    id: "rotulo-fora-do-controle",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Checkbox, Radio or Switch label in an element beside it",
    fix: "Pass the text as a child: `<Checkbox>ISS retido na fonte</Checkbox>`. The piece wraps itself in a `<label>`.",
    source: "convencoes.md, A control's label comes as a child",
  },
  {
    id: "imagem-sem-alt",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Image without `alt`",
    fix: '`alt` that says what the image shows, or `alt=""` when it only decorates.',
    source: "reference/a11y.md, Pitfalls by component",
  },
  {
    id: "elemento-clicavel",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "`onClick` on an element that is not a control",
    fix: "`Button` to act, `Link` to go. A `div` with `onClick` does not enter the Tab order.",
    source: "reference/a11y.md, Focus and keyboard",
  },
  {
    id: "tabindex-positivo",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Positive `tabIndex`",
    fix: "Fix the DOM order. `tabIndex` only `0` or `-1`.",
    source: "reference/a11y.md, Focus and keyboard",
  },
  {
    id: "foco-apagado",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "`outline-none` without restoring the focus ring",
    fix: "Next to `outline-none`, `focus-visible:ring-2 focus-visible:ring-ring`.",
    source: "SKILL.md, What never to do; reference/a11y.md, Focus and keyboard",
  },
  {
    id: "formulario-sem-zod",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Form built without `useZodForm`",
    fix: "`Form` and `FormField` from `@rivocode/ui/form`, with the zod schema in `useZodForm(schema)`.",
    source: "reference/forms.md",
  },
  {
    id: "useform-direto",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "react-hook-form's `useForm` called directly",
    fix: "`useZodForm(schema)`: wires the zod resolver and takes the type from the schema.",
    source: "reference/forms.md",
  },
  {
    id: "dinheiro-float",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Money as a floating-point number",
    fix: "`CurrencyInput`, which goes in and out in integer cents, with `z.number().int()` in the schema; `toCents` to convert text.",
    source: "reference/forms.md, Money is CurrencyInput; convencoes.md, Formatting the number",
  },
  {
    id: "dinheiro-escrito",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Money formatted by hand",
    fix: "`currencyShort` in indicators, tables and axes; `currency` where the cent is the subject. Both come from the root.",
    source: "SKILL.md, Money comes out abbreviated",
  },
  {
    id: "documento-sem-validador",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "CPF or CNPJ checked without `isValidCpf` or `isValidCnpj`",
    fix: "`z.string().refine(isValidCnpj, 'CNPJ inválido')`. Both check the digit, accept a mask and the alphanumeric CNPJ.",
    source: "reference/forms.md; convencoes.md, Formatting the number",
  },
  {
    id: "mascara-a-mao",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Mask written with `replace`",
    fix: "`MaskedInput` with `mask` (`cpf`, `cnpj`, `telefone`, `cep`, `boleto`), or `applyMask` for a table cell.",
    source: "convencoes.md, Formatting the number",
  },
  {
    id: "pix-qr-caseiro",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "QR or Pix built by hand",
    fix: "`PixCode` to charge, with the copy-and-paste code from `buildPixPayload`; `QRCode` for any other link. In native, both come from `@rivocode/ui-native/chart`.",
    source: "reference/components.md, Charge by Pix; convencoes.md, Pix has its three",
  },
  {
    id: "import-caminho-errado",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Import through the wrong path",
    fix: "The path the message names. Form, chart, AI, drag and editor live in subpaths; in native, each peer has its own door.",
    source: "convencoes.md, The four subpaths; The native package, and its five subpaths",
  },
  {
    id: "recharts-direto",
    severity: "menor",
    kind: "mecanica",
    scope: "arquivo",
    title: "Recharts imported directly",
    fix: "The marks the theme dresses come from `@rivocode/ui/chart`, inside `ChartContainer`.",
    source: "convencoes.md, `@rivocode/ui/chart`",
  },
  {
    id: "portal-a-mao",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Provider or portal mounted by hand",
    fix: "Nothing: `RivoProvider` already mounts the tooltip provider, the toast wiring and the portal container.",
    source: "SKILL.md, The Provider, once, at the root",
  },
  {
    id: "altura-cravada",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Hardcoded control height",
    fix: "`h-[var(--rc-control-md)]`, with `sm` and `lg`: the height comes from the density.",
    source: "SKILL.md, Control height comes from the density",
  },
  {
    id: "descendente-arbitrario",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Piece part reached through a descendant variant",
    fix: "`classNames={{ part: '…' }}`, with the name from the Parts section of the piece's page.",
    source: "SKILL.md, Below the root, dress the part by name",
  },
  {
    id: "movimento-literal",
    severity: "menor",
    kind: "mecanica",
    scope: "arquivo",
    title: "Literal duration or curve",
    fix: "`duration-fast`, `duration-base`, `duration-slow` and `ease-rc`, which go to zero with reduce motion.",
    source: "convencoes.md, Motion has intent names",
  },
  {
    id: "consulta-sem-finais",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Listing or chart without the four endings",
    fix: "`isLoading`, `isError` with `onRetry`, and `empty` with title and description.",
    source: "SKILL.md, Every listing has four endings; reference/components.md",
  },
  {
    id: "texto-sem-acento",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Screen text without accents",
    fix: "The text the person reads carries its accents.",
    source: "reference/texto.md, Form",
  },
  {
    id: "texto-em-ingles",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Screen text in English",
    fix: "Code in English, content in PT-BR. Ecosystem terms are not translated.",
    source: "SKILL.md, What never to do; reference/texto.md",
  },
  {
    id: "peer-faltando",
    severity: "serio",
    kind: "mecanica",
    scope: "projeto",
    title: "Subpath peer missing from package.json",
    fix: "Install the peer the subpath requires. Without it the build breaks, or the piece does not mount.",
    source: "convencoes.md, The four subpaths; The native package",
  },
  {
    id: "escolha-de-peca",
    severity: "serio",
    kind: "julgamento",
    scope: "arquivo",
    title: "Wrong catalog piece for the situation",
    fix: "The row of the choice table in `reference/components.md` that matches the situation.",
    source: "reference/components.md, Choices that usually go wrong",
  },
  {
    id: "validacao-a-mao",
    severity: "serio",
    kind: "julgamento",
    scope: "arquivo",
    title: "Form that validates with state and `if`",
    fix: "The zod schema in `useZodForm`, which validates and gives the type.",
    source: "reference/forms.md",
  },
  {
    id: "cor-sozinha",
    severity: "serio",
    kind: "julgamento",
    scope: "arquivo",
    title: "Status told by color alone",
    fix: 'A word or icon next to the tone: the `Badge` says "Vencida".',
    source: "reference/a11y.md, Never color alone",
  },
  {
    id: "texto-generico",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Text that does not say what happens",
    fix: "A button with verb and object, an error that names who failed and what to do, an empty state that is a door.",
    source: "reference/texto.md",
  },
  {
    id: "finais-da-consulta",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Query that only draws the happy path",
    fix: "Loading, error with a way out and empty with a description, also outside `DataTable`.",
    source: "reference/components.md, Every query has four endings",
  },
  {
    id: "titulos-fora-de-ordem",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Headings that skip a level",
    fix: "One `h1` per page and then `h2`, `h3` in order; the size changes through `size` on `Heading`.",
    source: "reference/a11y.md, Heading order",
  },
  {
    id: "passo-sem-nome",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Wizard step called by its number",
    fix: 'A noun name that says the step\'s decision: "Cliente", "Serviço", "Revisão". A step only called "Passo 2" is a scroll, and the content fits in a single form.',
    source: "reference/fluxo.md, One screen or several",
  },
  {
    id: "dado-sem-mascara",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Document, phone or CEP field in a plain Input",
    fix: '`MaskedInput` with `mask="cpf"`, `"cnpj"`, `"telefone"` or `"placa"`, and `PostalCodeField` for CEP. The mask punctuates, brings up the numeric keyboard, and `onValueChange` delivers the raw value.',
    source: "SKILL.md, The field comes from the data; reference/components.md",
  },
  {
    id: "wizard-sem-dependencia",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Wizard for what is just long",
    fix: "A single form, in sections with `Fieldset`, and the rare in a `Collapsible`. Steps only when a stage depends on the previous one.",
    source: "reference/fluxo.md, Wizard or single form: the check",
  },
  {
    id: "confirmacao-em-reversivel",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Confirmation for what could have been undone",
    fix: 'Do it right away and offer "Desfazer" in the toast, with `useToast`\'s `actionProps`. `AlertDialog` is for what cannot be undone.',
    source: "reference/fluxo.md, Confirm, undo, or nothing",
  },
  {
    id: "destrutivo-sem-protecao",
    severity: "serio",
    kind: "julgamento",
    scope: "arquivo",
    title: "Irreversible action without confirmation or undo",
    fix: "`AlertDialog` that names the object and says the effect, or, if it can be reversed, undo in the toast.",
    source: "reference/fluxo.md, Confirm, undo, or nothing",
  },
  {
    id: "rascunho-que-some",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Task that loses what was typed",
    fix: "A single form beneath the steps, and a submit error that keeps the fields. Storing a draft in the browser is a project decision, and never with sensitive data.",
    source: "reference/fluxo.md, The well-made wizard",
  },
  {
    id: "sucesso-silencioso",
    severity: "menor",
    kind: "julgamento",
    scope: "arquivo",
    title: "Action that finishes without saying it finished",
    fix: 'A toast with what happened and the next step: "Nota 4816 emitida. Ver PDF".',
    source: "reference/fluxo.md, What makes the product smart",
  },
  {
    id: "provider-ausente",
    severity: "critico",
    kind: "julgamento",
    scope: "projeto",
    title: "Tree without `RivoProvider` at the root",
    fix: "One `RivoProvider` at the app root, and no tooltip, toast or portal provider by hand.",
    source: "SKILL.md, The Provider, once, at the root",
  },
];

const RULE_BY_ID = new Map(RULES.map((rule) => [rule.id, rule]));

export const ENTRIES: Record<string, { names: string[]; alsoAtRoot: string[] }> = {
  "@rivocode/ui-native/ai": {
    names: ["AILabel", "Conversation", "Message", "PromptInput", "ToolCall"],
    alsoAtRoot: [],
  },
  "@rivocode/ui-native/chart": {
    names: [
      "ChartBar",
      "ChartContainer",
      "ChartDonut",
      "ChartFunnel",
      "ChartGauge",
      "ChartHeatmap",
      "ChartLine",
      "ChartRadial",
      "ChartTreemap",
      "PALETTE",
      "PixCode",
      "QRCode",
      "SignaturePad",
      "isSignatureEmpty",
      "signatureToSvg",
    ],
    alsoAtRoot: [],
  },
  "@rivocode/ui-native/clipboard": {
    names: ["Clipboard"],
    alsoAtRoot: [],
  },
  "@rivocode/ui-native/dnd": {
    names: ["SortableList"],
    alsoAtRoot: [],
  },
  "@rivocode/ui-native/file-upload": {
    names: ["FileUpload", "FileUploadItem", "FileUploadList"],
    alsoAtRoot: [],
  },
  "@rivocode/ui-native/form": {
    names: ["Form", "FormField", "forChecked", "forDate", "forText", "forValue", "useZodForm"],
    alsoAtRoot: [],
  },
  "@rivocode/ui/ai": {
    names: ["AILabel", "Conversation", "Message", "PromptInput", "ToolCall", "aiLabelVariants"],
    alsoAtRoot: [],
  },
  "@rivocode/ui/chart": {
    names: [
      "Area",
      "AreaChart",
      "Bar",
      "BarChart",
      "CartesianGrid",
      "Cell",
      "ChartAreaGradient",
      "ChartContainer",
      "ChartDonut",
      "ChartFunnel",
      "ChartGauge",
      "ChartHeatmap",
      "ChartLegend",
      "ChartLegendContent",
      "ChartRadial",
      "ChartTooltip",
      "ChartTooltipContent",
      "ChartTreemap",
      "ChartXAxis",
      "ChartYAxis",
      "LabelList",
      "Line",
      "LineChart",
      "Pie",
      "PieChart",
      "PolarAngleAxis",
      "PolarGrid",
      "PolarRadiusAxis",
      "Radar",
      "RadarChart",
      "RadialBar",
      "RadialBarChart",
      "Rectangle",
      "ReferenceArea",
      "ReferenceLine",
      "Scatter",
      "ScatterChart",
      "Sparkline",
      "XAxis",
      "YAxis",
      "ZAxis",
      "areaGradient",
      "compact",
      "compactWords",
      "currency",
      "currencyShort",
      "currencyShortWords",
      "dayMonth",
      "formatters",
      "integer",
      "monthShort",
      "percent",
      "useChartMotion",
      "useSeriesToggle",
    ],
    alsoAtRoot: [
      "compact",
      "compactWords",
      "currency",
      "currencyShort",
      "currencyShortWords",
      "dayMonth",
      "formatters",
      "integer",
      "monthShort",
      "percent",
    ],
  },
  "@rivocode/ui/dnd": {
    names: ["Kanban", "SortableList"],
    alsoAtRoot: [],
  },
  "@rivocode/ui/editor": {
    names: ["RichTextEditor", "RichTextView"],
    alsoAtRoot: [],
  },
  "@rivocode/ui/form": {
    names: [
      "Form",
      "FormField",
      "forChecked",
      "forDate",
      "forValue",
      "useZodForm",
    ],
    alsoAtRoot: [],
  },
};

const ASSET_PATHS = [
  /^@rivocode\/ui\/(?:styles\.css|fonts\.css|preset|tokens\/.+)$/,
  /^@rivocode\/ui-native\/(?:tokens|contrast|theme\.css)$/,
];

export const PEERS: Record<string, { always: string[]; withZod?: string[] }> = {
  "@rivocode/ui": { always: ["lucide-react", "react", "react-dom", "tailwindcss"] },
  "@rivocode/ui-native": {
    always: [
      "nativewind",
      "react",
      "react-native",
      "react-native-keyboard-controller",
      "react-native-reanimated",
    ],
  },
  "@rivocode/ui/form": { always: ["react-hook-form"], withZod: ["zod", "@hookform/resolvers"] },
  "@rivocode/ui/chart": { always: ["recharts"] },
  "@rivocode/ui/dnd": { always: ["@dnd-kit/core", "@dnd-kit/sortable"] },
  "@rivocode/ui/editor": {
    always: [
      "@tiptap/react",
      "@tiptap/pm",
      "@tiptap/core",
      "@tiptap/starter-kit",
      "@tiptap/extensions",
    ],
  },
  "@rivocode/ui-native/form": {
    always: ["react-hook-form"],
    withZod: ["zod", "@hookform/resolvers"],
  },
  "@rivocode/ui-native/chart": { always: ["react-native-svg"] },
  "@rivocode/ui-native/clipboard": { always: ["expo-clipboard"] },
  "@rivocode/ui-native/file-upload": { always: ["expo-document-picker"] },
};

export const ACCENTS: Record<string, string> = {
  nao: "não",
  acao: "ação",
  acoes: "ações",
  botao: "botão",
  botoes: "botões",
  pagina: "página",
  paginas: "páginas",
  padrao: "padrão",
  padroes: "padrões",
  opcao: "opção",
  opcoes: "opções",
  codigo: "código",
  usuario: "usuário",
  usuarios: "usuários",
  voce: "você",
  ja: "já",
  tambem: "também",
  alem: "além",
  apos: "após",
  atraves: "através",
  proxima: "próxima",
  proximo: "próximo",
  proprio: "próprio",
  propria: "própria",
  unico: "único",
  unica: "única",
  numero: "número",
  numeros: "números",
  minimo: "mínimo",
  maximo: "máximo",
  titulo: "título",
  titulos: "títulos",
  rotulo: "rótulo",
  icone: "ícone",
  conteudo: "conteúdo",
  area: "área",
  invalido: "inválido",
  obrigatoria: "obrigatória",
  obrigatorio: "obrigatório",
  automatico: "automático",
  automatica: "automática",
  grafico: "gráfico",
  graficos: "gráficos",
  possivel: "possível",
  impossivel: "impossível",
  disponivel: "disponível",
  indisponivel: "indisponível",
  responsavel: "responsável",
  visivel: "visível",
  util: "útil",
  uteis: "úteis",
  dificil: "difícil",
  facil: "fácil",
  referencia: "referência",
  preferencia: "preferência",
  preferencias: "preferências",
  experiencia: "experiência",
  sequencia: "sequência",
  frequencia: "frequência",
  periodo: "período",
  periodos: "períodos",
  historico: "histórico",
  descricao: "descrição",
  selecao: "seleção",
  navegacao: "navegação",
  informacao: "informação",
  informacoes: "informações",
  aplicacao: "aplicação",
  emissao: "emissão",
  atencao: "atenção",
  posicao: "posição",
  validacao: "validação",
  configuracao: "configuração",
  instalacao: "instalação",
  documentacao: "documentação",
  organizacao: "organização",
  operacao: "operação",
  duracao: "duração",
  direcao: "direção",
  ate: "até",
  tres: "três",
  varias: "várias",
  varios: "vários",
  ultima: "última",
  ultimo: "último",
  criterio: "critério",
  necessario: "necessário",
  necessaria: "necessária",
  cabecalho: "cabeçalho",
  espaco: "espaço",
  servico: "serviço",
  servicos: "serviços",
  preco: "preço",
  precos: "preços",
  saida: "saída",
  familia: "família",
  visao: "visão",
  versao: "versão",
  decisao: "decisão",
  revisao: "revisão",
  so: "só",
  entao: "então",
  formulario: "formulário",
  inicio: "início",
  rapido: "rápido",
  metodo: "método",
  calendario: "calendário",
  relatorio: "relatório",
  comentario: "comentário",
  diferenca: "diferença",
  mudanca: "mudança",
  mudancas: "mudanças",
  seguranca: "segurança",
  ausencia: "ausência",
  tecnico: "técnico",
  ninguem: "ninguém",
  alguem: "alguém",
  porem: "porém",
  contem: "contém",
  indice: "índice",
  pais: "país",
  atras: "atrás",
  avancar: "avançar",
  comecar: "começar",
  ocorrencia: "ocorrência",
};

const AMBIGUOUS = new Set(["pais", "contem"]);

const ENGLISH = new Set([
  "the",
  "your",
  "you",
  "please",
  "and",
  "with",
  "this",
  "that",
  "save",
  "cancel",
  "submit",
  "delete",
  "loading",
  "search",
  "settings",
  "next",
  "previous",
  "back",
  "close",
  "sign",
  "welcome",
  "something",
  "went",
  "wrong",
  "error",
  "results",
  "required",
  "password",
  "username",
  "confirm",
  "edit",
  "update",
  "create",
  "send",
  "upload",
  "download",
  "yes",
  "invalid",
  "success",
  "failed",
  "try",
  "again",
  "select",
  "choose",
  "here",
  "click",
  "hide",
]);

const MONEY_WORDS = new Set([
  "preco",
  "precos",
  "price",
  "prices",
  "valor",
  "valores",
  "amount",
  "amounts",
  "total",
  "totais",
  "totals",
  "subtotal",
  "money",
  "saldo",
  "saldos",
  "balance",
  "fee",
  "fees",
  "tarifa",
  "tarifas",
  "desconto",
  "descontos",
  "discount",
  "salario",
  "salary",
  "custo",
  "custos",
  "cost",
  "costs",
  "pagamento",
  "pagamentos",
  "payment",
  "payments",
  "fatura",
  "faturas",
  "invoice",
  "invoices",
  "cobranca",
  "cobrancas",
  "reais",
  "brl",
]);

const NOT_MONEY_WORDS = new Set([
  "page",
  "pages",
  "pagina",
  "paginas",
  "count",
  "qty",
  "quantity",
  "quantidade",
  "index",
  "length",
  "id",
  "percent",
  "percentual",
  "porcentagem",
  "centavo",
  "centavos",
  "cent",
  "cents",
  "notas",
  "itens",
  "items",
  "linhas",
  "rows",
  "registros",
  "dias",
  "days",
]);

function wordsOf(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function talksMoney(text: string): boolean {
  const words = wordsOf(text);
  return (
    words.some((word) => MONEY_WORDS.has(word)) && !words.some((word) => NOT_MONEY_WORDS.has(word))
  );
}

const WRITTEN_MONEY = /R\$\s?(?:\d|\$\{)|R\$\s*$/;

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|mauve|olive|mist|taupe";
const COLOR_UTILITY =
  "bg|text|border|border-[xytrblse]|ring|ring-offset|outline|fill|stroke|divide|from|via|to|shadow|inset-shadow|drop-shadow|decoration|placeholder|caret|accent";
const PALETTE_CLASS = new RegExp(
  `^(?:${COLOR_UTILITY})-(?:(?:${PALETTE})-(?:50|[1-9]00|950)|white|black)(?:\\/(?:\\d+|\\[[^\\]]+\\]))?$`,
);
const COLOR_NAMES =
  "white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|gold|brown|navy|teal|cyan|magenta|lime|maroon|olive|aqua|fuchsia|crimson|tomato|coral|salmon|indigo|violet";
const ARBITRARY_NAMED = new RegExp(
  `^(?:${COLOR_UTILITY})-\\[(?:color:)?(?:${COLOR_NAMES})\\](?:\\/(?:\\d+|\\[[^\\]]+\\]))?$`,
  "i",
);
const HEX = /^\s*#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\s*$/i;
const COLOR_FUNCTION = /(?:^|[^\w-])((?:rgba?|hsla?|oklch|oklab|hwb)\(\s*[\d.])/i;
const NAMED_COLOR =
  /\b(?:color|backgroundColor|borderColor|background|fill|stroke|tintColor|shadowColor|placeholderTextColor)\s*[:=]\s*\{?\s*["'](white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|gold|brown|navy|teal|cyan|magenta)["']/g;

const CONTROLS_WEB = new Set([
  "Input",
  "Textarea",
  "MaskedInput",
  "CurrencyInput",
  "PasswordInput",
  "NumberField",
  "DatePicker",
  "DateRangePicker",
  "TimeField",
  "TagsInput",
]);
const CONTROLS_NATIVE = new Set([
  "Input",
  "Textarea",
  "MaskedInput",
  "CurrencyInput",
  "PasswordInput",
  "NumberField",
  "DatePicker",
  "TimeField",
]);
const SIZED_CONTROLS = new Set([
  "Button",
  "IconButton",
  "Input",
  "Select",
  "SelectTrigger",
  "Combobox",
  "NumberField",
  "SearchInput",
  "PasswordInput",
  "MaskedInput",
  "CurrencyInput",
  "DatePicker",
  "Toggle",
  "TimeField",
]);
const LABEL_WRAPPERS = new Set(["Field", "FormField", "label"]);
const NON_INTERACTIVE = new Set([
  "div",
  "span",
  "li",
  "p",
  "td",
  "tr",
  "section",
  "article",
  "img",
  "header",
  "footer",
  "main",
  "aside",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "svg",
]);

const RAW_TAGS: Record<string, string> = {
  button: "`Button` (or `IconButton`, when it has only an icon)",
  select: "`Select` (long list or one from the server: `Combobox`)",
  textarea: "`Textarea`",
  table: "`DataTable` for a listing, or `Table` built by hand",
  dialog: "`Dialog` (destructive confirmation: `AlertDialog`)",
  progress: "`Progress`",
  meter: "`Meter`",
  hr: "`Separator`",
  details: "`Accordion` or `Collapsible`",
};

const INPUT_TYPES: Record<string, string> = {
  checkbox: "`Checkbox`",
  radio: "`RadioGroup` with `Radio`",
  range: "`Slider`",
  search: "`SearchInput`",
  password: "`PasswordInput`",
  file: "`FileUpload`",
  date: "`DatePicker`",
  "datetime-local": "`DatePicker` with `TimeField`",
  time: "`TimeField`",
  number: "`NumberField` (money: `CurrencyInput`)",
  color: "`ColorPicker`",
  submit: '`Button type="submit"`',
  button: "`Button`",
};

const ROLES: Record<string, string> = {
  dialog: "`Dialog`",
  alertdialog: "`AlertDialog`",
  tooltip: "`Tooltip`",
  switch: "`Switch`",
  tablist: "`Tabs` with `TabList`",
  progressbar: "`Progress`",
  menu: "`Menu`",
  combobox: "`Combobox`",
};

const NATIVE_PRIMITIVES: Record<string, string> = {
  Button: "`@rivocode/ui-native`'s `Button`",
  TextInput: "`Input` (or `Textarea`, `PasswordInput`, `CurrencyInput`)",
  Switch: "`@rivocode/ui-native`'s `Switch`",
  Modal: "`Dialog` or `Sheet`",
  ActivityIndicator: "`Spinner`",
  TouchableOpacity: "`Button` or `IconButton`",
  TouchableHighlight: "`Button` or `IconButton`",
  TouchableWithoutFeedback: "`Button`, `IconButton` or `Pressable` with `accessibilityRole`",
  TouchableNativeFeedback: "`Button` or `IconButton`",
};

const QR_LIBRARIES = new Set([
  "qrcode",
  "qrcode.react",
  "react-qr-code",
  "qrcode-generator",
  "qr-code-styling",
  "react-native-qrcode-svg",
  "react-qrcode-logo",
  "qrcode-svg",
]);

const HAND_PROVIDERS =
  /^(?:TooltipProvider|ToastProvider|ToastViewport|Tooltip\.Provider|Toast\.Provider|Toast\.Viewport)$/;

const TEXT_ATTRIBUTE =
  /^(?:aria-label|aria-description|aria-valuetext|title|placeholder|alt|label|description|accessibilityLabel|accessibilityHint|[a-z][A-Za-z]*(?:Label|Message|Text|Title|Description))$/;

const IGNORE = /rivocode-audit-ignore\s+([a-z][a-z-]*)\s*:\s*(\S[^*\n]*)/g;

type Attribute = {
  name: string;
  kind: "string" | "expression" | "bare" | "spread";
  value: string;
  start: number;
  end: number;
};

type Child =
  | { kind: "text"; value: string; start: number }
  | { kind: "element"; node: number }
  | { kind: "expression"; value: string; start: number };

type JsxNode = {
  index: number;
  name: string;
  attrs: Attribute[];
  start: number;
  end: number;
  parent: number;
  selfClosing: boolean;
  children: Child[];
};

type Literal = { value: string; start: number };

type Parsed = {
  elements: JsxNode[];
  literals: Literal[];
  comments: Literal[];
  code: string;
  bare: string;
};

const KEYWORDS_BEFORE_EXPRESSION = new Set([
  "return",
  "typeof",
  "case",
  "in",
  "of",
  "new",
  "delete",
  "void",
  "throw",
  "else",
  "do",
  "yield",
  "await",
  "default",
  "extends",
]);

export function parse(source: string): Parsed {
  const src = source;
  const size = src.length;
  const elements: JsxNode[] = [];
  const literals: Literal[] = [];
  const comments: Literal[] = [];
  const blanked = src.split("");
  const bare = src.split("");
  const stack: number[] = [];

  const blank = (from: number, to: number) => {
    for (let at = from; at < to; at++) {
      if (blanked[at] !== "\n") blanked[at] = " ";
      if (bare[at] !== "\n") bare[at] = " ";
    }
  };
  const blankLiteral = (from: number, to: number) => {
    for (let at = from; at < to; at++) if (bare[at] !== "\n") bare[at] = " ";
  };

  const readString = (start: number, quote: string): number => {
    let at = start + 1;
    while (at < size) {
      const char = src[at]!;
      if (char === "\\") {
        at += 2;
        continue;
      }
      if (char === quote || char === "\n") break;
      at += 1;
    }
    literals.push({ value: src.slice(start + 1, at), start: start + 1 });
    blankLiteral(start + 1, at);
    return at + 1;
  };

  const readTemplate = (start: number): number => {
    let at = start + 1;
    let from = at;
    while (at < size) {
      const char = src[at]!;
      if (char === "\\") {
        at += 2;
        continue;
      }
      if (char === "`") {
        literals.push({ value: src.slice(from, at), start: from });
        blankLiteral(from, at);
        return at + 1;
      }
      if (char === "$" && src[at + 1] === "{") {
        literals.push({ value: src.slice(from, at), start: from });
        blankLiteral(from, at);
        at = readCode(at + 2, true);
        from = at;
        continue;
      }
      at += 1;
    }
    return at;
  };

  const readRegex = (start: number): number => {
    let at = start + 1;
    let inClass = false;
    while (at < size) {
      const char = src[at]!;
      if (char === "\\") {
        at += 2;
        continue;
      }
      if (char === "\n") return start + 1;
      if (char === "[") inClass = true;
      else if (char === "]") inClass = false;
      else if (char === "/" && !inClass) {
        at += 1;
        while (at < size && /[a-z]/i.test(src[at]!)) at += 1;
        return at;
      }
      at += 1;
    }
    return at;
  };

  const readComment = (start: number): number => {
    if (src[start + 1] === "/") {
      const newline = src.indexOf("\n", start);
      const end = newline < 0 ? size : newline;
      comments.push({ value: src.slice(start + 2, end), start });
      blank(start, end);
      return end;
    }
    const close = src.indexOf("*/", start + 2);
    const end = close < 0 ? size : close + 2;
    comments.push({ value: src.slice(start + 2, end - 2), start });
    blank(start, end);
    return end;
  };

  const expressionMayStart = (last: string, word: string) =>
    last === "" ||
    "(,=:?[{!&|;}+-*%~^".includes(last) ||
    last === "=>" ||
    (last === "w" && KEYWORDS_BEFORE_EXPRESSION.has(word));

  function readCode(start: number, untilBrace: boolean): number {
    let at = start;
    let depth = 0;
    let last = "";
    let word = "";
    while (at < size) {
      const char = src[at]!;
      if (char === "/" && (src[at + 1] === "/" || src[at + 1] === "*")) {
        at = readComment(at);
        continue;
      }
      if (char === '"' || char === "'") {
        at = readString(at, char);
        last = "s";
        continue;
      }
      if (char === "`") {
        at = readTemplate(at);
        last = "s";
        continue;
      }
      if (char === "/") {
        if (expressionMayStart(last, word) && last !== "}") {
          at = readRegex(at);
          last = "s";
          continue;
        }
        last = "/";
        at += 1;
        continue;
      }
      if (
        char === "<" &&
        /[A-Za-z>]/.test(src[at + 1] ?? "") &&
        expressionMayStart(last, word) &&
        last !== "}"
      ) {
        const end = readElement(at);
        if (end !== null) {
          at = end;
          last = "j";
          continue;
        }
      }
      if (char === "{") depth += 1;
      if (char === "}") {
        if (depth === 0 && untilBrace) return at + 1;
        depth -= 1;
      }
      if (/[A-Za-z_$]/.test(char)) {
        let end = at + 1;
        while (end < size && /[\w$]/.test(src[end]!)) end += 1;
        word = src.slice(at, end);
        last = "w";
        at = end;
        continue;
      }
      if (/\d/.test(char)) {
        let end = at + 1;
        while (end < size && /[\w.]/.test(src[end]!)) end += 1;
        last = "n";
        at = end;
        continue;
      }
      if (!/\s/.test(char)) {
        last = char === ">" && src[at - 1] === "=" ? "=>" : char;
        word = "";
      }
      at += 1;
    }
    return at;
  }

  function readElement(start: number): number | null {
    const saved = {
      elements: elements.length,
      literals: literals.length,
      comments: comments.length,
      stack: stack.length,
    };
    const fail = () => {
      elements.length = saved.elements;
      literals.length = saved.literals;
      comments.length = saved.comments;
      stack.length = saved.stack;
      return null;
    };

    let at = start + 1;
    let name = "";
    if (src[at] !== ">") {
      const match = /^[A-Za-z_$][\w$.:-]*/.exec(src.slice(at, at + 80));
      if (!match) return fail();
      name = match[0];
      at += name.length;
      let peek = at;
      while (peek < size && /\s/.test(src[peek]!)) peek += 1;
      if (src[peek] === "<") {
        let depth = 0;
        let cursor = peek;
        const limit = Math.min(size, peek + 400);
        while (cursor < limit) {
          const char = src[cursor]!;
          if (char === "<") depth += 1;
          else if (char === ">" && src[cursor - 1] !== "=") {
            depth -= 1;
            if (depth === 0) break;
          }
          cursor += 1;
        }
        if (depth !== 0) return fail();
        at = cursor + 1;
      }
    }

    const node: JsxNode = {
      index: elements.length,
      name,
      attrs: [],
      start,
      end: -1,
      parent: stack.length > 0 ? stack[stack.length - 1]! : -1,
      selfClosing: false,
      children: [],
    };
    elements.push(node);
    stack.push(node.index);

    for (;;) {
      while (at < size && /\s/.test(src[at]!)) at += 1;
      if (at >= size) return fail();
      const char = src[at]!;
      if (char === "/" && src[at + 1] === ">") {
        node.selfClosing = true;
        node.end = at + 2;
        stack.pop();
        return at + 2;
      }
      if (char === ">") {
        at += 1;
        break;
      }
      if (char === "/" && (src[at + 1] === "*" || src[at + 1] === "/")) {
        at = readComment(at);
        continue;
      }
      if (char === "{") {
        const end = readCode(at + 1, true);
        const value = src.slice(at + 1, end - 1);
        if (!value.trim().startsWith("...") && !/^\s*\/\*[\s\S]*\*\/\s*$/.test(value))
          return fail();
        node.attrs.push({ name: "...", kind: "spread", value, start: at, end });
        at = end;
        continue;
      }
      const match = /^[A-Za-z_$][\w$:.-]*/.exec(src.slice(at, at + 80));
      if (!match) return fail();
      const attrName = match[0];
      const attrStart = at;
      at += attrName.length;
      while (at < size && /\s/.test(src[at]!)) at += 1;
      if (src[at] !== "=") {
        node.attrs.push({ name: attrName, kind: "bare", value: "", start: attrStart, end: at });
        continue;
      }
      at += 1;
      while (at < size && /\s/.test(src[at]!)) at += 1;
      const opener = src[at];
      if (opener === '"' || opener === "'") {
        const end = readString(at, opener);
        node.attrs.push({
          name: attrName,
          kind: "string",
          value: src.slice(at + 1, end - 1),
          start: attrStart,
          end,
        });
        at = end;
        continue;
      }
      if (opener === "{") {
        const end = readCode(at + 1, true);
        node.attrs.push({
          name: attrName,
          kind: "expression",
          value: src.slice(at + 1, end - 1),
          start: attrStart,
          end,
        });
        at = end;
        continue;
      }
      return fail();
    }

    for (;;) {
      if (at >= size) return fail();
      const char = src[at]!;
      if (char === "<") {
        if (src[at + 1] === "/") {
          const match = /^<\/\s*([A-Za-z_$][\w$.:-]*)?\s*>/.exec(src.slice(at, at + 120));
          if (!match || (match[1] ?? "") !== name) return fail();
          at += match[0].length;
          break;
        }
        const child = elements.length;
        const end = readElement(at);
        if (end === null) return fail();
        node.children.push({ kind: "element", node: child });
        at = end;
        continue;
      }
      if (char === "{") {
        const end = readCode(at + 1, true);
        const value = src.slice(at + 1, end - 1);
        if (/^\s*\/\*[\s\S]*\*\/\s*$/.test(value)) {
          blank(at, end);
        } else {
          node.children.push({ kind: "expression", value, start: at + 1 });
        }
        at = end;
        continue;
      }
      let end = at;
      while (end < size && src[end] !== "<" && src[end] !== "{") end += 1;
      node.children.push({ kind: "text", value: src.slice(at, end), start: at });
      at = end;
    }

    node.end = at;
    stack.pop();
    return at;
  }

  let begin = 0;
  if (src.startsWith("#!")) {
    begin = src.indexOf("\n");
    if (begin < 0) begin = size;
    blank(0, begin);
  }
  readCode(begin, false);

  return { elements, literals, comments, code: blanked.join(""), bare: bare.join("") };
}

type Import = {
  source: string;
  line: number;
  offset: number;
  typeOnly: boolean;
  names: { imported: string; local: string; typeOnly: boolean }[];
};

function importsOf(bare: string, text: string, lineOf: (offset: number) => number): Import[] {
  const found: Import[] = [];
  const statement =
    /(?:^|[;\n])\s*import\s+(type\s+)?([^"';]*?)\s*from\s*["']([^"']+)["']|(?:^|[;\n])\s*import\s*["']([^"']+)["']/dg;
  for (const match of bare.matchAll(statement)) {
    const offset = match.index! + match[0].search(/import/);
    const group = match[4] !== undefined ? 4 : 3;
    const [from, to] = match.indices![group]!;
    const source = text.slice(from, to).trim();
    if (!source) continue;
    if (group === 4) {
      found.push({ source, line: lineOf(offset), offset, typeOnly: false, names: [] });
      continue;
    }
    const clause = match[2]!;
    const typeOnly = Boolean(match[1]);
    const names: Import["names"] = [];
    const braces = /\{([\s\S]*)\}/.exec(clause);
    if (braces) {
      for (const raw of braces[1]!.split(",")) {
        const item = raw.trim();
        if (!item) continue;
        const isType = item.startsWith("type ");
        const [imported, local] = item.replace(/^type\s+/, "").split(/\s+as\s+/);
        names.push({
          imported: imported!.trim(),
          local: (local ?? imported)!.trim(),
          typeOnly: typeOnly || isType,
        });
      }
    }
    const outside = clause
      .replace(/\{[\s\S]*\}/, "")
      .replace(/,/g, " ")
      .trim();
    const namespace = /\*\s*as\s+([\w$]+)/.exec(outside);
    if (namespace) names.push({ imported: "*", local: namespace[1]!, typeOnly });
    else if (outside)
      names.push({ imported: "default", local: outside.split(/\s+/)[0]!, typeOnly });
    found.push({ source, line: lineOf(offset), offset, typeOnly, names });
  }
  return found;
}

const isHouse = (source: string) =>
  source === "@rivocode/ui" ||
  source.startsWith("@rivocode/ui/") ||
  source === "@rivocode/ui-native" ||
  source.startsWith("@rivocode/ui-native/");

const classTokens = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => ({
      token,
      base: token.replace(/^!/, "").split(":").pop()!.replace(/^[!-]/, ""),
    }));

type Context = {
  path: string;
  platform: Platform;
  parsed: Parsed;
  imports: Import[];
  lineOf: (offset: number) => number;
  house: (node: JsxNode) => string | undefined;
  native: (node: JsxNode) => string | undefined;
  attr: (node: JsxNode, name: string) => Attribute | undefined;
  spread: (node: JsxNode) => boolean;
  ancestors: (node: JsxNode) => JsxNode[];
  descendants: (node: JsxNode) => JsxNode[];
  literalsIn: (attribute: Attribute) => Literal[];
  findings: Finding[];
  add: (rule: string, offset: number, message: string) => void;
};

function excerpt(text: string, limit = 60) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat;
}

function tagOf(node: JsxNode) {
  return node.name === "" ? "<>" : `<${node.name}>`;
}

const ADDRESS_ATTRIBUTE = new Set(["href", "to", "id", "htmlFor", "key", "name", "value", "src"]);

function checkColors(ctx: Context) {
  const { parsed, add } = ctx;
  const addresses = parsed.elements.flatMap((node) =>
    node.attrs
      .filter((attribute) => ADDRESS_ATTRIBUTE.has(attribute.name))
      .map((attribute) => [attribute.start, attribute.end]),
  );
  for (const literal of parsed.literals) {
    const value = literal.value;
    if (addresses.some(([from, to]) => literal.start > from! && literal.start < to!)) continue;
    if (HEX.test(value)) {
      const before = parsed.bare.slice(Math.max(0, literal.start - 60), literal.start - 1);
      const address =
        /(?:[!=]==?|\bcase)\s*$/.test(before) || /\.hash\b|\bhash\s*[:=]/.test(before);
      if (!address) add("cor-literal", literal.start, `hex color \`${value.trim()}\``);
      continue;
    }
    const functional = COLOR_FUNCTION.exec(value);
    if (functional)
      add("cor-literal", literal.start, `color in a function \`${excerpt(functional[1]!, 20)}…\``);
    for (const { token, base } of classTokens(value)) {
      if (/\[[^\]]*#[0-9a-f]{3,8}(?![0-9a-z])[^\]]*\]/i.test(token))
        add("cor-literal", literal.start, `class with an arbitrary color \`${token}\``);
      else if (ARBITRARY_NAMED.test(base))
        add("cor-literal", literal.start, `class with a named color \`${token}\``);
      else if (PALETTE_CLASS.test(base))
        add("cor-literal", literal.start, `Tailwind palette class \`${token}\``);
    }
  }
  for (const match of parsed.code.matchAll(NAMED_COLOR)) {
    add("cor-literal", match.index!, `named color \`${match[1]}\``);
  }
}

const CLASS_ATTRIBUTES = new Set(["className", "classNames"]);

function classGroupOf(ctx: Context, offset: number): number {
  for (const node of ctx.parsed.elements) {
    for (const attribute of node.attrs) {
      if (
        CLASS_ATTRIBUTES.has(attribute.name) &&
        offset > attribute.start &&
        offset < attribute.end
      )
        return attribute.start;
    }
  }
  const bare = ctx.parsed.bare;
  let depth = 0;
  for (let at = offset - 1; at >= 0 && at > offset - 4000; at--) {
    const char = bare[at]!;
    if (char === ")" || char === "]" || char === "}") depth += 1;
    else if (char === "(" || char === "[" || char === "{") {
      if (depth === 0) return char === "{" ? offset : at;
      depth -= 1;
    }
  }
  return offset;
}

function checkClasses(ctx: Context) {
  const { parsed, add, platform } = ctx;
  for (const literal of parsed.literals) {
    const tokens = classTokens(literal.value);
    for (const { token, base } of tokens) {
      if (/^-?z-(?:\d+|\[-?\d+\])$/.test(base))
        add("z-index-numerico", literal.start, `class \`${token}\``);
      if (
        /^(?:duration|delay)-\d+$/.test(base) ||
        (/^(?:ease|duration)-\[/.test(base) && !base.includes("var(--rc-"))
      ) {
        add("movimento-literal", literal.start, `class \`${token}\``);
      }
    }
    if (/z-index\s*:\s*-?\d/.test(literal.value))
      add("z-index-numerico", literal.start, "numeric `z-index` in CSS");
  }
  if (platform === "web") {
    const groups = new Map<number, Literal[]>();
    for (const literal of parsed.literals) {
      const key = classGroupOf(ctx, literal.start);
      groups.set(key, [...(groups.get(key) ?? []), literal]);
    }
    for (const literals of groups.values()) {
      const tokens = literals.flatMap((literal) =>
        classTokens(literal.value).map((item) => ({ ...item, start: literal.start })),
      );
      const hides = tokens.find(({ base }) => base === "outline-none" || base === "outline-hidden");
      const restores = tokens.some(({ token }) =>
        /^(?:focus-visible|focus|focus-within):(?:ring|outline-(?!none|hidden))/.test(token),
      );
      if (hides && !restores)
        add(
          "foco-apagado",
          hides.start,
          `\`${hides.token}\` without \`focus-visible:ring\` in the same class`,
        );
    }
  }
  for (const match of parsed.code.matchAll(/\bzIndex\s*:\s*-?\d/g)) {
    add("z-index-numerico", match.index!, "numeric `zIndex` in the style");
  }
}

function checkElements(ctx: Context) {
  const { parsed, platform, house, native, attr, spread, ancestors, descendants, add } = ctx;
  const htmlFor = parsed.elements.some((node) => attr(node, "htmlFor"));
  const fetches = /\buse(?:Query|SuspenseQuery|InfiniteQuery|SWR)\b|\bfetch\s*\(/.test(parsed.code);

  for (const node of parsed.elements) {
    const name = house(node);
    const lower = /^[a-z]/.test(node.name) ? node.name : undefined;
    const has = (attribute: string) => attr(node, attribute) !== undefined;
    const filled = (attribute: string) => {
      const found = attr(node, attribute);
      if (!found) return false;
      if (found.kind === "string") return /\S/.test(found.value);
      if (found.kind === "expression") return !/^\s*(?:(["'`])\s*\1)?\s*$/.test(found.value);
      return found.kind === "bare";
    };
    const nativeNamed = () =>
      filled("accessibilityLabel") || filled("aria-label") || filled("aria-labelledby");
    const onlyIcons = (outer: JsxNode) => {
      const inside = outer.children.filter((child) => child.kind === "element");
      if (outer.children.some((child) => child.kind === "text" && /\S/.test(child.value)))
        return false;
      if (outer.children.some((child) => child.kind === "expression")) return false;
      return (
        inside.length > 0 &&
        descendants(outer).every(
          (inner) =>
            !inner.children.some(
              (grand) =>
                (grand.kind === "text" && /\S/.test(grand.value)) || grand.kind === "expression",
            ),
        )
      );
    };

    if (name === "IconButton" && !spread(node)) {
      if (!filled("label")) {
        add("nome-acessivel", node.start, "`IconButton` without `label`");
      }
    }

    if (platform === "web" && (name === "Button" || lower === "button") && !spread(node)) {
      const named = filled("aria-label") || filled("aria-labelledby") || filled("title");
      if (!named && onlyIcons(node))
        add(
          "nome-acessivel",
          node.start,
          `${tagOf(node)} with only an icon and no name: it is \`IconButton\` with \`label\``,
        );
    }

    if (
      platform === "native" &&
      (name === "Button" || native(node) === "Pressable") &&
      !spread(node) &&
      !nativeNamed() &&
      onlyIcons(node)
    ) {
      add(
        "nome-acessivel",
        node.start,
        `${tagOf(node)} with only an icon and no \`accessibilityLabel\`: it is \`IconButton\` with \`label\``,
      );
    }

    if (platform === "web" && lower === "img" && !spread(node) && !has("alt")) {
      add("imagem-sem-alt", node.start, "`<img>` without `alt`");
    }

    if (
      platform === "web" &&
      lower &&
      (NON_INTERACTIVE.has(lower) || (lower === "a" && !has("href"))) &&
      has("onClick") &&
      !has("role")
    ) {
      const suffix = lower === "a" ? " without `href`" : "";
      add("elemento-clicavel", node.start, `\`<${lower} onClick>\`${suffix}`);
    }

    const tab = attr(node, "tabIndex");
    if (tab && /^\s*[1-9]\d*\s*$/.test(tab.value))
      add("tabindex-positivo", node.start, `\`tabIndex=${tab.value.trim()}\``);

    if (platform === "web" && lower) {
      const role = attr(node, "role");
      const classes = attr(node, "className");
      const classValue = classes
        ? ctx
            .literalsIn(classes)
            .map((literal) => literal.value)
            .join(" ")
        : "";
      const tokens = new Set(classTokens(classValue).map(({ base }) => base));
      let suggestion: string | undefined;
      if (lower === "input") {
        const type = attr(node, "type");
        const kind = type?.kind === "string" ? type.value : "text";
        if (kind !== "hidden") suggestion = INPUT_TYPES[kind] ?? "`Input`";
      } else if (lower === "form") {
        suggestion = undefined;
      } else if (RAW_TAGS[lower]) {
        suggestion = RAW_TAGS[lower];
      } else if (role?.kind === "string" && ROLES[role.value]) {
        suggestion = ROLES[role.value];
      } else if (has("aria-modal") || (tokens.has("fixed") && tokens.has("inset-0"))) {
        suggestion = "`Dialog` or `Sheet` (home-made modal)";
      }
      if (suggestion) add("peca-reescrita", node.start, `\`<${lower}>\` instead of ${suggestion}`);
    }

    const primitive = native(node);
    if (platform === "native" && primitive && NATIVE_PRIMITIVES[primitive]) {
      add(
        "peca-reescrita",
        node.start,
        `react-native's \`${primitive}\` instead of ${NATIVE_PRIMITIVES[primitive]}`,
      );
    }

    if (name === "Field" && !spread(node)) {
      if (
        platform === "web" &&
        !descendants(node).some((inner) => house(inner) === "FieldLabel" || inner.name === "label")
      ) {
        add("campo-sem-rotulo", node.start, "`Field` without `FieldLabel`");
      }
      if (platform === "native" && !filled("label"))
        add("campo-sem-rotulo", node.start, "`Field` without `label`");
    }

    const controls = platform === "native" ? CONTROLS_NATIVE : CONTROLS_WEB;
    if (name && controls.has(name) && !spread(node)) {
      const named =
        filled("aria-label") ||
        filled("aria-labelledby") ||
        filled("label") ||
        filled("accessibilityLabel") ||
        (has("id") && htmlFor);
      const wrapped = ancestors(node).some((outer) =>
        LABEL_WRAPPERS.has(house(outer) ?? outer.name),
      );
      if (!named && !wrapped) {
        const placeholder = has("placeholder") ? ", and `placeholder` is not a label" : "";
        add(
          "campo-sem-rotulo",
          node.start,
          `\`${name}\` outside \`Field\` and without a name${placeholder}`,
        );
      }
    }

    if (
      (name === "Checkbox" || name === "Radio" || name === "Switch") &&
      node.selfClosing &&
      !spread(node)
    ) {
      const labelled =
        has("aria-label") ||
        has("accessibilityLabel") ||
        (platform === "native" && filled("label"));
      let outside = false;
      if (!labelled && node.parent >= 0) {
        const siblings = parsed.elements[node.parent]!.children.filter(
          (child) => child.kind === "element" || (child.kind === "text" && /\S/.test(child.value)),
        );
        const at = siblings.findIndex(
          (child) => child.kind === "element" && child.node === node.index,
        );
        const next = siblings[at + 1];
        if (next && next.kind === "element") {
          const neighbor = parsed.elements[next.node]!;
          if (["span", "label", "p"].includes(neighbor.name) || house(neighbor) === "Text") {
            outside = true;
            add(
              "rotulo-fora-do-controle",
              node.start,
              `\`${name}\` without a child, with the text in a ${tagOf(neighbor)} beside it`,
            );
          }
        }
      }
      if (!labelled && !outside && platform === "native" && name !== "Radio") {
        add(
          "nome-acessivel",
          node.start,
          `\`${name}\` without text beside it and without \`label\`: in native the spoken name is \`label\``,
        );
      }
    }

    if (platform === "web" && lower === "form") {
      const role = attr(node, "role");
      if (
        !(role?.kind === "string" && role.value === "search") &&
        !/\buseZodForm\b/.test(parsed.code)
      ) {
        add("formulario-sem-zod", node.start, "`<form>` built by hand, without `Form` and `useZodForm`");
      }
    }

    if (name && SIZED_CONTROLS.has(name)) {
      const classes = attr(node, "className");
      if (classes) {
        for (const literal of ctx.literalsIn(classes)) {
          for (const { token, base } of classTokens(literal.value)) {
            if (/^h-(?:\d+(?:\.5)?|\[\d+(?:\.\d+)?(?:px|rem)\])$/.test(base)) {
              add("altura-cravada", literal.start, `\`${token}\` on \`${name}\``);
            }
          }
        }
      }
    }

    if (name && ["DataTable", "ChartContainer", "DataList"].includes(name) && !spread(node)) {
      const query = has("isLoading") || has("isError") || has("onRetry") || fetches;
      if (query) {
        const missing = ["isLoading", "isError", "empty"].filter((key) => !has(key));
        if (has("isError") && !has("onRetry")) missing.push("onRetry");
        if (missing.length > 0) {
          add(
            "consulta-sem-finais",
            node.start,
            `query \`${name}\` without ${missing.map((key) => `\`${key}\``).join(", ")}`,
          );
        }
      }
    }

    if (name) {
      const classes = attr(node, "className");
      for (const literal of classes ? ctx.literalsIn(classes) : []) {
        for (const { token } of classTokens(literal.value)) {
          if (/\[&[_>]/.test(token))
            add(
              "descendente-arbitrario",
              literal.start,
              `\`${excerpt(token, 40)}\` on \`${name}\``,
            );
        }
      }
    }

    if (HAND_PROVIDERS.test(node.name))
      add("portal-a-mao", node.start, `\`${node.name}\` mounted by hand`);

    const isMoneyInput =
      (lower === "input" || name === "Input") && attr(node, "type")?.value === "number";
    if (isMoneyInput || name === "NumberField") {
      const labels = [node, ...ancestors(node)]
        .flatMap((outer) =>
          ["name", "label", "id", "placeholder", "aria-label"].map(
            (key) => attr(outer, key)?.value ?? "",
          ),
        )
        .join(" ");
      if (talksMoney(labels))
        add(
          "dinheiro-float",
          node.start,
          `numeric field for money (\`${excerpt(labels, 30)}\`): it is \`CurrencyInput\``,
        );
    }
  }
}

function checkCode(ctx: Context) {
  const { parsed, imports, add, platform } = ctx;
  const code = parsed.code;
  const lines = code.split("\n");
  let offset = 0;
  for (const line of lines) {
    if (/\b(?:parseFloat|Number)\s*\(/.test(line) && talksMoney(line)) {
      add("dinheiro-float", offset, `\`${excerpt(line, 50)}\``);
    } else if (/\.toFixed\s*\(\s*2\s*\)/.test(line) && (talksMoney(line) || line.includes("R$"))) {
      add("dinheiro-float", offset, `\`${excerpt(line, 50)}\``);
    }
    if (/style\s*:\s*["']currency["']|currency\s*:\s*["']BRL["']/.test(line)) {
      add("dinheiro-escrito", offset, "`Intl.NumberFormat` or `toLocaleString` with a currency");
    }
    if (/\bcreatePortal\s*\(/.test(line)) add("portal-a-mao", offset, "`createPortal`");
    if (/\bcrc16\w*\s*\(|\bfunction\s+crc\w*/i.test(line))
      add("pix-qr-caseiro", offset, "BR Code CRC computed by hand");
    offset += line.length + 1;
  }

  const affixes = parsed.elements.flatMap((node) =>
    node.attrs
      .filter((attribute) => attribute.name === "prefix" || attribute.name === "suffix")
      .map((attribute) => [attribute.start, attribute.end] as const),
  );
  const isAffix = (literal: Literal) =>
    literal.value.trim() === "R$" &&
    affixes.some(([from, to]) => literal.start > from && literal.start < to);
  for (const literal of parsed.literals) {
    if (WRITTEN_MONEY.test(literal.value) && !isAffix(literal))
      add("dinheiro-escrito", literal.start, `\`${excerpt(literal.value, 40)}\``);
    if (/\$1[\s.\-/)]\s*\(?\$2/.test(literal.value))
      add("mascara-a-mao", literal.start, `\`${literal.value}\``);
    if (/^000201/.test(literal.value) || /br\.gov\.bcb\.pix/i.test(literal.value)) {
      add("pix-qr-caseiro", literal.start, "Pix copy-and-paste code built by hand");
    }
  }
  for (const node of parsed.elements) {
    const affix = ["InputPrefix", "InputSuffix"].includes(ctx.house(node) ?? "");
    for (const child of node.children) {
      if (affix && child.kind === "text" && child.value.trim() === "R$") continue;
      if (child.kind === "text" && WRITTEN_MONEY.test(child.value))
        add("dinheiro-escrito", child.start, `\`${excerpt(child.value, 40)}\` written in the JSX`);
    }
  }

  const mentions = /\b(?:cpf|cnpj)\b/i.exec(code);
  if (mentions && !/\bisValid(?:Cpf|Cnpj)\b/.test(code)) {
    const validates =
      /\bz\.|\.regex\s*\(|\.test\s*\(|\.length\s*[!=]==?\s*1[14]\b|\.(?:length|min|max)\s*\(\s*1[14]\b|\bvalidate\b/.test(
        code,
      );
    if (validates)
      add(
        "documento-sem-validador",
        mentions.index,
        "CPF or CNPJ checked without the check digit",
      );
  }

  for (const literal of parsed.literals) {
    if (/^\s*(?:passo|etapa|step)\s*\d+\s*$/i.test(literal.value))
      add("passo-sem-nome", literal.start, `\`${literal.value}\` as a step name`);
  }

  const DATA_FIELD = /\b(?:cpf|cnpj|telefone|celular|whatsapp|cep|placa)\b/i;
  for (const node of parsed.elements) {
    if (ctx.house(node) !== "Input") continue;
    const locked = ["readOnly", "disabled"].some((name) => {
      const attribute = ctx.attr(node, name);
      return attribute && (attribute.kind === "bare" || attribute.value.trim() !== "false");
    });
    if (locked) continue;
    const own = ["name", "id", "aria-label", "placeholder", "autoComplete"]
      .map((name) => ctx.attr(node, name))
      .filter((attribute) => attribute && attribute.kind === "string")
      .map((attribute) => attribute!.value)
      .join(" ");
    const field = ctx.ancestors(node).find((ancestor) => ctx.house(ancestor) === "Field");
    const label = field
      ? ctx
          .descendants(field)
          .filter((inner) => ctx.house(inner) === "FieldLabel")
          .flatMap((inner) => inner.children)
          .map((child) => (child.kind === "text" ? child.value : ""))
          .join(" ")
      : "";
    const hit = DATA_FIELD.exec(`${own} ${label}`);
    if (hit) add("dado-sem-mascara", node.start, `${hit[0]} field in a plain \`Input\``);
  }

  for (const entry of imports) {
    const offsetOf = entry.offset;
    if (QR_LIBRARIES.has(entry.source))
      add("pix-qr-caseiro", offsetOf, `\`${entry.source}\` instead of \`QRCode\` or \`PixCode\``);
    if (
      entry.source === "react-hook-form" &&
      entry.names.some((item) => item.imported === "useForm")
    ) {
      add("useform-direto", offsetOf, "react-hook-form's `useForm`");
    }
    if (platform === "web" && entry.source === "recharts")
      add("recharts-direto", offsetOf, "`recharts` importada direto");
    checkImport(ctx, entry, offsetOf);
  }
}

function checkImport(ctx: Context, entry: Import, offset: number) {
  const { add, platform } = ctx;
  const source = entry.source;
  if (!isHouse(source)) return;
  if (ASSET_PATHS.some((pattern) => pattern.test(source))) return;

  const nativePackage = source.startsWith("@rivocode/ui-native");
  if (platform === "native" && !nativePackage) {
    add(
      "import-caminho-errado",
      offset,
      `\`${source}\` is the web package; in React Native it is \`@rivocode/ui-native\``,
    );
    return;
  }
  if (platform === "web" && nativePackage) {
    add(
      "import-caminho-errado",
      offset,
      `\`${source}\` is the native package; on the web it is \`@rivocode/ui\``,
    );
    return;
  }

  const root = nativePackage ? "@rivocode/ui-native" : "@rivocode/ui";
  const subpaths = Object.entries(ENTRIES).filter(([path]) => path.startsWith(`${root}/`));

  if (source !== root && !ENTRIES[source]) {
    add(
      "import-caminho-errado",
      offset,
      `\`${source}\` is not a package entry; the entries are \`${root}\` and ${subpaths.map(([path]) => `\`${path}\``).join(", ")}`,
    );
    return;
  }

  for (const item of entry.names) {
    if (item.typeOnly || item.imported === "*" || item.imported === "default") continue;
    const home = subpaths.find(([, value]) => value.names.includes(item.imported));
    if (source === root) {
      if (home && !home[1].alsoAtRoot.includes(item.imported)) {
        add(
          "import-caminho-errado",
          offset,
          `\`${item.imported}\` comes from \`${home[0]}\`, and not from the root`,
        );
      }
      continue;
    }
    const entryNames = ENTRIES[source]!.names;
    if (!entryNames.includes(item.imported)) {
      add(
        "import-caminho-errado",
        offset,
        `\`${item.imported}\` does not come from \`${source}\`; ${home ? `it lives in \`${home[0]}\`` : `it lives at the root, \`${root}\``}`,
      );
    }
  }
}

function screenTexts(ctx: Context): Literal[] {
  const { parsed } = ctx;
  const texts: Literal[] = [];
  const skipRanges: [number, number][] = [];
  const codeLike = new Set(["code", "pre", "Code", "CodeBlock", "Kbd", "style", "script"]);

  for (const node of parsed.elements) {
    for (const attribute of node.attrs) {
      if (
        attribute.name === "className" ||
        attribute.name === "classNames" ||
        attribute.name === "style"
      ) {
        skipRanges.push([attribute.start, attribute.end]);
      }
    }
    if (codeLike.has(node.name)) skipRanges.push([node.start, node.end]);
  }
  const skipped = (offset: number) =>
    skipRanges.some(([from, to]) => offset >= from && offset < to);
  const seen = new Set<number>();

  for (const node of parsed.elements) {
    if (codeLike.has(node.name)) continue;
    for (const child of node.children) {
      if (child.kind === "text" && /\p{L}{2}/u.test(child.value) && !skipped(child.start)) {
        texts.push({ value: child.value, start: child.start });
      }
    }
    for (const attribute of node.attrs) {
      if (!TEXT_ATTRIBUTE.test(attribute.name)) continue;
      for (const literal of ctx.literalsIn(attribute)) {
        texts.push(literal);
        seen.add(literal.start);
      }
    }
  }

  const lines = parsed.code.split("\n");
  const lineStarts: number[] = [];
  let running = 0;
  for (const line of lines) {
    lineStarts.push(running);
    running += line.length + 1;
  }

  for (const literal of parsed.literals) {
    if (seen.has(literal.start) || skipped(literal.start)) continue;
    const value = literal.value;
    if (!/\s/.test(value.trim()) || /[{}<>=;]|\$\{/.test(value)) continue;
    const words = value.trim().split(/\s+/);
    const classy =
      words.every((word) => /^[!a-z0-9:_[\]/.%&>()#-]+$/.test(word)) &&
      words.some((word) => /[-:[]/.test(word));
    if (classy) continue;
    if (words.filter((word) => /^\p{L}{2,}[.,;:!?]?$/u.test(word)).length < 2) continue;
    const line = lines[ctx.lineOf(literal.start) - 1] ?? "";
    if (/console\.\w+\(|\bimport\b|\bfrom\s+["']|\bnew\s+\w*Error\s*\(|\bthrow\b/.test(line))
      continue;
    texts.push(literal);
  }

  return texts;
}

function checkText(ctx: Context) {
  for (const text of screenTexts(ctx)) {
    const prose = text.value
      .replace(/\$\{[^}]*\}/g, " ")
      .replace(/\S+@\S+|\b(?:https?:\/\/|www\.)\S+/g, " ");
    const words = [...prose.matchAll(/\p{L}+/gu)].map((match) => match[0]);
    const missing: string[] = [];
    const english: string[] = [];
    for (const word of words) {
      const lower = word.toLowerCase();
      const right = ACCENTS[lower];
      if (right && !AMBIGUOUS.has(lower) && right !== lower) missing.push(`${word} → ${right}`);
      else if (/^[a-z]{2,}(?:cao|coes)$/i.test(word) && !ACCENTS[lower]) {
        missing.push(`${word} → ${word.replace(/cao$/i, "ção").replace(/coes$/i, "ções")}`);
      }
      if (ENGLISH.has(lower)) english.push(word);
    }
    if (missing.length > 0) {
      ctx.add(
        "texto-sem-acento",
        text.start,
        `"${excerpt(text.value, 50)}": ${[...new Set(missing)].join(", ")}`,
      );
    }
    if (english.length > 0) {
      ctx.add(
        "texto-em-ingles",
        text.start,
        `"${excerpt(text.value, 50)}": ${[...new Set(english)].join(", ")}`,
      );
    }
  }
}

export type FileAudit = {
  /** The file path. */
  path: string;
  /** Whether the file counts in the score: it has JSX or imports the library. */
  relevant: boolean;
  /** `web` or `native`. */
  platform: Platform;
  /** The findings, before the dismissals. */
  findings: Finding[];
  /** The findings a suppression comment took out of the count. */
  waived: (Finding & { reason: string })[];
  /** The library entries the file imports. */
  entries: string[];
  /** Whether the file calls `useZodForm`. */
  usesZod: boolean;
};

export function auditSource(path: string, source: string): FileAudit {
  const parsed = parse(source);
  const lineStarts = [0];
  for (let at = 0; at < source.length; at++) if (source[at] === "\n") lineStarts.push(at + 1);
  const lineOf = (offset: number) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (lineStarts[middle]! <= offset) low = middle;
      else high = middle - 1;
    }
    return low + 1;
  };

  const imports = importsOf(parsed.bare, source, lineOf);
  const houseNames = new Map<string, string>();
  const nativeNames = new Map<string, string>();
  for (const entry of imports) {
    for (const item of entry.names) {
      if (isHouse(entry.source)) houseNames.set(item.local, item.imported);
      if (entry.source === "react-native") nativeNames.set(item.local, item.imported);
    }
  }

  const isNative = imports.some(
    (entry) => entry.source === "react-native" || entry.source.startsWith("@rivocode/ui-native"),
  );
  const platform: Platform = isNative ? "native" : "web";
  const relevant = parsed.elements.length > 0 || imports.some((entry) => isHouse(entry.source));

  const byIndex = parsed.elements;
  const children = new Map<number, number[]>();
  for (const node of byIndex) {
    const list = children.get(node.parent) ?? [];
    list.push(node.index);
    children.set(node.parent, list);
  }

  const findings: Finding[] = [];
  const keys = new Set<string>();
  const ctx: Context = {
    path,
    platform,
    parsed,
    imports,
    lineOf,
    house: (node) => houseNames.get(node.name),
    native: (node) => nativeNames.get(node.name),
    attr: (node, name) => node.attrs.find((attribute) => attribute.name === name),
    spread: (node) => node.attrs.some((attribute) => attribute.kind === "spread"),
    ancestors: (node) => {
      const list: JsxNode[] = [];
      let parent = node.parent;
      while (parent >= 0) {
        list.push(byIndex[parent]!);
        parent = byIndex[parent]!.parent;
      }
      return list;
    },
    descendants: (node) => {
      const list: JsxNode[] = [];
      const queue = [...(children.get(node.index) ?? [])];
      while (queue.length > 0) {
        const next = queue.shift()!;
        list.push(byIndex[next]!);
        queue.push(...(children.get(next) ?? []));
      }
      return list;
    },
    literalsIn: (attribute) =>
      parsed.literals.filter(
        (literal) => literal.start > attribute.start && literal.start < attribute.end,
      ),
    findings,
    add: (rule, offset, message) => {
      const line = lineOf(offset);
      const key = `${rule}:${line}:${message}`;
      if (keys.has(key)) return;
      keys.add(key);
      findings.push({ rule, file: path, line, message });
    },
  };

  if (relevant) {
    checkColors(ctx);
    checkClasses(ctx);
    checkElements(ctx);
    checkCode(ctx);
    checkText(ctx);
  }

  const suppressions: { rule: string; reason: string; line: number }[] = [];
  for (const comment of parsed.comments) {
    for (const match of comment.value.matchAll(IGNORE)) {
      suppressions.push({ rule: match[1]!, reason: match[2]!.trim(), line: lineOf(comment.start) });
    }
  }

  const kept: Finding[] = [];
  const waived: FileAudit["waived"] = [];
  for (const finding of findings) {
    const hit = suppressions.find(
      (item) =>
        item.rule === finding.rule &&
        (item.line === finding.line || item.line === finding.line - 1),
    );
    if (hit) waived.push({ ...finding, reason: hit.reason });
    else kept.push(finding);
  }

  return {
    path,
    relevant,
    platform,
    findings: sortFindings(kept),
    waived: sortFindings(waived),
    entries: [...new Set(imports.map((entry) => entry.source).filter(isHouse))].sort(),
    usesZod: /\buseZodForm\b/.test(parsed.code),
  };
}

function sortFindings<T extends Finding>(list: T[]): T[] {
  return [...list].sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.rule.localeCompare(b.rule) ||
      a.message.localeCompare(b.message),
  );
}

export function auditPeers(
  audits: FileAudit[],
  manifests: SourceFile[],
): { findings: Finding[]; notes: string[] } {
  const used = new Map<string, number>();
  let zod = false;
  for (const audit of audits) {
    if (!audit.relevant) continue;
    const keys = new Set(
      audit.entries.flatMap((entry) => {
        const root = entry.startsWith("@rivocode/ui-native")
          ? "@rivocode/ui-native"
          : "@rivocode/ui";
        return PEERS[entry] && entry !== root ? [root, entry] : [root];
      }),
    );
    for (const key of keys) used.set(key, (used.get(key) ?? 0) + 1);
    if (audit.usesZod) zod = true;
  }
  if (used.size === 0) return { findings: [], notes: [] };
  const manifest = manifests[0];
  if (!manifest) {
    return {
      findings: [],
      notes: ["No package.json found: the subpath peers were not checked."],
    };
  }

  const installed = new Set<string>();
  for (const item of manifests) {
    let parsedManifest: Record<string, Record<string, string> | undefined>;
    try {
      parsedManifest = JSON.parse(item.source) as typeof parsedManifest;
    } catch {
      return {
        findings: [],
        notes: [`${item.path} is not valid JSON: the peers were not checked.`],
      };
    }
    for (const key of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ]) {
      for (const name of Object.keys(parsedManifest[key] ?? {})) installed.add(name);
    }
  }

  const findings: Finding[] = [];
  for (const [entry, count] of [...used.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const peer = PEERS[entry];
    if (!peer) continue;
    const wanted = [...peer.always, ...(zod ? (peer.withZod ?? []) : [])];
    for (const name of wanted) {
      if (installed.has(name)) continue;
      findings.push({
        rule: "peer-faltando",
        file: manifest.path,
        line: 1,
        message: `\`${entry}\` is imported in ${count} file(s) and \`${name}\` is not in package.json`,
      });
    }
  }
  return { findings, notes: [] };
}

export function fileScore(findings: Finding[]): number {
  const counts = new Map<string, number>();
  for (const finding of findings) counts.set(finding.rule, (counts.get(finding.rule) ?? 0) + 1);
  let penalty = 0;
  for (const [rule, count] of counts)
    penalty += WEIGHTS[RULE_BY_ID.get(rule)!.severity] * Math.min(count, CAP);
  return Math.max(0, 100 - penalty);
}

export function verdictOf(score: number, critical: boolean): string {
  const band =
    score >= 90
      ? "Follows the house"
      : score >= 75
        ? "Spot fixes"
        : score >= 50
          ? "Rework"
          : "Outside the contract";
  return critical && band === "Follows the house" ? "Spot fixes" : band;
}

function shapeProblem(item: unknown, text: "message" | "reason"): string | undefined {
  if (!item || typeof item !== "object" || Array.isArray(item))
    return `\`${JSON.stringify(item)}\` is not an object with \`rule\`, \`file\`, \`line\` and \`${text}\``;
  const record = item as Record<string, unknown>;
  const where = `\`${String(record.rule)}\` in ${String(record.file)}:${String(record.line)}`;
  if (typeof record.rule !== "string" || record.rule.length === 0)
    return `${where}, without \`rule\` as text`;
  if (typeof record.file !== "string" || record.file.length === 0)
    return `${where}, without \`file\` as text`;
  if (typeof record.line !== "number" || !Number.isInteger(record.line) || record.line < 1)
    return `${where}, with a \`line\` that is not an integer from 1`;
  const value = record[text];
  if (typeof value !== "string" || value.trim().length === 0)
    return text === "reason" ? "no reason" : `${where}, without \`message\``;
  return undefined;
}

export function audit(input: AuditInput): Report {
  const files = [...input.files].sort((a, b) => a.path.localeCompare(b.path));
  const audits = files.map((file) => auditSource(file.path, file.source));
  const relevant = audits.filter((item) => item.relevant);
  const notes: string[] = [];

  const peers = auditPeers(audits, input.manifests ?? []);
  notes.push(...peers.notes);

  const known = new Set(relevant.map((item) => item.path));
  const judged: Finding[] = [];
  for (const finding of input.findings ?? []) {
    const shape = shapeProblem(finding, "message");
    if (shape) {
      notes.push(`Finding refused: ${shape}.`);
      continue;
    }
    const rule = RULE_BY_ID.get(finding.rule);
    if (!rule) {
      notes.push(`Finding refused: the rule \`${finding.rule}\` does not exist.`);
      continue;
    }
    const project = rule.scope === "projeto";
    if (!project && !known.has(finding.file)) {
      notes.push(`Finding refused: \`${finding.file}\` is not among the audited files.`);
      continue;
    }
    judged.push({
      rule: finding.rule,
      file: finding.file,
      line: finding.line,
      message: finding.message,
    });
  }

  const all = [...relevant.flatMap((item) => item.findings), ...peers.findings, ...judged];
  const waived = relevant.flatMap((item) => item.waived);
  const kept: Finding[] = [];
  const dismissals: Dismissal[] = [];
  for (const item of input.dismissals ?? []) {
    const shape = shapeProblem(item, "reason");
    if (!shape) {
      dismissals.push(item);
    } else if (shape === "no reason") {
      notes.push(`Discard refused, no reason: \`${item.rule}\` in ${item.file}:${item.line}.`);
    } else {
      notes.push(`Discard refused: ${shape}.`);
    }
  }
  for (const finding of all) {
    const index = dismissals.findIndex(
      (item) =>
        item.rule === finding.rule && item.file === finding.file && item.line === finding.line,
    );
    if (index >= 0) {
      waived.push({ ...finding, reason: dismissals[index]!.reason.trim() });
      dismissals.splice(index, 1);
    } else {
      kept.push(finding);
    }
  }
  for (const item of dismissals) {
    notes.push(
      `Discard with no matching finding: \`${item.rule}\` in ${item.file}:${item.line}.`,
    );
  }

  const isProject = (finding: Finding) => RULE_BY_ID.get(finding.rule)!.scope === "projeto";
  const scores: FileScore[] = relevant.map((item) => {
    const own = kept.filter((finding) => !isProject(finding) && finding.file === item.path);
    return {
      file: item.path,
      platform: item.platform,
      score: fileScore(own),
      findings: own.length,
    };
  });
  const base =
    scores.length > 0
      ? Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length)
      : 100;
  const projectFindings = kept.filter(isProject);
  const projectCounts = new Map<string, number>();
  for (const finding of projectFindings)
    projectCounts.set(finding.rule, (projectCounts.get(finding.rule) ?? 0) + 1);
  let projectPenalty = 0;
  for (const [rule, count] of projectCounts)
    projectPenalty += WEIGHTS[RULE_BY_ID.get(rule)!.severity] * Math.min(count, CAP);
  const score = Math.max(0, base - projectPenalty);
  const critical = kept.some((finding) => RULE_BY_ID.get(finding.rule)!.severity === "critico");

  return {
    score,
    verdict: verdictOf(score, critical),
    files: scores,
    skipped: audits.filter((item) => !item.relevant).map((item) => item.path),
    findings: sortFindings(kept),
    waived: sortFindings(waived),
    notes,
  };
}

export const FORMULA = [
  `Each rule has a weight by severity: critical ${WEIGHTS.critico}, serious ${WEIGHTS.serio}, moderate ${WEIGHTS.moderado}, minor ${WEIGHTS.menor}.`,
  `File score = max(0, 100 − Σ weight(rule) × min(occurrences of the rule in the file, ${CAP})).`,
  "Base = average of the audited files' scores, rounded to the nearest integer (no file, 100).",
  `Final score = max(0, base − Σ weight(project rule) × min(occurrences, ${CAP})).`,
  "Band: 90 to 100 follows the house, 75 to 89 spot fixes, 50 to 74 rework, below 50 outside the contract. With a critical finding, the band does not go above spot fixes.",
];

export function renderMarkdown(report: Report): string {
  const out: string[] = [];
  out.push("# @rivocode/ui screen audit", "");
  out.push(`**Score: ${report.score}/100.** ${report.verdict}.`, "");
  const platforms =
    [...new Set(report.files.map((file) => file.platform))].join(" and ") || "none";
  out.push(
    `${report.files.length} file(s) audited, platform ${platforms}.` +
      (report.skipped.length > 0
        ? ` ${report.skipped.length} left out for having neither JSX nor a library import.`
        : ""),
    "",
  );

  const byRule = new Map<string, Finding[]>();
  for (const finding of report.findings)
    byRule.set(finding.rule, [...(byRule.get(finding.rule) ?? []), finding]);
  if (byRule.size > 0) {
    out.push(
      "## By rule",
      "",
      "| Rule | Severity | Weight | Occurrences | Files |",
      "| --- | --- | --- | --- | --- |",
    );
    const ordered = RULES.filter((rule) => byRule.has(rule.id));
    for (const rule of ordered) {
      const list = byRule.get(rule.id)!;
      out.push(
        `| \`${rule.id}\` ${rule.title} | ${SEVERITY_LABEL[rule.severity]} | ${WEIGHTS[rule.severity]} | ${list.length} | ${new Set(list.map((item) => item.file)).size} |`,
      );
    }
    out.push("");
  }

  if (report.files.length > 0) {
    out.push(
      "## By file",
      "",
      "| File | Platform | Score | Findings |",
      "| --- | --- | --- | --- |",
    );
    for (const file of report.files)
      out.push(`| \`${file.file}\` | ${file.platform} | ${file.score} | ${file.findings} |`);
    out.push("");
  }

  if (report.findings.length > 0) {
    out.push("## Findings", "");
    let current = "";
    for (const finding of report.findings) {
      if (finding.file !== current) {
        if (current !== "") out.push("");
        current = finding.file;
        const score = report.files.find((file) => file.file === current)?.score;
        out.push(`### \`${current}\`${score === undefined ? "" : ` (score ${score})`}`, "");
      }
      const rule = RULE_BY_ID.get(finding.rule)!;
      out.push(
        `- L${finding.line} **${rule.id}** (${SEVERITY_LABEL[rule.severity]}${rule.kind === "julgamento" ? ", judgment" : ""}): ${finding.message}. ${rule.fix}`,
      );
    }
    out.push("");
  } else {
    out.push("No findings.", "");
  }

  if (report.waived.length > 0) {
    out.push("## Out of the count", "");
    for (const item of report.waived)
      out.push(
        `- \`${item.file}\` L${item.line} **${item.rule}**: ${item.message}. Reason: ${item.reason}`,
      );
    out.push("");
  }

  if (report.notes.length > 0) {
    out.push("## Notes", "", ...report.notes.map((note) => `- ${note}`), "");
  }

  out.push("## The math", "", ...FORMULA.map((line) => `- ${line}`), "");
  return out.join("\n");
}

const SOURCE_FILE = /\.(?:tsx|jsx|ts|js|mjs)$/;
const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".expo",
  "coverage",
  ".git",
  ".turbo",
  "out",
]);
const TEST_FILE = /\.(?:test|spec|stories)\.[jt]sx?$|\.d\.ts$/;

function collect(target: string, out: string[]) {
  const stats = statSync(target);
  if (stats.isFile()) {
    if (SOURCE_FILE.test(target)) out.push(target);
    return;
  }
  for (const entry of readdirSync(target).sort()) {
    if (SKIPPED_DIRECTORIES.has(entry) || entry === "__tests__") continue;
    const full = join(target, entry);
    const inner = statSync(full);
    if (inner.isDirectory()) collect(full, out);
    else if (SOURCE_FILE.test(entry) && !TEST_FILE.test(entry)) out.push(full);
  }
}

function manifestsAbove(from: string): string[] {
  const found: string[] = [];
  let current = resolve(from);
  if (existsSync(current) && statSync(current).isFile()) current = dirname(current);
  for (;;) {
    const candidate = join(current, "package.json");
    if (existsSync(candidate)) found.push(candidate);
    if (existsSync(join(current, ".git"))) return found;
    const parent = dirname(current);
    if (parent === current) return found;
    current = parent;
  }
}

function judgmentProblem(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return 'the top level has to be an object, `{ "findings": [...], "dismissals": [...] }`';
  const record = value as Record<string, unknown>;
  for (const key of ["findings", "dismissals"]) {
    const list = record[key];
    if (list === undefined) continue;
    if (!Array.isArray(list)) return `\`${key}\` has to be a list`;
    const index = list.findIndex(
      (item) => !item || typeof item !== "object" || Array.isArray(item),
    );
    if (index >= 0) return `\`${key}[${index}]\` has to be an object`;
  }
  return undefined;
}

function main(argv: string[]) {
  const targets: string[] = [];
  let json = false;
  let judgment: string | undefined;
  let manifestPath: string | undefined;
  let minimum: number | undefined;
  for (let at = 0; at < argv.length; at++) {
    const arg = argv[at]!;
    if (arg === "--json") json = true;
    else if (arg === "--julgamento") judgment = argv[++at];
    else if (arg === "--manifesto") manifestPath = argv[++at];
    else if (arg === "--minimo") minimum = Number(argv[++at]);
    else if (arg === "--ajuda" || arg === "-h" || arg === "--help") {
      console.log(
        "Usage: bun audit.mts <file-or-folder>... [--json] [--julgamento findings.json] [--manifesto package.json] [--minimo 85]",
      );
      return 0;
    } else targets.push(arg);
  }
  if (targets.length === 0) {
    console.error("Say what to audit: bun audit.mts src/pages");
    return 2;
  }

  const paths: string[] = [];
  for (const target of targets) {
    if (!existsSync(target)) {
      console.error(`Could not find ${target}.`);
      return 2;
    }
    collect(target, paths);
  }
  const base = process.cwd();
  const files = [...new Set(paths)].map((path) => ({
    path: relative(base, path) || path,
    source: readFileSync(path, "utf8"),
  }));

  const found = manifestPath
    ? [resolve(manifestPath)]
    : [...new Set(targets.flatMap((target) => manifestsAbove(target)))];
  const manifests = found
    .filter((path) => existsSync(path))
    .map((path) => ({ path: relative(base, path) || path, source: readFileSync(path, "utf8") }));

  let extra: { findings?: Finding[]; dismissals?: Dismissal[] } = {};
  if (judgment) {
    let parsedJudgment: unknown;
    try {
      parsedJudgment = JSON.parse(readFileSync(judgment, "utf8"));
    } catch (error) {
      console.error(`${judgment} is not readable JSON: ${(error as Error).message}`);
      return 2;
    }
    const problem = judgmentProblem(parsedJudgment);
    if (problem) {
      console.error(`${judgment} does not have the judgment shape: ${problem}.`);
      return 2;
    }
    extra = parsedJudgment as typeof extra;
  }

  const report = audit({
    files,
    manifests,
    findings: extra.findings,
    dismissals: extra.dismissals,
  });
  console.log(json ? JSON.stringify(report, undefined, 2) : renderMarkdown(report));
  if (minimum !== undefined && Number.isFinite(minimum) && report.score < minimum) return 1;
  return 0;
}

const entry =
  (import.meta as { main?: boolean }).main ??
  /[\\/]scripts[\\/]audit\.m?ts$/.test(process.argv[1] ?? "");
if (entry) process.exitCode = main(process.argv.slice(2));
