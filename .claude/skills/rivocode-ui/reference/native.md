# Construir tela nativa com o ui-native

O React Native fala o **mesmo vocabulário** do web (`bg-bg`, `text-fg-muted`,
`rounded-pill`) via NativeWind, sobre um `theme.css` gerado dos mesmos tokens
(`bun run gen:native` na raiz). Nenhum componente conhece a cor da marca aqui
também.

Os componentes vivem em `native/src` e o app de exemplo em `examples/native`
(`bunx expo start --ios`). O CSS do app é pré-compilado:
`node scripts/build-css.mjs` dentro do app: mudou classe nova, rode de novo.

## Tema: os dois de casa trocam em runtime, o do cliente é build

`theme="rivocode-dark" | "rivocode-light" | "system"` troca a tela inteira em
runtime, porque essas cores foram compiladas como `light-dark()` e o provider só
gira o `Appearance`. **Tema de cliente não funciona assim, e supor que funciona
custa um dia.**

- **A cor de classe só muda em BUILD.** O compilador do `react-native-css` crava
  o valor dentro da regra (`.bg-accent` vira `{"backgroundColor":"#d4f34a"}`), e
  no CSS compilado não sobra uma ocorrência de `--`. Logo nenhum objeto de tema
  passado em runtime jamais trocou cor de classe.
- **O mapa de tema SAIU do provider.** Ele alcançava só quem lê cor
  por JS (`ChartDonut`, `ChartRadial`, o giro do `Button` e do `Spinner`, o
  trilho do `Switch`, a `Sparkline`, o texto de dica dos campos), e o sintoma era
  tela MISTURADA: donut de um tema e botão de outro, lado a lado. O provider
  passou a resolver os 45 papéis lendo o CSS compilado, uma classe `bg-` por
  papel, então contexto e classe dizem sempre a mesma cor. A prop `theme` aceita
  só `rivocode-dark`, `rivocode-light` e `system`, e a prop `scheme` saiu junto
  com o mapa, porque era ela que escolhia o esquema dele.
- **O teto é de dois temas por build.** `light-dark()` tem duas vagas. Um
  cliente por app cabe; uma vitrine de cinco temas pede cinco bundles.

O caminho que funciona: sobrescrever os papéis num `@theme` do `global.css` do
app, depois do `@rivocode/ui-native/theme.css`, e pré-compilar de novo.

```css
@import "@rivocode/ui-native/theme.css";
@import "tailwindcss/utilities.css";

@theme {
  --color-accent: #2563eb;
  --color-accent-fg: #ffffff;
  --color-bg: light-dark(#f7f8fa, #0d1220);
  /* …e os outros papéis que a marca troca. */
}
```

Isto sozinho veste a tela inteira, gráfico incluído: a classe pinta a cor nova,
e a peça que lê cor por JS lê a mesma cor do mesmo CSS. Não passe mapa nenhum na
prop `theme`, e nunca prometa troca de marca em runtime numa tela nativa.

## Mesmo nome não é mesma API

Onde o nome da peça é o mesmo, o nome da prop também é (`Avatar fallback`,
`OTPField onValueComplete`, `ToggleGroup multiple`). **A assinatura, não.**
Nenhuma peça aceita o mesmo JSX dos dois lados, por duas regras:

- **No nativo tudo é controlado**: sem `defaultValue`, `defaultChecked`,
  `defaultOpen`. `<Checkbox checked={x} onCheckedChange={setX} />`, as duas
  obrigatórias.
- **A lista vem por `items`, não por composição**: `RadioGroup`,
  `CheckboxGroup`, `ToggleGroup`, `Combobox`, `Tabs` e `Select` recebem o
  array e desenham a folha: `<Select items={…} value onValueChange label />`,
  sem `SelectTrigger`/`SelectContent`/`SelectItem`. O `label` é obrigatório
  porque é ele que o leitor de tela anuncia.

Nunca prometa que a tela do web "vai rodar no celular": o que se reaproveita é
o vocabulário de classes, o token e a escolha da peça. O JSX se reescreve.

O que sobra dessas duas regras — prop que troca de nome, tipo que troca de
forma, variante que só existe de um lado — está na tabela da próxima seção,
peça por peça. Leia a linha antes de reescrever a chamada: os seis casos que
mais custaram tempo (`SearchInput`, `MaskedInput`, `Timeline`, `Sparkline`,
`Popconfirm` e `Meter`) foram descobertos um a um, no `tsc`, por não estarem
escritos em lugar nenhum.

## A assinatura, prop a prop

**147 divergências de assinatura em 66 peças.** As duas regras acima (tudo controlado, lista por `items`) valem em todo o catálogo; o que está aqui é o que sobra delas — prop que muda de nome, tipo que muda de forma, e variante que existe de um lado só. `—` quer dizer que não há prop equivalente daquele lado. Todas as três colunas são conferidas contra os dois pacotes por `bun run check:assinatura`.

