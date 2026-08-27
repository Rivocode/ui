# Onde paramos

Atualizado em 27/08/2026, de madrugada. Este arquivo e o "onde paramos" do
repositorio: serve a quem chega frio, humano ou agente, e responde tres coisas:
o que existe, o que falta de verdade, e o que esta parado esperando uma pessoa.

Todo numero aqui foi medido no dia, com comando. A secao **Como conferir cada
numero** no fim diz qual comando, para que a proxima pessoa nao precise
acreditar em nada: mede de novo. Numero em documento envelhece calado, e a
versao anterior deste arquivo passou o dia afirmando que 21 pecas nativas
estavam na fila quando restavam tres.

Tudo que esta descrito abaixo como feito esta comitado na `main`, passa no
`bun run check` inteiro e no `bun run build`.

## O que existe hoje

| Peca                        | Onde                                        | Estado                                                     |
| --------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `@rivocode/ui`              | este repo, `src/`                           | **0.8.0** na arvore; 0.7.0 no npm, falta a tag            |
| `@rivocode/ui-native`       | este repo, `native/`                        | **0.3.1** na arvore; 0.3.0 no npm, falta a tag            |
| Site de documentacao        | `apps/docs/`, no ar em `ds.rivocode.com.br` | Publicado por CI desde 26/08, uma pagina crua por peca     |
| Landing                     | repo `rivocode.com`, na `main`              | Migrada e consumindo o pacote do npm, presa no `^0.2.0`    |
| Sync com o claude.ai/design | projeto `RivoCode`                          | Parado desde 24/08, e provavelmente nao vale mais retomar  |

O gate do repo esta verde: `bun run check` passa inteiro - vinte e tres verificacoes
mais a suite dos dois pacotes, `test/` e `native/test/`. O `bun run build`
tambem. A contagem de testes nao se escreve aqui de proposito: ela mora na home
do site, que e o unico lugar onde `check:testes` a confere.

### O catalogo, por familia

Sao **91 pecas** e **177 documentos** em `.design-sync/docs/`. Os dois numeros
sao diferentes de proposito, e a diferenca e a coisa mais facil de errar aqui:
**parte nao e peca**. `CardHeader`, `DialogFooter` e `SelectItem` so existem
dentro de outra coisa, e as 86 partes moram na pagina de quem as monta, com
ancora propria. Quem conta os 176 arquivos como catalogo passa a gastar
contexto abrindo `CardTitle.md` como se fosse componente independente. A regra
esta em `apps/docs/src/parts.ts` e a guarda que a segura em
`test/indice.test.ts`.

| Familia      | Quais                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulario   | Autocomplete, Calendar, Checkbox, CheckboxGroup, ColorPicker, Combobox, DatePicker, DateRangePicker, Editable, Field, Fieldset, FileUpload, Form, Input, InputGroup, MaskedInput, NumberField, OTPField, PasswordInput, RadioGroup, SearchInput, Select, Slider, Switch, TagsInput, Textarea, TimeField, TimePicker, Tree, TreeSelect            |
| Estrutura    | Accordion, AspectRatio, Avatar, Card, Collapsible, DataTable, DescriptionList, FilterBar, FilterChip, Item, PageHeader, ScrollArea, Separator, Splitter, Stat, Table, VirtualList                                                                                                                                                               |
| Feedback     | Alert, Badge, EmptyState, Indicator, Kbd, Meter, Progress, QueryBoundary, Skeleton, Spinner, ToastViewport                                                                                                                                                                                                                                      |
| Navegacao    | Breadcrumb, Command, Menu, Menubar, NavigationMenu, Pagination, Sidebar, Steps, Tabs                                                                                                                                                                                                                                                            |
| Sobreposicao | AlertDialog, ContextMenu, Dialog, Popconfirm, Popover, PreviewCard, Sheet, Tooltip                                                                                                                                                                                                                                                              |
| Acoes        | Button, ButtonGroup, Clipboard, Toggle, ToggleGroup, Toolbar                                                                                                                                                                                                                                                                                    |
| Grafico      | ChartContainer, ChartDonut, ChartRadial, Sparkline                                                                                                                                                                                                                                                                                              |
| Dados        | Code, RelativeTime, Timeline, Tracker                                                                                                                                                                                                                                                                                                           |
| Fundacao     | RivoProvider                                                                                                                                                                                                                                                                                                                                    |

