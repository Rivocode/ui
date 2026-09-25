# Onde paramos

Retrato do repositorio em **25/09/2026**, reescrito do zero. Todo numero daqui
foi medido nesta arvore, nesse dia, e a secao **Como conferir cada numero** diz
o comando de cada um: quem chegar depois mede de novo em vez de acreditar.

Este arquivo e o ESTADO: o que existe, o que falta de verdade, o que espera uma
pessoa. A REGRA mora em `CLAUDE.md`; o contrato de quem consome, em
`.design-sync/conventions.md` e em `.claude/skills/rivocode-ui/SKILL.md`. A
historia - por que cada coisa ficou como esta - mora no `git log` e nos tres
CHANGELOGs, e nao e repetida aqui.

## Os pacotes

| Pacote                | Onde      | Manifesto | No npm em 25/09                    | Tag              |
| --------------------- | --------- | --------- | ---------------------------------- | ---------------- |
| `@rivocode/ui`        | `src/`    | 0.18.1    | **0.18.1**, com procedencia        | `v0.18.1`        |
| `@rivocode/ui-native` | `native/` | 0.14.0    | **0.14.0**, com procedencia        | `native-v0.14.0` |
| `@rivocode/ui-mcp`    | `mcp/`    | 0.3.0     | 0.3.0                              | `mcp-v0.3.0`     |

