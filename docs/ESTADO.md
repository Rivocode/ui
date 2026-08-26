# Onde paramos

Atualizado em 26/08/2026. Este arquivo e o "onde paramos" do repositorio: serve
a quem chega frio, humano ou agente, e responde tres coisas — o que existe, o
que falta de verdade, e o que esta parado esperando uma pessoa.

Todo numero aqui foi medido no dia, com comando. A secao **Como conferir cada
numero** no fim diz qual comando, para que a proxima pessoa nao precise
acreditar em nada: mede de novo. Numero em documento envelhece calado, e a
versao anterior deste arquivo passou dois dias afirmando que o site de
documentacao nao existia.

## O que existe hoje

| Peca                         | Onde                                       | Estado                                                        |
| ---------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `@rivocode/ui`               | este repo, `src/`                          | **0.6.1**, publicado no npm, 83 pecas no catalogo             |
| `@rivocode/ui-native`        | este repo, `native/`                       | **0.2.0**, publicado no npm, 46 das 83 pecas traduzidas       |
| Site de documentacao         | `apps/docs/`, no ar em `ds.rivocode.com.br` | **Publicado por CI desde hoje**, 158 paginas cruas            |
| Landing                      | repo `rivocode.com`, na `main`             | Migrada e consumindo o pacote do npm, presa no `^0.2.0`       |
| Sync com o claude.ai/design  | projeto `RivoCode`                         | **Parado desde 24/08**, e provavelmente nao vale mais retomar |

O gate do repo esta verde: `bun run check` passa inteiro — quinze verificacoes
mais **552 testes em 68 arquivos**, sendo 453 do web e 99 do nativo.

### O catalogo, por familia

Sao **83 pecas** e **158 documentos** em `.design-sync/docs/`. Os dois numeros
sao diferentes de proposito, e a diferenca e a coisa mais facil de errar aqui:
**parte nao e peca**. `CardHeader`, `DialogFooter` e `SelectItem` so existem
dentro de outra coisa, e as 75 partes moram na pagina de quem as monta, com
ancora propria. Quem conta os 158 arquivos como catalogo passa a gastar
contexto abrindo `CardTitle.md` como se fosse componente independente. A regra
esta em `apps/docs/src/parts.ts` e a guarda que a segura em
`test/indice.test.ts`.

| Familia      | Pecas | Quais                                                                                                                                                                                                                          |
| ------------ | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Formulario   |    28 | Autocomplete, Calendar, Checkbox, CheckboxGroup, ColorPicker, Combobox, DatePicker, DateRangePicker, Editable, Field, Fieldset, FileUpload, Form, Input, InputGroup, MaskedInput, NumberField, OTPField, PasswordInput, RadioGroup, SearchInput, Select, Slider, Switch, TagsInput, Textarea, Tree, TreeSelect |
| Estrutura    |    14 | Accordion, AspectRatio, Avatar, Card, Collapsible, DataTable, DescriptionList, Item, PageHeader, ScrollArea, Separator, Splitter, Stat, Table                                                                                     |
| Feedback     |    10 | Alert, Badge, EmptyState, Indicator, Kbd, Meter, Progress, Skeleton, Spinner, ToastViewport                                                                                                                                       |
| Navegacao    |     9 | Breadcrumb, Command, Menu, Menubar, NavigationMenu, Pagination, Sidebar, Steps, Tabs                                                                                                                                              |
| Sobreposicao |     7 | AlertDialog, ContextMenu, Dialog, Popover, PreviewCard, Sheet, Tooltip                                                                                                                                                            |
| Acoes        |     6 | Button, ButtonGroup, Clipboard, Toggle, ToggleGroup, Toolbar                                                                                                                                                                                  |
| Grafico      |     4 | ChartContainer, ChartDonut, ChartRadial, Sparkline                                                                                                                                                                               |
| Dados        |     4 | Code, RelativeTime, Timeline, Tracker                                                                                                                                                                                            |
| Fundacao     |     1 | RivoProvider                                                                                                                                                                                                                     |