| Peça | No web | No React Native | O que muda na chamada |
| --- | --- | --- | --- |
| `Accordion` | `value` | — | a raiz não guarda valor: cada `AccordionItem` abre sozinho, com `defaultOpen` |
| `Accordion` | `multiple` | — | sem raiz controlada, vários abertos é o único modo |
| `Accordion` | — | `children` | a raiz só empilha; quem tem prop é o item |
| `AccordionItem` | — | `title` | o cabeçalho vira `title`, no lugar do `AccordionTrigger` por filho |
| `AccordionItem` | `value` | — | não há valor de item: quem abre e fecha é o próprio item |
| `Alert` | — | `title` | o título vira prop; no web ele é `AlertTitle` por filho |
| `Alert` | `icon` | — | o ícone é o do tom, e não se troca |
| `Alert` | `onDismiss` | — | não há fechar: aviso que some no toque some sem ninguém ver, e `dismissLabel` sai junto |
| `AlertDialog` | — | `title` | `title` e `description` viram props obrigatórias, no lugar de `AlertDialogTitle` e `AlertDialogDescription` |
| `AlertDialog` | — | `actionLabel` | o botão que confirma é `actionLabel` mais `onAction`, e não um `AlertDialogClose` no rodapé |
| `AlertDialog` | `open` | `open` | `open` e `onOpenChange` são obrigatórios, e não fecha no toque fora |
| `Autocomplete` → `Combobox` | `value` | `value` | no web `value` é o texto digitado e ele pode não estar na lista; no nativo é o item escolhido (`string` ou `string[]`) |
| `Autocomplete` → `Combobox` | `mode` | — | não há completar inline: a folha filtra e a pessoa toca |
| `Autocomplete` → `Combobox` | `items` | `items` | grupos (`Group[]`) não portam: a folha recebe uma lista rasa de `{ label, value }` |
| `Avatar` | `src` | — | imagem remota ainda não entra: só as iniciais, e `alt` sai junto |
| `Avatar` | `fallback` | `fallback` | vira obrigatória, porque é tudo que a peça tem para desenhar |
| `Button` | `size` | `size` | `cta`, `icon` e `iconSm` não portam: alvo de toque não encolhe, e botão de ícone se resolve com `hitSlop` |
| `Button` | `shape` | — | sem pílula: o raio é o do token, igual em todo botão |
| `Calendar` | — | `value` | o web é o react-day-picker (`mode`, `selected`, `onSelect`); o nativo é um mês desenhado à mão com `value`/`onValueChange` |
| `Calendar` | `startMonth` | — | a faixa é `min`/`max` em ISO `aaaa-mm-dd`, e não `startMonth`/`endMonth` em `Date` |
| `Calendar` | `mode` | — | só data única: intervalo é o `DateRangePicker` |
| `ChartContainer` | — | `children` | `children` é função e recebe `{ width, height, colors }`: não há `ResponsiveContainer` para medir por você, e a medida chega zerada no primeiro quadro |
| `ChartContainer` | `empty` | `empty` | `title` e `description` do vazio são `string`, e não `ReactNode`; `icon` sai |
| `ChartContainer` | `errorTitle` | `errorTitle` | `errorTitle`, `errorMessage` e `retryLabel` viram `string` |
| `ChartDonut` | `format` | `format` | só função `(value: number) => string`: nome de formatador da casa pediria o `Intl` no bundle |
| `ChartDonut` | `centerValue` | `centerValue` | `centerValue` e `centerLabel` viram `string` |
| `ChartRadial` | `color` | `color` | no web é qualquer cor de CSS; no nativo é papel de token (`chart-1`…`chart-8`), senão a peça fica surda ao tema |
| `Checkbox` | `indeterminate` | — | não há terceiro estado, e `parent` sai junto: o pai de um grupo se desenha à mão |
| `Checkbox` | — | `accessibilityLabel` | sem `children`, é ele que nomeia a caixa para o leitor de tela |
| `Clipboard` | `variant` | `variant` | só `secondary` e `ghost`: o copiar não é ação destrutiva nem primária |
| `Clipboard` | — | `toast` | o aviso falado vem junto e `toast={false}` desliga: rótulo trocado sob o dedo não é reanunciado |
| `Code` | — | `children` | `children` é `string`, e não `ReactNode`: o trecho é texto |
| `Collapsible` | `open` | — | a peça guarda o próprio aberto; `defaultOpen` é o que se passa |
| `Collapsible` | — | `label` | o cabeçalho vira `label`, no lugar de `CollapsibleTrigger` e `CollapsiblePanel` |
| `ColorPicker` | `label` | `label` | `label` é `string`: sem `ReactNode`, como em toda peça do nativo |
| `Combobox` | `items` | `items` | `items` na raiz e obrigatória; sem `ComboboxItem` por filho e sem grupos |
| `Combobox` | — | `label` | `label` é obrigatório: é ele que o leitor de tela anuncia, no lugar do `aria-label` |
| `Combobox` | — | `searchPlaceholder` | a folha tem busca própria; `emptyMessage` é o texto de lista vazia |
| `Combobox` | `filter` | — | o filtro é da peça e ignora acento; não se troca |
| `DataTable` → `DataList` | `columns` | `renderItem` | não há coluna: `renderItem` desenha a linha inteira |
| `DataTable` → `DataList` | `rowKey` | `keyExtractor` | mesmo papel, nome do React Native |
| `DataTable` → `DataList` | `onRowClick` | `onRowPress` | mesmo papel, nome do toque |
| `DataTable` → `DataList` | `value` | `selected` | a seleção é `selected` mais `onSelectedChange`, e não `value`/`onValueChange` |
| `DataTable` → `DataList` | `pageSize` | — | lista de celular rola: sem página, e `virtual`, `rowHeight` e `maxHeight` saem junto |
| `DataTable` → `DataList` | — | `filterValue` | o `filter` só busca no que esta função devolve, porque não há coluna de onde tirar texto |
| `DatePicker` | `value` | `value` | o valor é ISO `aaaa-mm-dd` em `string`, e não `Date`; a exibição continua `dd/mm/aaaa` |
| `DatePicker` | `startMonth` | — | a faixa é `min`/`max` em ISO, e `disabledDays` não porta |
| `DatePicker` | `confirm` | — | a folha sempre confirma: escolher já fecha |
| `DatePicker` | — | `label` | `label` é obrigatório, e o campo não vive dentro de um `Field` |
| `DateRangePicker` | `value` | `value` | as duas pontas são ISO `string` num `{ from, to }`, e não `Date` |
| `DateRangePicker` | `numberOfMonths` | — | um mês por folha, sempre |
| `DescriptionItem` | `label` | `label` | `label` é `string`, e o corpo continua sendo filho |
| `Dialog` | — | `title` | `title` é prop obrigatória e `description` é prop: sem `DialogTitle` e sem `DialogTrigger` |
| `Dialog` | `open` | `open` | `open` e `onOpenChange` são obrigatórios: quem abre é quem chama |
| `Editable` | `value` | `value` | `value` e `onValueChange` obrigatórios; quem abre é o toque longo, e há um `Cancelar` visível |
| `EmptyState` | `title` | `title` | `title` e `description` são `string` |
| `EmptyState` | `icon` | — | sem ícone: o desenho é texto e ação |
| `Field` | — | `label` | `label`, `description` e `error` viram props: sem `FieldLabel`, `FieldDescription` e `FieldError` |
| `Field` | `validate` | — | a validação é do formulário, e não do campo: veja `@rivocode/ui-native/form` |
| `Fieldset` | — | `legend` | `legend` vira prop obrigatória, no lugar do `FieldsetLegend` |
| `FileUpload` | `onSelect` | `onSelect` | o que volta é `PickedFile` com `uri` local, e não `File`: `size` pode faltar |
| `FileUpload` | `accept` | `accept` | aceita lista, e fala MIME: é o que o seletor do sistema sabe filtrar |
| `FileUpload` | `label` | `label` | `label` e `hint` são `string`, e a área de soltar vira um botão |
| `FilterBar` | `labels` | `labels` | `labels.empty` é `string`, e `labels.scroll` não existe: quem rola é a lista |
| `FilterChip` | `value` | `value` | `value` é `string`: a pílula não recebe elemento |
| `Form` | — | `children` | `children` é função e recebe `{ submit, isSubmitting }`: nada envia sozinho, porque não há `<form>` nem `type="submit"` |
| `FormField` | `label` | `label` | `label` vira obrigatório e é `string`: é ele que vira `accessibilityLabel` no controle |
| `FormField` | `description` | `description` | `description` é `string` |
| `Indicator` | `label` | `label` | `label` vira obrigatório: a pastilha é uma parada só do leitor de tela, e o que ela diz é a frase |
| `Indicator` | `classNames` | `badgeClassName` | uma classe só, a da pastilha: não há `classNames` no pacote nativo |
| `Input` | `onValueChange` | — | o campo é um `TextInput`: `value` mais `onChangeText` |
| `Input` | — | `font` | escolhe o papel de fonte, que o web resolve por classe |
| `InputGroup` | — | `prefix` | `prefix`, `suffix` e `actions` viram props: sem `InputPrefix`, `InputSuffix` e `InputAction` |
| `InputGroup` | — | `value` | a moldura desenha o próprio campo: `value` e `onValueChange` são dela, e não de um `Input` por dentro |
| `Item` | — | `title` | `title`, `description`, `media` e `actions` viram props: sem `ItemTitle`, `ItemDescription` e `ItemMedia` |
| `Item` | `interactive` | `onPress` | quem torna a linha tocável é o `onPress`, e não um booleano |
| `MaskedInput` | `mask` | `mask` | no web é nome de molde (`cpf`, `cnpj`, `moeda`) ou molde com `9`; no nativo é sempre molde literal e o dígito é `#` |
| `MaskedInput` | `value` | `value` | no web `value` é o texto COM máscara; no nativo é só dígito, e a máscara é do campo |
| `MaskedInput` | `onValueChange` | `onValueChange` | no web chega `(masked, raw)`; no nativo chega só o limpo |
| `Menu` | — | `actions` | os itens viram `actions`, no lugar de `MenuItem` por filho, e a folha sobe de baixo |
| `Menu` | — | `title` | a folha tem cabeçalho obrigatório: sem ancoragem, é ele que diz do que o menu trata |
| `Menu` | `open` | `open` | `open` e `onOpenChange` são obrigatórios: não há `MenuTrigger` |
| `Meter` | `format` | `valueLabel` | o texto vai pronto: resolver nome de formatador custaria o `Intl` no bundle do celular |
| `Meter` | `label` | `label` | `label` vira obrigatório e é `string` |
| `NumberField` | `value` | `value` | `value` é `number` e nunca `null`: o stepper sempre tem um número |
| `NumberField` | `step` | `step` | sem `"any"`: o passo do stepper é um número |
| `NumberField` | — | `label` | `label` é obrigatório: é ele que nomeia os dois botões de passo |
| `OTPField` | `length` | `length` | no nativo tem padrão (6) e é opcional |
| `OTPField` | `mask` | — | sem esconder o dígito, e sem `autoSubmit`, `normalizeValue` e `validationType` |
| `PageHeader` | `breadcrumb` | — | o caminho de volta é o botão de voltar do router |
| `PageHeader` | — | `badge` | a pastilha ao lado do título vira prop |
| `PageHeader` | `titleAs` | — | não há nível de título: o cabeçalho é uma parada só do leitor de tela |
| `PasswordInput` | `labels` | `labels` | `labels.show` e `labels.hide` são obrigatórios juntos, porque o botão troca de nome com o estado |
| `Popconfirm` → `AlertDialog` | `trigger` | — | não há ancoragem: você desenha o próprio botão e controla `open` |
| `Popconfirm` → `AlertDialog` | `onConfirm` | `onAction` | e não devolve promessa: o modal não segura o botão em espera |
| `Popconfirm` → `AlertDialog` | `confirmLabel` | `actionLabel` | mesmo papel, e obrigatório |
| `Popconfirm` → `AlertDialog` | `description` | `description` | vira `string` obrigatória: o modal não abre sem dizer o que se perde |
| `Popconfirm` → `AlertDialog` | `tone` | — | o botão é sempre destrutivo, e o painel não cancela ao tocar fora |
| `Popconfirm` → `AlertDialog` | `side` | — | `align`, `sideOffset` e `finalFocus` saem junto: o modal ocupa o meio da tela |
| `Progress` | `format` | — | sem formatador, e sem `showValue`: a barra mostra a porcentagem |
| `Progress` | `min` | — | a escala é 0 a 100, e `max` sai junto |
| `Progress` | `label` | `label` | `label` vira obrigatório e é `string` |
| `QueryBoundary` | `empty` | `empty` | `title` e `description` do vazio são `string`, e o `icon` sai |
| `QueryBoundary` | `errorTitle` | `errorTitle` | `errorTitle`, `errorMessage` e `retryLabel` viram `string` |
| `RivoProvider` | `density` | — | a prop não existe: alvo de toque não encolhe, e `comfortable` é a única altura |
| `RivoProvider` | `theme` | `theme` | só `rivocode-dark`, `rivocode-light` e `system`: tema de cliente é decisão de BUILD |
| `RivoProvider` | — | `fonts` | as fontes entram pelo provider, com `isFontLoaded` para segurar a tela até carregarem |
| `RivoProvider` | `toastPosition` | — | o aviso sobe de baixo, e `scope` e `dir` saem junto |
| `SearchInput` | — | `onValueChange` | no web a peça é um `<input>` e aceita `value`/`onChange` (ou nenhum dos dois); aqui `value` e `onValueChange` são obrigatórios |
| `SearchInput` | `onClear` | — | o limpar é botão da própria peça, e ele chama `onValueChange("")` |
| `SearchInput` | `shortcut` | — | não há teclado para desenhar o `Kbd` dentro do campo |
| `Select` | `items` | `items` | `items` na raiz e obrigatória; sem `SelectTrigger`, `SelectContent` e `SelectItem` |
| `Select` | — | `label` | `label` é obrigatório: é ele que o leitor de tela anuncia |
| `Select` | `value` | `value` | o valor é `string` ou `string[]`, e não o item genérico do web |
| `Sheet` | `side` | — | só de baixo, que já era o modo estreito do web; `snapPoints` sai junto |
| `Sheet` | — | `title` | `title` é prop obrigatória e `description` é prop |
| `Slider` | `value` | `value` | um valor só: `number`, e não `number[]` |
| `Slider` | `format` | — | sem formatador e sem `showValue`: o número sai como está |
| `Slider` | `label` | `label` | `label` vira obrigatório e é `string` |
| `Sparkline` | `variant` | `variant` | `area` não porta: pede polígono preenchido, e o desenho nativo é `View` |
| `Sparkline` | `color` | `color` | no web é qualquer cor de CSS; no nativo é papel de token |
| `Sparkline` | — | `height` | a altura é prop, porque não há CSS que a dê de fora |
| `Spinner` | `size` | `size` | os dois tamanhos do `ActivityIndicator`: `small` e `large`, e não `sm`/`md`/`lg` |
| `Spinner` | `label` | — | sem rótulo próprio: quem nomeia a espera é o texto ao lado |
| `Stat` | `value` | `value` | `value` é `string` já formatada: não há `Intl` para escrever o número |
| `Stat` | `deltaFormat` | — | `delta` é número e sai como veio; `deltaVariant` sai junto |
| `Stat` | `icon` | — | sem ícone, sem `footer`, sem `hint` e sem `actions`: o cartão é rótulo, valor e variação |
| `Steps` | `onStepClick` | — | só o modo estreito do web (texto e barra), e ele nunca foi clicável |
| `Switch` | `value` | — | não há formulário nativo para carregar valor: o estado é `checked` |
| `Tabs` | — | `items` | `items` na raiz, no lugar de `TabList`, `Tab` e `TabPanel`: é a caixinha segmentada, e o painel é seu |
| `Tabs` | `value` | `value` | o valor é `string`, e não o genérico do web |
| `TagsInput` | `labels` | `removeLabel` | uma função só, e não um objeto de rótulos |
| `TagsInput` | — | `max` | o teto de fichas é prop, porque não há como cortar por CSS |
| `Textarea` | `onValueChange` | — | o campo é um `TextInput`: `value` mais `onChangeText`, como o `Input` |
| `TimeField` | — | `label` | `label` é obrigatório, e as setas viram dois botões de passo |
| `TimePicker` | — | `label` | `label` é obrigatório, e a folha tem duas colunas: NÃO embute o `TimeField` |
| `Timeline` | — | `items` | os eventos vêm por `items`, e não por `TimelineItem` filho |
| `Timeline` | — | `label` | `label` diz o que a linha conta, e entra no anúncio de cada parada |
| `TimelineItem` → `Timeline` | `at` | — | vira `items[].at` e é `string` já escrita: um `RelativeTime` vivo lá dentro deixaria o rótulo falado preso na hora em que montou |
| `TimelineItem` → `Timeline` | `tone` | — | `tone` e `pending` viram campos de `items[]`, e `by` e `title` também |
| `Toggle` | `value` | — | não há formulário nativo para carregar valor: o estado é `pressed` |
| `ToggleGroup` | — | `items` | `items` na raiz, no lugar de `Toggle` por filho; `multiple` continua igual |
| `Tree` | `expanded` | — | não há aberto: um nível por vez, e tocar num galho empurra o de dentro |
| `Tree` | `filter` | — | sem busca dentro da árvore; `emptyMessage` é o texto de nada encontrado |
| `Tree` | — | `label` | `label` é obrigatório: é ele que nomeia o nível para o leitor de tela |
| `TreeSelect` | `searchable` | — | sem busca na folha |
| `TreeSelect` | — | `label` | `label` é obrigatório, e o rodapé traz a contagem do rascunho e o `Aplicar` |

