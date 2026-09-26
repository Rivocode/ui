# Mudancas

## 1.1.0

A primeira versao menor da 1.x e, na maior parte, conserto. Uma revisao de
todas as pecas, com cada defeito reproduzido em teste ou no Chrome antes de ser
chamado de defeito, achou perto de oitenta; os do web estao aqui, cada um com
teste que fica vermelho se ele voltar. Nada foi tirado nem renomeado. Onde o
comportamento muda de um jeito que se ve, a linha diz.

### Novo

- `ChartDonut`, `ChartFunnel`, `ChartTreemap` e `ChartHeatmap` ganham `empty`,
  no formato do `ChartContainer`, mostrado com lista vazia ou soma zero.
- `ChartContainer` com lista vazia e sem `empty` avisa "Sem dados no periodo"
  em vez de desenhar eixos sobre o nada; o texto troca por `labels.noData`.
- `SidebarProvider` ganha `openMobile` e `onOpenMobileChange`: a folha do
  celular tem estado proprio.
- `Timeline` ganha `labels`, com o "pendente" e a palavra de cada tom ditos em
  texto ao leitor de tela.
- `FileUpload` ganha `labels.tooMany`.

### Camadas

- O que abre de dentro de uma camada fica acima dela. `Select`, `Combobox`,
  `Autocomplete`, `Menu`, `ContextMenu`, `Menubar` e `NavigationMenu` abriam
  escondidos atras de `Dialog`, `AlertDialog`, `Sheet`, `Command` e `Popover`.
  Fora de camada nenhuma, nada muda de valor.
- O `AlertDialog` aberto de dentro de um `Popover` cobre o popover e o deixa
  inerte; o `Tour` com alvo dentro de um `Dialog` bloqueia o resto do dialogo;
  o cartao arrastado do `Kanban` sai em portal e fica visivel, sobre o
  original, mesmo dentro de uma `Sheet` ou de um `Dialog`, e as setas do
  arrasto por teclado chegam ao `Kanban` e ao `SortableList` dentro dessas
  camadas (o popup as parava, e o cartao nao andava). Muda o que se exige: o
  `Kanban` passa a pedir o `RivoProvider` em volta, como as pecas que abrem
  camada ja pediam.

### Formulario

- `MaskedInput`: o Backspace apaga o telefone ate o fim (travava em `(11) `), e
  o cursor fica onde se digitou no meio; Backspace e Delete sobre um literal
  apagam o digito vizinho (com Alt, Ctrl ou Cmd, fica com o navegador). Muda o
  que se ve: o literal so aparece junto com o digito seguinte - "11" no
  telefone mostra `(11`, e nao `(11) `.
- `DatePicker` e `Calendar` controlados voltam ao vazio quando o valor de fora
  volta a `undefined` (voltavam a primeira data escolhida, e o formulario a
  enviava); a data digitada respeita `disabledDays`.
- `CurrencyInput` e `TimeField` mandam ao formulario so o valor, e nao o texto
  pontuado, inclusive pelo `name` do `<Field>`; o `TimeField` desabilitado nao
  envia; o `<Field disabled>` tira do envio o valor escondido deles e do
  `TagsInput`, e trava o olho do `PasswordInput`; o "-" sozinho do
  `CurrencyInput` sai quando o valor e zerado por fora ou o campo perde o foco.
- `forValue` repassa a `ref`: o react-hook-form foca o campo de dinheiro ou de
  hora que voltou com erro.
- `TagsInput`: no teto continua focado e tirando ficha pelo Backspace; colar
  com virgula vira uma ficha por item; o formulario recebe as fichas, e nao o
  rascunho.
- `SearchInput` controlado: o Esc limpa pelo `onChange`, e o estado do app
  acompanha a tela.
- `PostalCodeField` aceita o CEP colado com ponto; o olho do `PasswordInput`
  desabilitado nao revela a senha; o `Editable` devolve o foco depois de Enter
  e Esc.
- `Tree` e `TreeSelect`: o teclado deixa de escolher no desabilitado, o pai
  deixa de mexer nas folhas desabilitadas, a busca ignora acento, e Home, End e
  o Tab voltam a ultima linha focada.
- `ColorPicker`: a amostra avisa a cor em seis digitos minusculos.
- `FileUpload` sem `multiple` manda o excedente para o `onReject`, com motivo.

### Dados, tabelas e graficos

- `FilterBar`: o "Limpar" mantem os filtros `removable: false` (apagava o
  escopo de filial ou tenant) e conta so os que saem; o foco pousa na barra.
- `DataTable`: a pagina fica dentro do que existe quando `data` encolhe; a
  selecao nao controlada perde as linhas que sairam; texto ordena em portugues
  (acento deixa de ir para depois do Z) e vazio fica sempre no fim.
- `EventCalendar`: o clique no painel "+N mais" nao cria compromisso; o
  intervalo devolvido e o clicado, em hora de parede (o horario de verao
  deslocava uma hora, e na hora repetida do fim dele o fim saia antes do
  comeco); so e "Dia inteiro" o que e dia inteiro; o seletor de
  data segue `locale` e `weekStartsOn`.
- `ChartDonut`: o miolo fica sempre visivel, e a dica abre fora do buraco e
  inteira dentro da moldura, mesmo num cartao estreito; a pizza
  (`thickness={1}`) mantem a largura do miolo; o anel de fundo e sempre
  desenhado; a cor segue a ordem do `config`.
- `ChartContainer`: chave com espaco ou ponto deixa de pintar a serie de preto.
- `ChartRadial` diz o valor real acima do maximo e travessao para `NaN`;
  `compact`, `compactWords` e `currencyShort` sobem de grandeza ("1M", e nao
  "1.000K"), ganham a faixa do trilhao ("1T") e seguem o sinal do `currency`; a `Sparkline` de um ponto sai
  neutra; o `ChartTreemap` espelha no RTL.
- `RelativeTime` com data invalida escreve travessao em vez de derrubar a
  arvore; `Stat` com delta que sai 0% na tela fica neutro; `DescriptionList`, `PageHeader` e
  `Accordion` quebram texto longo em vez de estourar a largura no celular.

### Acoes, avisos e navegacao

- Todo botao interno de peca declara `type="button"`: "Tentar de novo",
  "Limpar selecao" e os botoes do `CookieConsent` e da `NotificationCenter`
  enviavam o formulario em volta.
- `RivoProvider` com `theme="system"` e o `Kbd` hidratam igual ao servidor.
- `Button` com `render` desabilitado ou carregando deixa de navegar e se
  anuncia desabilitado.
- `Clipboard` mostra o `children` ate copiar e chama o `onClick` de quem usa.
- `Progress` e `Meter` com `format` escrevem o valor da faixa, e nunca `NaN`.
- `ToastViewport`: o aviso alem do limite sai de vista em vez de ficar visivel
  e inerte.
- `Sidebar` e `Command`: Ctrl/Cmd+B e Ctrl/Cmd+K nao disparam em campo nem no
  `RichTextEditor`; o atalho casa maiuscula; o Enter da composicao do IME nao
  executa comando.
- `SidebarProvider` controlado deixa de abrir a folha do celular por cima da
  tela; quem abria a folha pelo `open` passa ao `openMobile`. `Sidebar` e
  `Steps` levam classe e atributos aos dois modos; o `id`, o `ref` e o
  `data-testid` do `Steps` ficam so na lista da mesa.
- `Breadcrumb`: mostra a primeira e as `max - 1` ultimas, sem repetir migalha.
  Muda o que se ve: com o padrao `max={4}` e cinco migalhas, a trilha sai
  "A … C D E". No celular, ela guarda a pagina atual e a migalha anterior de
  verdade, com o link de volta.
- `Pagination` prende a pagina na faixa e trava as setas sem pagina para ir.
- `ToolCall` abre o painel quando o status muda para erro ou aprovacao;
  `useWizard` anda um passo so com dois toques durante a checagem assincrona.

## 1.0.0

A primeira versao em que o contrato vale como promessa. A API fica congelada:
daqui em diante vale semver a risca - quebra so em versao maior, o que vai sair
ganha `@deprecated` com o caminho novo e fica pelo menos uma versao menor antes
de sair, prop e peca nova sao versao menor, correcao e patch. Para chegar
limpa aqui, a biblioteca tirou o que estava obsoleto e deu um nome so a cada
ideia. Cada troca, peca por peca, esta em
<https://ds.rivocode.com.br/migrar-para-1-0> (e em markdown cru em
`/migrar-para-1-0.md`); quem usa o Claude Code pode copiar o agent `migracao`
do repositorio, que conhece a tabela e reescreve os pontos de chamada.

Quase tudo abaixo o `tsc` acusa. O que ele nao pega esta no fim.

### Sai o que estava obsoleto

- `Calendar`: `mode="single"` com `selected` e `onSelect` sai; data unica e
  `value` e `onValueChange`. `multiple` e `range` continuam pelo `mode`.
- `startMonth` e `endMonth` saem do `Calendar`, do `DatePicker` e do
  `DateRangePicker`; `min` e `max` param a navegacao no mesmo mes e ainda
  bloqueiam os dias de fora.
- `labelClassName` sai do `Checkbox`, do `Radio` e do `Switch`: `classNames.label`.
- `@rivocode/ui/form`: `forDatePicker`, `forSelect` e `forCheckbox` e os tipos
  `PropsDeDatePicker`, `PropsDeSelect` e `PropsDeCheckbox` saem; ficam
  `forDate`, `forValue`, `forChecked`, `DateProps`, `ValueProps` e
  `CheckedProps`.

### Um nome so para cada coisa

- `variant="destructive"` vira `variant="danger"` no `Button`, no `IconButton`
  e no `Clipboard`, o mesmo nome do `tone="danger"` do `Popconfirm` e do
  `MenuItem`. As classes e os pares de contraste nao mudam.
- Botao so de icone e sempre o `IconButton`: `size="icon"` e `size="iconSm"`
  saem do `Button`. O `Clipboard` sem texto passa a desenhar um `IconButton`,
  aceita `size` `sm`, `md` e `lg`, e recusa `aria-label` no tipo - o nome vem
  de `labels.copy` e `labels.copied`.
- `size="cta"` do `Button` vira `size="xl"`, com as mesmas medidas, e `xl` e so
  tamanho: fica no peso medio, como `sm`, `md` e `lg`.
- Abrir e fechar se chama `open`: o `Spoiler` troca `expanded`,
  `defaultExpanded` e `onExpandedChange` por `open`, `defaultOpen` e
  `onOpenChange`, e a `Tree` troca `expanded` e `onExpandedChange` por `open` e
  `onOpenChange`, e ganha `defaultOpen`.
- O `Steps` troca `current` e `onStepClick` por `step` e `onStepChange`, como o
  `Tour` e o `useWizard`.

### Texto de interface em `labels`

As props soltas terminadas em `Label` saem sem apelido, e cada uma vira a chave
de `labels` com o nome sem o `Label`; onde era `ReactNode`, a chave e `string`:
`retryLabel` (`QueryBoundary`, `DataTable`, `VirtualList`, `EventCalendar`,
`Gantt`, `ChartContainer`), `dismissLabel` (`Alert`, `Banner`),
`confirmLabel`, `cancelLabel` e `busyLabel` (`Popconfirm`), `externalLabel`
(`Link`), `swatchesLabel` (`ColorPicker`), `scrollLabel` (`Conversation`),
`submitLabel` e `stopLabel` (`PromptInput`), `rateLabel`, `overallLabel`
(`ChartFunnel`, e `overallLabel={false}` vira `showOverall={false}`) e
`emptyLabel` (`ChartHeatmap`).

O texto que estava cravado em portugues sem prop nenhuma ganha chave tambem, e
sem `labels` a tela continua igual: `Pagination`, `Breadcrumb`, `NumberField`,
`Tree`, `TreeSelect`, `SidebarTrigger`, `FileUpload`, `FileUploadItem`,
`DatePicker`, `DateRangePicker`, `ComboboxInput`, `DataTable` (as caixas de
marcar, a contagem e a paginacao de dentro), `EventCalendar`, `Gantt`, `Kbd`,
`Stat`, `AvatarGroup`, `OTPField`, `Steps`, `RichTextView`, `ChartDonut`,
`ChartGauge`, o nome montado do `ChartContainer`, o papel do `Carousel` e cada
amostra do `ColorPicker`. O xis do aviso se traduz no `RivoProvider`, com
`toastLabels`, ou no `ToastViewport`. O `EventCalendar` e o `Gantt` ganham
`locale` para os nomes de mes e de dia, com `pt-BR` de padrao. Cada tipo
`...Labels` sai do indice ao lado da peca.

### Datas

- O `DateRange` deixa de ser o do `react-day-picker` e passa a ser `{ from:
  Date; to: Date }`, as duas pontas obrigatorias, como no nativo.
- O `DateRangePicker` com `Date` so entrega periodo fechado ou `null`, como o
  formato em texto ja fazia: `onValueChange(range: DateRange | null)`. O
  periodo pela metade fica no calendario, e o Limpar responde `null`. No
  `value`, o vazio continua `undefined`.
- O `Calendar` ganha `defaultValue`, em `Date` ou `aaaa-mm-dd`.

### Adicoes

- `Select`, `Combobox` e `Textarea` ganham `size` (`sm`, `md`, `lg`), com as
  mesmas classes do `Input`. `SelectProps` e `ComboboxProps` saem do indice.

**Mudanca que pode aparecer (compila e muda a tela):** o `Button size="xl"` nao
e negrito como era o `cta` - some `className="font-rc-bold"` para a chamada de
marketing. O `DateRangePicker` com `Date` nao avisa mais no primeiro clique nem
com `undefined` no Limpar. O `ColorPicker` dentro de um `Field` nao desenha
mais o proprio `label`: o rotulo na tela e o do `FieldLabel`, e o `label` do
`ColorPicker` so nomeia a grade para o leitor de tela.

## 0.20.0

O visto do `Clipboard` passa a se ler sobre os botoes preenchidos, e o
`check-theme` passa a medir o que o primario e o ghost pintam sob o ponteiro.
Nada que compilava na 0.19.0 deixa de compilar.