Os nomes de familia saem do `category` do proprio documento, e o site os escreve
com acento. Nenhuma peca esta sem documento hoje: as 79 que tem exemplo
executavel tem doc tambem, e a familia "Sem documento" saiu do catalogo - ela
existia para peca com exemplo e sem texto, caso que o `check:doc` ja nao deixa
passar.

Fora do `@rivocode/ui` principal ficam dois subcaminhos, `@rivocode/ui/form` e
`@rivocode/ui/chart`, cada um com dependencia de par opcional — quem nao usa
React Hook Form ou Recharts nao carrega nada deles. Mais os utilitarios:
`useZodForm`, `useWizard`, `useSidebar`, `useTelaEstreita`, `formatDate` e
`applyMask`.

**Fundacao:** tokens em tres camadas, temas `rivocode-dark` e `rivocode-light`,
densidade confortavel e compacta, guarda de cor literal e guarda de contraste.

## A publicacao do site, que mudou hoje

Ate hoje, o que estava no ar em `ds.rivocode.com.br` vinha de `vercel deploy`
rodado na mao. O workflow `docs` existia desde 25/08 e **nunca tinha publicado
uma vez** — foram dezesseis falhas seguidas.

A causa nao era a que a mensagem de erro dizia. O `VERCEL_TOKEN` do repositorio
era um token sem dono: a API o aceitava em tudo que se perguntasse por ela, e
por isso ele parecia certo em qualquer conferencia. Mas o CLI da Vercel carrega
o dono do token **antes de qualquer comando**, e parava com "Not able to load
user … User not found". Um erro que fala de usuario, num passo que fala de
projeto, com um token que passa em todos os testes de acesso. O token foi
trocado hoje por um criado como pessoa, com escopo no time dono do projeto.

**A primeira publicacao por CI foi o run `32978401957`**, em 26/08/2026 as
14:08 UTC, disparado a mao pelo `workflow_dispatch`. O run seguinte,
`32979630565`, ja saiu do push normal na `main` e publicou 158 paginas cruas.
Os dois terminam com `Aliased https://ds.rivocode.com.br`.

Como funciona: no push para a `main`, o workflow confere os tres segredos, faz
`vercel pull`, `vercel build --prod` e `vercel deploy --prebuilt --prod`. Nao ha
passo de alias — o dominio ja pertence ao projeto na Vercel, entao a
publicacao de producao o assume sozinha. O site e construido **aqui** e sobe
pronto, porque a Vercel construindo por conta propria exigiria plano Pro para
ler um repositorio privado de organizacao.

Antes de publicar, o workflow confere o que vai ao ar: `llms.txt`, `index.html`
e as paginas cruas de componente, com piso de cem. O site existe para ser lido
por agente, e um build sem o indice sobe bonito e inutil.

## O React Native

O `@rivocode/ui-native` esta na 0.2.0 no npm, publicado em 26/08. A tabela de
paridade em `.claude/skills/rivocode-ui/reference/native.md` mede peca por peca
contra o `native/src/index.ts`, e o `bun run check:paridade` a segura — ela nao
pode dizer que uma peca falta depois que ela chegou.

| No React Native      | Quantas | O que significa                                                            |
| -------------------- | ------: | ------------------------------------------------------------------------- |
| Traduz, mesmo nome   |      43 | mesma peca, mesmo nome de prop — a assinatura muda, veja abaixo            |
| Traduz, outro nome   |       3 | `Autocomplete` vira `Combobox`, `DataTable` vira `DataList`, `ToastViewport` vira `useToast` |
| `○ na fila`          |      21 | falta escrever; **e a pendencia real do nativo**                           |
| `✕ nao porta`        |      16 | decisao, nao atraso: idioma de mesa que nao tem sentido no toque           |