Fora da tabela, uma perda que se repete: **13 peças perdem `size` no nativo** — `Badge`, `Clipboard`, `DatePicker`, `DateRangePicker`, `Input`, `InputGroup`, `MaskedInput`, `NumberField`, `PasswordInput`, `SearchInput`, `TimeField`, `TimePicker` e `TreeSelect`. Alvo de toque não encolhe, e `comfortable` é a única altura. Esta lista é medida a cada geração, e não escrita à mão.

## O formulário entra por outro caminho

`Form`, `FormField`, os adaptadores e o `useZodForm` vivem em
`@rivocode/ui-native/form`, não no índice da raiz: o `react-hook-form` é peer
opcional, e o metro resolve import por arquivo.

```tsx
import { Form, FormField, forText, useZodForm } from '@rivocode/ui-native/form'
```

Duas diferenças mordem logo: **nada envia sozinho** (sem `<form>`, sem
`type="submit"`, sem Enter: o `Form` entrega `{ submit, isSubmitting }` por
função), e **o rótulo viaja no campo** (sem `for` nem `id`, o `FormField` põe
`accessibilityLabel` e `invalid` na linha, e o adaptador os leva ao controle).

## O gráfico também, e ele traz um peer nativo

`ChartContainer`, `ChartDonut` e `ChartRadial` vivem em
`@rivocode/ui-native/chart` e pedem `react-native-svg`, peer **opcional** e
módulo nativo, que o app instala e liga ao projeto só se desenhar gráfico
(`npx expo install react-native-svg`).

