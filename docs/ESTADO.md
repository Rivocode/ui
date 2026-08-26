# Onde paramos

Atualizado em 26/08/2026, ao fim do dia. Este arquivo e o "onde paramos" do
repositorio: serve a quem chega frio, humano ou agente, e responde tres coisas —
o que existe, o que falta de verdade, e o que esta parado esperando uma pessoa.

Todo numero aqui foi medido no dia, com comando. A secao **Como conferir cada
numero** no fim diz qual comando, para que a proxima pessoa nao precise
acreditar em nada: mede de novo. Numero em documento envelhece calado, e a
versao anterior deste arquivo passou o dia afirmando que 21 pecas nativas
estavam na fila quando restavam tres.

**Ha trabalho nao comitado na arvore.** Tudo que esta descrito abaixo como
feito passa no gate e no build, e nada disso virou commit ainda.

## O que existe hoje

| Peca                        | Onde                                        | Estado                                                     |
| --------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `@rivocode/ui`              | este repo, `src/`                           | **0.7.0** na arvore; no npm ainda a 0.6.1, falta a tag     |
| `@rivocode/ui-native`       | este repo, `native/`                        | **0.3.0** na arvore; no npm ainda a 0.2.0, falta a tag     |
| Site de documentacao        | `apps/docs/`, no ar em `ds.rivocode.com.br` | Publicado por CI desde 26/08, 169 paginas cruas            |
| Landing                     | repo `rivocode.com`, na `main`              | Migrada e consumindo o pacote do npm, presa no `^0.2.0`    |
| Sync com o claude.ai/design | projeto `RivoCode`                          | Parado desde 24/08, e provavelmente nao vale mais retomar  |

O gate do repo esta verde: `bun run check` passa inteiro — dezenove verificacoes
mais **867 testes em 92 arquivos**. O `bun run build` tambem.

### O catalogo, por familia

Sao **83 pecas** e **169 documentos** em `.design-sync/docs/`. Os dois numeros
sao diferentes de proposito, e a diferenca e a coisa mais facil de errar aqui:
**parte nao e peca**. `CardHeader`, `DialogFooter` e `SelectItem` so existem
dentro de outra coisa, e as 86 partes moram na pagina de quem as monta, com
ancora propria. Quem conta os 169 arquivos como catalogo passa a gastar
contexto abrindo `CardTitle.md` como se fosse componente independente. A regra
esta em `apps/docs/src/parts.ts` e a guarda que a segura em
`test/indice.test.ts`.

| Familia      | Pecas | Quais                                                                                                                                                                                                                                                                                                      |
| ------------ | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulario   |    28 | Autocomplete, Calendar, Checkbox, CheckboxGroup, ColorPicker, Combobox, DatePicker, DateRangePicker, Editable, Field, Fieldset, FileUpload, Form, Input, InputGroup, MaskedInput, NumberField, OTPField, PasswordInput, RadioGroup, SearchInput, Select, Slider, Switch, TagsInput, Textarea, Tree, TreeSelect |
| Estrutura    |    14 | Accordion, AspectRatio, Avatar, Card, Collapsible, DataTable, DescriptionList, Item, PageHeader, ScrollArea, Separator, Splitter, Stat, Table                                                                                                                                                                 |
| Feedback     |    10 | Alert, Badge, EmptyState, Indicator, Kbd, Meter, Progress, Skeleton, Spinner, ToastViewport                                                                                                                                                                                                                   |
| Navegacao    |     9 | Breadcrumb, Command, Menu, Menubar, NavigationMenu, Pagination, Sidebar, Steps, Tabs                                                                                                                                                                                                                          |
| Sobreposicao |     7 | AlertDialog, ContextMenu, Dialog, Popover, PreviewCard, Sheet, Tooltip                                                                                                                                                                                                                                        |
| Acoes        |     6 | Button, ButtonGroup, Clipboard, Toggle, ToggleGroup, Toolbar                                                                                                                                                                                                                                                  |
| Grafico      |     4 | ChartContainer, ChartDonut, ChartRadial, Sparkline                                                                                                                                                                                                                                                           |
| Dados        |     4 | Code, RelativeTime, Timeline, Tracker                                                                                                                                                                                                                                                                        |
| Fundacao     |     1 | RivoProvider                                                                                                                                                                                                                                                                                                 |

Os nomes de familia saem do `category` do proprio documento, e o site os escreve
com acento. Nenhuma peca esta sem documento.

Fora do `@rivocode/ui` principal ficam dois subcaminhos, `@rivocode/ui/form` e
`@rivocode/ui/chart`, cada um com dependencia de par opcional. Mais os
utilitarios: `useZodForm`, `useWizard`, `useSidebar`, `useTelaEstreita`,
`formatDate` e `applyMask`.

**Fundacao:** tokens em tres camadas, temas `rivocode-dark` e `rivocode-light`,
densidade confortavel e compacta, guarda de cor literal e guarda de contraste.

## O React Native