- `Clipboard`: nos preenchidos, `primary` e `destructive`, o visto da
  confirmacao sai na cor do rotulo (`accent-fg` e `danger-fg`), e nao mais no
  verde de sucesso. Medido, o verde ficava em 1,41:1 sobre o `accent` do tema
  escuro e em 1,08:1 sobre o `danger` do claro, contra os 3:1 que um icone
  pede. `secondary`, `ghost` e `outline` continuam no verde.
- Pares novos de contraste, medidos nos dois temas: `accent-fg` sobre
  `accent-hover` e sobre `accent-active` (o rotulo e o visto do primario sob o
  ponteiro, pior caso 12,27:1), e `success-text` sobre `accent-subtle` em `bg`
  e em `surface` (o visto do ghost e do outline sob o ponteiro, pior caso
  5,02:1).

**Mudanca que pode aparecer:** o `rivocode-ui check-theme` mede esses pares.
Tema de cliente com `accent-hover` ou `accent-active` claro demais para o
`accent-fg`, ou com `success-text` apagado sobre o `accent-subtle`, passava na
0.19.0 e passa a reprovar no CI. Por isso a versao sobe o segundo numero.

## 0.19.0

As datas passam a aceitar texto `aaaa-mm-dd`, com os mesmos nomes do nativo, e
a tabela de props do site volta a mostrar props que sumiam dela. Nada que
compilava na 0.18.1 deixa de compilar.

### Data em texto no Calendar, no DatePicker e no DateRangePicker

- `value`, `defaultValue` e `onValueChange` aceitam `Date` ou texto
  `aaaa-mm-dd`, lido como dia do calendario: `"2026-09-25"` e 25 de setembro em
  qualquer fuso, e nao a meia-noite UTC do `new Date(texto)`, que em Brasilia
  ainda e dia 24. A peca responde no formato que recebeu: quem passa `Date`
  continua recebendo `Date`. Com texto, o `DatePicker` e o `Calendar` respondem
  `string` (`""` quando o campo esvazia), e o `DateRangePicker` responde
  `IsoDateRange` fechado ou `null` no Limpar. `IsoDateRange` sai do indice.
- `min` e `max` inclusivos, em `Date` ou texto, nas tres pecas: os dias de fora
  ficam desabilitados, a navegacao para no mes de cada ponta, e o `DatePicker`
  nao aceita data digitada fora da janela.
- O `Calendar` ganha `value` e `onValueChange` para data unica. `mode="single"`
  com `selected` e `onSelect`, e `startMonth`/`endMonth` nas tres pecas, seguem
  funcionando, marcados `@deprecated`. `range` e `multiple` continuam pelo
  `mode`, e em `range` e `multiple` um numero em `min`/`max` continua sendo a
  contagem de dias.

**Mudanca que pode aparecer:** no `DatePicker`, tocar de novo no dia escolhido
nao limpa mais a data. Limpar e apagar o campo. As setas de mes do `Calendar`
passam a parecer desabilitadas na ponta da navegacao: o estilo mirava
`disabled`, e o `react-day-picker` marca `aria-disabled`.

### Leitor de tela e nomes

- `SearchInput` ganha `onValueChange`, chamado a cada tecla e com `""` no Esc
  quando nao ha `onClear`. Convive com o `onChange`.
- `Meter`, `Progress` e `Slider` anunciam o mesmo texto que o `format` escreve
  na tela ("R$ 4,2 mil"), e nao mais o numero cru. Um `getAriaValueText`
  proprio continua valendo por cima.
- O `RichTextEditor` com `max` 1 diz "Limite de 1 caractere atingido.", no
  singular, e o `tokens` do cli conta "1 arquivo".

### A tabela de props volta a mostrar o que sumia

Prop propria com o mesmo nome de um atributo HTML sumia da tabela e, pior,
tinha o tipo cruzado com o do atributo. Doze pecas tiram a chave herdada, e o
tipo so alarga:

- o `format` do `ChartXAxis` e do `ChartYAxis` aceita funcao;
- o `title` do `AccordionItem`, do `CodeBlock`, do `TimelineItem` e da
  `Sidebar` aceita `ReactNode`;
- o `length` do `OTPField` deixa de ser obrigatorio (o padrao e 6);
- `value` do `Clipboard`, `defaultValue` do `MaskedInput` e do `TreeSelect`,
  `name` do `CurrencyInput` e do `TimeField`, `max` do `TagsInput`.

O `check:props` passa a reprovar essa colisao.

### A styles.css pronta encolhe

O gzip vai de 19,4 KB para 18,2 KB sem mudar um pixel da vitrine: sai o espaco
em branco e saem treze classes que nenhuma peca usa, que o scanner do Tailwind
lia em nome de metodo, de evento e em comentario.

**Mudanca que pode aparecer:** quem usa a `styles.css` pronta, sem Tailwind
proprio, e escrevia uma destas classes na sua tela perde a regra: `blur`,
`collapse`, `container`, `filter`, `grow`, `inline`, `invert`, `italic`,
`outline`, `resize`, `ring`, `table` e `transform` (so a classe nua: `ring-2`,
`blur-sm` e as outras formas com sufixo nao mudam). Quem compila o proprio
Tailwind nao ve diferenca. A `Sidebar` deixa de levar a classe `group/sidebar`,
que nenhuma parte dela lia: seletor `group-*/sidebar:` escrito do lado de fora
para de casar.

## 0.18.1

- `PromptInput`: o contador diz "1 caractere" e "Limite de 1 caractere
  atingido." no singular; antes saia "1 caracteres". As frases de contagem e
  de limite passam a morar num lugar so, compartilhado com o nativo.

## 0.18.0

Treze pecas novas, quatro graficos sem Recharts e o peso da letra como token:
o catalogo vai de 121 a 134. Passou pela mesma revisao da 0.17.0 - codigo,
acessibilidade e visual - e a vitrine inteira passa no `bun run a11y`, que
agora tambem anda cada pagina no Tab.

### Pecas novas

- `Tour`: guia a tela um alvo por vez, com mascara recortada, balao ancorado
  e foco preso; pula o passo cujo alvo some.
- `SignaturePad`: assinatura por dedo, caneta ou mouse, ou pelo nome
  digitado, com tinta sempre escura sobre papel claro; exporta SVG e PNG.
- `Gantt`: tabela e linha do tempo numa rolagem so, escala de dia, semana e
  mes, dependencias, grupos, e edicao pelo ponteiro e pelo teclado. O `end` e
  exclusivo, e a pagina da peca explica.
- `TransferList`, `Highlight`, `Spoiler`, `TableOfContents`, `ScrollToTop` e
  `Affix`.
- No subcaminho `/chart`: `ChartHeatmap`, `ChartGauge`, `ChartFunnel` e
  `ChartTreemap`, desenhados sem Recharts.

### O peso da letra vira token

`--rc-weight-regular`, `-medium`, `-strong`, `-bold` e `-display`, com as
classes `font-rc-*`. Tema de cliente pode sobrescrever, e o montador de tema
escreve o peso mais proximo que a fonte escolhida tem. Com o tema da casa nada
muda na tela.

**Mudanca que pode aparecer:** dezesseis titulos (de `Card`, `Dialog`,
`Sheet`, `AlertDialog`, `PageHeader`, `Popover`, `Fieldset`, o valor do
`Stat` e outros) passam a declarar o peso 600, que antes nao declaravam. O
tema da casa ja carregava so a Poppins 600 e 700, entao nada muda; quem
carrega a Poppins 400 por conta propria vera esses titulos mais pesados.

### Outras mudancas

- `/blocos` ganha as paginas de erro: 404, 500, 403 e manutencao.
- O `Highlight` pinta o trecho achado no fundo cheio de atencao, com 5:1
  contra o fundo em volta.
- O `ChartGauge` mostra o valor real no centro e no nome acessivel, mesmo fora
  da escala ("140 de 100"); so o arco e o ponteiro param na ponta.
- Os orcamentos de tamanho sobem com as pecas novas, com o custo de cada uma
  medido e escrito; importar uma peca continua pagando so por ela.

## 0.17.0

Doze pecas novas, dois subcaminhos e uma biblioteca de hooks: o catalogo vai
de 109 a 121. E a primeira versao que passou por revisao de codigo, de
acessibilidade e visual antes de sair, e a vitrine inteira passa no
`bun run a11y` sem nenhum achado.

### Importar uma peca deixa de carregar a biblioteca inteira

O `dist/` saia num arquivo so, e o bundler de quem usa nao conseguia descartar
o que nao foi importado: `import { Button } from "@rivocode/ui"` custava 129 KB
em gzip. Agora sai um arquivo por modulo, e o mesmo import custa 12 KB. A API
publica e a mesma, com as mesmas exportacoes e os mesmos tipos; muda so o
formato do `dist/`. De quebra, as pecas que declaram `"use client"` passam a
levar a diretiva no arquivo publicado, o que o Next precisa. Uma guarda nova,
`check:tamanho`, mede cada entrada contra um orcamento escrito.

### Pecas novas

- `ResizablePanelGroup`, `ResizablePanel` e `ResizableHandle`: N paineis,
  recolher, minimo e maximo, grupos aninhados, RTL e `autoSaveId`. O
  `Splitter` passa a ser a forma curta deles, com a mesma API.
- `Questionnaire`: uma pergunta por vez, com progresso, pular, atalho de letra
  e as respostas tambem no `FormData`.
- `Rating`, `AppShell` e `NotificationCenter`.
- `QRCode`, com codificador proprio da ISO/IEC 18004, e `PixCode`, com
  `buildPixPayload`, `parsePixPayload` e `isValidPixKey` no padrao do Banco
  Central. O codigo sai sempre escuro sobre claro, em qualquer tema.
- `CurrencyInput`: dinheiro em centavos inteiros, digitado da direita, que
  recusa colagem com texto misturado ou digitos demais.
- `isValidBoletoLine`, `boletoLineToBarcode`, `parseBoleto` e o molde
  `boleto`; `isValidCnh`, `isValidVoterId`, `isValidPis`, `isValidRenavam` e
  `isValidPlate`.

### Subcaminhos novos, com peer opcional

- `@rivocode/ui/dnd`: `SortableList` e `Kanban`, sobre o `@dnd-kit`.
- `@rivocode/ui/editor`: `RichTextEditor`, sobre o Tiptap 3, e `RichTextView`,
  que exibe o que ele salvou sem `innerHTML`.

### Hooks

Vinte e cinco: `useDisclosure`, `useToggle`, `useCounter`, `useListState`,
`useSetState`, `usePrevious`, `useIsFirstRender`, `useMounted`,
`useDebouncedValue`, `useDebouncedCallback`, `useThrottledCallback`,
`useInterval`, `useTimeout`, `useIdle`, `useLocalStorage`,
`useSessionStorage`, `useClickOutside`, `useHotkeys`, `useInfiniteScroll`,
`useIntersection`, `useElementSize`, `useClipboard`, `useReducedMotion`,
`useDocumentTitle` e `useNetworkStatus`. O guia Hooks do site diz cada um.

### Mudancas visiveis

- O `ImageViewer` abre a tela cheia num palco escuro nos dois temas.
- O `Button` desabilitado desenha um contorno fraco, em vez de virar rotulo
  solto sobre a superficie.
- A divisoria do `Splitter` passa a `border-strong`, que mede 3:1.
- A linha selecionada do `DataTable` ganha fundo.
- O valor em reais nao quebra mais entre "R$" e o numero.

### Correcoes de acessibilidade em pecas que ja existiam

`Tree`, `OTPField`, `RadioGroup`, `Checkbox`, `TagsInput`, `Toast`,
`Breadcrumb`, `Sidebar`, `Calendar`, `EventCalendar`, `FilterBar`, `Table`,
`DataTable` e `ChartDonut`: estrutura ARIA, alvo de 24px, foco que nao cai no
corpo da pagina depois da acao, contraste e pagina que nao rola de lado a
320px. A `Sidebar` deixa de desenhar marcador de lista no item fora de
`SidebarMenu`, e o gatilho diz "Recolher barra lateral" na mesa.

## 0.16.0

Dez pecas novas e um subcaminho novo: o catalogo vai de 99 a 109. Esta versao
fecha a segunda leva da comparacao com os design systems de mercado.

### `@rivocode/ui/ai`

Subcaminho novo, sem dependencia de SDK de IA: a peca recebe as mensagens por
prop e devolve eventos.

- `PromptInput`: Enter envia e Shift+Enter quebra a linha, e durante a resposta
  o botao de enviar vira o de parar.
- `Message`: a mensagem por papel (`user`, `assistant`, `system`), com copiar,
  tentar de novo e o indicador de quem ainda esta escrevendo.
- `Conversation`: a lista que gruda no fim enquanto o texto chega, e para de
  grudar quando a pessoa rola para cima.
- `ToolCall`: a chamada de ferramenta, com os cinco estados e o aprovar e
  recusar de quando a ferramenta pede permissao.
- `AILabel`: o selo que marca conteudo gerado por IA, com a explicacao opcional.

### Pecas novas no pacote principal

- `ActionBar`: as acoes em lote, com "N selecionados" em regiao viva e o foco
  devolvido ao sair.
- `PostalCodeField`: o CEP que busca o endereco pela funcao que quem usa passa,
  e cancela a busca velha quando o CEP muda. A biblioteca nao chama servico
  externo sozinha.
- `CookieConsent`: o aviso de cookies no molde da LGPD, com recusar pesando o
  mesmo que aceitar. Ele nao grava cookie: devolve a escolha.
- `Carousel`: por scroll-snap do CSS, com botoes, teclado e rotacao desligada
  por padrao, que para sozinha no foco, no ponteiro e com movimento reduzido.
- `ImageViewer`: a foto em tela cheia sobre o `Dialog`, com zoom, setas, deslize
  e `alt` obrigatorio no tipo.

### Correcoes

- As transicoes de cor e opacidade de `Alert`, `Banner`, `DataTable`, `Sidebar`,
  `Table` e `Toast` passam a usar a curva `ease-rc-effects`, e uma guarda cobra
  curva da casa em toda transicao.
- A seta do `Link` externo cola na pontuacao que vem depois.
- O `Editable` para de disparar o aviso de `key` depois do espalhamento.

### Dependencias