Os nomes de familia saem do `category` do proprio documento, e o site os escreve
com acento. Nenhuma peca esta sem documento. A coluna de contagem por familia
saiu daqui: ela somava oitenta e tres depois de o catalogo chegar a noventa, e
nao ha guarda que a confira - o site soma sozinho, a partir de `ENTRIES`.

Fora do `@rivocode/ui` principal ficam dois subcaminhos, `@rivocode/ui/form` e
`@rivocode/ui/chart`, cada um com dependencia de par opcional. Mais os
utilitarios: `useZodForm`, `useWizard`, `useSidebar`, `useTelaEstreita`,
`formatDate` e `applyMask`.

**Fundacao:** tokens em tres camadas, temas `rivocode-dark` e `rivocode-light`,
densidade confortavel e compacta, guarda de cor literal e guarda de contraste.

## O React Native

**A fila chegou a zero.** `Tree`, `TreeSelect` e `Editable` foram as ultimas, e
e hoje 73 das 90 pecas do web tem par no celular.

| No React Native    | Quantas | O que significa                                                                              |
| ------------------ | ------: | -------------------------------------------------------------------------------------------- |
| Traduz, mesmo nome |      69 | mesma peca, mesmo nome de prop: a assinatura muda, veja abaixo                               |
| Traduz, outro nome |       4 | `Autocomplete` vira `Combobox`, `DataTable` vira `DataList`, `ToastViewport` vira `useToast`  |
| `○ na fila`        |       0 | -                                                                                             |
| `✕ nao porta`      |      17 | decisao, nao atraso: idioma de mesa que nao tem sentido no toque                              |

As 17 que nao portam nao voltam a esta lista sem que alguem mude de ideia sobre
o que um dedo faz. Os tres graficos, que este arquivo listava como bloqueados
por falta de motor de desenho, atravessaram: `native/src/chart/` desenha com
`react-native-svg`, e a moldura entrega `{ width, height, colors }` a quem
desenha, porque nao ha Recharts nem `var(--color-serie)` do lado de la.

**Aviso que vale mais que a tabela:** nome igual nao e API igual. No nativo tudo
e controlado (sem `defaultValue`) e a lista vem por `items`, nao por
composicao. Nunca prometa que a tela do web vai rodar no celular: o que se
reaproveita e o vocabulario de classes, o token e a escolha da peca. O JSX se
reescreve.

O pacote tem quatro subcaminhos (`form`, `chart`, `clipboard` e `file-upload`),
e a regra que os separa e **um subcaminho por peer, e nao um por assunto**.
No celular peer nao e byte: modulo do Expo custa build. Um `/expo` comum
cobraria o seletor de documentos de quem so quer copiar uma chave de acesso.

## O que foi feito neste dia

Fechou a lista inteira de pendencias que este arquivo abria de manha. O detalhe
de cada uma esta em `CHANGELOG.md` (0.7.0) e `native/CHANGELOG.md` (0.3.0); o
que importa aqui e que **nao ha mais item aberto na secao "achados que agentes
deixaram anotados"**: ela deixou de existir.

Tres coisas nao estavam na lista e apareceram no caminho:

1. **A guarda de acento so varria `src/`.** O `DataList` nativo serviu "Nao foi
   possivel carregar a lista." por versoes, acentuada do lado web e crua no
   aparelho, sem nada acusar. A varredura cobre os dois pacotes agora. A
   primeira tentativa de junta-los num padrao de chaves aninhadas varreu ZERO
   arquivo em silencio e ficou verde por nao olhar nada: por isso o teste
   ganhou piso de arquivo.
2. **Quatro scripts orfaos sairam de `scripts/`**: `acentos-previews`,
   `exports-ingles`, `rodar-acentos` e `titulos-previews`. Eram mutacoes de uma
   vez so, ja aplicadas, e nao guardas. Um deles deixou rastro que sobreviveu
   meses: `Apos` virou `After` dentro de uma frase em portugues na fonte da
   tabela de paridade.
3. **`ChartContainer` ja aceitava `id` e `aria-*`.** A pendencia listava nove
   pecas de tipo fechado; eram oito.

