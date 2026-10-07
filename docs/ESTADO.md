# Onde paramos

Retrato do repositorio. Ha dois tipos de numero aqui, e a diferenca importa:

- **Entre `<!-- gerado: ... -->` e `<!-- /gerado -->`**, o numero sai das
  guardas: `bun run gen:estado` roda cada uma e escreve o que ela mediu, e
  `check:estado`, no gate, fica vermelho quando o comitado diverge. Nao se
  edita a mao - a proxima corrida desfaz.
- **Fora dos marcadores**, o texto e a mao e leva a data: decisao, historia, e
  o que precisa de rede (versao no npm, tag do `origin`, segredo do GitHub). A
  ultima medida a mao foi em **07/10/2026**, e a secao **Como conferir o que
  e a mao** diz o comando de cada um.

Este arquivo e o ESTADO: o que existe, o que falta de verdade, o que espera uma
pessoa. A REGRA mora em `CLAUDE.md`; o contrato de quem consome, em
`.design-sync/conventions.md` e em `.claude/skills/rivocode-ui/SKILL.md`. A
historia - por que cada coisa ficou como esta - mora no `git log` e nos tres
CHANGELOGs, e nao e repetida aqui.

## Os pacotes

<!-- gerado: packages -->
| Pacote                | Onde      | Manifesto |
| --------------------- | --------- | --------- |
| `@rivocode/ui`        | `src/`    | 1.2.2     |
| `@rivocode/ui-native` | `native/` | 1.1.1     |
| `@rivocode/ui-mcp`    | `mcp/`    | 0.9.3     |
<!-- /gerado -->

No npm e no `origin`, medido a mao em 07/10:

| Pacote                | No npm em 07/10            | Tag             |
| --------------------- | -------------------------- | --------------- |
| `@rivocode/ui`        | **1.2.2**, com procedencia | `v1.2.2`        |
| `@rivocode/ui-native` | **1.1.0**, com procedencia | `native-v1.1.0` |
| `@rivocode/ui-mcp`    | **0.9.2**, com procedencia | `mcp-v0.9.2`    |

O site `ds.rivocode.com.br` sai de `apps/docs/` a cada push na `main`
(`docs.yml`), e esta em dia com `eeace31`. O `origin` tem 59 tags; `gh release
list` continua vazio, porque tag nao vira release no GitHub e isso nunca foi
automatizado.

**A 0.14.0 do nativo saiu na segunda tentativa.** A primeira morreu no
`npm publish` com `ENEEDAUTH`: a publicacao confiavel do `@rivocode/ui-native`
estava configurada errada no npmjs.com, e o ensaio verde nao pegaria isso,
porque o `--dry-run` nao autentica. Corrigida a configuracao, a mesma tag
publicou por `gh workflow run release-native --field tag=native-v0.14.0`: a
versao nao tinha queimado.

### Publicacao confiavel, desde 25/09

Os tres workflows de release publicam pela publicacao confiavel do npm (OIDC),
sem `NPM_TOKEN` e sem `registry-url`: nenhum token e escrito em `.npmrc`. Cada
um instala o npm mais novo (a publicacao confiavel exige 11.5.1 ou mais) e
falha cedo se o token OIDC nao estiver la. `--provenance` e `id-token: write`
andam juntos, e o `--dry-run` nao exercita nenhum dos dois.

Os tres pacotes ja publicaram por esse caminho, assinados: o web desde a
0.18.1, o nativo desde a 0.14.0 e o mcp desde a 0.7.0. O segredo `NPM_TOKEN`
saiu do repositorio em 07/10 (`gh secret list`); falta o dono revogar o token
no npmjs.com.

Versoes sem procedencia, e assim ficam porque publicacao nao se desfaz: ate
`v0.8.0` e `native-v0.3.1`, quando o repositorio era privado.

## O catalogo

<!-- gerado: catalog -->
**134 pecas** e **222 documentos** em `.design-sync/docs/`. A diferenca sao as **88 partes**.