```tsx
import { ChartContainer, ChartDonut, ChartRadial, PALETTE } from '@rivocode/ui-native/chart'
```

Três coisas mordem. **A moldura mede e entrega**: `children` como função recebe
`{ width, height, colors }`, no lugar do `ResponsiveContainer` e das
`var(--color-série)`, e a medida chega zerada no primeiro quadro. **No toque
não há dica**: a legenda da rosca é o controle, e tocar a linha acende a fatia
e leva nome e valor para o meio. **Cor de série é papel de token** (`chart-1` a
`chart-8`), nunca hexadecimal, senão a peça fica surda ao tema do cliente: no
web a mesma prop aceita qualquer cor de CSS porque lá ela vira
`var(--color-série)`, e aqui o que a peça recebe já é o valor final que vai
para o desenho.

A `PALETTE` é essa lista dos oito papéis, na ordem em que devem ser usados:
série sem `color` no `config` recebe o próximo dela, e é ela que o
`ChartDonut` percorre fatia a fatia. Importe-a quando o seu desenho à mão
precisar da mesma ordem, em vez de escrever `chart-1` de novo num canto.

A `Sparkline` fica de fora disto, na raiz e desenhada com `View`: ela é o slot
`chart` do `Stat`, e o `Stat` sai da raiz.