## A auditoria de acessibilidade, e o que ela achou

A 0.7.0 saiu de manha e foi auditada a tarde, com retrato em Chrome e varredura
da arvore de acessibilidade. **Treze defeitos em pecas que ja estavam no
registro**, e nenhum aparecia nos 1072 testes verdes daquele momento.

Dois eram falha WCAG de nivel A: o `Popconfirm` ficava sem NENHUM focavel
enquanto a chamada corria (o foco caia no `<body>`, Esc nao fechava, e o Tab
vazava para o fundo `aria-hidden`), e o `VirtualList` tinha 256 mil pixels de
rolagem sem parada de tabulacao, o que em Firefox e Safari significa nao poder
rolar pelo teclado.

Os treze estao consertados, cada um medido em Chrome antes e depois. O detalhe
de cada um esta no `CHANGELOG.md` da 0.8.0.

**Quatro pecas liam o dado errado em `dir="rtl"`**, e o pior era o `Tree`:
`paddingLeft` e propriedade fisica, entao os tres niveis paravam no mesmo
pixel e a hierarquia era invisivel. Trocar so a tecla teria consertado o
teclado para um desenho que continuava errado.

## O catalogo cresceu sete pecas, e nenhuma nasceu so no web

`TimeField`, `TimePicker`, `FilterBar`, `FilterChip`, `QueryBoundary`,
`Popconfirm` e `VirtualList` - as seis que a auditoria propunha havia semanas,
mais o par que faltava. O catalogo vai de 83 para 90.

Cinco delas nasceram tambem no React Native no mesmo dia. As outras duas nao
sao atraso: `VirtualList` nao porta porque a `FlatList` ja virtualiza de
fabrica, e `Popconfirm` vira `AlertDialog`. **A fila do nativo voltou a zero no
mesmo dia em que encheu.**

E isso deixou de depender de boa vontade. O `CLAUDE.md` ganhou o **nono
artefato**: peca web nova nasce nos dois pacotes no mesmo dia, e
`check:paridade` recusa peca na fila sem uma linha em `FILA_DECLARADA` dizendo
por que ela nao pode nascer junto. A lista so encolhe, como o `DEBT` das outras
guardas.

O `Calendar` de agenda continua fora - e o unico da auditoria que nao se apoia
em nada pronto, e merece desenho proprio.

## Dois defeitos que a doc ja desmentia, e ninguem tinha lido

1. **O `ChartContainer` mostrava esqueleto quando devia mostrar erro**, nos
   dois pacotes. Ele testava `isLoading` antes de `isError`, entao consulta que
   falhou durante um refetch escondia a falha: carregamento eterno, sem o botao
   de tentar de novo. O `DataTable` sempre ordenou certo, e `DataTable.md` e a
   tabela de paridade ja afirmavam que a regra era "erro vence carregando" - a
   peca e que discordava do texto, calada. Ha teste dos dois lados agora.

2. **O `Tracker` lia o dado errado em `dir="rtl"`.** Nao era preferencia de
   layout: o flex espelhava o desenho, a conta do ponteiro nao. A 5% da
   esquerda ele lia "Dia 2" onde a celula era "Dia 20" - dezessete celulas de
   distancia, e o balao dizia o dado errado. Consertado e medido em Chrome de
   verdade. O `Splitter` tem o mesmo limite e continua tendo, agora escrito e
   com numero na pagina dele.

## As tres assinaturas visuais desatualizadas

`bun run visual` estava vermelho e ninguem sabia, porque ele nao estava no
gate: `flutuantes-celular` com 50% dos quadrados divergindo, mais `flutuantes`
e `dialogo-celular`.

**A causa foi encontrada, e nao e a fonte de hoje.** A assinatura foi gravada
em `90c12a6`, e depois disso as cinco pecas que aparecem nesses retratos -
`popover`, `tooltip`, `dialog`, `menu`, `select` - foram refeitas no trabalho
que unificou o posicionamento dos cinco paineis flutuantes. As mudancas sao
legitimas e ja foram revisadas quando entraram; o que faltou foi regravar a
assinatura.