| Familia      | Qtd | Pecas                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------ | --: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulario   |  37 | Autocomplete, Calendar, Checkbox, CheckboxGroup, ColorPicker, Combobox, CurrencyInput, DatePicker, DateRangePicker, Editable, Field, Fieldset, FileUpload, Form, Input, InputGroup, MaskedInput, NumberField, OTPField, PasswordInput, PostalCodeField, Questionnaire, RadioGroup, Rating, RichTextEditor, SearchInput, Select, SignaturePad, Slider, Switch, TagsInput, Textarea, TimeField, TimePicker, TransferList, Tree, TreeSelect |
| Estrutura    |  25 | Accordion, Affix, AppShell, AspectRatio, Avatar, Card, Carousel, Collapsible, Container, DataTable, DescriptionList, FilterBar, FilterChip, Grid, Item, PageHeader, ResizablePanelGroup, ScrollArea, Separator, Splitter, Spoiler, Stack, Stat, Table, VirtualList                                                                                                                                                                       |
| Feedback     |  14 | Alert, Badge, Banner, CookieConsent, EmptyState, Indicator, Kbd, Meter, NotificationCenter, Progress, QueryBoundary, Skeleton, Spinner, ToastViewport                                                                                                                                                                                                                                                                                    |
| Dados        |  10 | Code, EventCalendar, Gantt, Kanban, PixCode, QRCode, RelativeTime, SortableList, Timeline, Tracker                                                                                                                                                                                                                                                                                                                                       |
| Navegacao    |  10 | Breadcrumb, Command, Menu, Menubar, NavigationMenu, Pagination, Sidebar, Steps, TableOfContents, Tabs                                                                                                                                                                                                                                                                                                                                    |
| Sobreposicao |  10 | AlertDialog, ContextMenu, Dialog, ImageViewer, Popconfirm, Popover, PreviewCard, Sheet, Tooltip, Tour                                                                                                                                                                                                                                                                                                                                    |
| Acoes        |   9 | ActionBar, Button, ButtonGroup, Clipboard, IconButton, ScrollToTop, Toggle, ToggleGroup, Toolbar                                                                                                                                                                                                                                                                                                                                         |
| Grafico      |   8 | ChartContainer, ChartDonut, ChartFunnel, ChartGauge, ChartHeatmap, ChartRadial, ChartTreemap, Sparkline                                                                                                                                                                                                                                                                                                                                  |
| IA           |   5 | AILabel, Conversation, Message, PromptInput, ToolCall                                                                                                                                                                                                                                                                                                                                                                                    |
| Tipografia   |   5 | Heading, Highlight, Link, RichTextView, Text                                                                                                                                                                                                                                                                                                                                                                                             |
| Fundacao     |   1 | RivoProvider                                                                                                                                                                                                                                                                                                                                                                                                                             |
<!-- /gerado -->

Parte e o que so existe dentro de outra peca - `CardHeader`, `DialogFooter`,
`SelectItem` - e mora na pagina dela com ancora propria. Parte nao e peca; quem
conta arquivo como catalogo abre `CardTitle.md` como se fosse componente. A
regra esta em `apps/docs/src/parts.ts` (`findParent`).

A familia sai do `category` de cada documento; o site a escreve com acento, e
esta tabela sem.

### Subcaminhos

Regra dos dois pacotes: **um subcaminho por peer, e nao um por assunto** - o
peer e quem cobra a instalacao, entao e ele que decide a porta. A excecao e o
`/ai`, que nao tem peer e existe pelo peso.

| Web                   | Peer opcional                        | O que exporta                                                                            |
| --------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `@rivocode/ui/chart`  | `recharts`                           | `ChartContainer` e eixos, dica, gradiente, as seis formas, `Sparkline`, `useChartMotion` |
| `@rivocode/ui/form`   | `react-hook-form`, `zod`, resolvers  | `Form`, `FormField`, `useZodForm`                                                        |
| `@rivocode/ui/ai`     | nenhum                               | `AILabel`, `Conversation`, `Message`, `PromptInput`, `ToolCall`                          |
| `@rivocode/ui/dnd`    | `@dnd-kit/core`, `@dnd-kit/sortable` | `SortableList`, `Kanban`                                                                 |
| `@rivocode/ui/editor` | `@tiptap/*` (Tiptap 3)               | `RichTextEditor`, `RichTextView` (este nao importa o Tiptap)                             |