O site `ds.rivocode.com.br` sai de `apps/docs/` a cada push na `main`
(`docs.yml`), e esta em dia com `c3fa570`. O `origin` tem 36 tags; `gh release
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

A 0.18.1 do web e a 0.14.0 do nativo sairam por esse caminho, assinadas. O
`@rivocode/ui-mcp` ainda nao publicou por ele: so a proxima versao dele prova a
configuracao do publicador confiavel dele. O segredo `NPM_TOKEN` **continua cadastrado** no
repositorio (`gh secret list`, criado em 04/09) e nenhum workflow o le mais:
ele deve ser apagado no GitHub e revogado no npm pelo dono.

Versoes sem procedencia, e assim ficam porque publicacao nao se desfaz: ate
`v0.8.0` e `native-v0.3.1`, quando o repositorio era privado.

## O catalogo

**134 pecas** e **222 documentos** em `.design-sync/docs/`. A diferenca sao as
**88 partes**: `CardHeader`, `DialogFooter`, `SelectItem` so existem dentro de
outra peca, e moram na pagina dela com ancora propria. Parte nao e peca; quem
conta arquivo como catalogo abre `CardTitle.md` como se fosse componente. A
regra esta em `apps/docs/src/parts.ts` (`findParent`).

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
| Tipografia   |   5 | Heading, Highlight, Link, RichTextView, Text                                                                                                                                                                                                                                                                                                                                                                                             |
| IA           |   5 | AILabel, Conversation, Message, PromptInput, ToolCall                                                                                                                                                                                                                                                                                                                                                                                    |
| Fundacao     |   1 | RivoProvider                                                                                                                                                                                                                                                                                                                                                                                                                             |

A familia sai do `category` de cada documento, e o site a escreve com acento.

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
tres binarios: `rivocode-ui-native-css`, `-theme` e `-init`. `check:chart`
guarda as fronteiras (onze, nos dois pacotes) e `check:contrato` cobra que todo
export de subcaminho esteja no `conventions.md` E na skill.

## O React Native

Das 134 pecas: **103 traduzem** com o mesmo nome, **5 viram** outra
(`Autocomplete` -> `Combobox`, `DataTable` -> `DataList`, `ToastViewport` ->
`useToast`, `Popconfirm` -> `AlertDialog`, `ContextMenu` -> `Menu`), **26 nao
portam** por decisao escrita, e **0 estao na fila**. `FILA_DECLARADA` esta
vazia e o acordo e que continue: peca web nova nasce nos dois pacotes no mesmo
dia, ou nasce com `nao` e o motivo.

As 26 que nao portam, com a nota de cada uma em `scripts/paridade-nativo.ts`:

| Peca                | Por que nao                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Affix               | a plataforma ja da: irmao absoluto da `ScrollView`, ou `stickyHeaderIndices`                     |
| AppShell            | o esqueleto do app no celular e o router: tab bar, drawer, barra da pilha                        |
| Breadcrumb          | o caminho de volta e o botao de voltar do router                                                 |
| ButtonGroup         | `Tabs` e `ToggleGroup` cobrem; botao encostado em botao vira um alvo so no dedo                  |
| Command             | paleta de comandos e gesto de mesa: campo, lista e teclado                                       |
| Container           | o celular ja e mais estreito que o menor passo; o respiro e o padding da tela                    |
| CookieConsent       | app nao tem cookie; o consentimento e o aviso da plataforma (ATT no iOS)                         |
| EventCalendar       | grade de tempo e idioma de mesa; no telefone e lista, e o mes e o `Calendar`                     |
| Gantt               | cronograma e idioma de mesa; tarefa por dia e lista, prazo e `Calendar`                          |
| Kanban              | a 390px cabe uma coluna; mover cartao e menu "Mover para", nao arrasto                           |
| Kbd                 | nao ha teclado para desenhar                                                                     |
| Menubar             | idioma de mesa; navegacao nativa e tab bar e drawer do router                                    |
| NavigationMenu      | idem                                                                                             |
| Pagination          | lista de celular rola; escolher numero de pagina e gesto de mesa                                 |
| Popover             | painel ancorado que o proprio dedo cobre: use `Sheet`                                            |
| PreviewCard         | aparece ao pousar o ponteiro, e nao ha pousar no toque                                           |
| ResizablePanelGroup | arrastar para dividir a largura e de mesa; no celular cada area e uma tela                       |
| RichTextEditor      | outro motor (WebView ou modulo nativo); o celular escreve com `Textarea` e le com `RichTextView` |
| ScrollToTop         | a plataforma ja da: toque na barra de status (iOS) e toque de novo na aba                        |
| Sidebar             | idioma de mesa; navegacao nativa e tab bar e drawer do router                                    |
| Splitter            | duas areas lado a lado nao cabem; lista e detalhe sao duas telas                                 |
| Table               | nao ha tabela no celular; a consulta vira `DataList`                                             |
| TableOfContents     | tela de app nao tem indice lateral: secoes numa lista, ou `Tabs`                                 |
| Toolbar             | superficie de edicao de mesa: parada de tabulacao e seta, que o toque nao tem                    |
| Tooltip             | hover nao existe no toque; o rotulo precisa estar na tela                                        |
| VirtualList         | a plataforma ja virtualiza: `FlatList` e `FlashList`                                             |

**Nome igual nao e API igual.** No nativo tudo e controlado (sem
`defaultValue`) e a lista vem por `items`, nao por composicao. O que se
reaproveita e o vocabulario de classes, o token e a escolha da peca; o JSX se
reescreve. `check:assinatura` confere **225 divergencias de assinatura em 91
pecas** contra os dois catalogos de props - o do nativo,
`apps/docs/src/native-props.json` (117 pecas, 763 props), e artefato comitado,
porque gerar exige `examples/native` instalado; `check:props:nativo` o mantem
em dia no job `nativo` da CI, ao lado do `check:native:types`.

Codigo puro atravessa por `src/shared/` e `src/hooks/common/`, espelhados em
`native/`: **38 arquivos**, com `check:compartilhado` cobrando que o espelho
nao tenha global nem import de plataforma, e 16 copias declaradas.

## O gate

`bun run check` sao **37 passos** - 36 verificacoes mais `bun test` -, em
sequencia, parando no primeiro que falhar. Bate com o `CLAUDE.md`. Em 25/09
saiu verde.

A suite: **2775 testes em 206 arquivos, 21778 `expect`**, 0 falhas. Do nativo
sao 743 testes em 62 arquivos; do web, 2032 em 144. A home do site exibe o
mesmo numero (`TESTS` em `apps/docs/src/pages/home.tsx`), e `check:testes`
falha se divergir.

| Guarda                  | O que ela diz em 25/09                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `check:props`           | 308 entradas (pecas e partes), 4368 props                                                                    |
| `check:colors`          | 188 arquivos sem cor literal fora de `src/tokens/`                                                           |
| `check:opacidade`       | 4 usos de opacidade parcial, todos declarados, 2 medidas de alfa                                             |
| `check:contrast`        | 138 pares por tema, nos dois temas, mais 14 de `scales.css`                                                  |
| `check:contrast:nativo` | por esquema: 60 de texto, 47 de 1.4.11, 1 de camada, 16 sobre tinta de serie, 3 do marcado; 7 papeis sem par |
| `check:native:contrast` | espelho `native/scripts/contrast.mjs` em dia, 273 linhas medidas iguais                                      |
| `check:temas`           | 90 tokens de tema e forma, 55 papeis obrigatorios                                                            |
| `check:doc`             | 222 paginas, todas com codigo                                                                                |
| `check:exemplos`        | nomes dos blocos `tsx` contra 752 nomes publicados por 14 entradas                                           |
| `check:readme`          | 97 de 134 pecas citadas, 37 declaradas fora                                                                  |
| `check:classes`         | 369 arquivos, toda classe gera regra, sem lista de excecao                                                   |
| `check:grupos`          | 8 seletores de grupo consumidos, todos declarados                                                            |
| `check:cli`             | 4 arquivos de mesa fora dos 205 arquivos que a biblioteca alcanca no `dist/`                                 |
| `check:tamanho`         | raiz 143,4 de 156,2 KB gzip; `Button` sozinho 12,2 de 13,6 KB; todas as entradas entre 90% e 98% do limite   |
| `check:skill`           | 115 props citadas nos exemplos da skill, todas existentes                                                    |
| `check:lista-skill`     | 13 arquivos de referencia, no indice e no laco `curl` do site                                                |
| `check:tema:nativo`     | 8 sementes, 37 derivados, 45 no `@theme`                                                                     |
| `check:paridade`        | 134 pecas: a tabela e as paginas dizem o mesmo                                                               |
| `check:pecas`           | 134, igual ao README, ao `package.json` e a meta do site                                                     |
| `check:demo`            | 131 de 134 na vitrine, 3 declaradas fora, em 21 paginas                                                      |
| `check:retratos`        | 12 retratos de secao sobre 6 areas, 23256 quadrados, 90 marcadores no demo                                   |
| `check:receita`         | 7 arquivos, 9 diretivas de CSS, 5 peers, e nenhum Babel nos dois                                             |

O `check:tamanho` esta perto do teto em todas as entradas (a `styles.css` em
98%): a proxima peca que crescer o pacote sobe o limite no mesmo commit, com o
motivo no `why` de `scripts/orcamento-de-tamanho.ts`.

### Fora do gate: `a11y`, `shot`, `visual` e a bancada

Os tres precisam do Chrome e ficam fora do `check`. `bun run shot` monta a
vitrine e tira **56 retratos** (44 de vitrine e 12 de secao, as entradas de
`demo/assinaturas.json`); `bun run visual` compara com as assinaturas e recusa
retrato que nao seja do build atual (marca `rc-build` no PNG); `bun run a11y`
roda o axe-core, o foco que sobrevive a acao, o alvo de 24px e o reflow a
320px.

Na CI os tres rodam pela **bancada** (`.github/workflows/bancada.yml`), em PR e
push na `main`, de forma DIFERENCIAL: base e cabeca no mesmo runner, julgadas
por `scripts/comparacao-da-bancada.ts`. Ela reprova problema de acessibilidade
que a base nao tinha e retrato que mudou sem a assinatura mudar junto; a
etiqueta `retrato-aceito` e a valvula para diferenca que so existe no linux.

**A bancada esta verde na `main` desde `946d594`**, a primeira corrida com a
captura deterministica, e de novo em `d5f98c2`; as corridas de antes saiam
vermelhas sem mudanca de tela. O retrato agora sai igual duas vezes seguidas, no mac e no linux:
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

| Lista             | Guarda                  | Tamanho | Quem esta nela                                                                                                                   |
| ----------------- | ----------------------- | ------: | -------------------------------------------------------------------------------------------------------------------------------- |
| `DEBT`            | `check:comentarios`     |       0 | vazia                                                                                                                            |
| `DEBT`            | `check:nomes`           |       0 | vazia                                                                                                                            |
| `DEBT`            | `check:contrast:nativo` |       0 | vazia                                                                                                                            |
| `FILA_DECLARADA`  | `check:paridade`        |       0 | vazia                                                                                                                            |
| `OUT_OF_SCOPE`    | `check:skill`           |       1 | `reference/native.md` - linha obsoleta, veja abaixo                                                                              |
| `OUT`             | `check:piso`            |       2 | `retratos`, `regressao-visual`                                                                                                   |
| `SEM_VITRINE`     | `check:demo`            |       3 | `ToastViewport`, `Autocomplete`, `Editable`                                                                                      |
| `DECLARADAS`      | `check:opacidade`       |       4 | legenda de grafico (2), `Button` carregando, `ColorPicker` desabilitado                                                          |
| `OUT`             | `check:scripts`         |       8 | `regressao-visual`, `shot`, `acessibilidade`, `serve`, `props-do-catalogo-nativo`, `build-preset`, `copy-fonts`, `fumaca-do-mcp` |
| `COPIA_DECLARADA` | `check:compartilhado`   |      16 | codigo que nao atravessa: `useZodForm`, `RivoContext`, `normalizeColor` e mais 13                                                |
| `OUT_OF_README`   | `check:readme`          |      37 | 37 pecas nao citadas no `README.md`, cada uma com o motivo                                                                       |

Fora do `check`, no `a11y`: `IGNORED_RULES` com 6 regras de layout de vitrine e
`IGNORED_NODES` com 2 nos de biblioteca. `check:classes` nasceu sem lista de
excecao e continua sem.

## O que esta pendente de verdade

### Esperando o dono

Nenhum destes tem codigo a escrever aqui.

1. **Conferir o publicador confiavel do `@rivocode/ui-mcp`** no npmjs.com
   (`Rivocode`, `ui`, `release-mcp.yml`, ambiente vazio): foi o erro do nativo,
   e so aparece no release de verdade.
2. **Apagar o segredo `NPM_TOKEN`** do GitHub e revogar o token no npm.
3. **Testar no iPhone** o que teste e `react-native-web` nao alcancam: colar
   valor no `CurrencyInput`; meia estrela do `Rating`, inclusive em RTL; o
   `Tour` nativo; e o anuncio de limite do `PromptInput` com o VoiceOver, que
   pode ser cortado pela ultima letra digitada.
4. **Importar os tokens DTCG no Figma** (`rivocode-ui tokens --out <pasta>`).

### Divida de codigo, conferida contra a arvore

- **`RichTextEditor` com `max={1}` diz "Limite de 1 caracteres atingido."**
  (`src/editor/rich-text-editor.tsx`, o rotulo padrao `limit`). Menor.
- **Oito props proprias somem da tabela publicada.** `Clipboard.value` (e e
  obrigatoria), `AccordionItem.title`, `TreeSelect.defaultValue`,
  `TimeField.name`, `Sidebar.title`, `TagsInput.max` e o `format` dos dois
  eixos. A causa esta em `scripts/props-do-catalogo.ts`: prop descartada quando
  `declarations[0]` cai em `@types/react`, e prop propria que colide com
  atributo HTML homonimo tem a do React como primeira declaracao. Consertar
  reescreve `component-props.json` e mexe nos carimbos `since`: commit proprio,
  com o diff do JSON lido.
- **`OUT_OF_SCOPE` do `check:skill` esta obsoleto.** O JSDoc dele condiciona a
  excecao a o nativo nao ter tabela de props, e ela existe
  (`native-props.json`). Os exemplos de `reference/native.md` sao o unico
  pedaco da skill cujas props ninguem confere. Falta o `check:skill` escolher o
  catalogo pelo arquivo, em vez de pular o arquivo.
- **`accessibilityLiveRegion` e so do Android.** Sete pecas nativas anunciam so
  por ela - `Banner`, `DateRangePicker`, `ImageViewer`, `FilterBar`, o `toast`,
  `Carousel` e `Conversation` -, e no iOS nada e anunciado sem
  `AccessibilityInfo.announceForAccessibility`, que outras nove ja usam.
- **Ref imperativo sem regra escrita.** `useImperativeHandle` aparece em dois
  lugares do web, `VirtualList` (`scrollToIndex`) e `ResizablePanelGroup`, e
  nem `conventions.md` nem a skill dizem quando expor ref imperativo.
- **`QueryBoundary` nao trata dado velho enquanto revalida.** O limite esta
  escrito na pagina da peca ("O que ela nao trata"), com o contorno por
  `isFetching`; o comportamento continua o mesmo.

### O que nao foi medido

- As pecas nativas em aparelho de verdade, alem dos itens do iPhone acima.
- O `npx rivocode-ui-native-init` num Expo recem-criado: `check:receita` so
  compara com o `examples/native`, onde a receita ja funciona.
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
bun run check                # 37 passos, termina nos 2775 testes
bun run build                # ha quebra que so aparece ao empacotar; constroi o mcp/dist
bun run fumaca:mcp           # o servidor MCP pelo stdio
bun run shot && bun run visual   # os 56 retratos contra as assinaturas (~2 min)
bun run a11y                 # axe, foco, alvo e reflow na vitrine
cd apps/docs && bun run dev  # o site, local
```