**Continua aberto, e e acao humana:** `bun run visual --aceitar` regrava, e
ninguem deve fazer isso sem olhar os retratos. E por isso que existe agora o
`check:scripts` - script fora do gate tem que ser declarado, para nao apodrecer
em silencio outra vez.

## A fonte, que mudou de lugar nos dois pacotes

Ate hoje a fonte era um padrao que nao se dispensava e nao se trocava por tema.
As tres coisas mudaram.

**No web**, os tokens sairam de `src/tokens/scales.css` - camada global - para
dentro de `[data-rc-theme="..."]`, como cor e sombra ja eram. E o que permite
duas marcas na mesma pagina. Nao ha fallback no `:root`, e e deliberado:
nenhum outro token de tema tem, e um `system-ui` por baixo so para fonte
tornaria a falta silenciosa. O `check:temas` passou de 72 para **75 tokens**,
entao tema novo sem fonte declarada falha o gate.

As `@font-face` sairam do `styles.css` e viraram entrada propria,
`@rivocode/ui/fonts.css`. **Isto e quebra**, e entra na 0.7.0 porque ela ainda
nao foi publicada - depois da tag, a mesma mudanca custaria um ciclo inteiro.
Medido: `dist/styles.css` com zero `@font-face`, `dist/fonts.css` com catorze.

**No nativo**, a fonte entra por `fonts` no `RivoProvider`, e quem a carrega e
o app, com `expo-font`. Nao ha subcaminho novo, e isso e a regra da casa sendo
aplicada: subcaminho existe por PEER, e aqui nao ha peer - a biblioteca nunca
importa `expo-font`, e o que atravessa a fronteira e `string`.

O bloco `fonts` dos tokens gerados **foi removido**. Ele anunciava as tres
familias do web, que nao existem instaladas em aparelho nenhum, e as resolvia
com `split(",")[0]` - ficando com a primeira da pilha e jogando fora o
fallback, que e literalmente a falha do `ui-monospace` escrita dentro da
ferramenta que gera os tokens.

## O comentario, que mudou de regra

Por decisao do dono, com o custo posto na mesa antes: **fica so o JSDoc preso a
uma prop publica**. Sairam 5015 linhas em 192 arquivos.

O que fica nao e prosa, e dado: `gen:props` extrai o JSDoc de prop para o campo
`note` de `component-props.json`, que e a tabela publicada. Por isso a passagem
usou `check:props` como prova - `242 pecas, 3800 props` antes e depois - e nao
o olho. Nenhuma linha de codigo mudou: cada arquivo foi reparsado e o fluxo de
tokens comparado.

Tres pastas ficam de fora, cada uma por motivo funcional, e as tres estao
escritas no `CLAUDE.md`: `.design-sync/previews/` (o bloco e titulo de
historia, o site o le), `scripts/check-*.ts` (cada um abre com o incidente que
o fez existir) e `apps/docs/` (e aplicacao, nao exporta prop, entao a regra nao
teria o que preservar).

**A parte que impede o trabalho de se desfazer sozinho e a mudanca do
`CLAUDE.md` no mesmo commit.** A secao "Comentario" descrevia a regra antiga
com exemplos nomeados; o proximo agente que a lesse recolocaria tudo achando
que consertava.

## O que esta pendente de verdade

### Divida de codigo

As tres que este arquivo listava foram pagas: `regressao-visual` virou divida
declarada com guarda (`check:scripts`), o RTL do `Tracker` foi consertado, e o
quadro de atraso do balao foi medido e declarado. Sobram estas:

1. **`Splitter` em `dir="rtl"`.** Arrastar 120px para a direita move a
   divisoria 118px para a ESQUERDA, e a seta tambem inverte. Esta medido e
   escrito na pagina, mas nao consertado - o `Tracker` mostrou que o conserto e
   pequeno (`useDirection()` mais `insetInlineStart`), entao vale fazer.
2. **`accessibilityLiveRegion` e do Android.** A `FilterBar` nativa anuncia a
   contagem por ela, e no iOS o anuncio automatico nao existe sem
   `announceForAccessibility`, que nenhuma peca do catalogo usa hoje. Vale para
   toda peca nativa que quiser anunciar mudanca sem foco.
3. **O `scrollToIndex` do `VirtualList` e o primeiro `useImperativeHandle` do
   `src/`.** Nao ha precedente na casa, e portanto nao ha regra escrita sobre
   quando expor `ref` imperativo. Ou vira padrao documentado, ou vira excecao
   justificada.