`@base-ui/react` 1.8, `@tanstack/react-table` 9.2 e as demais atualizacoes do
grupo de menor e correcao. Nada muda para quem consome.

## 0.15.0

Oito pecas novas, e o catalogo vai de 91 a 99. Esta versao fecha a primeira
leva da comparacao com os design systems de mercado.

### Quebra pequena: o nome `Link` agora e nosso

Quem importa o `Link` de um router e o do `@rivocode/ui` no mesmo arquivo
precisa renomear um dos dois no import. A pagina do `Link` mostra como.

### A mascara de `cnpj` aceita o CNPJ alfanumerico

Desde 31/07/2026 a Receita emite CNPJ com letra nas doze primeiras casas, e o
molde `99.999.999/9999-99` recusava a letra. O molde passa a
`**.***.***/****-99`, a letra sobe a caixa sozinha, e o CNPJ so de numeros sai
igual. O campo `cnpj` deixa de abrir o teclado numerico no celular, porque a
letra precisa entrar. Molde escrito a mao com `*` tambem deixa de abrir o
teclado numerico.

### `isValidCpf` e `isValidCnpj`

Conferem os digitos verificadores, com ou sem pontuacao, e o `isValidCnpj` ja
faz a conta do CNPJ alfanumerico (cada letra vale o codigo menos 48). Com o
zod: `z.string().refine(isValidCnpj, 'CNPJ inválido')`.

### `Stack`, `Grid` e `Container`

Primitivas de layout. `Stack` empilha numa direcao, `Grid` faz grade por
`columns` ou por `minItemWidth` (auto-fill, sem media query), e `Container`
centraliza com largura maxima. O vao sai da escala nova `--rc-gap-*`
(`xs` a `xl`), que a densidade compacta aperta.

### `Heading`, `Text` e `Link`, na familia nova Tipografia

`Heading` separa `level` (a tag) de `size` (o tamanho), para a ordem de titulos
nao depender da aparencia. `Text` tem `size`, `tone`, `weight`, `truncate` e
`lineClamp`, e sem props herda de quem o cerca. `Link` traz os tons, o
sublinhado e o `external`, que abre em nova aba com o aviso para leitor de
tela.

### Tokens em DTCG

`rivocode-ui tokens --out <pasta>` exporta paleta, escalas, densidades e temas
em JSON DTCG 2025.10, importavel pelo Tokens Studio e pelas variaveis do Figma.
Os arquivos do tema da casa saem no pacote, em `@rivocode/ui/tokens/*`, e no
site, em `/tokens/*.json`. Passando o CSS de um tema de cliente, o comando
exporta esse tema.

### Movimento como token

Curvas `--rc-ease-enter` e `--rc-ease-exit`, e tres molas em `linear()`
(`spatial`, `expressive` e `effects`), com as classes `duration-*` e `ease-rc-*`
correspondentes. Tudo vai a zero quando o sistema pede menos movimento.


### O `Sheet` de baixo nao some mais atras da barra do navegador

No celular, a camada do `Sheet` ocupava `inset-0`, que inclui a faixa que a
barra do navegador cobre. O painel de baixo ficava preso a essa borda
escondida, e o rodape dele sumia: o `Aplicar` e o `Limpar` do
`DateRangePicker` ficavam fora da tela. A camada agora vai do topo ate `100dvh`,
que e a altura que se ve.

### `IconButton` e `Banner` entram no catalogo

**`IconButton`** e o botao so com icone. O `label` e obrigatorio e vira o nome
acessivel; `aria-label` e `aria-labelledby` saem do tipo, para o nome ter um
caminho so. Por dentro ele e o `Button` - mesmas variantes, mesma `shape`,
mesmo `render` -, com tres quadrados lidos de `--rc-control-sm/md/lg`. Em
`loading` a espera toma o lugar do icone, entao o quadrado nao alarga. `tooltip`
mostra o `label` numa dica sem amarra-la por `aria-describedby`: a dica repete o
nome, e o leitor de tela ouviria a mesma frase duas vezes. Os tamanhos `icon` e
`iconSm` do `Button` continuam funcionando, e a pagina dele passa a apontar para
o `IconButton`.

**`Banner`** e o aviso de pagina: faixa de largura total no topo da area, para
manutencao, fatura em atraso, modo de teste. Quatro tons, `title` opcional,
`description` obrigatoria, `actions`, `onDismiss` com "Fechar aviso", e
`classNames` por parte. `danger` e `warning` saem `role="alert"`, `info` e
`success` saem `role="status"`, como no `Alert`. O icone do tom vem sozinho,
porque cor nunca e o unico sinal.

Pares novos de contraste, medidos nos dois temas: `fg` sobre `<estado>-subtle`
(corpo da faixa, pior caso 12,13:1), e `border-strong` e `ring` sobre
`<estado>-subtle` (o botao secundario e o foco do xis dentro da faixa, pior caso
3,19:1).

## 0.14.1

### O `Sheet` volta a deixar a lista de dentro rolar

O miolo do `SheetContent` nascia sem altura, entao todo `h-full` abaixo dele
crescia ate o tamanho do conteudo em vez de parar na altura do painel. Agora
ele herda a altura do painel.

- No `Sidebar` do celular, o `SidebarContent` passa a rolar sozinho, e o
  `SidebarFooter` fica preso embaixo. Antes o painel inteiro rolava, e o rodape
  ficava fora da tela.
- Uma lista com `overscroll-behavior: contain` dentro do `Sheet` nao rolava de
  jeito nenhum, nem com a roda nem com o toque: ela nao transbordava e ainda
  barrava a rolagem de chegar ao painel. Era o caso da gaveta de navegacao do
  site.

## 0.14.0

### O catalogo passa a se mexer, e o que se mexia pela metade passa a se mexer inteiro

O achado que abriu esta versao foi um defeito, e nao falta de acabamento: no
Tailwind 4, `scale-*`, `translate-*` e `rotate-*` escrevem as propriedades
`scale`, `translate` e `rotate`, e nao `transform`. Sete pecas listavam
`transition-[...transform...]`, e a escala ou o deslize delas nunca animou: o
painel de `Menu`, `Popover`, `Select`, `Combobox`, `Tooltip`, `PreviewCard` e
`NavigationMenu` esmaecia com a escala saltando, e o polegar do `Switch` e o
`Toast` pulavam. Uma guarda em `test/movimento.test.tsx` recusa `transform` em
lista de transicao.

Passam a se mexer, sempre com os tokens de duracao e curva, e sempre zerados
por "reduzir movimento":

- `Dialog`, `AlertDialog` e `Command` entram esmaecendo e crescendo de 0,97;
- a marca do `Checkbox` e o ponto do `Radio` crescem ao marcar;
- `FieldError` aparece e sai com esmaecer e 4px de descida;
- o painel novo das `Tabs` esmaece, e o velho some na hora;
- o `Steps` troca cor e anel da etapa, e a linha entre etapas enche;
- `Calendar`, `DatePicker`, `DateRangePicker` e `EventCalendar` deslizam o mes
  novo do lado para onde a pessoa andou (`animate={false}` desliga);
- o `Clipboard`, o `Avatar` e a seta de ordenacao da `DataTable`, que virou uma
  so e gira meia volta; o `Editable` esmaece na troca entre leitura e edicao.

Fica sem movimento de proposito o que tem que ser imediato ou seguir o dedo:
anel de foco, `Slider`, `Splitter` e numero digitado.

### As pecas entram na montagem, e o grafico se desenha na primeira vez

A regra antiga, "produto de operacao nao anima entrada", saiu. Entra o que
CHEGA; a moldura nao. Cinco utilitarios novos: `animate-enter`,
`animate-appear`, `animate-pop`, `animate-fill` e `animate-reveal`. Todos terminam em
`backwards`, entao se a animacao nao rodar o conteudo continua la, e rodam uma
vez por montagem. `Alert`, `EmptyState`, `Stat`, `Progress`, `Meter`,
`Tracker`, `Indicator`, `Timeline`, o item do `FileUpload`, a ficha que chega no
`TagsInput` e no `FilterBar` e o corpo da `DataTable` ao sair do esqueleto
passam a entrar. `Card`, `PageHeader`, `Sidebar`, controles no estado inicial e
`Badge` ficam parados: a tela inteira piscaria a cada navegacao.

### O grafico anima com a casa, e nao com a Recharts

O `ChartContainer` aplica sozinho, em toda marca, a duracao e a curva dos
tokens, no lugar dos 1500ms padrao da Recharts, e desliga a animacao sob
"reduzir movimento" sem depender de quem usa lembrar do `useChartMotion`. Ele
continua exportado, e espalha-lo dentro da moldura nao muda nada. `ChartDonut` e
`ChartRadial` perderam o `isAnimationActive={false}` fixo: varrem do zero ao
aparecer e andam ate o valor novo na troca. A `Sparkline` so esmaece, porque
aparece as dezenas numa tabela.

O HTML do servidor continua sem SVG, como antes; a primeira marca montada no
cliente ja nasce animada, entao nao existe quadro com o desenho pronto que some.

### `EmptyState` ganha `illustration`

O `icon` forca 32px em qualquer SVG descendente, e por isso ilustracao nao
cabia. `illustration` e a prop separada, sem tamanho forcado e com o involucro
em `text-fg-subtle`, para `currentColor` acompanhar o tema do cliente. A pagina
e a skill dizem quando usar cada uma: ilustracao na primeira vez e no
onboarding, icone na busca sem resultado. Nao ha kit de ilustracoes: o sistema
veste varios clientes, e cor literal so existe em `src/tokens/`.

### O site abre a pagina de uma peca de duas a quatro vezes mais rapido

As partes de uma pagina baixavam uma depois da outra, e a tabela de props vinha
num JSON de 534 KB com o catalogo inteiro. Agora tudo sai em paralelo e cada
pagina recebe so os props dela: abrir o `Select` pela barra lateral foi de 1,87 s
para 0,59 s na rede de celular simulada.

### As dependencias chegam por PR

O Dependabot abre, toda segunda, um PR agrupado de menor e correcao por pasta e
um por major, e o `ci.yml` e quem aprova. `native/` fica de fora de proposito.

## 0.13.0

### A skill ganha o metodo, e o site manda instala-la antes de ler

`reference/method.md` e o nono arquivo da skill, e escreve a ORDEM que faltava:
seis passos do pedido ate a tela conferida, e o que termina cada um. Os outros
oito ensinam o sistema, e nenhum dizia em que sequencia usa-lo - a decisao de
acabamento caia na leitura "geral", que nao tem resposta errada. O passo 4 troca
essa leitura por quatro passadas, cada uma com UMA pergunta literal: quantos
valores de espaco existem aqui, o que a pessoa veio ler esta em `text-fg`, o
raio de dentro e menor que o de fora, quantas coisas se mexem.

Os dois ultimos passos sao os que se pulam, e por isso estao escritos com o
incidente junto: olhar nos dois temas e nas duas densidades e o passo que faltou
quando sete pecas foram publicadas sem ninguem ter olhado para nenhuma, com mais
de mil testes verdes.

Duas secoes que nao existiam em lugar nenhum: os dez sinais que fazem uma tela
parecer gerada - todos passando no `tsc` e no teste - e o que faz uma tela
parecer atual, escrito so com token que ja existe.

O arquivo viaja no pacote, entao quem roda `npx rivocode-ui skill` nesta versao
recebe o metodo junto. O agent `rivocode-ui` passa a comecar por ele.

### O `llms.txt` abre mandando instalar a skill

A primeira secao do indice para agents deixou de ser o catalogo e passou a ser a
instalacao; `/convencoes.md` virou o plano B de quem nao pode instalar nada. O
laco `curl` NAO foi repetido la de proposito: seria a segunda copia escrita a mao
da pasta `reference/`, que e o defeito que o `check:lista-skill` existe para
pegar, e ele so olha o `skill.md`.

A pagina "Para agents" fechava dizendo que a skill "ainda nao existe, falta o
empacotamento". Ela viaja dentro do pacote desde que o `build:skill` existe, e a
pagina que ensina o agente a ler o site era a ultima a saber.

### Corrigido: tres pares de cor reprovavam por baixo do `check:contrast`

A guarda mede o par PLENO e nao ve `opacity-*`. Entao a conta aprovava
`danger-fg` sobre `danger` e a peca pintava 90% dele. Tres defeitos viviam nesse
ponto cego, todos no tema claro:

- o xis de fechar do `Alert`, em `opacity-70` sobre `{tom}-subtle`, media
  **2,77** no success e **2,66** no warning, contra os 3 da WCAG 1.4.11. Passa a
  `text-fg-muted hover:text-fg`, que mede 5,07 a 5,20 nos quatro tons;
- o `hover:opacity-90` do Button destrutivo media **4,45**, e AA pede 4,5. Era o
  unico variant cujo hover nao era token, e o hover sai. Devolve-lo direito pede
  um `--rc-danger-hover`, que seria papel obrigatorio novo e quebraria todo tema
  de cliente na atualizacao - fica como decisao, e nao como conserto de pressa;
- `SearchInput`, `InputGroup`, `FilterBar`, `TagsInput` e o horario do
  `EventCalendar` desciam a opacidade em vez de trocar o token. Passam a
  `text-fg-disabled` com `bg-surface-raised` e `border-border-disabled`, que e o
  que `Checkbox`, `Radio` e `Switch` ja faziam.

O hover da linha da `Table` era `hover:bg-surface-raised`, e no tema claro
`surface` e `surface-raised` sao os dois a mesma cor: branco sobre branco. Vira
`bg-accent-subtle`, e a linha de cabecalho do `DataTable` recebe
`hover:bg-transparent`, porque `fg-subtle` reprova sobre esse fundo.

### `check:opacidade`: o alfa sobre cor passa a ser medido

Trigesimo quinto passo do gate. Toda ocorrencia de `opacity-<1..99>` em `src/`
tem que estar declarada com motivo, e a linha que declara um par de cor tem a
conta MEDIDA nos dois temas com o alfa aplicado. Cobra os dois sentidos, e a
lista so encolhe.