Para ver a decisao de tag sem criar nada: `gh workflow run tag`. Para
atravessar um release sem publicar: `gh workflow run release --field
ensaio=true` (idem `release-native` e `release-mcp`).

## Como conferir cada numero

```sh
npm view @rivocode/ui version                       # 0.18.1
npm view @rivocode/ui-native version                # 0.14.0
npm view @rivocode/ui-mcp version                   # 0.3.0
curl -s https://registry.npmjs.org/-/npm/v1/attestations/@rivocode/ui@0.18.1 | head -c 80   # assinada
gh run list --workflow=release-native --limit 3     # native-v0.14.0: failure (ENEEDAUTH), depois success
gh secret list                                      # NPM_TOKEN ainda cadastrado
grep -rn NPM_TOKEN .github/workflows                # nada: nenhum workflow o le
git ls-remote --tags origin | grep -vc '\^{}'       # 36 tags
ls .design-sync/docs/*.md | wc -l                   # 222 documentos
bun run check:pecas                                 # 134 pecas (222 - 88 partes)
grep -oE 'state: "[a-z]+"' scripts/paridade-nativo.ts | sort | uniq -c   # 103 traduz, 5 vira, 26 nao
grep -n FILA_DECLARADA scripts/paridade-nativo.ts   # {} vazia
node -e 'p=require("./package.json");console.log(p.scripts.check.split("&&").length)'   # 37
bun run check:testes                                # 2775 testes em 206 arquivos
bun test native/test                                # 743 em 62 arquivos
bun run check:assinatura                            # 225 divergencias em 91 pecas
node -e 'j=require("./apps/docs/src/native-props.json");console.log(Object.keys(j).length)'   # 117
bun run check:compartilhado                         # 38 espelhados, 16 copias
bun run check:contrast | grep -cE '^ +ok'          # 290: 138 por tema mais 14 de scales.css
bun run check:contrast:nativo                       # 60 + 47 + 1 + 16 + 3 por esquema
bun run check:tamanho                               # a tabela do orcamento
bun run check:demo                                  # 131 de 134, 3 fora
bun run check:readme                                # 97 de 134, 37 fora
bun run check:scripts                               # 8 fora do gate
node -e 'console.log(Object.keys(require("./demo/assinaturas.json")).length)'   # 56 retratos
gh run list --workflow=bancada --limit 5            # verde em 946d594 e d5f98c2
node -e 'j=require("./apps/docs/src/component-props.json");console.log(j.Clipboard.props.some(p=>p.name==="value"))'   # false: a divida das props
```

A familia de cada peca sai do `category:` do documento, e peca e o documento
cujo `findParent` (em `apps/docs/src/parts.ts`) nao acha dono.