**A fila chegou a zero.** `Tree`, `TreeSelect` e `Editable` foram as ultimas, e
com elas 67 das 83 pecas do web tem par no celular.

| No React Native    | Quantas | O que significa                                                                              |
| ------------------ | ------: | -------------------------------------------------------------------------------------------- |
| Traduz, mesmo nome |      64 | mesma peca, mesmo nome de prop — a assinatura muda, veja abaixo                               |
| Traduz, outro nome |       3 | `Autocomplete` vira `Combobox`, `DataTable` vira `DataList`, `ToastViewport` vira `useToast`  |
| `○ na fila`        |       0 | —                                                                                             |
| `✕ nao porta`      |      16 | decisao, nao atraso: idioma de mesa que nao tem sentido no toque                              |

As 16 que nao portam nao voltam a esta lista sem que alguem mude de ideia sobre
o que um dedo faz. Os tres graficos, que este arquivo listava como bloqueados
por falta de motor de desenho, atravessaram: `native/src/chart/` desenha com
`react-native-svg`, e a moldura entrega `{ width, height, colors }` a quem
desenha, porque nao ha Recharts nem `var(--color-serie)` do lado de la.

**Aviso que vale mais que a tabela:** nome igual nao e API igual. No nativo tudo
e controlado (sem `defaultValue`) e a lista vem por `items`, nao por
composicao. Nunca prometa que a tela do web vai rodar no celular: o que se
reaproveita e o vocabulario de classes, o token e a escolha da peca. O JSX se
reescreve.

O pacote tem quatro subcaminhos — `form`, `chart`, `clipboard` e `file-upload`
—, e a regra que os separa e **um subcaminho por peer, e nao um por assunto**.
No celular peer nao e byte: modulo do Expo custa build. Um `/expo` comum
cobraria o seletor de documentos de quem so quer copiar uma chave de acesso.

## O que foi feito neste dia

Fechou a lista inteira de pendencias que este arquivo abria de manha. O detalhe
de cada uma esta em `CHANGELOG.md` (0.7.0) e `native/CHANGELOG.md` (0.3.0); o
que importa aqui e que **nao ha mais item aberto na secao "achados que agentes
deixaram anotados"** — ela deixou de existir.

Tres coisas nao estavam na lista e apareceram no caminho:

1. **A guarda de acento so varria `src/`.** O `DataList` nativo serviu "Nao foi
   possivel carregar a lista." por versoes, acentuada do lado web e crua no
   aparelho, sem nada acusar. A varredura cobre os dois pacotes agora. A
   primeira tentativa de junta-los num padrao de chaves aninhadas varreu ZERO
   arquivo em silencio e ficou verde por nao olhar nada — por isso o teste
   ganhou piso de arquivo.
2. **Quatro scripts orfaos sairam de `scripts/`**: `acentos-previews`,
   `exports-ingles`, `rodar-acentos` e `titulos-previews`. Eram mutacoes de uma
   vez so, ja aplicadas, e nao guardas. Um deles deixou rastro que sobreviveu
   meses: `Apos` virou `After` dentro de uma frase em portugues na fonte da
   tabela de paridade.
3. **`ChartContainer` ja aceitava `id` e `aria-*`.** A pendencia listava nove
   pecas de tipo fechado; eram oito.

## O que esta pendente de verdade

### Divida de codigo

1. **`regressao-visual.ts` e o unico script fora do gate.** Ele roda por `bun
   run visual`, e nada o chama no `check`. Ou entra, ou vira dividido declarado
   como as outras guardas fazem — script que ninguem roda envelhece igual a
   numero em documento.
2. **RTL no `Tracker`.** A conta do ponteiro e as setas assumem LTR. Mesmo
   limite que o `Splitter` ja tem, e nenhum dos dois esta declarado em lugar
   nenhum.
3. **O balao do `Tracker` pode atrasar um quadro** enquanto o ponteiro varre a
   faixa: a Base UI acompanha ancora que se move por `layoutShift`, e o
   `TooltipContent` da casa so repassa `side`/`align`/`sideOffset` ao
   `Positioner`, entao nao da para usar `trackCursorAxis`.

### Pecas novas que a auditoria propos e ninguem fez

Em ordem de valor sobre custo, todas com caso de uso escrito na auditoria:
`TimeField`/`TimePicker` (agendamento, ponto eletronico, janela de entrega),
`FilterBar`/`FilterChip` (a barra de filtros que toda listagem remonta),
`QueryBoundary` (os quatro finais como peca, hoje so DataTable e
ChartContainer os tem), `Popconfirm` (excluir uma linha sem o peso do
AlertDialog), `VirtualList` (o virtualizador ja esta pago pelo DataTable) e o
`Calendar` de agenda — este ultimo grande, e o unico que nao se apoia em nada
pronto.

## O que esta bloqueado esperando acao humana

Quatro coisas, e nenhuma e trabalho de codigo:

1. **Comitar o dia.** A arvore tem o trabalho inteiro descrito acima sem
   commit. O gate e o build passam.

