#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

export type Severity = "critico" | "serio" | "moderado" | "menor";

export type Rule = {
  /** O nome curto da regra, o mesmo que o comentario de supressao e o JSON de julgamento citam. */
  id: string;
  /** A gravidade, que decide o peso na nota. */
  severity: Severity;
  /** `mecanica` sai do script; `julgamento` so entra pelo JSON que o agente escreve. */
  kind: "mecanica" | "julgamento";
  /** `arquivo` pesa na nota do arquivo; `projeto` desconta direto da nota final. */
  scope: "arquivo" | "projeto";
  /** A regra numa frase, como aparece no relatorio. */
  title: string;
  /** O que escrever no lugar. */
  fix: string;
  /** O trecho da documentacao de onde a regra saiu. */
  source: string;
};

export type Finding = {
  /** O `id` da regra. */
  rule: string;
  /** O caminho do arquivo, relativo a raiz da auditoria. */
  file: string;
  /** A linha, contada a partir de 1. */
  line: number;
  /** O que foi achado, com o trecho. */
  message: string;
};

export type Dismissal = {
  /** O `id` da regra do achado descartado. */
  rule: string;
  /** O arquivo do achado descartado. */
  file: string;
  /** A linha do achado descartado. */
  line: number;
  /** Por que o achado nao vale. Sem motivo, o descarte nao e aceito. */
  reason: string;
};

export type SourceFile = {
  /** O caminho, que aparece no relatorio. */
  path: string;
  /** O texto do arquivo. */
  source: string;
};

export type AuditInput = {
  /** Os arquivos de tela. */
  files: SourceFile[];
  /** Os `package.json` do app, do mais perto ao da raiz do monorepo, para conferir os peers opcionais. */
  manifests?: SourceFile[];
  /** Os achados de julgamento que o agente escreveu. */
  findings?: Finding[];
  /** Os achados mecanicos que o agente descartou, cada um com o motivo. */
  dismissals?: Dismissal[];
};

export type FileScore = {
  /** O caminho do arquivo. */
  file: string;
  /** `web` ou `native`, pelo que o arquivo importa. */
  platform: Platform;
  /** A nota do arquivo, de 0 a 100. */
  score: number;
  /** Quantos achados pesaram na nota. */
  findings: number;
};

export type Report = {
  /** A nota final, de 0 a 100. */
  score: number;
  /** A faixa da nota, em palavras. */
  verdict: string;
  /** A nota de cada arquivo auditado, em ordem de caminho. */
  files: FileScore[];
  /** Os arquivos lidos e deixados de fora, por nao terem JSX nem import da biblioteca. */
  skipped: string[];
  /** Os achados que pesaram, em ordem de arquivo, linha e regra. */
  findings: Finding[];
  /** Os achados que um comentario de supressao ou um descarte tirou da conta. */
  waived: (Finding & { reason: string })[];
  /** O que nao pode ser conferido ou foi recusado: manifesto ausente, achado de arquivo fora da auditoria. */
  notes: string[];
};

type Platform = "web" | "native";

export const WEIGHTS: Record<Severity, number> = { critico: 10, serio: 5, moderado: 3, menor: 1 };
export const CAP = 3;

const SEVERITY_LABEL: Record<Severity, string> = {
  critico: "crítico",
  serio: "sério",
  moderado: "moderado",
  menor: "menor",
};