## Copiar e anexar: dois caminhos, e não um

`Clipboard` e `FileUpload` também pedem peer opcional, e cada um mora num
subcaminho próprio: **um subcaminho por peer, e não um por assunto**. Quem põe
um botão de copiar ao lado da chave de acesso de uma NF-e não anexa arquivo
nenhum, e um índice comum cobraria os dois módulos do Expo de quem só usa um.

```sh
npx expo install expo-clipboard        # @rivocode/ui-native/clipboard
npx expo install expo-document-picker  # @rivocode/ui-native/file-upload
```

```tsx
import { Clipboard } from '@rivocode/ui-native/clipboard'
import { FileUpload, FileUploadItem, FileUploadList } from '@rivocode/ui-native/file-upload'
```

Duas coisas mordem. **A confirmação de copiar é dupla**: o botão troca de nome,
como no web, e a peça dispara **também** um aviso, porque `accessibilityLabel`
trocado num `Pressable` que já está sob o foco não é reanunciado nem pelo
VoiceOver nem pelo TalkBack, e o aviso do `RivoProvider` é o único canal desta
tela que fala sozinho (`toast={false}` desliga). E **a área de soltar não
existe**: no celular não há arrastar, então o que abre o seletor é um botão de
altura de controle, com o `hint` dentro do nome falado. O `accept` fala MIME,
que é o que o seletor do sistema sabe filtrar, e o que volta é um `PickedFile`
com `uri` local: `size` pode faltar, e `maxSize` só recusa o que mediu.