So o web: em `native/src` o desabilitado E `opacity-50` na camada inteira, e isso
ja estava decidido e escrito em `WITHOUT_PAIR`. O repositorio tambem ja sabia do
problema - `test/contrato-das-irmas.test.tsx` cobra "nenhum dos tres desabilita
por opacidade" e explica este mesmo motivo -, mas a regra tinha virado teste de
TRES pecas, e as outras sete nunca foram olhadas.

### Os `--rc-leading-*` deixam de ser ficcao no web

O `contract.css` nao ligava nenhum deles, e o `dist` saia com o default do
Tailwind: `leading-relaxed` em 1.625 enquanto o token dizia 1.7, e cada `text-*`
com a altura de linha do Tailwind e nao a nossa. A documentacao e a skill
descreviam um contrato de altura de linha que **so o pacote nativo cumpria**.

As oito medidas passam a ler `--rc-leading-tight` de `xl` para cima e
`--rc-leading-normal` abaixo - a mesma regra que `gen-native-tokens` ja aplicava
do outro lado da fronteira. Tema de cliente que declare os tres tokens muda
junto, que e o que a doc sempre prometeu.

### Sombra, raio e o acabamento que a regua do metodo apontou

`--rc-shadow-2` e `--rc-shadow-3` ganham uma camada de contato curta e uma de
ambiente com spread negativo, e perdem alfa no tema escuro: a sombra abraca o
painel em vez de manchar a pagina, e quem separa continua sendo o anel de 1px.
`Menu` e `Popover` descem de `shadow-3` para `shadow-2` - um menu a 4px do
gatilho nao flutua o mesmo que um dialogo modal.

`--rc-radius-sm` vai de 6px para 4px, porque entre 6 e 8 a diferenca e invisivel
e a passada de forma ("o raio de dentro e menor que o de fora?") nao tinha como
ser conferida a olho. `--rc-control-lg` compacto vai de 38px para 36px, o unico
numero da escala fora da grade de 4.

E o resto: o `Card` passa a usar `--rc-pad-panel`, que a documentacao ja
afirmava que ele usava, entao o respiro dele finalmente segue a densidade; a aba
segmentada sai de `h-7` para `--rc-control-sm`; o cabecalho de grupo da
`Sidebar` e do `Command` deixa de ser `font-mono`, porque nao se le caractere a
caractere; o corpo do `Accordion` vai para `text-fg`, porque e a resposta que a
pessoa abriu a sanfona para ler; o `TableFooter` para de pintar superficie fora
do caso que gruda; e os dois botoes do `Combobox` recebem raio menor que o do
campo que os contem.

### Corrigido: tres testes do `DateRangePicker` nativo liam o relogio

Eles montavam a peca com `value={null}`, e sem valor a grade abre no mes de
HOJE - `calendar.tsx` cai em `new Date()` quando nao ha ISO para ancorar. Os
toques eram todos de agosto de 2026: passaram ate 31/08/2026 e ficaram vermelhos
em 01/09, com `undefined is not an object`, que nao parece com "o mes virou".

O `beforeAll` prende 15/08/2026 e o `afterAll` devolve o relogio. Medido movendo
o pino para setembro: caem exatamente os tres, e nenhum outro. Nada mudou na
peca publicada.

## 0.12.0

### Corrigido: a barra que carrega o valor sozinha era invisivel no tema claro

`Meter`, `Progress`, `Tracker`, `Steps` e `FileUpload` pintavam a barra cheia
com `bg-accent`, que mede **1,03:1** contra a propria trilha no tema claro. A
WCAG 1.4.11 pede 3:1, e com `showValue` desligado - que e o padrao - a barra e o
UNICO portador do valor: uma cota em 72% lia como barra vazia.

O token passou a ser `bg-accent-text`, que mede 4,69 a 4,87 nos tres fundos onde
as pecas pousam. No tema escuro os dois tokens sao o mesmo valor, entao la nao
muda um pixel. Nenhuma lima clara alcanca 3:1 - `accent-hover` da 1,11 e
`accent-active` 1,26 -, e esse teto ja estava registrado para a chave, a caixa,
o radio e o Slider, que fizeram esse mesmo troco antes.

A guarda foi consertada ANTES da peca, e e ela que impede a volta: o par que
`CSS_BOUNDARIES` media era o token do Slider, ja consertado, entao ninguem media
o acento cru sobre a trilha. O terceiro fundo (`surface-raised`, onde o medidor
dentro de Dialog e Menu pousa) tambem faltava. O mapa nativo tinha o mesmo
buraco.

O `Tracker` entrou junto por medida propria: o periodo neutro dele e o proprio
`bg-skeleton`, entao o tom `accent` era indistinguivel de "nada aconteceu",
enquanto os outros tres tons mediam de 4,24 a 4,84 no mesmo lugar.

### Corrigido: `DataTable` respondia "Nenhum resultado" com o resultado existindo

`pageIndex` nao voltava para zero quando o `filter` mudava. Quem estava na pagina
3 e buscava algo que devolvia uma linha recebia uma negativa categorica sobre um
dado que existe, com o rodape escrevendo `21-1 de 1`. Reordenar tinha o mesmo
defeito, mais silencioso.

A pagina ja prometia o conserto - "filtrar ou reordenar volta para a primeira
pagina" -, e agora a promessa e verdade. Por seguranca, a mensagem de vazio
tambem passou a calar quando o modelo filtrado ainda tem linha: antes a condicao
so olhava a pagina.

### Corrigido: o `label` do `Slider` nao nomeava o controle

O rotulo saia num `<span>` sem `id`, e o `<input type="range">` so recebia
`aria-label` quando vinha `thumbLabel`. Um `<Slider label="Desconto" />` era um
controle sem nome nenhum para o leitor de tela - e era essa a forma que o
exemplo da pagina ensinava. O exemplo tambem foi consertado.

### Corrigido: `Dialog` e `AlertDialog` sem altura maxima

O painel e `fixed` e nao tinha `max-h` nem rolagem. Conteudo mais alto que a
janela crescia para os dois lados a partir do centro, e o que passava da borda
nao rolava de jeito nenhum - o titulo sumia acima da tela. Agora os dois seguem
a conta que o `Sheet` ja fazia: `max-h-[85dvh]` com o miolo rolando e o titulo
parado.

### Corrigido: o realce do `Command` derivava, e o Enter executava outra acao

O indice ativo so era grampeado quando a lista encolhia, e nunca voltava ao topo
quando a CONSULTA mudava. Como o filtro remove itens de qualquer posicao, o mesmo
indice passava a apontar para outra acao: com "a" e tres setas o realce estava em
"Abonar multa"; digitando mais uma letra, o Enter executava "Abandonar rascunho".
A peca existe para quem digita rapido sem olhar a lista.

### Corrigido: o `Breadcrumb` empurrava a pagina para fora da tela

`truncate` estava no `<a>` e no `<span>`, que computam `display: inline` - e
`overflow` nao tem efeito em caixa inline. O texto saia do proprio item, as
migalhas se sobrepunham, e o documento ganhava barra horizontal ja em 1280px.
Junto saiu um chevron orfao que aparecia no celular em toda trilha de tres
migalhas ou mais: o separador escondia pela migalha seguinte, e nao pela
anterior.

### A heranca de cor da marca passa a decidir papel a papel

O portao que pintava a serie e o que avisava serie desconhecida era o mesmo, e
ele exigia `fill` E `stroke` vazios na mesma marca. `<Bar dataKey="v"
stroke="none" />` - que e o que sai de qualquer exemplo da Recharts copiado -
caia fora dos dois: a barra de uma serie CONHECIDA voltava a nascer preta, e a
chave que o `config` nao conhecia deixava de acusar. Apagava a cor e desligava
a guarda com a mesma prop, e nenhuma das duas tinha relacao com ela.

Agora cada papel decide sozinho, pela tabela que ja dizia que prop de tinta
cada marca usa: o `fill` da barra, o `stroke` da linha, os dois da area. E a
chave vai para o aviso sempre que sobrou papel por pintar, e nao so quando os
dois estavam vazios.

O criterio conservador continua: papel que o chamador escreveu fica como esta,
entao `fill="url(#gradiente)"` segue intocado.

### O miolo do `ChartDonut` apaga durante a leitura, e agora esta escrito

Ele sempre apagou enquanto o ponteiro le uma fatia - a dica ja mostra o numero
daquela fatia, e os dois juntos deixariam dois numeros na tela sem dizer qual e
qual. Nao estava em lugar nenhum, e a primeira frase do JSDoc, que e a unica que
chega a tabela publicada, nao dizia.

## 0.11.0

### O `PageHeader` deixa o chamador alcancar a caixa de acoes

O lado do titulo nasce `min-w-0` e encolhe; o das acoes nasce `shrink-0` e nao
encolhe. Isso esta certo para o caso comum - botao nao deve ser espremido pelo
titulo -, mas o que vai ali nem sempre e botao: campo de busca e barra de filtro
sao largos, e sem poder encolher eles empurram a linha inteira para fora da
pagina. Nenhuma classe do chamador alcancava aquela caixa.

A peca ganhou `classNames` por parte - `row`, `heading`, `title`, `description`
e `actions` -, que e a convencao da casa para exatamente isso. O padrao nao
mudou: quem precisa de encolhimento passa
`classNames={{ actions: "min-w-0 shrink" }}`, e o `tailwind-merge` resolve o
conflito com o `shrink-0`.

### Corrigido na doc: o exemplo de gradiente de area nao compilava

A pagina do `ChartContainer` ensinava a chamar um `useAreaGradient('faturado')`
que nunca existiu. A funcao real e `areaGradient(id, name)`, e o mesmo exemplo
ainda esquecia o `id` obrigatorio do `<ChartAreaGradient>` - enquanto o
paragrafo logo abaixo do bloco explicava justamente esse `id`. Quem copiava do
site nao compilava.

Varrendo as 177 paginas, era o UNICO nome inventado. O `check:exemplos` entrou
no gate para que continue sendo zero: ele confere cada `useAlgo(` e cada
`<ChartAlgo>` dos blocos `tsx` contra os exports dos dois pacotes. O corpo das
paginas era a unica parte do material que nao passava por compilador nenhum - o
`check:previews` ja compilava os previews, e o `check:skill` ja cobria a SKILL.

## 0.10.0

### Corrigido: parte de campo fora do `Field` nao derruba mais a pagina

`FieldLabel`, `FieldDescription` e `FieldError` usadas fora de um `Field`
lancavam `FieldRootContext is missing` la dentro da Base UI, e a arvore inteira
caia: pagina em branco, sem erro na tela. O `tsc` passava, o build passava, e
nenhum teste acusava. O caso que apareceu foi um `FieldLabel` solto dentro de um
`CheckboxGroup`.

As tres passaram a ler um contexto proprio. Sem o `Field` em volta, desenham um
elemento comum - `label`, `p` e `div` - com as mesmas classes, e reclamam em
desenvolvimento nomeando a peca e o conserto. A pagina continua de pe, e a
ligacao com o controle que o leitor de tela espera fica faltando, que e o que a
mensagem diz.

`Input` e `Textarea` ficaram de fora de proposito: elas nao caem, e o proprio
catalogo as usa fora de `Field` no `MaskedInput`, no `DatePicker`, no
`ColorPicker` e no `TimeField`. Avisar ali seria ruido em cima de uso correto.

### Marca de grafico sem cor passa a herdar a da serie

`<Bar dataKey="emitidas">` sem `fill` saia PRETO, porque e o padrao da Recharts
- cor que nao pertence a tema nenhum da casa. A moldura ja conhecia a serie pelo
`config`, entao ela passou a descer nos filhos e pintar sozinha: o defeito deixa
de existir em vez de virar aviso.

O criterio e conservador de proposito. So recebe cor a marca que nasce sem
`fill` E sem `stroke`; quem escreveu uma das duas fez uma escolha, e a moldura
nao a desfaz, entao `fill="url(#gradiente)"` continua como esta.

Sobra o caso em que nao ha o que herdar - `dataKey` que o `config` nao conhece
-, e esse avisa em desenvolvimento, nomeando a chave.

### `Select` e `Combobox` passam a acusar rotulo cru na tela

Sem o mapeamento de rotulo, as duas escreviam a CHAVE: o campo mostrava
`freire` no lugar de `Freire Contabilidade`, e `todas` no lugar de `Todas as
situacoes`. Compilava, renderizava, e so a tela contava.

O aviso de desenvolvimento nao pergunta "falta a prop", e sim "o que o campo
escreve e diferente do que a lista escreve". Ele so sai quando a resolucao caiu
para o valor cru, o item e o escolhido, o filho e texto puro e esse texto
difere da chave. Item em texto cala, `{ value, label }` cala, `items` cala,
`itemToStringLabel` cala, `SelectValue` com funcao cala.

Duas abstencoes deliberadas: peca nao controlada e sem `defaultValue` fica muda,
porque nao da para saber o escolhido sem interceptar o `onValueChange`; e nao ha
palpite sobre a forma da string, porque heuristica de aparencia e o aviso que
grita em cima de uso correto e e desligado na segunda semana.

## 0.9.1

### Corrigido: o `Popconfirm` segura o foco no Firefox

A 0.9.0 acertou Chromium e WebKit e deixou o Firefox de pe: com a promessa do
`onConfirm` correndo, o foco caia no `<body>` e o Tab seguinte saia do painel.

A guarda tinha forma de Chromium. Ela so movia o foco para o cancelar quando
`document.activeElement` ja era o `<body>`, e e isso que o Chromium faz
enquanto larga o foco do botao que acabou de virar `disabled`. O Firefox adia
esse conserto: no instante do efeito o `activeElement` ainda e o proprio
confirmar, ja `disabled`, a guarda concluia que ninguem tinha perdido nada, e
so depois o navegador largava o foco no vazio - sem ninguem para pega-lo.

A pergunta passou a ser "o foco esta perdido, ou prestes a se perder", e nao
"o foco esta no `<body>`": conta como perdido o alvo ausente, o `<body>`, o que
saiu da arvore, e o que ainda esta ativo mas ja e `disabled`. O ultimo e a
ordem do Firefox. Foco que a pessoa moveu de proposito para um alvo vivo
continua intocado.

## 0.9.0

