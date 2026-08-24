# Notas do sync com o claude.ai/design

Projeto: `RivoCode` (`ee82ac5d-bfc0-4f2f-959a-5e371dddee8b`).

## O que custou tempo na primeira vez

- **`package.json` precisa de `types` no topo.** O conversor le
  `pkg.types`, nao o bloco `exports`. Sem ele encontra zero componentes e
  reporta `[ZERO_MATCH] tokens-only DS`, que parece um problema de outra
  natureza. Ja corrigido no pacote, e util para outras ferramentas tambem.

- **A pasta de codigo precisa se chamar `components`.** O conversor tira o
  grupo do nome do diretorio, e so ignora nomes genericos
  (`components`, `component`, `src`, `lib`, `ui`, `packages`, `react`). Com
  `src/primitives` os 14 componentes com preview autorado ficavam todos num
  grupo "primitives" e a categoria do documento era ignorada. Renomeado.

- **`provider` no `cfg` tem que ser `scope: 'local'`.** No modo global o
  RivoProvider veste os tokens mas nao pinta fundo, entao o cartao fica branco
  com texto quase branco por cima e as variantes de contorno e fantasma somem.

- **Os previews precisam de folha propria.** O Tailwind da biblioteca varre
  so `src/`, entao uma classe usada apenas num preview (`h-12`, `max-w-lg`)
  nao existe e o cartao renderiza incompleto **sem nenhum aviso**. Por isso
  existe `.design-sync/sync.css`, que varre tambem `previews/`, e o
  `cfg.cssEntry` aponta para o resultado dela. A CSS de producao continua
  enxuta. Recompilar antes de cada sync:

  ```sh
  bunx @tailwindcss/cli -i .design-sync/sync.css -o .design-sync/.cache/styles.css
  bun run scripts/copy-fonts.ts .design-sync/.cache/styles.css
  ```

- **Playwright**: a versao mais recente (1.62) pede o chromium 1234, que ja
  estava no cache da maquina. Nada para baixar.

## Avisos conhecidos, ja triados

Nenhum. A ultima verificacao saiu com zero avisos e `bad: 0`.

Cinco componentes tem `cardMode` fixado porque flutuam e nao cabem na grade:
`Checkbox` (column), `Dialog`, `Menu`, `Select`, `Tooltip` e `ToastViewport`
(single). Isso e apresentacao, nao defeito.

## Segunda rodada, 24/08/2026

O catalogo foi de 15 para 41 componentes e o sync ficou 26 atras. Foram
autorados 26 previews e 35 documentos novos, e o `docsMap` passou de 52 para 87
entradas.

Uma porta de erro silencioso foi fechada: os previews nao eram checados por
tipo, entao um `variant` inexistente ou uma prop renomeada so aparecia como
cartao incompleto no sync. Agora `bun run check:previews` compila a pasta
contra o **fonte**, por `paths` no `.design-sync/tsconfig.json`, sem depender de
build nem de `bun link`. Entrou no `bun run check`.

A `sync.css` passou a varrer tambem `src/form`.

**O upload ainda nao foi feito**: ele depende da skill `/design-sync`, que nao
esta instalada nesta maquina. O material local esta pronto para quando ela
estiver.

## Riscos para o proximo sync

- **Os compostos continuam no cartao de piso** (`CardHeader`, `TableCell`,
  `MenuItem`, `ComboboxList` e afins). Eles importam e funcionam, so nao tem
  preview proprio. Autorar e opcional e incremental.

- **Os previews de peca flutuante usam `defaultOpen` e uma altura minima**
  (`min-h-72`), senao o cartao sai vazio. Vale para `AlertDialog`, `Sheet`,
  `Popover` e `Combobox`.

- **O `Sidebar` tem altura fixa no preview** e nao `min-h-dvh`, senao o cartao
  cresce ate o tamanho da janela de captura.

- **A folha `.design-sync/.cache/styles.css` e gerada e gitignorada.** Se ela
  nao for recompilada antes do build, o sync usa a versao velha e classes novas
  de preview somem sem avisar. Este e o risco mais silencioso deste setup.

- **O `_ds_manifest.json` e o `_adherence.oxlintrc.json` no projeto sao do
  app**, nao nossos. Nao apagar.

- **A landing tinha `Header` e `Logo` sincronizados antes**, de quando o design
  system eram os componentes do site. Foram apagados neste sync. Se alguem
  sentir falta, o lugar deles e outro projeto, nao este.