Alem deles o web exporta `./styles.css`, `./fonts.css`, `./preset` e
`./tokens/*`, e o binario `rivocode-ui` (`check-theme` e `tokens`, que escreve
JSON DTCG 2025.10). O nativo exporta `./form`, `./chart`, `./clipboard`,
`./file-upload`, `./ai`, `./dnd`, `./tokens`, `./contrast` e `./theme.css`, e
tres binarios: `rivocode-ui-native-css`, `-theme` e `-init`.

<!-- gerado: frontiers -->
`check:chart` guarda **11 fronteiras** de subcaminho, nos dois pacotes, e `check:contrato` cobra que todo export de subcaminho esteja no `conventions.md` E na skill.
<!-- /gerado -->

## O React Native

<!-- gerado: native -->
Das 134 pecas: **104 traduzem** com o mesmo nome, **4 viram** outra (`ContextMenu` -> `Menu`, `DataTable` -> `DataList`, `Popconfirm` -> `AlertDialog`, `ToastViewport` -> `useToast`), **26 nao portam** por decisao escrita, e **0 estao na fila**. `FILA_DECLARADA` tem 0 entradas.

As 26 que nao portam, com a nota de cada uma em `scripts/paridade-nativo.ts`:

| Peca                | Por que nao                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Affix               | a plataforma ja da: um irmao da `ScrollView` com `position: absolute` nao rola com ela, e o que gruda ao rolar e o `stickyHeaderIndices` da lista                                                                   |
| AppShell            | o esqueleto do app no celular e o router: tab bar, drawer e a barra de titulo da pilha                                                                                                                              |
| Breadcrumb          | o caminho de volta e o botao de voltar do router                                                                                                                                                                    |
| ButtonGroup         | `Tabs` e `ToggleGroup` cobrem o caso; botao encostado em botao vira um alvo so no dedo                                                                                                                              |
| Command             | paleta de comandos e gesto de mesa: um campo, uma lista e o teclado                                                                                                                                                 |
| Container           | o celular ja e mais estreito que o menor passo; o respiro lateral e o padding da tela, dentro da area segura                                                                                                        |
| CookieConsent       | app nao tem cookie; o consentimento de rastreio no celular e o aviso da plataforma, o App Tracking Transparency no iOS                                                                                              |
| EventCalendar       | grade de tempo e idioma de mesa; no telefone a resposta e a lista, e o mes e o `Calendar`                                                                                                                           |
| Gantt               | cronograma e idioma de mesa; no telefone a tarefa por dia e lista, e o prazo e o `Calendar`                                                                                                                         |
| Kanban              | o quadro e idioma de mesa: a 390px cabe uma coluna, e levar o cartao a outra e um menu "Mover para", e nao um arrasto                                                                                               |
| Kbd                 | nao ha teclado para desenhar                                                                                                                                                                                        |
| Menubar             | idioma de mesa; navegacao nativa e tab bar e drawer do router                                                                                                                                                       |
| NavigationMenu      | idioma de mesa; navegacao nativa e tab bar e drawer do router                                                                                                                                                       |
| Pagination          | lista de celular rola; escolher o numero da pagina e gesto de mesa                                                                                                                                                  |
| Popover             | painel ancorado que o proprio dedo cobre: use `Sheet`                                                                                                                                                               |
| PreviewCard         | aparece ao pousar o ponteiro, e nao ha pousar no toque                                                                                                                                                              |
| ResizablePanelGroup | painel que se arrasta para dividir a largura e idioma de mesa; no celular cada area e uma tela do router, ou uma folha por cima                                                                                     |
| RichTextEditor      | editar texto formatado no toque e outro motor (WebView ou biblioteca nativa, com peer de modulo nativo) e a barra e superficie de mesa; o celular escreve com `Textarea` e le o que o web salvou com `RichTextView` |
| ScrollToTop         | a plataforma ja da: o toque na barra de status no iOS e o toque de novo na aba do router sobem a lista                                                                                                              |
| Sidebar             | idioma de mesa; navegacao nativa e tab bar e drawer do router                                                                                                                                                       |
| Splitter            | duas areas lado a lado nao cabem em tela estreita; no celular a lista e o detalhe sao duas telas do router                                                                                                          |
| Table               | nao ha tabela no celular; a consulta vira `DataList`                                                                                                                                                                |
| TableOfContents     | tela de app nao tem indice lateral: texto longo no celular vira secoes numa lista que abre cada uma, ou `Tabs`                                                                                                      |
| Toolbar             | superficie de edicao de mesa: uma parada de tabulacao e navegacao por seta, que o toque nao tem                                                                                                                     |
| Tooltip             | hover nao existe no toque; o rotulo precisa estar na tela                                                                                                                                                           |
| VirtualList         | a plataforma ja virtualiza: `FlatList` e `FlashList` fazem isto de fabrica                                                                                                                                          |
<!-- /gerado -->