As 21 na fila: `ChartContainer`, `ChartDonut`, `ChartRadial`, `Clipboard`,
`Code`, `ColorPicker`, `DateRangePicker`, `Editable`, `FileUpload`, `Form`,
`Indicator`, `InputGroup`, `Item`, `PasswordInput`, `RelativeTime`, `Steps`,
`TagsInput`, `Timeline`, `Tracker`, `Tree`, `TreeSelect`.

Tres delas nao dependem so de escrever codigo: `Clipboard` e `FileUpload` pedem
uma dependencia do Expo, e dependencia e escolha do app, nao da biblioteca. Os
tres graficos dependem de um motor de desenho nativo que ainda nao existe — a
Recharts e DOM e nao atravessa.

**Aviso que vale mais que a tabela:** nome igual nao e API igual. No nativo tudo
e controlado (sem `defaultValue`) e a lista vem por `items`, nao por
composicao. Nunca prometa que a tela do web vai rodar no celular: o que se
reaproveita e o vocabulario de classes, o token e a escolha da peca. O JSX se
reescreve.

## O que esta pendente de verdade

1. **As 21 pecas na fila do nativo**, acima. E a maior lacuna aberta do
   repositorio, e a unica em que o trabalho e so escrever a peca.

2. **O workflow `release-native` nunca publicou.** As quatro tentativas
   falharam, e a ultima falhou com `E403 ... You cannot publish over the
   previously published versions: 0.2.0` — ou seja, a 0.2.0 que esta no npm
   subiu pela mao, e o caminho automatico segue sem prova de que funciona. Ele
   so vai ser exercitado de verdade na `native-v0.3.0`. O workflow `release`
   do web, esse ja publicou por CI: a 0.6.1 saiu da tag.

3. **A landing esta presa no `^0.2.0`.** O repo `rivocode.com` ja consome o
   pacote publicado, entao o bloqueio antigo acabou, mas ela esta quatro
   versoes menores atras da 0.6.1. Subir e trabalho de migracao de ponto de
   chamada, nao de publicacao.

4. **O sync com o claude.ai/design esta parado desde 24/08.** A ultima rodada do
   driver foi as 13:19 daquele dia, e nada tocou naquela pasta desde entao. O
   `ds-bundle/` e o `.design-sync/.cache/` continuam na arvore, nao versionados,
   com o material daquele dia. Vale registrar a duvida em vez de esconde-la:
   aquele sync existia para dar ao agente de design um catalogo que ele nao
   tinha, e desde entao o site cru em `ds.rivocode.com.br` passou a entregar a
   mesma coisa por HTTP, com `llms.txt` de indice. Provavelmente a pendencia
   deve ser fechada como abandonada, e nao retomada. Ninguem decidiu isso
   ainda.

## O que esta bloqueado esperando acao humana

Hoje, nada. Os dois bloqueios que este arquivo listava cairam:

- **Publicar no npm** — resolvido. Os dois pacotes estao no registro, e a conta
  desta maquina esta autenticada (`npm whoami` responde `emanuelbacalhau`). A
  nota anterior, de que `npm login` travava a publicacao do `ui-native`, nao
  vale mais: a 0.2.0 subiu em 26/08 as 05:06 UTC.
- **Publicar o site** — resolvido hoje, com a troca do token, acima.

O que continua valendo como restricao, e nao como bloqueio: **o repositorio e
privado**, entao o npm recusa `--provenance` com 422, e por isso os dois
workflows de release publicam sem assinatura. Tornar o repositorio publico e o
que devolve a procedencia. Esta escrito nos dois workflows, no lugar onde
alguem tentaria "consertar".

## Decisoes que continuam valendo

- **Mobile primeiro.** Decidir o que acontece em 390px antes de desenhar o
  desktop. Painel flutuante nao encosta na borda, calendario cai para um mes,
  dialogo vira folha de baixo, tabela rola dentro da propria moldura.