## A paridade, peça por peça

**91 peças no catálogo do web, medidas contra `native/src/index.ts`, `native/src/form/index.ts`, `native/src/chart/index.ts`, `native/src/clipboard/index.ts` e `native/src/file-upload/index.ts` em 2026-08-27:** 69 traduzem com o mesmo nome, 4 traduzem com outro, 0 estão na fila e 18 não portam por decisão. A coluna do meio separa as duas ausências, que é a distinção que a tabela existe para fazer: `○` muda com o tempo, `✕` não muda. E `✔` não quer dizer copiar e colar: a seção acima explica por quê.

| Peça | No React Native | O que saber antes de contar com ela |
| --- | --- | --- |
| `Accordion` | ✔ traduz | cada `AccordionItem` guarda o próprio aberto; não há raiz controlada |
| `Alert` | ✔ traduz | `title` é prop e o corpo é filho; sem `AlertTitle`/`AlertDescription` |
| `AlertDialog` | ✔ traduz | `actionLabel` e `onAction` em vez de composição; não fecha no toque fora, como no web |
| `AspectRatio` | ✔ traduz | `ratio` numérico, igual |
| `Autocomplete` | ✔ vira `Combobox` | e **não** aceita valor fora da lista: a folha escolhe, não digita |
| `Avatar` | ✔ traduz | só `fallback`, as iniciais: imagem remota ainda não entra |
| `Badge` | ✔ traduz | os mesmos tons; o texto e filho; NAO tem `size`, porque no nativo so ha uma densidade |
| `Breadcrumb` | ✕ não porta | o caminho de volta é o botão de voltar do router |
| `Button` | ✔ traduz | contrato controlado; `hitSlop` no `sm`, porque 32px de alvo não se toca sem ajuda |
| `ButtonGroup` | ✕ não porta | `Tabs` e `ToggleGroup` cobrem o caso; botão encostado em botão vira um alvo só no dedo |
| `Calendar` | ✔ traduz | mês desenhado à mão; valor ISO `aaaa-mm-dd`, exibição `dd/mm/aaaa` |
| `Card` | ✔ traduz | com `CardHeader`, `CardTitle`, `CardDescription` e `CardContent` (sem `CardFooter`) |
| `ChartContainer` | ✔ traduz | vive em `@rivocode/ui-native/chart`; os quatro finais atravessam com os mesmos nomes, e o desenho entra por função: não há Recharts, nem contentor que meça, nem `var(--color-série)` |
| `ChartDonut` | ✔ traduz | a legenda é o controle: sem dica para abrir no toque, tocar a linha acende a fatia e leva nome e valor ao meio; `format` só aceita função, e as pontas saem retas |
| `ChartRadial` | ✔ traduz | atravessa quase inteiro, porque nunca teve dica; `color` é papel de token e o nome sai do que está escrito no meio, não só da porcentagem |
| `Checkbox` | ✔ traduz | `checked` e `onCheckedChange` **obrigatórios**; sem `defaultChecked` e sem `indeterminate` |
| `CheckboxGroup` | ✔ traduz | `items` na raiz e `value: string[]`; `label` nomeia o conjunto, no lugar do `aria-label` do web |
| `Clipboard` | ✔ traduz | vive em `@rivocode/ui-native/clipboard`; a confirmação é dupla: o botão troca de nome e um aviso fala, porque rótulo trocado debaixo do dedo não é reanunciado |
| `Code` | ✔ traduz | o trecho quebra linha junto com a frase que o cerca, e o toque longo copia (`selectable`); a rolagem própria é do `CodeBlock`, que continua fora |
| `Collapsible` | ✔ traduz | `label` no lugar de `CollapsibleTrigger` e `CollapsiblePanel` |
| `ColorPicker` | ✔ traduz | sai na raiz; controlada, e sem seta: cada amostra é um alvo de 44px com o desenho de 32 por dentro, e são seis por linha, não dez |
| `Combobox` | ✔ traduz | a lista abre numa folha com busca sem acento; `items` na raiz, não `ComboboxItem` por filho |
| `Command` | ✕ não porta | paleta de comandos é gesto de mesa: um campo, uma lista e o teclado |
| `ContextMenu` | ✕ não porta | não precisa de peça nova: precisa de `longPress` no `Menu`, que ele ainda não aceita |
| `DataTable` | ✔ vira `DataList` | `filter` e `selectable` portam com o mesmo nome; ordenar e `pageSize` ficam de fora por desenho |
| `DatePicker` | ✔ traduz | abre a folha com o mês; guarda ISO e exibe `dd/mm/aaaa` |
| `DateRangePicker` | ✔ traduz | um mês numa folha, com as duas pontas na mesma grade; a peça ordena os toques, e o intervalo invertido deixou de existir |
| `DescriptionList` | ✔ traduz | as bordas entram por `Children`: a utility de divisória do Tailwind não existe no RN |
| `Dialog` | ✔ traduz | `open`, `onOpenChange` e `title` como props; sem `DialogTrigger` |
| `Editable` | ✔ traduz | quem abre é o toque **longo**, o retorno do teclado confirma e há um `Cancelar` visível: sair do campo não salva, ao contrário do web |
| `EmptyState` | ✔ traduz | `description` obrigatória, pelo mesmo motivo do web |
| `EventCalendar` | ✕ não porta | grade de tempo e idioma de mesa; no telefone a resposta e a lista, e o mes e o `Calendar` |
| `Field` | ✔ traduz | `label`, `description` e `error` como props; o erro vence a descrição, como no web |
| `Fieldset` | ✔ traduz | `legend` como prop |
| `FileUpload` | ✔ traduz | vive em `@rivocode/ui-native/file-upload`; a área de soltar vira um botão, porque no celular não há soltar; o `accept` fala MIME e o tamanho sai formatado sem `Intl` |
| `FilterBar` | ✔ traduz | rola na horizontal com o limpar ancorado FORA do que rola; a linha reservada e uma altura de alvo de toque; a borda com mais escondido vira regua de 1pt, e nao esmaecido |
| `FilterChip` | ✔ traduz | a faixa de toque tem 44pt e a pilula pintada continua com 28; `size` muda o desenho, nunca o alvo |
| `Form` | ✔ traduz | vive em `@rivocode/ui-native/form`; o `Form` entrega o `submit` em vez de esperar um `type="submit"`, e há um adaptador a mais, o `forText` |
| `Indicator` | ✔ traduz | `label` é obrigatório: a pastilha é uma parada só do leitor de tela, e o que ela diz é a frase, nunca o número |
| `Input` | ✔ traduz | a borda acende no foco: não há `focus-visible` em tela de toque |
| `InputGroup` | ✔ traduz | `prefix`, `suffix` e `actions` são props e a moldura desenha o próprio campo; sem `size` |
| `Item` | ✔ traduz | `title`, `description`, `media` e `actions` como props; o corte com reticências é `numberOfLines`, que lá é prop e não classe |
| `Kbd` | ✕ não porta | não há teclado para desenhar |
| `MaskedInput` | ✔ traduz | o valor é só dígitos; a máscara é do campo, o dado não a carrega |
| `Menu` | ✔ traduz | folha de baixo com `actions`, nunca popup ancorado |
| `Menubar` | ✕ não porta | idioma de mesa; navegação nativa é tab bar e drawer do router |
| `Meter` | ✔ traduz | sem `format`: resolver nome de formatador custaria o `Intl` no bundle do celular, e o texto vai pronto em `valueLabel` |
| `NavigationMenu` | ✕ não porta | idioma de mesa; navegação nativa é tab bar e drawer do router |
| `NumberField` | ✔ traduz | vira stepper (menos, valor, mais), que é o idioma do toque |
| `OTPField` | ✔ traduz | caixas visíveis, um campo escondido: teclado, autofill de SMS e leitor veem um só |
| `PageHeader` | ✔ traduz | `title`, `description`, `badge` e `actions` como props |
| `Pagination` | ✕ não porta | lista de celular rola; escolher o número da página é gesto de mesa |
| `PasswordInput` | ✔ traduz | o botão troca de nome com o estado (`labels.show`/`labels.hide`), e sair do campo esconde de novo |
| `Popconfirm` | ✔ vira `AlertDialog` | vira `AlertDialog`; no celular a confirmacao e modal e NAO cancela ao tocar fora |
| `Popover` | ✕ não porta | painel ancorado que o próprio dedo cobre: use `Sheet` |
| `PreviewCard` | ✕ não porta | aparece ao pousar o ponteiro, e não há pousar no toque |
| `Progress` | ✔ traduz | `value` de 0 a 100 e `label`; sem `format` |
| `QueryBoundary` | ✔ traduz | mesmos nomes e mesma ordem; texto vira `string`, e nao ha `classNames` no pacote nativo |
| `RadioGroup` | ✔ traduz | `items` na raiz; nao existe `Radio` solto; `label` nomeia o grupo, no lugar do `aria-label` do web |
| `RelativeTime` | ✔ traduz | o relógio porta, com passo por unidade e refeitura ao voltar do fundo; sem `Intl`, o texto é sempre numérico |
| `RivoProvider` | ✔ traduz | `theme` troca em runtime só entre os dois temas de casa, e tema de cliente é decisão de BUILD; `density` não existe: alvo de toque não encolhe, e `comfortable` é a única altura; e ganha `fonts`, que o web não tem |
| `ScrollArea` | ✕ não porta | rolagem é da plataforma: `ScrollView` e `FlatList`, com a barra que o sistema desenha |
| `SearchInput` | ✔ traduz | `value` e `onValueChange` obrigatórios |
| `Select` | ✔ traduz | poucas opções fixas; `items` e `label` na raiz, e a lista abre numa folha de baixo |
| `Separator` | ✔ traduz | só a linha horizontal |
| `Sheet` | ✔ traduz | só o comportamento de baixo, que já era o modo estreito do web |
| `Sidebar` | ✕ não porta | idioma de mesa; navegação nativa é tab bar e drawer do router |
| `Skeleton` | ✔ traduz | mesma marca de lugar, mesmo token |
| `Slider` | ✔ traduz | anda por gesto e responde às ações do leitor de tela; um valor só, e `label` obrigatório |
| `Sparkline` | ✔ traduz | `line` e `bar` valem nos dois lados; `area` fica de fora (pede polígono preenchido, e o desenho nativo é `View`) |
| `Spinner` | ✔ traduz | `small` e `large`, os dois tamanhos do `ActivityIndicator` |
| `Splitter` | ✕ não porta | duas áreas lado a lado não cabem em tela estreita; no celular a lista e o detalhe são duas telas do router |
| `Stat` | ✔ traduz | `value` já formatado, `delta` numérico, e o slot `chart` que a `Sparkline` nativa preenche |
| `Steps` | ✔ traduz | só o modo estreito do web (texto e barra), e por isso sem `onStepClick`; o `useWizard()` atravessa inteiro |
| `Switch` | ✔ traduz | `checked` e `onCheckedChange` obrigatórios; o trilho é o do sistema, pintado por token |
| `Table` | ✕ não porta | não há tabela no celular; a consulta vira `DataList` |
| `Tabs` | ✔ traduz | só a caixinha segmentada, por `items`; seção de página é trabalho do router nativo |
| `TagsInput` | ✔ traduz | Enter e separador digitado fecham a ficha; o Backspace com o campo vazio não porta |
| `Textarea` | ✔ traduz | `rows` e a altura inicial e o campo cresce; `onChangeText`, como o `Input`, e nao `onValueChange` |
| `TimeField` | ✔ traduz | digita com mascara e teclado numerico; as setas viram dois botoes de passo, no molde do `NumberField` |
| `TimePicker` | ✔ traduz | gatilho mais folha de baixo com duas colunas; NAO embute o TimeField, ao contrario do web |
| `Timeline` | ✔ traduz | os eventos vêm por `items`, com `tone` e `pending` em cada um; `at` é texto pronto, e cada evento é uma parada só do leitor de tela, com a posição escrita no rótulo |
| `ToastViewport` | ✔ vira `useToast` | não se monta nada: o `RivoProvider` já traz a fiação, e o hook é o mesmo |
| `Toggle` | ✔ traduz | `pressed` e `onPressedChange` |
| `ToggleGroup` | ✔ traduz | `items` na raiz; `multiple` para vários, o mesmo nome e o mesmo sentido do web |
| `Toolbar` | ✕ não porta | superfície de edição de mesa: uma parada de tabulação e navegação por seta, que o toque não tem |
| `Tooltip` | ✕ não porta | hover não existe no toque; o rótulo precisa estar na tela |
| `Tracker` | ✔ traduz | a faixa inteira é um alvo só: o dedo arrasta e o período lido aparece na linha de baixo; `label` de cada ponto é `string` |
| `Tree` | ✔ traduz | um nível por vez, empilhado: tocar num galho empurra o nível de dentro e o cabeçalho mostra o caminho e volta; sem recuo, sem busca |
| `TreeSelect` | ✔ traduz | o `Tree` dentro de uma folha, com a contagem do rascunho e o `Aplicar` no rodapé; sair pela lateral desiste |
| `VirtualList` | ✕ não porta | a plataforma ja virtualiza: `FlatList` e `FlashList` fazem isto de fabrica |