O acordo e que a fila continue vazia: peca web nova nasce nos dois pacotes no
mesmo dia, ou nasce com `nao` e o motivo.

**Nome igual nao e API igual.** No nativo tudo e controlado (sem
`defaultValue`) e a lista vem por `items`, nao por composicao. O que se
reaproveita e o vocabulario de classes, o token e a escolha da peca; o JSX se
reescreve.

<!-- gerado: signature -->
`check:assinatura` confere **195 divergencias de assinatura em 88 pecas** contra os dois catalogos de props - o do nativo, `apps/docs/src/native-props.json` (118 pecas, 870 props), e artefato comitado.
<!-- /gerado -->

O catalogo do nativo e comitado porque gerar exige `examples/native`
instalado; `check:props:nativo` o mantem em dia no job `nativo` da CI, ao lado
do `check:native:types`.

Codigo puro atravessa por `src/shared/` e `src/hooks/common/`, e
`check:compartilhado` cobra que o espelho nao tenha global nem import de
plataforma:

<!-- gerado: shared -->
**43 arquivos** espelhados de `src/shared/` e `src/hooks/common/` em `native/`, e 16 copias declaradas.
<!-- /gerado -->

## O gate

<!-- gerado: gate -->
`bun run check` sao **39 passos** - 38 verificacoes mais `bun test` -, em sequencia, parando no primeiro que falhar.

A suite: **3384 testes em 249 arquivos**, a mesma conta que a home exibe (`TESTS` em `apps/docs/src/pages/home.tsx`, cobrado por `check:testes`).