4. **`QueryBoundary` nao trata dado velho enquanto revalida.** O
   stale-while-revalidate mostra o esqueleto por cima do que ja estava na tela.
   Nao e esquecimento, esta escrito na pagina - mas e o caso que mais aparece
   em tela real.

### Pecas novas que a auditoria propos

Seis das sete foram feitas hoje. Falta uma:

- **`Calendar` de agenda** - grande, e o unico da lista que nao se apoia em
  nada pronto. Merece desenho proprio antes de codigo, como `Tree`,
  `TreeSelect` e `Editable` mereceram.

## O que esta bloqueado esperando acao humana

Os dois bloqueios de publicacao cairam em 26/08, e vale registrar COMO, porque
a versao anterior deste arquivo descrevia o problema errado.

**Os dois pacotes saem por CI agora.** `@rivocode/ui@0.7.0` e
`@rivocode/ui-native@0.3.0` foram publicados pelos workflows, disparados por
tag - nenhum `npm publish` na mao. Antes disso, o `release-native` rodou em modo
ensaio (`gh workflow run release-native --field ensaio=true`) e passou: e o
ensaio que provou o segredo antes de a tag ser gasta, e essa prova nunca tinha
sido feita.

A historia das "quatro falhas" que este arquivo contava estava errada. A
primeira, pela tag `native-v0.2.0`, falhou com `ENEEDAUTH` por falta de
segredo; alguem publicou a 0.2.0 a mao; e as tres seguintes tomaram `403 - You
cannot publish over the previously published versions`, que e o npm recusando
sobrescrever. **Uma falha real e tres recusas legitimas.** Com o segredo
corrigido e uma versao nova para publicar, o caminho completou de primeira.

Sobram duas coisas, e nenhuma e trabalho de codigo:

1. **A landing (`rivocode.com`) precisa de uma linha, e de uma decisao.**

   A linha: com o `fonts.css` separado nesta versao, a landing sai na fonte do
   sistema ate alguem escrever `@import "@rivocode/ui/fonts.css"`. Sem erro e
   sem aviso - so a letra muda.

   A decisao: a arvore dela tem `pnpm-lock.yaml` e `pnpm-workspace.yaml` NAO
   RASTREADOS, com uma excecao de `minimumReleaseAge` escrita a mao. O
   repositorio versiona `bun.lock`, a producao usa bun, e a maquina usa pnpm.
   Enquanto isso nao for decidido e comitado, qualquer quebra no bump vem sem
   etiqueta: nao se sabe se foi a biblioteca nova ou o gerenciador que a
   producao nem usa. Ha ainda um risco especifico nao testado: o
   `@source '../../node_modules/@rivocode/ui/dist'` do CSS passa por symlink
   sob pnpm, e se o scanner do Tailwind nao atravessar, a landing sai sem
   estilo - so localmente.

2. **As tres assinaturas visuais.** `bun run visual --aceitar` regrava, e
   ninguem deve faze-lo sem olhar os retratos. A causa esta diagnosticada
   acima.

O que continua valendo como restricao, e nao como bloqueio: **o repositorio e
privado**, entao o npm recusa `--provenance` com 422, e por isso os dois
workflows publicam sem assinatura. Tornar o repositorio publico e o que devolve
a procedencia. Esta escrito nos dois workflows, no lugar onde alguem tentaria
"consertar", e continua sendo uma decisao que ninguem tomou.

## Decisoes que continuam valendo

- **Mobile primeiro.** Decidir o que acontece em 390px antes de desenhar o
  desktop. Painel flutuante nao encosta na borda, calendario cai para um mes,
  dialogo vira folha de baixo, tabela rola dentro da propria moldura.
- **Um subcaminho por peer, e nao um por assunto.** E o peer que cobra a
  instalacao, entao e ele que decide onde a porta fica. Vale nos dois pacotes.
- **A TanStack Table entrou, como motor interno.** A decisao de 24/08 era
  deixa-la de fora; a spec do mesmo dia
  (`docs/superpowers/specs/2026-08-24-datatable-tanstack-design.md`) a reviu, e
  hoje o `DataTable` importa `@tanstack/react-table` v9 mais a
  `@tanstack/react-virtual`. O que a decisao protegia continua protegido: nenhum
  tipo de terceiro vaza para a assinatura publica.