export const RULES: Rule[] = [
  {
    id: "cor-literal",
    severity: "critico",
    kind: "mecanica",
    scope: "arquivo",
    title: "Cor literal no lugar de papel do tema",
    fix: "Use o papel: `bg-surface`, `text-fg-muted`, `border-border`, `text-danger-text`, `bg-accent` com `text-accent-fg`. No nativo, a cor de série é da `PALETTE`.",
    source: "SKILL.md, O que nunca fazer; convencoes.md, O vocabulário",
  },
  {
    id: "nome-acessivel",
    severity: "critico",
    kind: "mecanica",
    scope: "arquivo",
    title: "Controle sem nome acessível",
    fix: "`IconButton` com `label`, nos dois pacotes. Botão só com ícone é `IconButton`, e não `Button` com um ícone dentro.",
    source: "reference/a11y.md, Nome acessível; reference/components.md, Botão só com ícone",
  },
  {
    id: "z-index-numerico",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "z-index numérico",
    fix: "`z-[var(--rc-z-sticky)]` para o que gruda ao rolar, `z-[var(--rc-z-base)]` para voltar ao plano. Os degraus do meio são das peças.",
    source: "SKILL.md, O que nunca fazer; convencoes.md, oito degraus de empilhamento",
  },
  {
    id: "peca-reescrita",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Peça reescrita à mão quando existe no catálogo",
    fix: "A peça do catálogo que a mensagem nomeia. A tabela de escolha de `reference/components.md` desempata as vizinhas.",
    source: "SKILL.md, Confira se a peça já existe; reference/components.md",
  },
  {
    id: "campo-sem-rotulo",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Campo sem rótulo",
    fix: "`Field` com `FieldLabel`, ou o campo dentro de `FormField` com `label`. No nativo, `Field` com `label`. O `placeholder` é exemplo de formato, e não rótulo.",
    source: "reference/a11y.md, por que placeholder não serve; reference/texto.md, Rótulo",
  },
  {
    id: "rotulo-fora-do-controle",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Rótulo de Checkbox, Radio ou Switch num elemento ao lado",
    fix: "Passe o texto como filho: `<Checkbox>ISS retido na fonte</Checkbox>`. A peça se embrulha num `<label>` sozinha.",
    source: "convencoes.md, Rótulo de controle vem como filho",
  },
  {
    id: "imagem-sem-alt",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Imagem sem `alt`",
    fix: '`alt` que diz o que a imagem mostra, ou `alt=""` quando ela só enfeita.',
    source: "reference/a11y.md, Armadilhas por componente",
  },
  {
    id: "elemento-clicavel",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "`onClick` em elemento que não é controle",
    fix: "`Button` para agir, `Link` para ir. Uma `div` com `onClick` não entra no Tab.",
    source: "reference/a11y.md, Foco e teclado",
  },
  {
    id: "tabindex-positivo",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "`tabIndex` positivo",
    fix: "Conserte a ordem do DOM. `tabIndex` só `0` ou `-1`.",
    source: "reference/a11y.md, Foco e teclado",
  },
  {
    id: "foco-apagado",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "`outline-none` sem repor o anel de foco",
    fix: "Junto do `outline-none`, `focus-visible:ring-2 focus-visible:ring-ring`.",
    source: "SKILL.md, O que nunca fazer; reference/a11y.md, Foco e teclado",
  },
  {
    id: "formulario-sem-zod",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Formulário montado sem `useZodForm`",
    fix: "`Form` e `FormField` de `@rivocode/ui/form`, com o esquema do zod em `useZodForm(schema)`.",
    source: "reference/forms.md",
  },
  {
    id: "useform-direto",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "`useForm` do react-hook-form chamado direto",
    fix: "`useZodForm(schema)`: liga o resolver do zod e tira o tipo do esquema.",
    source: "reference/forms.md",
  },
  {
    id: "dinheiro-float",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Dinheiro como número com vírgula",
    fix: "`CurrencyInput`, que entra e sai em centavos inteiros, com `z.number().int()` no esquema; `toCents` para converter texto.",
    source: "reference/forms.md, Dinheiro é CurrencyInput; convencoes.md, Formatar o número",
  },
  {
    id: "dinheiro-escrito",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Dinheiro formatado à mão",
    fix: "`currencyShort` em indicador, tabela e eixo; `currency` onde o centavo é o assunto. Os dois saem da raiz.",
    source: "SKILL.md, Dinheiro sai abreviado",
  },
  {
    id: "documento-sem-validador",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "CPF ou CNPJ conferido sem `isValidCpf` ou `isValidCnpj`",
    fix: "`z.string().refine(isValidCnpj, 'CNPJ inválido')`. Os dois conferem o dígito, aceitam máscara e o CNPJ alfanumérico.",
    source: "reference/forms.md; convencoes.md, Formatar o número",
  },
  {
    id: "mascara-a-mao",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Máscara escrita com `replace`",
    fix: "`MaskedInput` com `mask` (`cpf`, `cnpj`, `telefone`, `cep`, `boleto`), ou `applyMask` para a célula de tabela.",
    source: "convencoes.md, Formatar o número",
  },
  {
    id: "pix-qr-caseiro",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "QR ou Pix montado à mão",
    fix: "`PixCode` para cobrar, com o copia e cola de `buildPixPayload`; `QRCode` para qualquer outro link. No nativo, os dois saem de `@rivocode/ui-native/chart`.",
    source: "reference/components.md, Cobrar por Pix; convencoes.md, O Pix tem as três dele",
  },
  {
    id: "import-caminho-errado",
    severity: "serio",
    kind: "mecanica",
    scope: "arquivo",
    title: "Importação pelo caminho errado",
    fix: "O caminho que a mensagem nomeia. Formulário, gráfico, IA, arrastar e editor moram em subcaminhos; no nativo, cada peer tem a sua porta.",
    source: "convencoes.md, Os quatro subcaminhos; O pacote nativo, e os cinco subcaminhos dele",
  },
  {
    id: "recharts-direto",
    severity: "menor",
    kind: "mecanica",
    scope: "arquivo",
    title: "Recharts importada direto",
    fix: "As marcas que o tema veste saem de `@rivocode/ui/chart`, dentro do `ChartContainer`.",
    source: "convencoes.md, `@rivocode/ui/chart`",
  },
  {
    id: "portal-a-mao",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Provedor ou portal montado à mão",
    fix: "Nada: o `RivoProvider` já monta o provedor de dica, a fiação de aviso e o container de portal.",
    source: "SKILL.md, O Provider, uma vez, na raiz",
  },
  {
    id: "altura-cravada",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Altura cravada em controle",
    fix: "`h-[var(--rc-control-md)]`, com `sm` e `lg`: a altura vem da densidade.",
    source: "SKILL.md, Altura de controle vem da densidade",
  },
  {
    id: "descendente-arbitrario",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Parte da peça alcançada por variante de descendente",
    fix: "`classNames={{ parte: '…' }}`, com o nome da seção Partes da página da peça.",
    source: "SKILL.md, Abaixo da raiz, vista a parte pelo nome",
  },
  {
    id: "movimento-literal",
    severity: "menor",
    kind: "mecanica",
    scope: "arquivo",
    title: "Duração ou curva literal",
    fix: "`duration-fast`, `duration-base`, `duration-slow` e `ease-rc`, que zeram com reduzir movimento.",
    source: "convencoes.md, Movimento tem nome de intenção",
  },
  {
    id: "consulta-sem-finais",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Listagem ou gráfico sem os quatro finais",
    fix: "`isLoading`, `isError` com `onRetry`, e `empty` com título e descrição.",
    source: "SKILL.md, Toda listagem tem quatro finais; reference/components.md",
  },
  {
    id: "texto-sem-acento",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Texto de tela sem acento",
    fix: "O texto que a pessoa lê vai acentuado.",
    source: "reference/texto.md, Forma",
  },
  {
    id: "texto-em-ingles",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Texto de tela em inglês",
    fix: "Código em inglês, conteúdo em PT-BR. Termo do ecossistema não se traduz.",
    source: "SKILL.md, O que nunca fazer; reference/texto.md",
  },
  {
    id: "peer-faltando",
    severity: "serio",
    kind: "mecanica",
    scope: "projeto",
    title: "Peer do subcaminho faltando no package.json",
    fix: "Instale o peer que o subcaminho cobra. Sem ele o build quebra, ou a peça não monta.",
    source: "convencoes.md, Os quatro subcaminhos; O pacote nativo",
  },
  {
    id: "escolha-de-peca",
    severity: "serio",
    kind: "julgamento",
    scope: "arquivo",
    title: "Peça do catálogo errada para a situação",
    fix: "A linha da tabela de escolha de `reference/components.md` que casa com a situação.",
    source: "reference/components.md, Escolhas que costumam sair erradas",
  },
  {
    id: "validacao-a-mao",
    severity: "serio",
    kind: "julgamento",
    scope: "arquivo",
    title: "Formulário que valida com estado e `if`",
    fix: "O esquema do zod em `useZodForm`, que valida e dá o tipo.",
    source: "reference/forms.md",
  },
  {
    id: "cor-sozinha",
    severity: "serio",
    kind: "julgamento",
    scope: "arquivo",
    title: "Situação dita só pela cor",
    fix: 'Palavra ou ícone junto do tom: o `Badge` diz "Vencida".',
    source: "reference/a11y.md, Cor nunca sozinha",
  },
  {
    id: "texto-generico",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Texto que não diz o que acontece",
    fix: "Botão com verbo e objeto, erro que nomeia quem falhou e o que fazer, vazio que é porta.",
    source: "reference/texto.md",
  },
  {
    id: "finais-da-consulta",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Consulta que só desenha o caminho feliz",
    fix: "Carregando, erro com saída e vazio com descrição, também fora do `DataTable`.",
    source: "reference/components.md, Toda consulta tem quatro finais",
  },
  {
    id: "titulos-fora-de-ordem",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Títulos que pulam nível",
    fix: "Um `h1` por página e depois `h2`, `h3` em ordem; o tamanho muda por `size` no `Heading`.",
    source: "reference/a11y.md, Ordem de títulos",
  },
  {
    id: "passo-sem-nome",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Passo de wizard chamado pelo número",
    fix: 'Nome de substantivo que diz a decisão do passo: "Cliente", "Serviço", "Revisão". Passo que só se chama "Passo 2" é rolagem, e o conteúdo cabe num formulário só.',
    source: "reference/fluxo.md, Uma tela ou várias",
  },
  {
    id: "dado-sem-mascara",
    severity: "moderado",
    kind: "mecanica",
    scope: "arquivo",
    title: "Campo de documento, telefone ou CEP num Input comum",
    fix: '`MaskedInput` com `mask="cpf"`, `"cnpj"`, `"telefone"` ou `"placa"`, e `PostalCodeField` para CEP. A máscara pontua, põe o teclado numérico, e o `onValueChange` entrega o cru.',
    source: "SKILL.md, O campo sai do dado; reference/components.md",
  },
  {
    id: "wizard-sem-dependencia",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Wizard para o que é só comprido",
    fix: "Um formulário só, em seções com `Fieldset`, e o raro num `Collapsible`. Passos só quando uma etapa depende da anterior.",
    source: "reference/fluxo.md, Wizard ou formulário único: a checagem",
  },
  {
    id: "confirmacao-em-reversivel",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Confirmação para o que dava para desfazer",
    fix: 'Faça na hora e ofereça "Desfazer" no aviso, com `actionProps` do `useToast`. `AlertDialog` fica para o que não tem volta.',
    source: "reference/fluxo.md, Confirmar, desfazer, ou nada",
  },
  {
    id: "destrutivo-sem-protecao",
    severity: "serio",
    kind: "julgamento",
    scope: "arquivo",
    title: "Ação sem volta sem confirmação nem desfazer",
    fix: "`AlertDialog` que nomeia o objeto e diz o efeito, ou, se der para reverter, desfazer no aviso.",
    source: "reference/fluxo.md, Confirmar, desfazer, ou nada",
  },
  {
    id: "rascunho-que-some",
    severity: "moderado",
    kind: "julgamento",
    scope: "arquivo",
    title: "Tarefa que perde o que foi digitado",
    fix: "Um formulário só por baixo dos passos, e o erro de envio que mantém os campos. Guardar rascunho no navegador é decisão do projeto, e nunca com dado sensível.",
    source: "reference/fluxo.md, O wizard bem feito",
  },
  {
    id: "sucesso-silencioso",
    severity: "menor",
    kind: "julgamento",
    scope: "arquivo",
    title: "Ação que termina sem dizer que terminou",
    fix: 'Aviso com o que aconteceu e o próximo passo: "Nota 4816 emitida. Ver PDF".',
    source: "reference/fluxo.md, O que deixa o produto esperto",
  },
  {
    id: "provider-ausente",
    severity: "critico",
    kind: "julgamento",
    scope: "projeto",
    title: "Árvore sem `RivoProvider` na raiz",
    fix: "Um `RivoProvider` na raiz do app, e nenhum provedor de dica, aviso ou portal à mão.",
    source: "SKILL.md, O Provider, uma vez, na raiz",
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
  button: "`Button` (ou `IconButton`, quando só tem ícone)",
  select: "`Select` (lista longa ou do servidor: `Combobox`)",
  textarea: "`Textarea`",
  table: "`DataTable` para listagem, ou `Table` montada à mão",
  dialog: "`Dialog` (confirmação destrutiva: `AlertDialog`)",
  progress: "`Progress`",
  meter: "`Meter`",
  hr: "`Separator`",
  details: "`Accordion` ou `Collapsible`",
};

const INPUT_TYPES: Record<string, string> = {
  checkbox: "`Checkbox`",
  radio: "`RadioGroup` com `Radio`",
  range: "`Slider`",
  search: "`SearchInput`",
  password: "`PasswordInput`",
  file: "`FileUpload`",
  date: "`DatePicker`",
  "datetime-local": "`DatePicker` com `TimeField`",
  time: "`TimeField`",
  number: "`NumberField` (dinheiro: `CurrencyInput`)",
  color: "`ColorPicker`",
  submit: '`Button type="submit"`',
  button: "`Button`",
};

const ROLES: Record<string, string> = {
  dialog: "`Dialog`",
  alertdialog: "`AlertDialog`",
  tooltip: "`Tooltip`",
  switch: "`Switch`",
  tablist: "`Tabs` com `TabList`",
  progressbar: "`Progress`",
  menu: "`Menu`",
  combobox: "`Combobox`",
};

const NATIVE_PRIMITIVES: Record<string, string> = {
  Button: "`Button` do `@rivocode/ui-native`",
  TextInput: "`Input` (ou `Textarea`, `PasswordInput`, `CurrencyInput`)",
  Switch: "`Switch` do `@rivocode/ui-native`",
  Modal: "`Dialog` ou `Sheet`",
  ActivityIndicator: "`Spinner`",
  TouchableOpacity: "`Button` ou `IconButton`",
  TouchableHighlight: "`Button` ou `IconButton`",
  TouchableWithoutFeedback: "`Button`, `IconButton` ou `Pressable` com `accessibilityRole`",
  TouchableNativeFeedback: "`Button` ou `IconButton`",
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
      if (!address) add("cor-literal", literal.start, `cor hexadecimal \`${value.trim()}\``);
      continue;
    }
    const functional = COLOR_FUNCTION.exec(value);
    if (functional)
      add("cor-literal", literal.start, `cor em função \`${excerpt(functional[1]!, 20)}…\``);
    for (const { token, base } of classTokens(value)) {
      if (/\[[^\]]*#[0-9a-f]{3,8}(?![0-9a-z])[^\]]*\]/i.test(token))
        add("cor-literal", literal.start, `classe com cor arbitrária \`${token}\``);
      else if (ARBITRARY_NAMED.test(base))
        add("cor-literal", literal.start, `classe com cor por nome \`${token}\``);
      else if (PALETTE_CLASS.test(base))
        add("cor-literal", literal.start, `classe da paleta do Tailwind \`${token}\``);
    }
  }
  for (const match of parsed.code.matchAll(NAMED_COLOR)) {
    add("cor-literal", match.index!, `cor por nome \`${match[1]}\``);
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
        add("z-index-numerico", literal.start, `classe \`${token}\``);
      if (
        /^(?:duration|delay)-\d+$/.test(base) ||
        (/^(?:ease|duration)-\[/.test(base) && !base.includes("var(--rc-"))
      ) {
        add("movimento-literal", literal.start, `classe \`${token}\``);
      }
    }
    if (/z-index\s*:\s*-?\d/.test(literal.value))
      add("z-index-numerico", literal.start, "`z-index` numérico em CSS");
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
          `\`${hides.token}\` sem \`focus-visible:ring\` na mesma classe`,
        );
    }
  }
  for (const match of parsed.code.matchAll(/\bzIndex\s*:\s*-?\d/g)) {
    add("z-index-numerico", match.index!, "`zIndex` numérico no estilo");
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
        add("nome-acessivel", node.start, "`IconButton` sem `label`");
      }
    }

    if (platform === "web" && (name === "Button" || lower === "button") && !spread(node)) {
      const named = filled("aria-label") || filled("aria-labelledby") || filled("title");
      if (!named && onlyIcons(node))
        add(
          "nome-acessivel",
          node.start,
          `${tagOf(node)} só com ícone e sem nome: é \`IconButton\` com \`label\``,
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
        `${tagOf(node)} só com ícone e sem \`accessibilityLabel\`: é \`IconButton\` com \`label\``,
      );
    }

    if (platform === "web" && lower === "img" && !spread(node) && !has("alt")) {
      add("imagem-sem-alt", node.start, "`<img>` sem `alt`");
    }

    if (
      platform === "web" &&
      lower &&
      (NON_INTERACTIVE.has(lower) || (lower === "a" && !has("href"))) &&
      has("onClick") &&
      !has("role")
    ) {
      const suffix = lower === "a" ? " sem `href`" : "";
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
        suggestion = "`Dialog` ou `Sheet` (modal caseiro)";
      }
      if (suggestion) add("peca-reescrita", node.start, `\`<${lower}>\` no lugar de ${suggestion}`);
    }

    const primitive = native(node);
    if (platform === "native" && primitive && NATIVE_PRIMITIVES[primitive]) {
      add(
        "peca-reescrita",
        node.start,
        `\`${primitive}\` do react-native no lugar de ${NATIVE_PRIMITIVES[primitive]}`,
      );
    }

    if (name === "Field" && !spread(node)) {
      if (
        platform === "web" &&
        !descendants(node).some((inner) => house(inner) === "FieldLabel" || inner.name === "label")
      ) {
        add("campo-sem-rotulo", node.start, "`Field` sem `FieldLabel`");
      }
      if (platform === "native" && !filled("label"))
        add("campo-sem-rotulo", node.start, "`Field` sem `label`");
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
        const placeholder = has("placeholder") ? ", e o `placeholder` não é rótulo" : "";
        add(
          "campo-sem-rotulo",
          node.start,
          `\`${name}\` fora de \`Field\` e sem nome${placeholder}`,
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
              `\`${name}\` sem filho, com o texto num ${tagOf(neighbor)} ao lado`,
            );
          }
        }
      }
      if (!labelled && !outside && platform === "native" && name !== "Radio") {
        add(
          "nome-acessivel",
          node.start,
          `\`${name}\` sem texto ao lado e sem \`label\`: no nativo o nome falado é o \`label\``,
        );
      }
    }

    if (platform === "web" && lower === "form") {
      const role = attr(node, "role");
      if (
        !(role?.kind === "string" && role.value === "search") &&
        !/\buseZodForm\b/.test(parsed.code)
      ) {
        add("formulario-sem-zod", node.start, "`<form>` montado à mão, sem `Form` e `useZodForm`");
      }
    }

    if (name && SIZED_CONTROLS.has(name)) {
      const classes = attr(node, "className");
      if (classes) {
        for (const literal of ctx.literalsIn(classes)) {
          for (const { token, base } of classTokens(literal.value)) {
            if (/^h-(?:\d+(?:\.5)?|\[\d+(?:\.\d+)?(?:px|rem)\])$/.test(base)) {
              add("altura-cravada", literal.start, `\`${token}\` em \`${name}\``);
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
            `\`${name}\` de consulta sem ${missing.map((key) => `\`${key}\``).join(", ")}`,
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
              `\`${excerpt(token, 40)}\` em \`${name}\``,
            );
        }
      }
    }

    if (HAND_PROVIDERS.test(node.name))
      add("portal-a-mao", node.start, `\`${node.name}\` montado à mão`);

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
          `campo numérico para dinheiro (\`${excerpt(labels, 30)}\`): é \`CurrencyInput\``,
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
      add("dinheiro-escrito", offset, "`Intl.NumberFormat` ou `toLocaleString` com moeda");
    }
    if (/\bcreatePortal\s*\(/.test(line)) add("portal-a-mao", offset, "`createPortal`");
    if (/\bcrc16\w*\s*\(|\bfunction\s+crc\w*/i.test(line))
      add("pix-qr-caseiro", offset, "CRC do BR Code calculado à mão");
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
      add("pix-qr-caseiro", literal.start, "copia e cola do Pix montado à mão");
    }
  }
  for (const node of parsed.elements) {
    const affix = ["InputPrefix", "InputSuffix"].includes(ctx.house(node) ?? "");
    for (const child of node.children) {
      if (affix && child.kind === "text" && child.value.trim() === "R$") continue;
      if (child.kind === "text" && WRITTEN_MONEY.test(child.value))
        add("dinheiro-escrito", child.start, `\`${excerpt(child.value, 40)}\` escrito no JSX`);
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
        "CPF ou CNPJ conferido sem o dígito verificador",
      );
  }

  for (const literal of parsed.literals) {
    if (/^\s*(?:passo|etapa|step)\s*\d+\s*$/i.test(literal.value))
      add("passo-sem-nome", literal.start, `\`${literal.value}\` como nome de passo`);
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
    if (hit) add("dado-sem-mascara", node.start, `campo de ${hit[0]} num \`Input\` comum`);
  }

  for (const entry of imports) {
    const offsetOf = entry.offset;
    if (QR_LIBRARIES.has(entry.source))
      add("pix-qr-caseiro", offsetOf, `\`${entry.source}\` no lugar de \`QRCode\` ou \`PixCode\``);
    if (
      entry.source === "react-hook-form" &&
      entry.names.some((item) => item.imported === "useForm")
    ) {
      add("useform-direto", offsetOf, "`useForm` do react-hook-form");
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
      `\`${source}\` é o pacote web; no React Native é \`@rivocode/ui-native\``,
    );
    return;
  }
  if (platform === "web" && nativePackage) {
    add(
      "import-caminho-errado",
      offset,
      `\`${source}\` é o pacote nativo; no web é \`@rivocode/ui\``,
    );
    return;
  }

  const root = nativePackage ? "@rivocode/ui-native" : "@rivocode/ui";
  const subpaths = Object.entries(ENTRIES).filter(([path]) => path.startsWith(`${root}/`));

  if (source !== root && !ENTRIES[source]) {
    add(
      "import-caminho-errado",
      offset,
      `\`${source}\` não é uma entrada do pacote; as entradas são \`${root}\` e ${subpaths.map(([path]) => `\`${path}\``).join(", ")}`,
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
          `\`${item.imported}\` sai de \`${home[0]}\`, e não da raiz`,
        );
      }
      continue;
    }
    const entryNames = ENTRIES[source]!.names;
    if (!entryNames.includes(item.imported)) {
      add(
        "import-caminho-errado",
        offset,
        `\`${item.imported}\` não sai de \`${source}\`; ${home ? `mora em \`${home[0]}\`` : `mora na raiz, \`${root}\``}`,
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
  /** O caminho do arquivo. */
  path: string;
  /** Se o arquivo entra na nota: tem JSX ou importa a biblioteca. */
  relevant: boolean;
  /** `web` ou `native`. */
  platform: Platform;
  /** Os achados, antes dos descartes. */
  findings: Finding[];
  /** Os achados que um comentario de supressao tirou da conta. */
  waived: (Finding & { reason: string })[];
  /** As entradas da biblioteca que o arquivo importa. */
  entries: string[];
  /** Se o arquivo chama `useZodForm`. */
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
      notes: ["Nenhum package.json achado: os peers dos subcaminhos não foram conferidos."],
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
        notes: [`${item.path} não é JSON válido: os peers não foram conferidos.`],
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
        message: `\`${entry}\` é importado em ${count} arquivo(s) e \`${name}\` não está no package.json`,
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
      ? "Segue a casa"
      : score >= 75
        ? "Ajustes pontuais"
        : score >= 50
          ? "Retrabalho"
          : "Fora do contrato";
  return critical && band === "Segue a casa" ? "Ajustes pontuais" : band;
}