- **A TanStack Table entrou, como motor interno.** A decisao de 24/08 era
  deixa-la de fora; a spec do mesmo dia
  (`docs/superpowers/specs/2026-08-24-datatable-tanstack-design.md`) a reviu, e
  hoje o `DataTable` importa `@tanstack/react-table` v9 mais a
  `@tanstack/react-virtual` (`src/components/data-table.tsx`,
  `package.json:82`). O que a decisao protegia continua protegido, e e essa a
  parte que nao muda: nenhum tipo de terceiro vaza para a assinatura publica. A
  `Coluna<Linha>` continua nossa, a API e colunas mais tres booleanos, e
  ordenacao, filtro, paginacao e selecao entram por opcao.
- **React Query fica de fora.** E arquitetura de aplicacao, nao de design. O que
  cabe ao design system e a apresentacao dos estados que uma consulta produz, e
  isso o `DataTable` ja faz por `isLoading`, `isError` e `onRetry` — funciona
  igual com `fetch` na mao, com SWR ou com server component.
- **Receitas de tela inteira** (login, painel, listagem pronta) continuam de
  fora, porque receita nao versiona como componente e ninguem decidiu se elas
  moram aqui ou num pacote separado.

## Um numero que divergia

O catalogo do site contava **82** pecas e a tabela de paridade do nativo
contava **83**. A diferenca inteira era o `ButtonGroup`: o nome comeca por
`Button`, e a regra de prefixo do `parts.ts` o tratava como parte do `Button`,
apesar de ele ter documento e export proprios. Faltava so o nome na lista
`STANDALONE`, onde `CheckboxGroup`, `InputGroup` e `ToggleGroup` ja estavam.
Resolvido: o `ButtonGroup` entrou na lista, os dois numeros sao 83, e a peca
voltou a ter pagina propria em vez de morar dentro da do `Button`.

## Como retomar

```sh
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun install
bun run check        # quinze verificacoes mais os 552 testes
bun run shot         # gera a vitrine em demo/dist/
cd apps/docs && bun run dev   # o site de documentacao, local
```

O contrato de uso da biblioteca esta em `.design-sync/conventions.md` e no ar em
`ds.rivocode.com.br/convencoes.md`. A skill que um agente le esta em
`.claude/skills/rivocode-ui/`, e vai dentro do pacote publicado (`skill/`,
gerado por `bun run build:skill`). As notas do sync com o claude.ai/design estao
em `.design-sync/NOTES.md`. O spec da fundacao esta nos outros dois arquivos
desta pasta.

## Como conferir cada numero

```sh
ls src/components | wc -l                          # 76 arquivos (peca != arquivo)
ls .design-sync/docs/*.md | wc -l                  # 158 documentos
bun test                                           # 552 pass, 68 arquivos
bun test ./test                                    # 453 do web, 59 arquivos
bun test native/test                               # 99 do nativo, 9 arquivos
bun run check:paridade                             # confere as 83 linhas da tabela
npm view @rivocode/ui version                      # 0.6.1
npm view @rivocode/ui-native version               # 0.2.0
gh run list --workflow=docs --limit 5              # a publicacao do site
gh run list --workflow=release-native --limit 5    # as quatro falhas
curl -sI https://ds.rivocode.com.br/llms.txt       # 200, text/plain
```

As 83 pecas nao saem de um `ls`: elas saem do catalogo, que separa peca de
parte. O caminho curto e `curl -s https://ds.rivocode.com.br/llms.txt | head`,
que abre dizendo o numero. Localmente, `ENTRIES` em `apps/docs/src/catalog.ts`.

## O que nao foi medido

- **Se a landing publicada esta com o pacote do npm ou com uma build antiga.**
  Foi medido o `package.json` e o `node_modules` do repo `rivocode.com` local
  — os dois dizem 0.2.0 —, mas nao o que esta servido em producao.
- **Se o sync com o claude.ai/design chegou a subir alguma coisa naquele dia.**
  O que se sabe e a data do ultimo log local. O estado do lado de la nao foi
  consultado.
