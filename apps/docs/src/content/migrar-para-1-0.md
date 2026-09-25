A 1.0 é a primeira versão em que o contrato vale como promessa: o
`@rivocode/ui` sai da 0.20 e o `@rivocode/ui-native` sai da 0.16 direto para a
1.0.0, e daqui em diante nada quebra fora de uma versão maior. Para chegar
limpo nesse ponto, a biblioteca tirou o que estava obsoleto e deu um nome só a
cada ideia. Esta página lista cada troca, peça por peça, com o nome antigo e o
novo.

Quase tudo aqui é renomeação que o TypeScript acusa: suba a versão, rode o
`tsc` e siga a lista de erros com esta página aberta. As poucas mudanças que o
tipo não pega estão numa seção própria, no fim, e são as que pedem olhar a tela.

```bash
npm install @rivocode/ui@^1.0.0          # web
npm install @rivocode/ui-native@^1.0.0   # React Native
npx tsc --noEmit
```

Quem usa o Claude Code pode copiar o agent `migracao`, que mora em
`.claude/agents/migracao.md` no [repositório da
biblioteca](https://github.com/Rivocode/ui), para o `.claude/agents/` do
projeto e pedir a migração: ele conhece esta tabela, reescreve os pontos de
chamada uma quebra por vez e roda o `tsc` entre elas.

## As quatro regras por trás da lista

Quase toda linha abaixo é um caso de uma destas quatro regras, e saber qual é
ajuda a migrar o que a tabela não previu:

- **Texto de interface mora em `labels`.** Não existe mais prop solta terminada
  em `Label` para o texto que a peça escreve sozinha: `retryLabel` virou
  `labels.retry`, `dismissLabel` virou `labels.dismiss`, e assim por diante. A
  chave é o nome antigo sem o `Label`. Passe só as chaves que mudam. O que
  continua prop é conteúdo: o `label` que dá nome ao campo, o `title`, o
  `placeholder`.
- **Abrir e fechar se chama `open`.** `open`, `defaultOpen` e `onOpenChange`
  em toda peça, inclusive nas que diziam `expanded`. O passo de uma sequência
  se chama `step`.
- **Ação que apaga se chama `danger`.** O mesmo nome do `tone="danger"` do
  `Popconfirm` e do `MenuItem`.
- **Parte se veste por `classNames`, e a peça se nomeia por `label`.** Somem
  as props `xxxClassName` avulsas e, no nativo, o `accessibilityLabel` das
  peças que já tinham nome.

## Web: `@rivocode/ui`

### Button, IconButton e Clipboard

| Peça | Antes | Na 1.0 |
|---|---|---|
| `Button` | `variant="destructive"` | `variant="danger"` |
| `Button` | `size="icon"`, `size="iconSm"` | `IconButton` com `label` e `size="md"` ou `size="sm"` |
| `Button` | `size="cta"` | `size="xl"`, que é só tamanho; o negrito, se quiser, vem de `className="font-rc-bold"` |
| `IconButton` | `variant="destructive"` | `variant="danger"` |
| `Clipboard` | `variant="destructive"` | `variant="danger"` |
| `Clipboard` | `size="icon"`, `"iconSm"`, `"cta"` | `size="sm"`, `"md"` ou `"lg"`; sem texto, o quadrado sai de um `IconButton` |
| `Clipboard` | `aria-label` | `labels={{ copy, copied }}`, que já nomeava o botão |

```tsx
// Antes
<Button size="iconSm" variant="destructive" aria-label="Excluir nota">
  <Trash2 size={16} />
</Button>

// Na 1.0
<IconButton size="sm" variant="danger" label="Excluir nota">
  <Trash2 />
</IconButton>
```

### Calendar, DatePicker e DateRangePicker

| Peça | Antes | Na 1.0 |
|---|---|---|
| `Calendar` | `mode="single"` com `selected` e `onSelect` | `value` e `onValueChange`, sem `mode`; `multiple` e `range` continuam no `mode` |
| `Calendar`, `DatePicker`, `DateRangePicker` | `startMonth`, `endMonth` | `min`, `max`, que param a navegação no mesmo mês e ainda bloqueiam os dias de fora |
| `DateRangePicker` | tipo `DateRange` do react-day-picker, com `to` opcional | `DateRange` próprio, `{ from: Date; to: Date }`, as duas pontas obrigatórias |
| `DateRangePicker` | `onValueChange(range: DateRange \| undefined)`, chamado já no primeiro clique com o período pela metade | `onValueChange(range: DateRange \| null)`: só período fechado, ou `null` quando a escolha esvazia |

O `DateRangePicker` com `Date` passou a responder como o formato em texto já
respondia: o período pela metade fica no calendário e nunca chega ao seu estado.
O `null` aparece no `onValueChange`, mas no `value` o vazio continua sendo
`undefined`, porque `null` no `value` é o que escolhe o formato em texto:

```tsx
// Antes
const [period, setPeriod] = useState<DateRange | undefined>()
<DateRangePicker value={period} onValueChange={setPeriod} />
// period?.to podia ser undefined, e o Limpar mandava undefined

// Na 1.0
const [period, setPeriod] = useState<DateRange | null>(null)
<DateRangePicker value={period ?? undefined} onValueChange={setPeriod} />
// period é null ou tem from e to
```

O `DateRange` continua saindo do `@rivocode/ui`, mas deixou de ser o do
`react-day-picker`. Quem misturava os dois tipos troca o import para o nosso.

### Checkbox, Radio e Switch

| Peça | Antes | Na 1.0 |
|---|---|---|
| `Checkbox`, `Radio`, `Switch` | `labelClassName` | `classNames={{ label }}` |

### Steps, Spoiler e Tree

| Peça | Antes | Na 1.0 |
|---|---|---|
| `Steps` | `current` | `step` |
| `Steps` | `onStepClick(index)` | `onStepChange(step)`, com o mesmo índice |
| `Spoiler` | `expanded`, `defaultExpanded`, `onExpandedChange` | `open`, `defaultOpen`, `onOpenChange` |
| `Tree` | `expanded`, `onExpandedChange` | `open`, `onOpenChange`, e agora há `defaultOpen` |

### Texto de interface em `labels`

Toda prop desta tabela saiu sem apelido de compatibilidade. Onde era
`ReactNode`, a chave nova é `string`.

| Peça | Antes | Na 1.0 |
|---|---|---|
| `Alert`, `Banner` | `dismissLabel` | `labels={{ dismiss }}` |
| `Popconfirm` | `confirmLabel`, `cancelLabel`, `busyLabel` | `labels={{ confirm, cancel, busy }}` |
| `QueryBoundary`, `DataTable`, `VirtualList`, `EventCalendar`, `Gantt`, `ChartContainer` | `retryLabel` | `labels={{ retry }}` |
| `Link` | `externalLabel` | `labels={{ external }}` |
| `ColorPicker` | `swatchesLabel` | `labels={{ swatches }}` |
| `Conversation` | `scrollLabel` | `labels={{ scroll }}` |
| `PromptInput` | `submitLabel`, `stopLabel` | `labels={{ submit, stop }}` |
| `ChartFunnel` | `rateLabel`, `overallLabel` | `labels={{ rate, overall }}` |
| `ChartFunnel` | `overallLabel={false}` | `showOverall={false}` |
| `ChartHeatmap` | `emptyLabel` | `labels={{ empty }}` |

```tsx
// Antes
<Popconfirm
  trigger={<Button variant="ghost">Excluir</Button>}
  title="Excluir a nota 4813?"
  onConfirm={remove}
  confirmLabel="Excluir"
  cancelLabel="Manter"
/>

// Na 1.0
<Popconfirm
  trigger={<Button variant="ghost">Excluir</Button>}
  title="Excluir a nota 4813?"
  onConfirm={remove}
  labels={{ confirm: 'Excluir', cancel: 'Manter' }}
/>
```

Muitas peças ganharam `labels` também para o texto que antes estava cravado em
português, sem prop nenhuma: `Pagination`, `Breadcrumb`, `NumberField`, `Tree`,
`TreeSelect`, `SidebarTrigger`, `FileUpload`, `DatePicker`, `DateRangePicker`,
`EventCalendar`, `Gantt`, `Kbd`, `Stat`, `AvatarGroup`, `OTPField`, `Steps` e
outras. Isso não quebra nada: sem `labels`, a tela continua em português. O xis
dos avisos se traduz no provider, com `toastLabels`. O `EventCalendar` e o
`Gantt` ganharam também `locale` para os nomes de mês e de dia, com `pt-BR` de
padrão.

### Formulário: `@rivocode/ui/form`

| Antes | Na 1.0 |
|---|---|
| `forDatePicker` | `forDate` |
| `forSelect` | `forValue` |
| `forCheckbox` | `forChecked` |
| tipo `PropsDeDatePicker` | `DateProps` |
| tipo `PropsDeSelect` | `ValueProps` |
| tipo `PropsDeCheckbox` | `CheckedProps` |

## React Native: `@rivocode/ui-native`

### Button, IconButton, Clipboard e Spinner

| Peça | Antes | Na 1.0 |
|---|---|---|
| `Button`, `IconButton`, `Clipboard` | `variant="destructive"` | `variant="danger"` |
| `IconButton` | `accessibilityLabel` | `label`, obrigatório |
| `Spinner` | `size="small"`, `size="large"` | `size="md"`, `size="lg"` (há também `sm`) |

### AlertDialog

O `AlertDialog` nativo passou a falar com os nomes do `Popconfirm` do web:

| Antes | Na 1.0 |
|---|---|
| `actionLabel` (obrigatório) | `labels={{ confirm }}`; sem ele, "Confirmar" |
| `onAction` | `onConfirm` |
| `cancelLabel` | `labels={{ cancel }}` |
| `busyLabel` | `labels={{ busy }}` |
| - | `onCancel`, novo: chamado no botão de cancelar e no voltar do Android |

```tsx
// Antes
<AlertDialog
  open={open}
  onOpenChange={setOpen}
  title="Cancelar a nota 4813?"
  description="O cliente recebe o aviso de cancelamento."
  tone="danger"
  actionLabel="Cancelar nota"
  cancelLabel="Manter nota"
  onAction={cancelInvoice}
/>

// Na 1.0
<AlertDialog
  open={open}
  onOpenChange={setOpen}
  title="Cancelar a nota 4813?"
  description="O cliente recebe o aviso de cancelamento."
  tone="danger"
  labels={{ confirm: 'Cancelar nota', cancel: 'Manter nota' }}
  onConfirm={cancelInvoice}
/>
```

O `tsc` acusa o `actionLabel` e o `onAction` que sobraram. O cuidado é na hora
de calar o erro: `actionLabel` era obrigatório e `labels.confirm` não é, então
apagar a prop em vez de mover o texto compila, e o botão sai escrito
"Confirmar".

### Parte por `classNames`

| Peça | Antes | Na 1.0 |
|---|---|---|
| `CurrencyInput`, `PostalCodeField`, `TagsInput` | `inputClassName` | `classNames={{ input }}` |
| `InputGroup` | `inputClassName` | `classNames={{ input }}`, e agora `prefix`, `suffix` e `action` |
| `PasswordInput` | `inputClassName` | `classNames={{ input }}` |
| `Highlight` | `markClassName` | `classNames={{ mark }}` |
| `Indicator` | `badgeClassName` | `classNames={{ badge }}` |
| `Menu` | `triggerClassName` | `classNames={{ trigger }}`, e agora `content` e `item` |
| `ScrollArea` | `footerClassName` | `classNames={{ footer }}`; o `contentContainerClassName` fica |

### O nome da peça por `label`

| Peça | Antes | Na 1.0 |
|---|---|---|
| `Checkbox` | `accessibilityLabel` | `label`; sem `children`, ele é obrigatório |
| `Switch` | - | `label`; sem `children`, ele é obrigatório |
| `SignaturePad` | `accessibilityLabel` | `label` |
| `OTPField` | - | `label`, novo e opcional |

Os adaptadores `forChecked` e `forDate` de `@rivocode/ui-native/form` passam o
rótulo do `FormField` como `label`, e não mais como `accessibilityLabel`. O
`forValue` entrega os dois. Só muda algo para quem espalha o resultado num
componente próprio que lia o `accessibilityLabel`.

### Estado com um nome só

| Peça | Antes | Na 1.0 |
|---|---|---|
| `Steps` | `current` | `step` |
| `Spoiler` | `expanded`, `defaultExpanded`, `onExpandedChange` | `open`, `defaultOpen`, `onOpenChange` |
| `DataList` | `selected`, `onSelectedChange` | `value`, `onValueChange` |
| `Accordion` | sem `multiple`, vários abertos | sem `multiple`, um aberto por vez, como no web; passe `multiple` para o comportamento antigo |

### Texto de interface em `labels`

| Peça | Antes | Na 1.0 |
|---|---|---|
| `Alert`, `Banner` | `dismissLabel` | `labels={{ dismiss }}` |
| `QueryBoundary`, `DataList`, `ChartContainer` | `retryLabel` | `labels={{ retry }}` |
| `Link` | `externalLabel` | `labels={{ external }}` |
| `ColorPicker` | `swatchesLabel` | `labels={{ swatches }}` |
| `TagsInput` | `removeLabel` | `labels={{ remove }}` |
| `Conversation` | `scrollLabel` | `labels={{ scroll }}` |
| `PromptInput` | `submitLabel`, `stopLabel` | `labels={{ submit, stop }}` |
| `ChartFunnel` | `rateLabel`, `overallLabel` | `labels={{ rate, overall }}` |
| `ChartFunnel` | `overallLabel={false}` | `showOverall={false}` |
| `ChartHeatmap` | `emptyLabel` | `labels={{ empty }}` |

Como no web, várias peças ganharam `labels` para o texto que estava cravado:
`Dialog`, `Sheet`, `SearchInput`, `Editable`, `NumberField`, `Calendar`,
`DatePicker`, `DateRangePicker`, `Select`, `Combobox`, `Autocomplete`,
`TreeSelect`, `Tree`, `Slider`, `Rating`, `Tracker`, `Menu` e
`RelativeTime`. Nada disso quebra.

### MaskedInput

| Antes | Na 1.0 |
|---|---|
| molde com `#` para dígito, como `"#####-###"` | a sintaxe do web: `9` dígito, `A` letra, `*` letra ou dígito, como `"99999-999"` |

Esta troca o `tsc` não pega: o `mask` aceita qualquer texto, porque o molde
escrito à mão é texto. Procure `#` nos moldes do projeto e troque cada um por
`9`. Um `A` que no molde antigo era letra fixa passa a ser vaga de letra.

## O que o tipo não pega

Estas mudanças compilam sem erro e mudam a tela. Depois do `tsc` verde, abra
cada uma delas:

- **`Button size="xl"` não é negrito.** O `cta` pintava `font-rc-bold`; o `xl`
  fica no peso médio, como `sm`, `md` e `lg`. Para a chamada de marketing
  continuar em negrito, some `className="font-rc-bold"`.
- **`DateRangePicker` com `Date` não avisa mais no primeiro clique**, nem com
  `undefined` no Limpar: o `onValueChange` só recebe período fechado, ou `null`.
  Quem testava `range?.to` para ignorar o meio do caminho pode apagar o teste.
- **`Accordion` do nativo sem `multiple` abre um item por vez.** Para manter
  vários abertos, passe `multiple`.
- **`ColorPicker` dentro de um `Field`** não desenha mais o próprio `label`: o
  rótulo na tela é o do `FieldLabel`, e o `label` do `ColorPicker` passa a só
  nomear a grade para o leitor de tela.
- **`PromptInput` do nativo cresce até 8 linhas**, como o do web, e não mais 6.
- **`AlertDialog` do nativo sem `labels.confirm`** escreve "Confirmar" no
  botão.
- **`MaskedInput` do nativo com `#` no molde** compila e deixa de pontuar:
  sem nenhuma vaga que ele reconheça, o campo aceita os dígitos crus, sem
  hífen, sem ponto e sem limite de tamanho. Troque cada `#` por `9`.

## Daqui para a frente

A partir da 1.0, os dois pacotes seguem versionamento semântico à risca:

- **Quebra só em versão maior** (2.0, 3.0). Tirar ou renomear prop, trocar o
  padrão de uma prop ou o formato de um callback é quebra.
- **Antes de sair, a prop fica obsoleta por pelo menos uma versão menor**, com
  `@deprecated` no tipo dizendo o caminho novo, e só sai na versão maior
  seguinte.
- **Prop nova e peça nova são versão menor** (1.1, 1.2).
- **Correção é versão de correção** (1.0.1).

O `CHANGELOG.md` de cada pacote diz, em cada versão, o que muda para quem
consome.