function shapeProblem(item: unknown, text: "message" | "reason"): string | undefined {
  if (!item || typeof item !== "object" || Array.isArray(item))
    return `\`${JSON.stringify(item)}\` não é um objeto com \`rule\`, \`file\`, \`line\` e \`${text}\``;
  const record = item as Record<string, unknown>;
  const where = `\`${String(record.rule)}\` em ${String(record.file)}:${String(record.line)}`;
  if (typeof record.rule !== "string" || record.rule.length === 0)
    return `${where}, sem \`rule\` em texto`;
  if (typeof record.file !== "string" || record.file.length === 0)
    return `${where}, sem \`file\` em texto`;
  if (typeof record.line !== "number" || !Number.isInteger(record.line) || record.line < 1)
    return `${where}, com \`line\` que não é um inteiro a partir de 1`;
  const value = record[text];
  if (typeof value !== "string" || value.trim().length === 0)
    return text === "reason" ? "sem motivo" : `${where}, sem \`message\``;
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
      notes.push(`Achado recusado: ${shape}.`);
      continue;
    }
    const rule = RULE_BY_ID.get(finding.rule);
    if (!rule) {
      notes.push(`Achado recusado: a regra \`${finding.rule}\` não existe.`);
      continue;
    }
    const project = rule.scope === "projeto";
    if (!project && !known.has(finding.file)) {
      notes.push(`Achado recusado: \`${finding.file}\` não está entre os arquivos auditados.`);
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
    } else if (shape === "sem motivo") {
      notes.push(`Descarte recusado, sem motivo: \`${item.rule}\` em ${item.file}:${item.line}.`);
    } else {
      notes.push(`Descarte recusado: ${shape}.`);
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
      `Descarte sem achado correspondente: \`${item.rule}\` em ${item.file}:${item.line}.`,
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
  `Cada regra tem um peso pela severidade: crítico ${WEIGHTS.critico}, sério ${WEIGHTS.serio}, moderado ${WEIGHTS.moderado}, menor ${WEIGHTS.menor}.`,
  `Nota do arquivo = max(0, 100 − Σ peso(regra) × min(ocorrências da regra no arquivo, ${CAP})).`,
  "Base = média das notas dos arquivos auditados, arredondada para o inteiro mais próximo (sem arquivo, 100).",
  `Nota final = max(0, base − Σ peso(regra de projeto) × min(ocorrências, ${CAP})).`,
  "Faixa: 90 a 100 segue a casa, 75 a 89 ajustes pontuais, 50 a 74 retrabalho, abaixo de 50 fora do contrato. Com achado crítico, a faixa não passa de ajustes pontuais.",
];