| Guarda                  | O que ela mede                                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check:props`           | 308 entradas (pecas e partes), 4419 props; prop propria que colide com atributo herdado reprova                                                           |
| `check:colors`          | 196 arquivos sem cor literal fora de `src/tokens/`                                                                                                        |
| `check:opacidade`       | 4 usos de opacidade parcial, todos declarados, 2 medidas de alfa                                                                                          |
| `check:contrast`        | 142 pares por tema, nos 2 temas, mais 14 de `scales.css`                                                                                                  |
| `check:contrast:nativo` | por esquema: 64 de texto, 47 de 1.4.11, 1 de camada, 16 sobre tinta de serie, 3 do marcado; 7 papeis sem par                                              |
| `check:native:contrast` | espelho `native/scripts/contrast.mjs` em dia, 281 linhas medidas iguais                                                                                   |
| `check:temas`           | 90 tokens de tema e forma, 55 papeis obrigatorios                                                                                                         |
| `check:doc`             | 222 paginas, todas com codigo                                                                                                                             |
| `check:exemplos`        | nomes dos blocos `tsx` contra 806 nomes publicados por 14 entradas                                                                                        |
| `check:readme`          | 134 de 134 pecas citadas, nenhuma declarada fora                                                                                                          |
| `check:classes`         | 385 arquivos, toda classe gera regra, sem lista de excecao                                                                                                |
| `check:grupos`          | 8 grupos declarados, cada um consumido e cada consumo declarado; declaracao sem consumo reprova                                                           |
| `check:cli`             | 4 arquivos de mesa (`contrast`, `theme-check`, `dtcg`, `theme-roles`) fora do grafo da biblioteca                                                         |
| `check:tamanho`         | raiz 152,1 de 156,2 KB gzip; 5 pecas sozinhas com as dependencias, a maior `EventCalendar` 122,4 de 128,6 KB; todas as entradas entre 90% e 98% do limite |
| `check:skill`           | 142 props citadas nos exemplos da skill, todas existentes; `reference/native.md` contra a tabela do nativo                                                |
| `check:lista-skill`     | 13 arquivos de referencia, no indice e no laco `curl` do site                                                                                             |
| `check:tema:nativo`     | 8 sementes, 37 derivados, 45 no `@theme`                                                                                                                  |
| `check:paridade`        | 134 pecas: a tabela e as paginas dizem o mesmo                                                                                                            |
| `check:pecas`           | 134, igual ao README, ao `package.json` e a meta do site                                                                                                  |
| `check:demo`            | 133 de 134 na vitrine, 1 declarada fora (`ToastViewport`), em 21 paginas                                                                                  |
| `check:retratos`        | 12 retratos de secao sobre 6 areas, 23256 quadrados, 91 marcadores no demo                                                                                |
| `check:receita`         | 7 arquivos, 9 diretivas de CSS, 5 peers, e nenhum Babel nos dois                                                                                          |

As entradas mais perto do teto do `check:tamanho`: `./editor` em 98%, `.` em 97%, `./chart` em 95%.
<!-- /gerado -->

Em 07/10 o gate saiu verde, e a suite fez 25325 `expect` - numero que nenhuma
guarda mede, e por isso fica a mao. Todas as entradas do `check:tamanho` andam
perto do teto: a proxima peca que crescer o pacote sobe o limite no mesmo
commit, com o motivo no `why` de `scripts/orcamento-de-tamanho.ts`.

### Fora do gate: `a11y`, `shot`, `visual` e a bancada

Os tres precisam do Chrome e ficam fora do `check`.

<!-- gerado: shots -->
`bun run shot` tira **56 retratos** - 44 de vitrine e 12 de secao, as entradas de `demo/assinaturas.json`.
<!-- /gerado -->

`bun run visual` compara com as assinaturas e recusa
retrato que nao seja do build atual (marca `rc-build` no PNG); `bun run a11y`
roda o axe-core, o foco que sobrevive a acao, o alvo de 24px e o reflow a
320px.

Na CI os tres rodam pela **bancada** (`.github/workflows/bancada.yml`), em PR e
push na `main`, de forma DIFERENCIAL: base e cabeca no mesmo runner, julgadas
por `scripts/comparacao-da-bancada.ts`. Ela reprova problema de acessibilidade
que a base nao tinha e retrato que mudou sem a assinatura mudar junto; a
etiqueta `retrato-aceito` e a valvula para diferenca que so existe no linux.

**A bancada e diferencial, e isso tem um custo.** Ela saiu vermelha em
`d3d619a`: o `233193e`, empurrado junto, criou o conteiner dos portais no
primeiro render, e `flutuantes` e `flutuantes-celular` mudaram sem a assinatura
mudar junto. O commit seguinte, `eeace31`, saiu verde porque comparou contra
`d3d619a`, que ja tinha a mudanca - e a assinatura comitada ficou velha na
`main` por seis dias. Em 07/10 o retrato foi olhado contra o da base (antes, a
pagina saia rolada ~290px pelo portal tardio; agora comeca no topo) e aceito.
Vermelho na bancada da `main` nao some no commit seguinte: aceita-se ou
conserta-se. O retrato agora sai igual duas vezes seguidas, no mac e no linux:
provado com o Chrome 154 em tres corridas num ubuntu 24.04 e duas no mac, os
56 PNG iguais pixel a pixel. As quatro causas que o `shot.ts` passou a
controlar, e que valem para quem mexer nele:

- **Ladrilho sem pintar.** O `--screenshot` do Chrome sem janela fotografa
  antes de rasterizar a pagina alta. O `shot.ts` dirige o Chrome pelo protocolo
  de depuracao (`launchChrome`, em `scripts/retratos.ts`, o mesmo do `a11y`),
  captura em faixas de 2048px e costura o PNG.
- **Fonte chegando depois da medida.** `demo/secao.html` espera o
  `document.fonts.ready` da pagina de dentro, remede quando ela muda de
  tamanho, e so entao marca `data-rc-ready`.
- **Ordem de foco decidida por relogio.** Clique agendado que depende de outro
  espera por ele, e documento com mais de uma moldura modal disputando o foco
  sai sem foco nenhum.
- **Relogio, fuso e idioma.** A captura congela o `Date` em 15/10/2026 13:00
  UTC, fixa `America/Sao_Paulo` e `pt-BR`, e liga a emulacao de foco.

A captura so acontece quando a pagina parou (fontes carregadas, animacao finita
no fim e infinita no quadro zero, tres leituras seguidas iguais com piso de
1,5s); pagina que nao para em 20s derruba a corrida com o nome. O custo: o
`shot` ficou mais lento: 119s de relogio no mac em 25/09.

## As listas de divida declarada

Toda lista de excecao **so encolhe**: entrada que nao acusa mais e erro, e a
guarda manda apagar a linha.

<!-- gerado: debts -->
| Lista             | Guarda                  | Tamanho | Quem esta nela                                                                       |
| ----------------- | ----------------------- | ------: | ------------------------------------------------------------------------------------ |
| `DEBT`            | `check:comentarios`     |       0 | vazia                                                                                |
| `DEBT`            | `check:nomes`           |       0 | vazia                                                                                |
| `DEBT`            | `check:contrast:nativo` |       0 | vazia                                                                                |
| `FILA_DECLARADA`  | `check:paridade`        |       0 | vazia                                                                                |
| `OUT`             | `check:piso`            |       0 | vazia                                                                                |
| `OUT_OF_README`   | `check:readme`          |       0 | vazia                                                                                |
| `SEM_VITRINE`     | `check:demo`            |       1 | `ToastViewport`                                                                      |
| `DECLARADAS`      | `check:opacidade`       |       4 | `chart/chart-legend.tsx` (2), `components/button.tsx`, `components/color-picker.tsx` |
| `OUT`             | `check:scripts`         |       7 | `regressao-visual`, `shot`, `acessibilidade` e mais 4                                |
| `COPIA_DECLARADA` | `check:compartilhado`   |      16 | `useZodForm`, `nameFromConfig`, `leavesOf` e mais 13                                 |
<!-- /gerado -->

Fora do `check`, no `a11y`: `IGNORED_RULES` com 6 regras de layout de vitrine e
`IGNORED_NODES` com 2 nos de biblioteca. `check:classes` nasceu sem lista de
excecao e continua sem.

## O que esta pendente de verdade

### Esperando o dono

Nenhum destes tem codigo a escrever aqui.

1. **Revogar o token antigo no npmjs.com.** O segredo `NPM_TOKEN` ja saiu do
   GitHub em 07/10; o token em si continua valido no npm ate o dono revoga-lo.
2. **Testar no iPhone** o que teste e `react-native-web` nao alcancam: colar
   valor no `CurrencyInput`; meia estrela do `Rating`, inclusive em RTL; o
   `Tour` nativo; e o anuncio de limite do `PromptInput` com o VoiceOver, que
   pode ser cortado pela ultima letra digitada.
3. **Importar os tokens DTCG no Figma** (`rivocode-ui tokens --out <pasta>`).

### Divida de codigo, conferida contra a arvore

- **`QueryBoundary` nao trata dado velho enquanto revalida.** O limite esta
  escrito na pagina da peca ("O que ela nao trata"), com o contorno por
  `isFetching`; o comportamento continua o mesmo.

- **A receita do nativo esta consertada na arvore, e nao no npm.** Em 07/10 a
  receita, seguida num Expo recem-criado com npm (SDK 57,
  `@rivocode/ui-native` 1.1.0), nao chegava ao fim, e o proprio
  `examples/native` nao fechava o bundle de iOS. Eram dois defeitos de versao:
  o `nativewind@preview` pede `react-native-css@3.1.0-rc.0` exato e o pacote
  sem tag instala a 3.0.7 (o npm morre em `ERESOLVE`; o bun do exemplo nao
  barra peer, e um patch local escondia a diferenca), e o compilador do
  `react-native-css` quebra com `lightningcss` 1.31 ou mais novo ("Specifier,
  found ()"). A doc passou a pedir `react-native-css@rc`, o init fixa o
  `lightningcss` em 1.30.1 e confere o motor contra o que o NativeWind pede, o
  exemplo saiu do patch, e o `check:receita` le o `bun.lock`. Medido de ponta
  a ponta com o pacote empacotado: `tsc`, export de iOS (4,5 MB) e de web. Quem
  instala do npm recebe isso na 1.1.1, que o manifesto ja diz e o `tag.yml`
  publica quando o branch entrar na `main`.

### O que nao foi medido

- As pecas nativas em aparelho de verdade, alem dos itens do iPhone acima.
- O aparelho de verdade com o app do zero: em 07/10 a receita foi seguida num
  Expo recem-criado (SDK 57, npm), e o resultado esta na divida acima.
- A landing (repo `rivocode.com`): nao esta nesta maquina nem na organizacao do
  GitHub visivel daqui. A ultima medida era `^0.7.0`.
- O sync com o claude.ai/design, parado desde 24/08 (`.design-sync/NOTES.md`).

## Decisoes que continuam valendo

- **Mobile primeiro.** Decidir 390px antes do desktop: painel flutuante nao
  encosta na borda, calendario cai para um mes, dialogo vira folha de baixo,
  tabela rola dentro da propria moldura.
- **Um subcaminho por peer**, nos dois pacotes.
- **Cor literal so em `src/tokens/`**, e contraste medido, nao estimado. Cor que
  a conta nao sabe ler reprova.
- **Ferramenta de mesa nao viaja no bundle.** Contraste, `theme-check`, DTCG e
  catalogo de papeis vao em `dist/cli.js`; `check:cli` le o grafo de imports.
- **TanStack Table e motor interno** do `DataTable`; nenhum tipo de terceiro
  vaza para a assinatura publica. **React Query fica de fora**: e arquitetura de
  aplicacao. **Receitas de tela inteira** tambem.
- **No nativo, densidade nao existe** (o controle cairia abaixo de 44pt) e cor
  de classe so muda em build: dois temas por build, no maximo, por
  `light-dark()`.
- **A tag nasce por maquina; o numero da versao e o CHANGELOG, nao.** O
  `tag.yml` so cria tag com as quatro guardas de `decideRelease` verdes, e
  `[no-release]` no ASSUNTO do commit segura os tres pacotes.
- **Guarda so vale se morde.** Varredura declara piso (`scanAtLeast`), classe se
  compara por token (`split(" ")`), e guarda nova so conta depois de ficar
  vermelha na sua frente.
- **Arvore compartilhada: sem `git stash`, `git checkout --` nem `git reset
--hard`** enquanto houver mais de uma frente escrevendo. Versao antiga se le
  com `git show HEAD:<arquivo>`.
- **Relato de agente nao e medida.** Numero se confere com o comando.

## Como retomar

```sh
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun install                  # na raiz, nunca dentro de native/
bun run check                # o gate inteiro, termina no bun test
bun run build                # ha quebra que so aparece ao empacotar; constroi o mcp/dist
bun run fumaca:mcp           # o servidor MCP pelo stdio
bun run shot && bun run visual   # os retratos contra as assinaturas (~2 min)
bun run a11y                 # axe, foco, alvo e reflow na vitrine
cd apps/docs && bun run dev  # o site, local
```

Para ver a decisao de tag sem criar nada: `gh workflow run tag`. Para
atravessar um release sem publicar: `gh workflow run release --field
ensaio=true` (idem `release-native` e `release-mcp`).

## Como conferir o que e a mao

Os numeros dos blocos gerados se conferem com `bun run check:estado`, e se
reescrevem com `bun run gen:estado`. O que fica abaixo e o que precisa de rede
ou de olho, com o valor de 07/10:

```sh
npm view @rivocode/ui version                       # 1.2.2
npm view @rivocode/ui-native version                # 1.1.0
npm view @rivocode/ui-mcp version                   # 0.9.2
curl -s https://registry.npmjs.org/-/npm/v1/attestations/@rivocode/ui@0.18.1 | head -c 80   # assinada
gh run list --workflow=release-native --limit 3     # native-v0.14.0: failure (ENEEDAUTH), depois success
gh secret list                                      # so os tres da Vercel: o NPM_TOKEN saiu em 07/10
grep -rn NPM_TOKEN .github/workflows                # nada: nenhum workflow o le
git ls-remote --tags origin | grep -vc '\^{}'       # 59 tags
gh run list --workflow=bancada --limit 5            # eeace31 verde; d3d619a vermelha (dois retratos de flutuantes)
node -e 'j=require("./apps/docs/src/component-props.json");console.log(j.Clipboard.props.some(p=>p.name==="value"))'   # false: a divida das props
```