A 0.8.0 foi instalada num app de verdade, e o app respondeu. O que veio de
volta nao foi lista de desejo: foram tres defeitos medidos com comando, cada um
do tipo que passa por `tsc` verde e build verde e sai errado na tela. Esta
versao e a resposta, e o tema dela e um so: **a biblioteca passa a cobrar no
consumidor o que ela ja cobrava em casa.**

### `rivocode-ui check-theme`: a guarda sai do repositorio

A quebra mais cara da 0.7.0 foi silenciosa. Os `--rc-font-*` viraram papel de
tema e sairam da camada global; dois temas de cliente escritos na 0.6.1 nao os
declaravam; a galeria inteira perdeu familia de fonte nesses dois temas. O
`tsc` compilou, o Vite construiu, e a unica coisa errada era a tela. A guarda
que pegaria isso existia - e rodava no repositorio da biblioteca.

Agora roda onde o dano aparece:

```sh
bunx rivocode-ui check-theme src/temas/meu-tema.css
```

Ele cobra os 55 papeis obrigatorios e mede o contraste de cada par, nesta
ordem - papel faltando primeiro, porque medir o que nao existe cai no valor
herdado e devolve numero bonito por acidente. Aceita `.css` (o tema do web) e
`.theme.ts` (o mapa do nativo), `--json` para CI, e o codigo de saida serve aos
dois.

A saida separa o que a tela denuncia do que ela esconde:

```
[data-rc-theme="neon"]   (tema-neon.css)
  52 dos 55 papeis. Faltam 3.
  QUEBRA CALADA, e e por isso que ninguem reporta:
    --rc-font-sans
      A pagina inteira cai na fonte do navegador. Nao ha valor de `:root` por
      baixo para segurar a queda, e isso e de proposito.
      Papel novo na 0.7.0: as tres familias sairam de `src/tokens/scales.css`.
```

A lista de papeis nao e escrita a mao em lugar nenhum - ela e extraida do
proprio CSS para `src/tokens/theme-roles.ts`, e `check:temas` fica vermelho se
o comitado divergir da fonte. Lista escrita a mao envelhece calada, que e
exatamente o defeito que o comando existe para pegar. Papel com um dedo errado
(`--rc-font-san`) vira sugestao, porque a distancia e 1 do papel que falta.

A conta de contraste mudou de casa para isso: ela morava em `scripts/`, que nao
e publicado. Agora mora em `src/lib/contrast.ts` e viaja em `dist/cli.js` - e
**nao** em `dist/index.js`. Quem so usa as pecas nao carrega um byte a mais, e
ha guarda lendo o grafo de imports para que continue assim.

### A conta de contraste passa a ler cor moderna

Ela lia so sRGB: hexadecimal de 6 e 8 digitos, `rgb()` e `rgba()`. A paleta do
Tailwind 4 e escrita em `oklch`, entao quem copiava cor de la - o caminho mais
comum que existe - ouvia "sem medida" em vez de ser medido.

Agora le hexadecimal de 3, 4, 6 e 8 digitos, `rgb()`/`rgba()` com numero ou
percentual, `hsl()`/`hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()` e
`color()` em todos os espacos predefinidos do CSS, com angulo em `deg`, `rad`,
`grad` ou `turn`.

A conversao foi provada contra o navegador, e nao contra si mesma: 328 cores
pintadas num Chrome sem cabeca e lidas de volta pixel a pixel. **315 batem
exatamente, 13 diferem em 1 de 255, nenhuma passa disso.** A prova pegou um
defeito real de matriz que ninguem teria visto de outro jeito.

**82 das 286 cores nomeadas do Tailwind 4 nao existem em sRGB** - `red-500` e
`blue-500` inclusive. Elas sao medidas cortadas por canal, que e o que o
navegador rasteriza (79 exatas contra o Chrome, 3 a 1/255; o algoritmo da
especificacao erra ate 123 de 255 contra o mesmo navegador). O corte nao e
calado: uma linha `nota` nomeia cada papel fora do gamut e o valor em que foi
medido, e ela nao reprova.

`color-mix()` e nome de cor da CSS continuam recusados, e a recusa diz qual dos
dois e. Cor que nao se mede reprova em vez de ficar verde: o que nao se mede
nao se promete.

### Corrigido: o controle marcado nao se via no tema claro

QUATRO pecas tinham o mesmo defeito, e nas tres primeiras ele era do tipo
invertido - o estado ativo ficava MENOS visivel que o inativo.

O trilho do `Switch` ligado pintava `accent`: no tema claro, **1,21:1** sobre a
pagina e 1,26:1 sobre o cartao. O trilho DESLIGADO media 3,33:1. A WCAG 1.4.11
pede 3:1 para controle sem texto, entao o ligado reprovava, e reprovava ao
contrario. Quem olhava a chave lia o pino, e nada mais. A caixa do `Checkbox`,
o circulo do `Radio` e o estado `indeterminate` mediam os mesmos numeros; ali o
tique ainda se lia, porque e grafite contra a pagina, e o que desaparecia era a
**fronteira** do controle.

Agora todos pintam `accent-text` com a marca em `surface-raised`: **5,55:1**
sobre a pagina, **5,75:1** sobre o cartao, e a marca a 5,75:1 dentro do
preenchimento. A lima continua sendo a lima - `accent-text` e o mesmo lima um
passo mais escuro -, e no tema escuro os dois papeis apontam para o mesmo
valor: la o trilho nao mudou de cor.

Nao havia lima clara que resolvesse: sobre branco o teto e 1,54:1, no
`accent-active`. Fronteira propria no trilho, o outro caminho que a norma
aceita, resolvia no web (3,85:1) e nao existe no celular, onde o trilho e o do
sistema e nao aceita borda - a peca ficaria com duas aparencias.

E o `Slider` era a quarta, achada ao armar os pares das outras tres. Nenhum
par dele alcancava 3:1 no tema claro: a borda do pino sobre o trilho media
**1,03:1**, e o proprio preenchimento sobre o trilho vazio media **1,03:1**
tambem - ou seja, no tema claro nem "quanto ja foi" se lia por cor. Agora o
preenchimento e o pino pintam `accent-text` com o miolo em `surface-raised`:
4,69:1 sobre o trilho e 5,55:1 sobre a pagina.

O pino se separa do preenchimento pelo MIOLO, e nao pela borda, e isso foi
medido: `border-strong` no pino dava 3,19:1 sobre o trilho vazio e **1,90:1
sobre o proprio preenchimento** - o contorno se perderia justamente na metade
cheia, que e onde o pino sempre encosta.

Cinco pares entraram nas duas guardas de contraste, com piso E comparacao: o
marcado tem que passar dos 3:1 **e** nao pode pesar menos que o desmarcado. Um
deles e o unico par da casa medido ao contrario - a marca DENTRO do
preenchimento -, porque nada declarava que ela tem que se ler. E dois sao os
primeiros pares EMPILHADOS do lado do CSS: o trilho carrega alfa, entao medir o
token cru mediria uma cor que nenhum pixel tem. Tema de cliente
herda as tres garantias sem escrever linha, porque `accent-text` ja precisava
de 4,5:1 sobre os fundos e contraste e simetrico.

Quem vestia o trilho por fora: `--rc-accent-image` e `--rc-accent-shadow`, o
acabamento opcional que a regra `:where(.bg-accent)` aplica, nao alcancam mais
o trilho ligado.

### Duas pecas param de aceitar uso errado em silencio

**`ChartContainer` com altura zero.** A moldura e `w-full` sem altura e o filho
e `h-full`: quem esquece a classe de altura recebe `height: 0` na funcao de
desenho, e o cartao fica vazio - sem erro, sem aviso, sem pista. Parecia
coberto porque a Recharts reclama nos testes, mas o guarda dela e um OU
(`containerWidth < 0 || calculatedWidth > 0`): largura positiva sozinha cala o
aviso, que e exatamente o caso da armadilha. Agora a peca acusa, 200ms depois
do primeiro layout, e a espera importa: um pai que mede em dois passes seria
acusado sem culpa, e ha teste para esse falso positivo.

**`Indicator` cobrindo texto.** A pastilha e `absolute -top-1 -right-1`, sem
reservar espaco, e nada impedia embrulhar conteudo largo - o resultado era
sempre texto coberto. Aviso em `__DEV__` quando o filho passa de 48px, que e o
teto exato do conjunto legitimo: `--rc-control-lg` e 48, `Avatar` grande e 48,
e os usos que existem de fato no repositorio sao `Button size="icon"`, 40. O
`ref` de quem consome continua chegando.

## 0.8.0

A 0.7.0 saiu de manha e foi auditada a tarde: um retrato em Chrome e uma
varredura da arvore de acessibilidade acharam treze defeitos em pecas que ja
estavam no registro. Nenhum deles aparecia nos 1072 testes verdes. A maior
parte desta versao e o conserto disso.

E entra a peca que faltava do catalogo.

### `EventCalendar`: o que acontece, quando, e por quanto tempo

O `Calendar` escolhe uma data. Este mostra compromisso no tempo, em quatro
vistas: `agenda` (lista por dia), `day`, `week` e `month`.

A linha que separa ele do vizinho nao e o `Calendar`, e o `DataTable`: **se
ninguem precisa ver duracao nem choque de horario, e tabela.** Calendario so se
paga quando a resposta e geometrica.

O que ele NAO faz esta escrito: nao busca dado (so `onRangeChange`), nao
conhece fuso, nao edita, nao arrasta, nao expande recorrencia. Sao as fronteiras
que impedem a peca de virar aplicacao.

Duas decisoes que valem a leitura:

- **Nada de `role="grid"` com celula por meia hora** - seriam 336 paradas de
  tabulacao numa semana, que e o erro do `Tracker` numa forma nova. O andaime
  visual sai `aria-hidden`, e **para quem ouve toda vista e a vista `agenda`**:
  secao por dia, lista cronologica, `aria-setsize` no total real. Uma parada de
  tabulacao, com foco itinerante entre eventos.
- **A 390px a `week` some e a `month` fica.** A coluna de semana precisa
  mostrar hora e duracao em 44,8px, e nao mostra. A celula de mes precisa
  mostrar que existe alguma coisa e mais ou menos o que, em 51px, e isso
  sobrevive.

O piso de altura da tarja e a parte que assume um defeito de proposito: um
evento de cinco minutos tem 4px, e o piso vem do CSS com o calculo rodando nos
horarios reais. Dois eventos curtos que nao colidem no dado podem se empilhar
na tela; a alternativa era a grade inteira mentir sobre duracao.

O calculo de layout mora em arquivo proprio, sem DOM, porque ele vai atravessar
para o React Native - e nao ha mecanismo no repositorio para compartilhar
codigo puro entre os dois pacotes. Esse mecanismo e o que a peca vai cobrar
primeiro.

**No React Native ele entra na fila**, e a fila e por decisao de gesto, nao por
tempo: arrastar para mudar de semana, tocar e segurar para criar, e o que fazer
quando o dedo pousa sobre dois eventos sobrepostos. Nenhuma tem resposta no
web, onde sao ponteiro e teclado.

### Dois defeitos de nivel A, os dois em pecas novas

**O `Popconfirm` era armadilha de teclado enquanto a chamada corria.** O
`disabled` do Cancelar e o `loading` do Excluir tiravam os dois da ordem de
tabulacao ao mesmo tempo, e o `role="alertdialog"` ficava com ZERO focaveis.
Medido em Chrome: o foco caia no `<body>`, Esc nao fechava, e quatro Tabs
depois o cursor estava fora do painel, no fundo que o Base UI marca
`aria-hidden`. O leitor de tela nao ouvia nada. O Cancelar agora recusa por
`aria-disabled` e continua focavel, e ha regiao viva com a prop `busyLabel`
para o texto da espera. Falhava WCAG 2.1.2 e 4.1.3.

**O `VirtualList` nao tinha como ser rolado pelo teclado** em Firefox e Safari:
256 mil pixels de rolagem sem parada de tabulacao. No Chrome o salvamento
automatico do navegador cobrava o preco na medida - nome vazio e o anel AZUL
dele em vez do da casa, o unico lugar da vitrine onde o anel de foco nao era o
nosso. Agora o viewport e uma parada nomeada, com o anel da casa, e o nome
carrega o total: sem isso o leitor dizia "lista com 15 itens" antes de chegar
ao "1 de 4000". Falhava WCAG 2.1.1.

### Quebra: `aria-label` deixou de ser aceito e ignorado

Em `FilterBar`, `Tracker` e `Splitter`, o `aria-label` de quem chamava pousava
num no sem papel, ou era sobrescrito pelo espalhamento. Compilava, renderizava,
e o leitor ouvia outro nome. Agora ele **vence** e chega ao no que tem papel.

Quem escrevia `aria-label` nessas tres pecas na 0.7.0 nao muda uma linha - passa
a funcionar. Quem dependia de ele ser ignorado (ninguem, esperamos) muda.

### Os outros nove

- **`FilterBar`**: o foco caia no `<body>` a cada ficha removida - seis
  reinicios numa barra de seis. Agora vai para o xis seguinte, depois o limpar,
  depois o anterior, depois a raiz. E `disabled` deixou de CRIAR uma parada de
  tabulacao sem nome: ela so existe quando a fileira realmente transborda.
- **`TimeField`**: os botoes de passo se chamavam "Aumentar" e "Diminuir", sem
  dizer de que campo. Agora herdam o nome do rotulo, e a mudanca e anunciada.
  Duas saidas obvias foram medidas e recusadas: apontar para o input devolve o
  VALOR e nao o rotulo, e `role="spinbutton"` faz o Chrome ignorar
  `aria-valuetext` e expor `480` enquanto a tela mostra `25:99`.
- **`Table`**: `aria-selected` em `role="row"` de tabela simples e descartado
  pelo navegador - a selecao era so cor, e o JSDoc prometia o contrario. Agora
  ha marcador textual, com `labels.selected`, e `role="grid"` continua recusado
  porque exigiria navegacao por setas que a peca nao implementa.
- **`Splitter`**: a alca media 13px, e a WCAG 2.5.8 pede 24. Passou a 25, sem
  engordar o desenho. Ganhou `aria-valuetext` (o leitor dizia "50" pelado) e
  `aria-controls`.