## Como esta tabela se mantém

A tabela acima e a seção **"No React Native"** de cada página de peça saem da
mesma fonte, `scripts/paridade-nativo.ts`:

```sh
bun run scripts/paridade-nativo.ts            # reescreve as duas
bun run scripts/paridade-nativo.ts --check    # só confere
```

O `--check` falha quando uma peça nova do catálogo não tem linha, quando uma
linha promete um import que não sai de nenhum índice do pacote nativo
(`native/src/index.ts`, `native/src/form/index.ts` e
`native/src/chart/index.ts`), e quando uma peça
marcada como `○ na fila` **já portou**, que é o caso silencioso: a doc
continua mandando usar o substituto depois que a peça de verdade chegou.
Portou peça nova no native? Rode o script e comite o que ele reescrever.

## O que nunca fazer no native

- Classe com var arbitrária (`h-[--rc-control-md]`) ou `translate-*`: o
  compilador do react-native-css atual não tolera var viva nem a shorthand
  `translate`. Altura de controle é fixa por tamanho até o fix upstream.
- Remover o `browserslist` moderno do `package.json` do app: sem ele, o passe
  web do Expo reescreve o `light-dark()` dos tokens num polyfill de vars que
  mata a compilação. É ele que sustenta a troca entre os dois temas de casa: o
  `RivoProvider` aceita `rivocode-dark`, `rivocode-light` e `system`, e trocar
  a prop troca a tela inteira via `Appearance.setColorScheme()`.