- **React Query fica de fora.** E arquitetura de aplicacao, nao de design. O que
  cabe ao design system e a apresentacao dos estados que uma consulta produz.
- **Receitas de tela inteira** (login, painel, listagem pronta) continuam de
  fora, porque receita nao versiona como componente e ninguem decidiu se elas
  moram aqui ou num pacote separado.

## Uma armadilha de processo, aprendida hoje

Sete agentes trabalharam em paralelo sobre esta arvore, particionados por
arquivo. Dois deles rodaram `git stash` para conferir se uma falha era
pre-existente, e **um `git stash` num repositorio compartilhado tira do disco o
trabalho de todo mundo**, nao so o de quem chamou. Tudo foi restaurado, mas o
`stash pop` conflitou num arquivo que o agente nao devia tocar, e por alguns
minutos leituras do repositorio devolveram conteudo velho: mediu-se falha que
nao existia.

A regra que fica: **enquanto houver mais de uma frente escrevendo na arvore,
nao se roda `git stash`, `git checkout --` nem `git reset --hard`.** Para saber
o que uma versao antiga dizia, use `git show HEAD:<arquivo>`, que le sem tocar
no disco. E nao se confia em verde parcial: o `check` inteiro so vale depois que
a ultima frente parou.

## Como retomar

```sh
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun install
bun run check        # vinte e tres verificacoes mais os 1070 testes
bun run build        # ha quebra que so aparece ao empacotar
bun run shot         # gera a vitrine em demo/dist/
cd apps/docs && bun run dev   # o site de documentacao, local
```

A landing tambem precisa da linha nova de `fonts.css`, ou sai na fonte do
sistema depois do bump.

O contrato de uso da biblioteca esta em `.design-sync/conventions.md` e no ar em
`ds.rivocode.com.br/convencoes.md`. Ele passou a cobrir tambem o pacote nativo
e os quatro subcaminhos dele. A skill que um agente le esta em
`.claude/skills/rivocode-ui/`, e vai dentro do pacote publicado (`skill/`,
gerado por `bun run build:skill`). As notas do sync com o claude.ai/design estao
em `.design-sync/NOTES.md`.

## Como conferir cada numero

```sh
ls .design-sync/docs/*.md | wc -l                  # 176 documentos
bun run check:pecas                                # 90 pecas
bun test                                           # a suite inteira, web e nativo
bun test native/test                               # a metade nativa
bun run check:paridade                             # confere as 90 linhas da tabela
bun run check:contrato                             # os SEIS subcaminhos, web e nativo
npm view @rivocode/ui version                      # tem que bater com package.json
npm view @rivocode/ui-native version               # tem que bater com native/package.json
gh run list --workflow=docs --limit 5              # a publicacao do site
gh run list --workflow=release-native --limit 5    # uma falha real e tres recusas
curl -sI https://ds.rivocode.com.br/llms.txt       # 200, text/plain
```

As pecas nao saem de um `ls`: elas saem do catalogo, que separa peca de
parte. O caminho curto e `curl -s https://ds.rivocode.com.br/llms.txt | head`,
que abre dizendo o numero. Localmente, `ENTRIES` em `apps/docs/src/catalog.ts`.

## O que nao foi medido

- **Se a landing publicada esta com o pacote do npm ou com uma build antiga.**
  Foi medido o `package.json` e o `node_modules` do repo `rivocode.com` local
  (os dois dizem 0.2.0), mas nao o que esta servido em producao.
- **Se o sync com o claude.ai/design chegou a subir alguma coisa naquele dia.**
  O que se sabe e a data do ultimo log local. O estado do lado de la nao foi
  consultado.
- **As tres pecas nativas novas em aparelho de verdade.** `Tree`, `TreeSelect` e
  `Editable` tem 27 testes sobre a logica (papel, estado, empilhamento de
  nivel, o gesto de toque longo), e nenhum deles mede como o gesto se sente. O
  `Editable` e o de maior risco de ficar estranho, e vale um prototipo antes de
  alguem construir tela em cima dele.