- **`Tracker`** e **`TimePicker`**: o nome era lido duas vezes seguidas.
- **As quatro irmas** (`DataTable`, `ChartContainer`, `QueryBoundary`,
  `VirtualList`) passam a aceitar `retryLabel` e a anunciar a espera. Duas
  tinham metade disso, e meio contrato e pior que nenhum: quem traduzia a tela
  ficava com titulo em ingles e botao em portugues.

### `dir="rtl"`: quatro pecas liam o dado errado

O `Tracker` a 5% da esquerda lia "Dia 2" onde a celula era "Dia 20" -
dezessete celulas de distancia, e o balao dizia o dado errado. O `Splitter`
movia a divisoria para o lado OPOSTO ao arrasto. O `ColorPicker` andava o foco
34px para a esquerda com a seta da direita.

E o `Tree` era o pior: `paddingLeft` e propriedade fisica, entao os tres niveis
paravam no mesmo pixel. **A hierarquia era invisivel.** Trocar so a tecla teria
consertado o teclado para um desenho que continuava errado.

As quatro leem a direcao do `RivoProvider` agora, e todas foram medidas em
Chrome antes e depois.

### O peso da instalacao

As tres dependencias de fonte sairam de `dependencies` para `devDependencies`.
As faces ja viajam dentro do pacote, em `dist/files`, e o `dist/fonts.css`
aponta para la - quem instalava baixava as fontes duas vezes.

## 0.7.0

Os dez nomes que a 0.6 manteve por apelido saem. O dono da biblioteca e hoje o
unico consumidor, entao arrastar compatibilidade custaria mais do que limpar -
alias e divida que ninguem cobra e ninguem remove, e o repositorio ja pagou
essa conta uma vez na 0.3.0.

Junto vai o trabalho de um dia inteiro em cima da 0.6.1: vocabulario unico para
escolher item, posicionamento igual nos cinco paineis flutuantes, os nomes
acessiveis reunidos num objeto, dez exports que a Base UI ja entregava e
ninguem via, um token de contraste novo e dez pecas nativas a mais.

### Quebra: os dez nomes que saem

| Antes | Agora | Peca |
|---|---|---|
| `tone` | `trend` | `Sparkline` |
| `selected` | `value` | `DataTable` |
| `onSelectedChange` | `onValueChange` | `DataTable` |
| `selected` | `value` | `Tree` |
| `onSelectedChange` | `onValueChange` | `Tree` |
| `maxItems` | `max` | `Breadcrumb` |
| `wrapperClassName` | `classNames.wrapper` | `PasswordInput` |
| `removeLabel` | `labels.remove` | `TagsInput` |
| `maskDate` | `applyDateMask` | `@rivocode/ui` |
| `phoneMask` | `phonePatternFor` | `@rivocode/ui` |

Oito sao troca de palavra, e o `tsc` acha todos. Dois mudam de forma, e por
isso merecem o olho:

```tsx
<PasswordInput wrapperClassName="w-72" />              // antes
<PasswordInput classNames={{ wrapper: 'w-72' }} />     // agora

<TagsInput removeLabel={(tag) => `Tirar ${tag}`} />              // antes
<TagsInput labels={{ remove: (tag) => `Tirar ${tag}` }} />       // agora
```

O `classNames` do `PasswordInput` tem tres partes - `wrapper`, `input` e
`action` -, entao quem vestia mais de uma parte passa a escrever um objeto so.
O `labels` do `TagsInput` hoje tem uma chave, e nasceu objeto porque e assim
que o resto do catalogo batiza nome acessivel configuravel.

Duas armadilhas de busca e troca:

- **`wrapperClassName` tambem existe no `ChartTooltip`**, que e a `Tooltip` da
  Recharts reexportada, e la ele nao muda de nome. Troque so o do
  `PasswordInput`.
- **`selected` continua sendo prop do `TableRow`** - a linha marcada da
  `Table` crua - e do `Calendar`. Troque so o do `DataTable` e o da `Tree`.

O `@rivocode/ui-native` acompanha a `Sparkline`: o `tone` de la tambem virou
`trend`, para o nome nao significar coisas diferentes nos dois lados.

O resto do nativo NAO acompanha nesta versao, e isso e proposital: o
`DataList` continua com `selected`/`onSelectedChange` e o `TagsInput` nativo
com `removeLabel`. La esses nunca foram apelido - sao o unico nome que a peca
tem -, e o pacote nativo tem versao e ciclo proprios. A troca de vocabulario
deles e uma quebra do `@rivocode/ui-native`, e sai numa versao dele.

### Escolher item se chama a mesma coisa nas tres pecas

`Tree`, `TreeSelect` e `DataTable` falavam tres dialetos para a mesma ideia, e
o `TreeSelect` embrulha o `Tree`: quem passava do painel para a arvore inline
reescrevia o binding inteiro. Agora sao `value`, `defaultValue` e
`onValueChange` nas tres.

A arvore tambem deixou de exigir a escolha. Quem so queria uma arvore que abre
e fecha inventava um estado para nada, enquanto o `TreeSelect` - a mesma peca
dentro de um painel - ja aceitava tudo opcional.

### Os cinco paineis flutuantes se posicionam do mesmo jeito

`Popover`, `Tooltip`, `Menu`, `Select` e `Combobox` dividem a mesma casca e
tinham quatro contratos para dizer onde abrir: o `Popover` expunha lado,
alinhamento e folga; o `Tooltip` so o lado; os outros tres, nada.

```tsx
<MenuContent side="right" align="start" sideOffset={10} />
```

`side`, `align` e `sideOffset` valem nas cinco, com o tipo derivado do
posicionador da Base UI em vez de escrito a mao. A folga vira uma so, 6 - o
`Popover` era o unico com 8, e quem depender daquele valor escreve
`sideOffset={8}`.

No `Select` ha uma sutileza: o posicionador dele alinha o item escolhido com o
gatilho por padrao, e nesse modo descarta lado e folga. Pedir qualquer uma das
tres desliga esse alinhamento; quem nao pede nenhuma mantem o comportamento de
hoje byte por byte.

Da mesma familia: o `AlertDialogContent` ganha `classNames.backdrop`, o
`ComboboxInput` ganha `classNames` - o `className` parava na moldura e nunca
chegava ao campo -, a tarja do `Dialog` passa a animar como as das irmas e o
`DialogFooter` empilha no celular.

### Os nomes acessiveis se reunem em `labels`

Cada peca batizava do seu jeito o texto que o leitor de tela ouve. Agora o
objeto e o mesmo em todas, e cada chave tem o proprio padrao - trocar uma nao
apaga a outra:

```tsx
<PasswordInput labels={{ show: 'Revelar a senha' }} />
<Clipboard labels={{ copy: 'Copiar a chave' }} />
<TagsInput labels={{ remove: (tag) => `Tirar ${tag}` }} />
```

Quem mais ganha e a ficha do `Combobox`: o xis era um `aria-label="Remover"`
cravado, sem prop nenhuma - nao dava para traduzir nem para dizer o que se
remove, e tres fichas se anunciavam "Remover, Remover, Remover". O padrao
agora sai do proprio conteudo da ficha, e o `ComboboxChip` aceita
`labels.remove` para o resto.

### `defaultValue` nas que exigiam controle

`TagsInput` e `Editable` exigiam `value` e `onValueChange`; `Tree` e
`DataTable` exigiam o par equivalente. Um filtro de tela nao envia nada e nao
guarda nada, e pagava um `useState` so para existir. As quatro seguem o padrao
das irmas: sem controle de fora, a peca guarda a propria escolha, e
`defaultValue` diz com o que ela comeca.

### Dez exports de menu e de select

Casca sobre o que a Base UI ja entregava e nunca foi exposto:

`MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem`, `MenuLinkItem`,
`MenuSubmenu`, `MenuSubmenuTrigger`, `SelectGroup`, `SelectGroupLabel`,
`SelectSeparator` e `ComboboxSeparator`.

O caso concreto e a listagem: "Colunas" para escolher o que aparece e
"Ordenar por" para escolher a ordem - hoje isso so se montava com `Popover`
mais `Checkbox` na mao, perdendo o `aria-checked` e a navegacao de menu. O
checkbox e o radio nao fecham o menu ao escolher; o item de link fecha, ao
contrario da Base UI, porque com roteador de uma pagina so o menu ficava
aberto flutuando sobre a tela nova.

Uma peca existente muda de aparencia: o `ComboboxGroupLabel` era reexport cru
e o unico cabecalho de grupo sem estilo - tinha o tamanho e a cor dos itens e
lia-se como mais uma opcao.

### O grafico diz o que e, e o vazio dele aparece

O `ChartContainer` ganha `label`, o nome que o leitor de tela ouve. Sem ela,
ele monta o nome a partir dos rotulos das series; antes o nome acessivel caia
nos rotulos de eixo colados - "MarAbrMaiJunJulAgo020406080" - porque a Recharts
entrega o `<svg>` com `role="application"`.

O `empty` do grafico tinha um defeito silencioso: so aparecia com `empty` E
`data` juntos, entao quem passava `empty` e esquecia `data` nunca via o estado
vazio, sem erro nenhum - o grafico desenhava eixos sobre o nada. Agora a
moldura le os pontos do proprio filho da Recharts, `data` vira reforco para os
casos em que eles moram mais fundo, e o `action` entra no vazio, como no
`DataTable`. Quando nem um nem outro acha ponto, sai aviso em desenvolvimento.

### `titleAs` no `PageHeader`

Ele emitia `h1` sempre, e uma aplicacao que ja tem `h1` no shell ganhava o
segundo sem aviso. `titleAs` aceita `h1`, `h2` ou `h3` e baixa o nivel sem
mexer no desenho. O padrao continua `h1`: ninguem que ja usa muda.

### O token `--rc-border-disabled`

Um controle desmarcado, travado e sem rotulo - a coluna de selecao do
`DataTable` - nao tinha sinal visual nenhum, porque `surface` e
`surface-raised` sao a mesma branca no tema claro. `Checkbox`, `Radio` e
`Switch` descem a borda para ele ao travar.

E o unico par da casa com teto alem de piso: pelo menos 1,6:1 contra o fundo,
porque em 1,23 a borda some, e a fronteira viva tem que pesar 1,4x mais, senao
travado e vivo ficam iguais. Um tema de cliente que redefina os tokens precisa
declarar este tambem.

Os tres tambem alinham o respiro em `gap-2` e trocam o `opacity-60` do travado
por token - a opacidade rebaixava borda, marca e texto de uma vez, e passava
por fora do `check:contrast`.

### O React Native chega a 56 pecas

`Steps`, `DateRangePicker`, `Form`, `Tracker`, `InputGroup`, `PasswordInput`,
`TagsInput`, `Indicator`, `Item` e `RelativeTime` saem da fila. Sao 56 pecas
traduzidas e 11 esperando coisa que ainda nao existe, das 83 do web.