2. **As duas tags.** A arvore esta em `ui@0.7.0` e `ui-native@0.3.0`, e o npm
   serve 0.6.1 e 0.2.0. A tag dispara o workflow que publica, e publicacao nao
   se desfaz — por isso nenhuma foi criada sozinha. Os dois CHANGELOGs ja estao
   fechados, entao nao ha mais nada a escrever antes delas.

3. **O ensaio do `release-native`.** `gh workflow run release-native --field
   ensaio=true` roda o caminho inteiro sem publicar. Ele NUNCA publicou de
   verdade em quatro tentativas, e o primeiro lancamento nativo continua sendo
   voo cego ate alguem rodar isso. Vale mais agora do que valia: a 0.3.0 leva
   quatro subcaminhos novos, e subcaminho errado no `exports` so aparece na
   instalacao de quem consome.

4. **A landing (`rivocode.com`), e o gerenciador de pacotes ANTES do bump.**
   Ela consome `^0.2.0` e nao quebra uma linha de codigo ao subir — usa cinco
   botoes, um import de CSS e dois atributos no `<html>`. O problema e outro: a
   arvore dela tem `pnpm-lock.yaml` e `pnpm-workspace.yaml` NAO RASTREADOS, com
   uma excecao de `minimumReleaseAge` escrita a mao. O repositorio versiona
   `bun.lock`, a producao usa bun, e a maquina usa pnpm. Enquanto isso nao for
   decidido e comitado, qualquer quebra no bump vem sem etiqueta: nao se sabe se
   foi a biblioteca nova ou o gerenciador que a producao nem usa. Ha ainda um
   risco especifico nao testado: o
   `@source '../../node_modules/@rivocode/ui/dist'` do CSS passa por symlink sob
   pnpm, e se o scanner do Tailwind nao atravessar, a landing sai sem estilo —
   so localmente.

O que continua valendo como restricao, e nao como bloqueio: **o repositorio e
privado**, entao o npm recusa `--provenance` com 422, e por isso os dois
workflows de release publicam sem assinatura. Tornar o repositorio publico e o
que devolve a procedencia. Esta escrito nos dois workflows, no lugar onde
alguem tentaria "consertar".

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
minutos leituras do repositorio devolveram conteudo velho — mediu-se falha que
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
bun run check        # dezenove verificacoes mais os 867 testes
bun run build        # ha quebra que so aparece ao empacotar
bun run shot         # gera a vitrine em demo/dist/
cd apps/docs && bun run dev   # o site de documentacao, local
```

O contrato de uso da biblioteca esta em `.design-sync/conventions.md` e no ar em
`ds.rivocode.com.br/convencoes.md` — ele passou a cobrir tambem o pacote nativo
e os quatro subcaminhos dele. A skill que um agente le esta em
`.claude/skills/rivocode-ui/`, e vai dentro do pacote publicado (`skill/`,
gerado por `bun run build:skill`). As notas do sync com o claude.ai/design estao
em `.design-sync/NOTES.md`.

## Como conferir cada numero

```sh
ls .design-sync/docs/*.md | wc -l                  # 169 documentos
bun run check:pecas                                # 83 pecas
bun test                                           # 867 pass, 92 arquivos
bun test native/test                               # a metade nativa
bun run check:paridade                             # confere as 83 linhas da tabela
bun run check:contrato                             # os SEIS subcaminhos, web e nativo
npm view @rivocode/ui version                      # 0.6.1 (a arvore ja e 0.7.0)
npm view @rivocode/ui-native version               # 0.2.0 (a arvore ja e 0.3.0)
gh run list --workflow=docs --limit 5              # a publicacao do site
gh run list --workflow=release-native --limit 5    # as quatro falhas
curl -sI https://ds.rivocode.com.br/llms.txt       # 200, text/plain
```

As 83 pecas nao saem de um `ls`: elas saem do catalogo, que separa peca de
parte. O caminho curto e `curl -s https://ds.rivocode.com.br/llms.txt | head`,
que abre dizendo o numero. Localmente, `ENTRIES` em `apps/docs/src/catalog.ts`.

## O que nao foi medido

- **Se a landing publicada esta com o pacote do npm ou com uma build antiga.**
  Foi medido o `package.json` e o `node_modules` do repo `rivocode.com` local —
  os dois dizem 0.2.0 —, mas nao o que esta servido em producao.
- **Se o sync com o claude.ai/design chegou a subir alguma coisa naquele dia.**
  O que se sabe e a data do ultimo log local. O estado do lado de la nao foi
  consultado.
- **As tres pecas nativas novas em aparelho de verdade.** `Tree`, `TreeSelect` e
  `Editable` tem 27 testes sobre a logica — papel, estado, empilhamento de
  nivel, o gesto de toque longo —, e nenhum deles mede como o gesto se sente. O
  `Editable` e o de maior risco de ficar estranho, e vale um prototipo antes de
  alguem construir tela em cima dele.
