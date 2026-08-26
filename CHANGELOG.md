# Mudancas

## 0.5.0 (nao publicado)

### `format` significava tres coisas, e agora significa uma

Nas pecas que escrevem numero, `format` era `Intl.NumberFormatOptions`; no
eixo do grafico, era nome de formatador ou funcao; no `ChartDonut`, so funcao.
O caminho que dava erro de tipo era o menos ruim - o que nao dava e pior:
`{ style: "percent" }` num medidor de 0 a 100 imprime 8.200% ao lado de uma
barra em 82%, e nada reclama.

| Peca | Antes | Agora |
|---|---|---|
| `Meter`, `Progress`, `Slider` | `format={{ style: "percent" }}` | `numberFormat={{ style: "percent" }}` |
| `Meter`, `Progress`, `Slider` | — | `format="percent"` ou `format={(v) => ...}` |
| `NumberField` | `format={{ ... }}` | `numberFormat={{ ... }}` |
| `ChartDonut` | so funcao | tambem nome: `format="currencyShort"` |

O `NumberField` nao aceita nome de formatador, e a razao e o campo ser
editavel: um formatador so escreve, e o que a pessoa digita precisa ser lido de
volta.

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