- Prometer tema de cliente em runtime, ou escrever `theme={{ light, dark }}`
  na prop: o objeto não é mais aceito, e nunca vestiu a tela inteira. Cor de
  classe é build, e o caminho está na seção de tema acima.
- Escrever `density` numa tela nativa: a prop **não existe** no pacote. Alvo de
  toque não encolhe em tela de dedo, e `comfortable` é a única altura.
- Glyph de texto como ícone de estado (o visto do Checkbox é borda
  rotacionada, porque fonte muda de corpo entre iOS e Android).
- Esquecer `accessibilityRole`/`accessibilityState` em controle custom.
- Alinhar texto de `TextInput` por classe **ou** por prop: as duas falham, e
  cada uma de um jeito. `text-center` vira prop no runtime e a aplicação
  quebra com `path.split is not a function`; a prop `textAlign` não está no
  `forwardPropsList` do react-native-web e é descartada em silêncio, então o
  campo nasce à esquerda no alvo web. O caminho que os dois alvos leem é
  `style={{ textAlign: "center" }}`. O mesmo vale para atalhos lógicos
  (`border-x` gera `border-inline`, que não existe lá): escreva
  `border-l border-r`.
- A utility de divisória do Tailwind (a de bordas entre filhos): o seletor de
  filho não existe no RN. O `DescriptionList` interpõe bordas via `Children`.
- Escrever nome de classe em comentário: o scanner do Tailwind lê fonte crua
  e gera a classe. Foi assim que uma palavra num comentário derrubou o build.