export function renderMarkdown(report: Report): string {
  const out: string[] = [];
  out.push("# Auditoria de tela do @rivocode/ui", "");
  out.push(`**Nota: ${report.score}/100.** ${report.verdict}.`, "");
  const platforms =
    [...new Set(report.files.map((file) => file.platform))].join(" e ") || "nenhuma";
  out.push(
    `${report.files.length} arquivo(s) auditado(s), plataforma ${platforms}.` +
      (report.skipped.length > 0
        ? ` ${report.skipped.length} ficaram de fora por não terem JSX nem import da biblioteca.`
        : ""),
    "",
  );

  const byRule = new Map<string, Finding[]>();
  for (const finding of report.findings)
    byRule.set(finding.rule, [...(byRule.get(finding.rule) ?? []), finding]);
  if (byRule.size > 0) {
    out.push(
      "## Por regra",
      "",
      "| Regra | Severidade | Peso | Ocorrências | Arquivos |",
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
      "## Por arquivo",
      "",
      "| Arquivo | Plataforma | Nota | Achados |",
      "| --- | --- | --- | --- |",
    );
    for (const file of report.files)
      out.push(`| \`${file.file}\` | ${file.platform} | ${file.score} | ${file.findings} |`);
    out.push("");
  }

  if (report.findings.length > 0) {
    out.push("## Achados", "");
    let current = "";
    for (const finding of report.findings) {
      if (finding.file !== current) {
        if (current !== "") out.push("");
        current = finding.file;
        const score = report.files.find((file) => file.file === current)?.score;
        out.push(`### \`${current}\`${score === undefined ? "" : ` (nota ${score})`}`, "");
      }
      const rule = RULE_BY_ID.get(finding.rule)!;
      out.push(
        `- L${finding.line} **${rule.id}** (${SEVERITY_LABEL[rule.severity]}${rule.kind === "julgamento" ? ", julgamento" : ""}): ${finding.message}. ${rule.fix}`,
      );
    }
    out.push("");
  } else {
    out.push("Nenhum achado.", "");
  }

  if (report.waived.length > 0) {
    out.push("## Fora da conta", "");
    for (const item of report.waived)
      out.push(
        `- \`${item.file}\` L${item.line} **${item.rule}**: ${item.message}. Motivo: ${item.reason}`,
      );
    out.push("");
  }

  if (report.notes.length > 0) {
    out.push("## Avisos", "", ...report.notes.map((note) => `- ${note}`), "");
  }

  out.push("## A conta", "", ...FORMULA.map((line) => `- ${line}`), "");
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
    return 'o topo tem que ser um objeto, `{ "findings": [...], "dismissals": [...] }`';
  const record = value as Record<string, unknown>;
  for (const key of ["findings", "dismissals"]) {
    const list = record[key];
    if (list === undefined) continue;
    if (!Array.isArray(list)) return `\`${key}\` tem que ser uma lista`;
    const index = list.findIndex(
      (item) => !item || typeof item !== "object" || Array.isArray(item),
    );
    if (index >= 0) return `\`${key}[${index}]\` tem que ser um objeto`;
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
        "Uso: bun audit.mts <arquivo-ou-pasta>... [--json] [--julgamento achados.json] [--manifesto package.json] [--minimo 85]",
      );
      return 0;
    } else targets.push(arg);
  }
  if (targets.length === 0) {
    console.error("Diga o que auditar: bun audit.mts src/pages");
    return 2;
  }

  const paths: string[] = [];
  for (const target of targets) {
    if (!existsSync(target)) {
      console.error(`Não achei ${target}.`);
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
      console.error(`${judgment} não é um JSON legível: ${(error as Error).message}`);
      return 2;
    }
    const problem = judgmentProblem(parsedJudgment);
    if (problem) {
      console.error(`${judgment} não tem a forma do julgamento: ${problem}.`);
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