Nenhuma foi transposta, e a [tabela de paridade](https://ds.rivocode.com.br/react-native)
conta peca a peca o que muda. O `useWizard` atravessa e a regua nao; o
`DateRangePicker` escolhe a faixa na grade de um mes so, porque dois meses lado
a lado dao 27px de celula em 390; o `Tracker` vira um alvo unico com arraste,
porque 365 quadrados dao 4px de alvo cada.

### Onze consertos e cinco verificacoes novas

Fronteira de campo abaixo de 3:1 no `NumberField`, no `OTPField` e no
`SearchInput`; `size` do `NumberField` que mudava fonte e nao mudava altura;
`SearchInput` sem `size` nenhum; `Item` que prometia `render` no proprio JSDoc
e nao aceitava; quatro paradas de tabulacao com `outline-none` e nenhum foco
reposto; a barra indeterminada ignorando "reduzir movimento" e mentindo "20%
concluido" para quem ouve; o `TagsInput` fora do `Field.Control`, o unico
rotulo orfao do site; a paleta de comandos que nao anunciava lista vazia; e o
`data-[disabled]` que vencia `data-[checked]` por ordem alfabetica do Tailwind,
pintando de acento cheio a caixa travada em estado misto.

As guardas: `check:pecas` (o catalogo que o README e o npm anunciam),
`check:testes` (a contagem que a home exibe), `check:skill` (prop citada em
exemplo da skill tem que existir na peca), `check:chart` (a Recharts nao pode
vazar de `src/chart/`) e `test/classe-da-raiz`, que varre as 230 pecas dos tres
indices atras de quem nao aceita `className` na raiz ou aceita e nao repassa -
ela ja nasceu achando `Command` e `CalendarPanel`.

### Uma mudanca de saida que nao tem nome novo

`delta={12.5}` no `Stat` imprimia "12.5%" e passa a imprimir "alta de 13%". O
`deltaFormat` chegou com padrao `percent`, e o `percent` da casa arredonda para
zero casas. Nenhuma prop mudou de nome, o `tsc` nao acha, e a tela continua
compilando - so o numero fica diferente. Quem precisa da casa decimal escreve
`deltaFormat={(value) => percent(value, 1)}`.

E a unica quebra desta versao que se descobre olhando, e por isso esta separada
das outras dez.

### A tabela ganha o rodape de totais

`TableFooter` entra no indice, e no `DataTable` basta uma coluna declarar
`total` para o `<tfoot>` existir:

```tsx
{ key: 'amount', header: 'Valor',
  total: (rows) => currencyShort(rows.reduce((sum, row) => sum + row.amount, 0)) }
```

**O total soma o que a busca deixou, e nao a pagina.** O total de uma busca e o
total da busca, e virar de pagina nao muda quanto se deve. Antes disso, um
total morava numa `<div>` embaixo da tabela: sem largura de coluna, ele nunca
alinhava com o numero que somava.

Junto vem o `TableCaption`, para quem monta a `Table` a mao. Ele e o nome
acessivel da tabela - o instinto oposto, um `<h3>` acima dela, nao quebra nada
e custa o nome inteiro. E `<caption>` nao tem outro pai legal alem de
`<table>`: solto ao lado, o React derruba com "cannot be a child of `<div>`".

### Os quatro finais ganham texto proprio

`errorTitle` e `noResultsMessage` no `DataTable`, `errorTitle` no
`ChartContainer`. Num painel com quatro consultas, "Nao foi possivel carregar"
quatro vezes nao diz qual delas caiu.

O `Alert` acompanha com `icon` e `onDismiss`, e a base do `alertVariants`
mudou junto: o icone entrava como filho, no meio do texto, e agora tem lugar -
com `mt-0.5`, que o alinha com a maiuscula da primeira linha e nao com o centro
dela.

### Nove pecas voltam a aceitar `id`, `data-*` e `aria-*`

`Stat`, `Tree`, `ColorPicker`, `Command`, `FileUpload`, `CalendarPanel`,
`ChartDonut` e `ChartRadial` tinham tipo de objeto fechado em vez de estender
`ComponentProps`, entao um `id` ou um `aria-label` escrito de fora nao chegava
ao DOM - e nao havia erro, o atributo simplesmente sumia.

Quatro colisoes tiveram que ser omitidas do tipo herdado, e a pior e silenciosa:
o `title` do `Command` e do `CalendarPanel` e `string` dos dois lados, entao a
intersecao COMPILAVA e mandava o valor para o titulo da peca **e** para a tarja
amarela do navegador.

Onde a peca escreve um `aria-label` padrao, o espalhamento vai depois dele,
para o rotulo de quem chama vencer. Antes disso, um rotulo escrito de fora era
engolido em silencio.

### O `Tracker` deixa de montar um portal por ponto

Cada quadrado montava um `Tooltip`, e tooltip e portal: um ano de dados eram
365 portais montados para que no maximo um aparecesse. Agora a faixa inteira e
o alvo, ha um balao so, e o indice lido sai de uma regra de tres sobre o
retangulo da faixa - nao mede quadrado a quadrado, que custaria um layout por
movimento do mouse.

A acessibilidade subiu junto, e nao apenas nao regrediu: nada ali era focavel
antes, entao a leitura exata de um periodo era so de quem tem mouse. A faixa
agora e uma parada de tabulacao, as setas caminham, `Home` e `End` vao as
pontas, e um `role="status"` anuncia o periodo lido pelo teclado - calado no
ponteiro, que e o mesmo contrato do `ChartContainer`.

O quadrado continua fora da ordem de tabulacao de proposito: 365 paradas dentro
de um cartao seriam obstaculo, e a lista escondida ja entrega os 365 textos.

### Tres guardas que estavam olhando para o lado errado

- **`check:contrato` so conhecia o web.** Os quatro subcaminhos do pacote
  nativo nunca entraram nele. Na primeira vez que rodou completo, achou sete
  nomes que existiam no pacote e em texto nenhum.
- **A guarda de acento so varria `src/`.** O `DataList` nativo serviu "Nao foi
  possivel carregar a lista." por versoes, acentuada do lado web e crua no
  aparelho. A varredura agora cobre os dois pacotes - e ganhou piso de arquivo,
  porque a primeira tentativa de junta-los num padrao so varreu ZERO arquivo em
  silencio e ficou verde por nao olhar nada.
- **`check:comentarios` tinha divida declarada.** As duas ultimas linhas do
  `DEBT` foram pagas, e a lista esta vazia.

Sairam quatro scripts de `scripts/`: `acentos-previews`, `exports-ingles`,
`rodar-acentos` e `titulos-previews`. Eram mutacoes de uma vez so, ja
aplicadas, e o que faziam uma vez hoje e cobrado a cada `check`. Um deles
deixou rastro: `Apos` virou `After` dentro de uma frase em portugues na fonte da
tabela de paridade, e a palavra ficou la por versoes.

### Quebra: a fonte da marca sai do `styles.css`

As `@font-face` do Manrope, do Poppins e do JetBrains Mono estavam dentro do
`dist/styles.css` de todo mundo, e os 220 KB de `.woff2` viajavam no pacote
mesmo para quem nunca quis a marca. Elas agora tem entrada propria:

```css
@import "@rivocode/ui/styles.css";   /* pecas e tokens */
@import "@rivocode/ui/fonts.css";    /* as faces da marca - opcional */
```

**Quem importa so o `styles.css` passa a renderizar na fonte do sistema**, sem
erro e sem aviso. E uma linha para devolver. Nao ha `styles-sem-fontes.css` de
compatibilidade de proposito: arrastar os dois arquivos faria eles divergirem
em silencio, e o repositorio ja pagou essa conta.

Medida depois da mudanca: `dist/styles.css` tem zero `@font-face`,
`dist/fonts.css` tem catorze, e os 16 arquivos de fonte so sao alcancaveis por
quem importa o segundo.

### A fonte passa a ser papel de tema

Os tres tokens saem de `src/tokens/scales.css`, que e camada global, e passam a
ser declarados dentro de `[data-rc-theme="..."]`, como cor e sombra ja eram.
Isso e o que torna possivel duas marcas na mesma pagina:

```css
@import "@fontsource-variable/inter";

[data-rc-theme="cliente-acme"] {
  --rc-font-sans: "Inter Variable", system-ui, sans-serif;
  --rc-font-display: "Inter Variable", sans-serif;
  --rc-font-mono: "JetBrains Mono Variable", ui-monospace, monospace;
}
```

**Nao ha fallback no `:root`, e isso e deliberado.** Nenhum outro token de tema
tem - `--rc-bg`, `--rc-accent` e `--rc-shadow-1` tambem nao. Inventar um
`system-ui` por baixo so para fonte tornaria a falta silenciosa: um tema de
cliente que esquecesse as tres renderizaria bonito e passaria por escolha.

O `check:temas` cobra os tres agora - passou de 72 para 75 tokens -, entao tema
novo sem fonte declarada falha o gate.

### Sete pecas novas, e nenhuma delas nasce so no web

`TimeField`, `TimePicker`, `FilterBar`, `FilterChip`, `QueryBoundary`,
`Popconfirm` e `VirtualList`. O catalogo vai de 83 para 90.

- **`TimeField` / `TimePicker`** - agendamento, ponto eletronico, janela de
  entrega. Nao sao wrapper do `MaskedInput`: o molde `hora` e posicional, poe
  os dois pontos e nada mais - nao sabe que `25:99` nao existe, nao conhece
  janela e nao tem seta. `25:99` nao vira `23:59` em silencio; marca invalido e
  volta ao ultimo valido ao sair, porque ninguem confere valor que o campo
  "aceitou". O `step` governa as setas e as opcoes, nunca a validacao.
- **`FilterBar` / `FilterChip`** - a fileira de filtros que toda listagem
  remontava a mao. Rola na horizontal: quebrar linha faria a altura depender de
  quantos filtros existem, e colapsar em "+3" esconde filtro atras de contador,
  que e a origem de "sumiram meus dados". A linha fica reservada para a tela
  nao pular quando o primeiro filtro entra.
- **`QueryBoundary`** - os quatro finais como peca. Usa os MESMOS nomes de prop
  do `DataTable` e do `ChartContainer`, e nao um terceiro dialeto. O `children`
  aceita funcao, que e o que justifica a peca: ela entrega o dado ja sem
  `undefined` e mata o `!` que a tela escrevia.
- **`Popconfirm`** - confirmar sem o peso do `AlertDialog`. Aqui dispensar
  CANCELA, ao contrario do vizinho, e a razao e que o gesto distraido leva ao
  resultado seguro: fechar nao apaga nada. Prender alguem num painel de 20rem
  para ler dois botoes cobra atencao onde nao ha risco, e e assim que se treina
  a pessoa a clicar em "Confirmar" sem ler.
- **`VirtualList`** - o virtualizador ja estava pago pelo `DataTable`. Ela mede
  a altura de verdade, o que a tabela nao pode fazer: linha absoluta sai do
  algoritmo de layout de tabela e leva junto a largura das colunas. Quem ja
  passou pela tela vale medida, quem nao passou vale palpite - e o que resolve
  o item que quebra em duas linhas a 390px. Anuncia `aria-setsize` no total
  real, entao o leitor de tela ouve "3 de 4000" e nao "3 de 20".

**Cinco das sete ja nasceram tambem no React Native**, no mesmo dia. As outras
duas nao sao atraso: o `VirtualList` nao porta porque a `FlatList` ja
virtualiza de fabrica, e o `Popconfirm` vira `AlertDialog`, porque painel
ancorado nao e idioma de toque - o proprio web ja vira folha de baixo abaixo de
640px. Isso deixou de ser boa vontade e virou regra com guarda; veja o
`CLAUDE.md`.

### Quebra silenciosa: o grafico mostrava esqueleto quando devia mostrar erro

O `ChartContainer` ordenava `isLoading` antes de `isError`. Com os dois ligados
- consulta que falhou durante um refetch -, ele desenhava o esqueleto e
escondia a falha: quem olhava via carregamento eterno, sem o botao de tentar de
novo.

O `DataTable` sempre ordenou certo, e `DataTable.md` e a tabela de paridade ja
afirmavam que a regra da casa era **erro vence carregando**. A peca e que
discordava do texto, calada, nos dois pacotes. Ha teste dos dois lados agora.

### O `Tracker` lia o dado errado em `dir="rtl"`

Nao era preferencia de layout: o flex espelhava o desenho, mas a conta que
descobre qual periodo esta sob o ponteiro nao. O ponteiro a 5% da esquerda lia
"Dia 2" quando a celula ali era "Dia 20" - **dezessete celulas de distancia**,
e o balao dizia o dado errado. A conta agora mede da borda que comeca a
leitura, as setas trocam de papel e a marca usa `insetInlineStart`.

O `Splitter` tem o mesmo limite e continua tendo: em `rtl`, arrastar 120px para
a direita move a divisoria 118px para a esquerda. Esta medido e escrito na
pagina dele, porque limite que ninguem escreve vira surpresa.

### `check:scripts`, e o guarda que ninguem rodava

`scripts/regressao-visual.ts` vivia fora do gate, e por isso ficou vermelho em
silencio: tres assinaturas de retrato divergiam do comitado desde o dia em que
os cinco paineis flutuantes foram refeitos, e ninguem sabia.

Ele nao pode entrar no gate - 77 segundos e um Chrome em caminho fixo de macOS,
enquanto a CI e ubuntu. Entao a guarda nova resolve a classe: todo `scripts/*.ts`
tem que ser alcancavel a partir do `check`, ou ter uma linha declarando o que o
impede. A lista so encolhe, como o `DEBT` das outras guardas. Custo: 22ms.

### Como migrar

Busca e troca por palavra inteira resolve oito dos dez. Os dois de forma -
`wrapperClassName` e `removeLabel` - viram chave dentro de objeto, e o `tsc`
aponta cada um. Cuidado com `selected` e com `wrapperClassName`, que continuam
existindo em outras pecas: confira a peca antes de trocar.

O agent `migracao`, que viaja no pacote, faz isso com o `tsc` entre uma quebra
e a seguinte.


## 0.6.1

### O molde do telefone volta para dentro do `applyMask`

```ts
applyMask("8388112233", "telefone")  // "(83) 88112-233"
```

O fixo saia vestindo a pontuacao do celular. O `MASKS.telefone` guarda um
molde so, e quem cumpria a promessa de trocar entre fixo e celular era o
`MaskedInput`, escolhendo o molde por fora antes de chamar - qualquer outro
chamador recebia o embolado.

Contorno em quem usa e uma segunda fonte de verdade: a regra so vale onde
alguem lembrou de repeti-la. A moeda ja era decidida dentro do `applyMask`
pelo mesmo motivo, e o telefone e o outro molde que depende do que ja foi
digitado. Agora os dois moram no mesmo lugar, e o componente anda pelo mesmo
caminho que qualquer um que chame o utilitario direto.


## 0.6.0

Uma releitura do relatorio de bancada sobre a 0.5.0, e um defeito que apareceu
no caminho. O item de contraste da lista - a fronteira de `Input` e do botao
`secondary` em 1,28:1 - ja estava fechado na 0.5.0, e o verificador mede 3,54:1
no claro e 3,30:1 no escuro contra o minimo de 3.

### O nome da mascara passa a dizer a natureza do que ela devolve

As tres tinham a mesma assinatura, `(text: string) => string`, e uma devolvia
coisa de outra natureza:

```ts
applyCurrencyMask("123456")  // "1.234,56"        texto
maskDate("31122026")         // "31/12/2026"      texto
phoneMask("11987654321")     // "(99) 99999-9999" MOLDE
```

Quem chamasse `phoneMask` esperando o telefone formatado escrevia o molde
literal no campo, e o TypeScript nao tinha como acusar. Agora `applyXMask`
devolve texto pronto e `phonePatternFor` devolve molde - tipado como `Mask`,
o que o liga ao `applyMask` que o recebe.

Nada quebra: `phoneMask` e `maskDate` continuam exportados como apelido
marcado `@deprecated`.

### `<li>` dentro de `<li>` na linha com acao

O `SidebarMenuRow` ja e o `<li>` da linha, e o `SidebarMenuItem` abria um
segundo por dentro. No cliente isso nunca aparece, porque o React monta no a
no e ninguem passa pelo analisador de HTML. A conta chega no SSR: o navegador
conserta separando os dois em irmaos, e a arvore consertada nao bate com a que
o React espera na hidratacao - o caminho comum de quem monta em Next.js, e nao
o raro.

### A barra encolhida para de sair torta

O `SidebarBrand` centraliza quando a barra encolhe, e o `SidebarFooter` estava
na outra ponta da mesma barra sem esse tratamento. O rodape esta em campo em
toda tela de operacao, entao a torta aparecia sempre.

### A verificacao nova

`check:instalacao` acusa um `bun install` solto dentro de `native/`. A pasta
nao e workspace, entao a instalacao de la cria uma segunda copia do React, e o
`bun test` da raiz quebra em noventa e oito testes com "Invalid hook call" -
apontando para codigo que esta certo. A CI nunca ve, porque so instala na raiz.


## 0.5.0

Uma bancada externa auditou a biblioteca inteira - 258 exports instanciados,
118 paginas lidas, contraste medido nos dois temas, 12 telas a 390px e 93
testes de interacao em tres navegadores. Esta versao e a resposta.

O padrao dos achados vale mais que a lista: **o que era verificado estava
impecavel, e todo defeito morava numa faixa que nenhum check cobria** - fuso de
data, callback na doc, contraste nao-textual, estado indeterminado, doc que
promete peca ausente. Por isso metade do trabalho aqui e verificacao nova, e
nao conserto.

### As pecas que faltavam

`Clipboard`, `Code` e `CodeBlock`, `RelativeTime`, `Timeline`, `Indicator`,
`AvatarGroup`, `PasswordInput`, `TagsInput`, `Tracker`, `Splitter` e
`Editable`. Todas com pagina, exemplo que roda, teste e linha na skill - que e
o contrato que faltou ao `FileUpload`, publicado com a doc pronta e o
componente ausente.

### `classNames` por parte

Abaixo da raiz, cada peca era no selado: a trilha do `Progress`, o pino do
`Slider`, a marca do `Checkbox`, a linha do `DataTable`, a tarja do `Dialog`.
O unico gancho de parte da biblioteca inteira era o `labelClassName`.

```tsx
<Slider classNames={{ track: "bg-accent-subtle", thumb: "shadow-glow" }} />
<Dialog classNames={{ backdrop: "backdrop-blur-md" }} />
```

Os nomes das partes sao os mesmos da secao "Partes" de cada pagina.
`labelClassName` continua valendo.

### Forma e movimento entram no tema

Canto, duracao, curva e espacamento de letra saem da escala global para
`src/tokens/forma.css`, e um tema pode redefinir os nove:

```css
[data-rc-theme="acme"] {
  --rc-radius-md: 0px;
  --rc-duration-base: 140ms;
}
```

### Onze consertos que a auditoria achou

Fuso nos formatadores de data do grafico (todo eixo de tempo do produto estava
deslocado um dia); barra indeterminada que parecia 100%; botao carregando que
perdia a variante; molde de mascara desconhecido que virava o valor do campo;
telefone fixo mal-formatado pelo `defaultValue`; caixa misturada no cabecalho
que ordena; `ComboboxValue` exportado, que destrava as fichas; tom no `Toast`;
`Avatar` que sumia quando `surface` e `surface-raised` sao iguais; contraste do
aviso no tema claro; e o rotulo de grupo da `Sidebar` que nunca sumia quando a
barra encolhia.

Mais tres de acessibilidade que so aparecem no celular ou no teclado: campo de
texto que disparava o zoom do iOS, quatro alvos abaixo de 24px, e - dentro de
um `Field` - todo radio de um grupo herdando o rotulo do campo, com o leitor de
tela dizendo o mesmo nome para todas as opcoes.

### A fronteira dos controles passa a cumprir a WCAG 1.4.11

`--rc-border-strong` sobe para 3:1 contra a superficie, e campo, moldura com
encosto, gatilho do `Select` e busca da barra passam a veste-la. **A mudanca e
visivel**: a borda de todo controle fica mais presente nos dois temas.

### Nove guardas novas

`check:props` (as tabelas saem do compilador, e 2.234 callbacks voltaram),
`check:nomes` (idioma do codigo), `check:doc` (pagina sem codigo e peca sem
pagina), `check:grupos` (seletor de grupo morto), `check:paridade` (a tabela do
nativo contra o indice real), `check:native:types` (a fonte publicada do
nativo), contraste com alfa composto, pares nao-textuais de 1.4.11, e acento em
texto de interface. Mais o `bun run visual`, que compara os retratos por
assinatura - ele pega o que `tsc` e teste de unidade nao pegam.

### Cada prop diz em que versao apareceu

As tabelas de props - no site e nos `.md` que um agente le - ganham a coluna
"Desde". Quem tem uma versao velha instalada precisa saber se a prop que esta
lendo existe para ele, e ate aqui descobria pelo erro de tipo, ou pior, pelo
atributo solto no DOM.

O marcador nao e escrito a mao: `bun run gen:props --desde 0.5.0` carimba, no
lancamento, tudo que ainda nao tem carimbo. Durante o desenvolvimento ninguem
sabe em que versao a prop vai sair, e adivinhar produz um numero errado que a
doc publica com confianca. Prop com `-` e prop que ainda nao saiu.

### O nativo ganha camada 3: tema de cliente

`@rivocode/ui-native` aceita um tema de cliente, gerado do mesmo CSS que veste
o web:

```sh
bun run gen:native --tema tema-acme.css --saida acme.theme.ts
```

```tsx
<RivoProvider theme={acmeTheme} scheme="system">
```

Os dois temas de casa nao mudam: continuam no `light-dark()`, com troca no
mesmo frame e sem re-render. O tema de cliente entra pelo
`VariableContextProvider` do NativeWind e custa uma re-renderizacao por troca -
paga so por quem veste um cliente.

Para quem escreve peca nativa: cor lida por fora da classe agora vem de
`useRivo().colors`, e nao de `tokens.themes[...]`. Um teste falha se alguem
voltar a ler direto, porque assim a tela do cliente sairia com metade das cores
dele e metade da lima da RivoCode.

### `format` significava tres coisas, e agora significa uma

Nas pecas que escrevem numero, `format` era `Intl.NumberFormatOptions`; no
eixo do grafico, era nome de formatador ou funcao; no `ChartDonut`, so funcao.
O caminho que dava erro de tipo era o menos ruim - o que nao dava e pior:
`{ style: "percent" }` num medidor de 0 a 100 imprime 8.200% ao lado de uma
barra em 82%, e nada reclama.

| Peca | Antes | Agora |
|---|---|---|
| `Meter`, `Progress`, `Slider` | `format={{ style: "percent" }}` | `numberFormat={{ style: "percent" }}` |
| `Meter`, `Progress`, `Slider` | - | `format="percent"` ou `format={(v) => ...}` |
| `NumberField` | `format={{ ... }}` | `numberFormat={{ ... }}` |
| `ChartDonut` | so funcao | tambem nome: `format="currencyShort"` |

O `NumberField` nao aceita nome de formatador, e a razao e o campo ser
editavel: um formatador so escreve, e o que a pessoa digita precisa ser lido de
volta.

### Os adaptadores de formulario tem nome de formato, e nao de peca

`forCheckbox` sempre serviu o `Switch` sem uma linha de diferenca, e
`forSelect` serve `RadioGroup`, `ToggleGroup`, `NumberField`, `Slider` e
`OTPField`. O nome fazia a API parecer menor do que e.

| Antes | Agora | Serve |
|---|---|---|
| `forSelect` | `forValue` | Tudo que tem `value` e `onValueChange` |
| `forCheckbox` | `forChecked` | Tudo que tem `checked` e `onCheckedChange` |
| `forDatePicker` | `forDate` | Valor em `Date` |

Os nomes antigos continuam valendo e apontam para os mesmos adaptadores.
`forValue` devolve o valor com o tipo que o schema deu a ele, em vez de
`unknown`, entao controle tipado encaixa sem `as`.

Os tipos deixam o portugues: `PropsDeSelect` vira `ValueProps`,
`PropsDeCheckbox` vira `CheckedProps`, `PropsDeDatePicker` vira `DateProps`.
Os nomes antigos seguem exportados como apelido.

### O DatePicker renomeia a prop `confirmar`

Era a unica prop publica em portugues numa API em ingles. Agora e `confirm`.

```tsx
<DatePicker confirmar />   // antes
<DatePicker confirm />     // agora
```

### Os formatadores saem tambem pela raiz

`currencyShort`, `percent`, `integer`, `monthShort` e os demais continuam em
`@rivocode/ui/chart` e passam a sair de `@rivocode/ui`. Formatar dinheiro numa
celula de tabela nao e assunto de grafico.

## 0.4.0

O 0.3.0 traduziu os nomes publicos e deixou uma sobra: o tipo virou
`WizardState`, mas os campos dele continuaram em portugues. Quem chamava
`useWizard()` escrevia `wizard.passo` e `wizard.avancar()` dentro de um tipo
com nome ingles. Fechado agora, pelo mesmo motivo de antes, e de novo sem
alias.

### `useWizard()`

| Antes | Agora |
|---|---|
| `passo` | `step` |
| `atual` | `current` |
| `primeiro` | `isFirst` |
| `ultimo` | `isLast` |
| `avancar` | `next` |
| `voltar` | `back` |
| `irPara` | `goTo` |

### Telas estreitas

`useNarrowScreen()` passa a se chamar `useMobile()`, e o `useSidebar()` devolve
`isMobile` no lugar de `narrow`. O tipo `SidebarState` agora e exportado.

O nome antigo descrevia a medida; o novo descreve a pergunta que se faz. E a
barra ja resolvia o celular sozinha sem deixar a aplicacao ler a mesma
resposta, que e como as duas metades da tela acabam discordando sobre o que e
celular.

### Tokens e atributos

| Antes | Agora |
|---|---|
| `--rc-ease-folha` | `--rc-ease-sheet` |
| `--rc-duration-folha` | `--rc-duration-sheet` |
| `--rc-sidebar-icone` | `--rc-sidebar-icon` |
| `data-encolhida` | `data-collapsed` |
| `data-lado` | `data-side` |
| `data-orientacao` | `data-orientation` |
| `data-rc-sidebar="aberta\|fechada"` | `"open"\|"closed"` |

Quem estilizava a barra por `data-[encolhida]` precisa trocar o seletor.

### Correcoes

A barra lateral guardava um estado so para dois contextos diferentes, e no
celular abria sozinha ao carregar, tapando a tela. Agora a folha comeca
fechada e se fecha ao escolher um item.

Na `DataTable`, clicar num botao dentro da linha subia ate a linha: abrir o
menu de acoes trazia junto a folha de detalhes. A linha passa a ignorar
cliques que nasceram em algo interativo.

Cinco componentes prometiam `truncate` sem `min-w-0`, o que impede o item flex
de encolher: em vez de cortar o texto, ele empurrava o container para fora da
tela.

### Por dentro

Os nomes internos passaram para ingles tambem, e quatro modulos foram
renomeados (`lib/mascara`, `lib/tela`, `lib/data`, `form/adaptadores`). Nada
disso e importado direto por quem usa o pacote: as entradas publicas continuam
`@rivocode/ui`, `/form` e `/chart`.

## 0.3.0

Todo nome publico passa a ser ingles. E quebra, e vale a pena agora: o pacote
saiu no npm ha poucas horas, entao renomear custa uma versao. Daqui a algumas
semanas custaria um guia de migracao e a paciencia de quem ja usava. Sem alias
de compatibilidade, de proposito: alias e divida que ninguem cobra e ninguem
remove.

A regra e a mesma do resto do projeto: codigo em ingles, conteudo em PT-BR.

### Tipos

| Antes | Agora |
|---|---|
| `Coluna` | `Column` |
| `Passo` | `Step` |
| `EstadoDoAssistente` | `WizardState` |
| `Migalha` | `Crumb` |
| `No` | `TreeNode` |
| `Mascara` | `Mask` |
| `NomeDeMolde` | `MaskName` |
| `MovimentoDoGrafico` | `ChartMotion` |

### Funcoes e constantes

| Antes | Agora |
|---|---|
| `formatarData` | `formatDate` |
| `lerData` | `parseDate` |
| `mascararData` | `maskDate` |
| `aplicarMascara` | `applyMask` |
| `aplicarMoeda` | `applyCurrencyMask` |
| `aplicarMolde` | `applyPattern` |
| `emCentavos` | `toCents` |
| `semMascara` | `unmask` |
| `moldeDeTelefone` | `phoneMask` |
| `MOLDES` | `MASKS` |
| `folhasDe` | `leavesOf` |
| `nomeDeTecla` | `keyName` |
| `useTelaEstreita` | `useNarrowScreen` |

### Adaptadores de formulario

| Antes | Agora |
|---|---|
| `paraDatePicker` | `forDatePicker` |
| `paraSelect` | `forSelect` |
| `paraCheckbox` | `forCheckbox` |

### Como migrar

Busca e troca por palavra inteira resolve. Cuidado so com `No`, que e curto
demais para trocar as cegas: procure por `type No`, `No[]`, `: No` e `<No>`.

## 0.2.0

Primeira versao no npm publico, sob licenca MIT. O `0.1.0` saiu so no GitHub
Packages e tem API diferente desta: **nao troque um pelo outro sem ler o que
mudou de nome.**

### Quebra

Nomes que estavam em portugues no codigo passaram para ingles. O conteudo que a
pessoa le continua em PT-BR.

- `@rivocode/ui/chart`: `moeda`, `moedaCurta`, `curto`, `inteiro`,
  `porcentagem`, `mesCurto`, `diaEMes` e `formatadores` viraram `currency`,
  `currencyShort`, `compact`, `integer`, `percent`, `monthShort`, `dayMonth` e
  `formatters`. Os tipos `Formato` e `NomeDeFormato` viraram `Format` e
  `FormatName`.
- `useSidebar()` devolve `{ open, collapsed, narrow, toggle, close }`, e nao
  mais `{ aberta, encolhida, estreita, alternar, fechar }`.

### Novo

- `Kbd`, `ButtonGroup`, `AspectRatio` e `Command`, a paleta de comandos com
  busca sem acento e sem caixa.
- Na `Sidebar`: `SidebarBrand`, `SidebarInput`, `SidebarMenuSub`,
  `SidebarSeparator`, `SidebarMenuAction`, `SidebarMenuSkeleton`,
  `SidebarRail`, e `side="right"`. Encolhida, o submenu vira menu ao lado em
  vez de sumir.
- Em `@rivocode/ui/chart`: `ChartDonut` com o total no meio, `Sparkline`,
  `ChartXAxis` e `ChartYAxis` com o padrao ja certo, `useSeriesToggle` para a
  legenda esconder serie, e estados de consulta no `ChartContainer`.
- `TabList` ganha `variant="segmented"`, para trocar a forma de ver a mesma
  coisa em vez de dividir a pagina.
- `Checkbox`, `Radio` e `Switch` aceitam o texto como filho e se embrulham num
  `<label>`. Antes o filho sumia em silencio.

### Correcao

- O preset passa a pintar o fundo pelo tema. Ate aqui o `data-rc-theme` so
  definia os tokens, entao a pagina ficava no cinza padrao do navegador.
- `Combobox`: o painel vazio deixou de reservar 48px em todo painel.
- `Slider` de intervalo desenha os dois pontos. Antes o limite de cima nao
  existia.
- `Steps`: o conector encolhe em vez de truncar o rotulo.

## 0.1.0

Primeira versao, no GitHub Packages.
