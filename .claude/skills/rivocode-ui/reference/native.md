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
  obrigatórias. A exceção é o que abre e fecha no lugar, `Accordion` e
  `Collapsible`: aceitam os dois modos, `value`/`open` opcionais ao lado de
  `defaultValue`/`defaultOpen`.
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

**204 divergências de assinatura em 88 peças.** As duas regras acima (tudo controlado, lista por `items`) valem em todo o catálogo; o que está aqui é o que sobra delas — prop que muda de nome, tipo que muda de forma, e variante que existe de um lado só. `—` quer dizer que não há prop equivalente daquele lado. Todas as três colunas são conferidas contra os dois pacotes por `bun run check:assinatura`.

| Peça | No web | No React Native | O que muda na chamada |
| --- | --- | --- | --- |
| `AILabel` | `explanation` | `explanation` | `string`, que vira a descrição da `Sheet` onde a explicação abre |
| `AILabel` | `side` | — | a explicação abre numa `Sheet`, que não tem lado |
| `Accordion` | — | `children` | a raiz só empilha; quem tem prop é o item |
| `ActionBar` | `position` | — | não há `sticky` nem `fixed`: a barra é sempre `absolute` sobre a lista, no pé da tela |
| `ActionBar` | — | `bottomInset` | a área segura de baixo entra por número, `useSafeAreaInsets().bottom`, porque o pacote não depende do `react-native-safe-area-context` |
| `ActionBar` | `finalFocus` | — | no toque não há foco de teclado para devolver quando a barra sai |
| `ActionBar` | `classNames` | — | um `className` só, no painel da barra |
| `Alert` | — | `title` | o título vira prop; no web ele é `AlertTitle` por filho |
| `Alert` | `icon` | — | o ícone é o do tom, e não se troca |
| `Alert` | `onDismiss` | — | não há fechar: aviso que some no toque some sem ninguém ver, e `dismissLabel` sai junto |
| `AlertDialog` | — | `title` | `title` e `description` viram props obrigatórias, no lugar de `AlertDialogTitle` e `AlertDialogDescription` |
| `AlertDialog` | — | `actionLabel` | o botão que confirma é `actionLabel` mais `onAction`, e não um `AlertDialogClose` no rodapé |
| `AlertDialog` | `open` | `open` | `open` e `onOpenChange` são obrigatórios, e não fecha no toque fora |
| `Autocomplete` → `Combobox` | `value` | `value` | no web `value` é o texto digitado e ele pode não estar na lista; no nativo é o item escolhido (`string` ou `string[]`) |
| `Autocomplete` → `Combobox` | `mode` | — | não há completar inline: a folha filtra e a pessoa toca |
| `Avatar` | `fallback` | `fallback` | vira obrigatória: é ela que ocupa o lugar enquanto a foto baixa, e é ela que volta se a foto falhar |
| `Banner` | `description` | `description` | `title` e `description` viram `string`: texto no nativo mora dentro de um `Text` |
| `Banner` | `icon` | `icon` | sem ícone padrão, porque o pacote não traz ícone; a função recebe a cor do tom e o tamanho |
| `Banner` | `classNames` | — | um `className` só, na raiz da faixa |
| `Button` | `size` | `size` | `cta`, `icon` e `iconSm` não portam: alvo de toque não encolhe, e botão de ícone se resolve com `hitSlop` |
| `Button` | `shape` | — | sem pílula: o raio é o do token, igual em todo botão |
| `Calendar` | — | `value` | o web é o react-day-picker (`mode`, `selected`, `onSelect`); o nativo é um mês desenhado à mão com `value`/`onValueChange` |
| `Calendar` | `startMonth` | — | a faixa é `min`/`max` em ISO `aaaa-mm-dd`, e não `startMonth`/`endMonth` em `Date` |
| `Calendar` | `mode` | — | só data única: intervalo é o `DateRangePicker` |
| `Carousel` | — | `items` | os slides vêm por `items` e `renderItem`, e não como filhos |
| `Carousel` | `index` | `index` | vira obrigatório, com `onIndexChange`: não há `defaultIndex` |
| `Carousel` | `slidesPerView` | `slidesPerView` | só número: o objeto por largura e o `"auto"` não portam |
| `Carousel` | `autoplay` | — | no toque a fileira que anda sozinha briga com o dedo; não há rotação nem pausa |
| `Carousel` | `classNames` | `className` | um `className` só, na raiz |
| `ChartContainer` | — | `children` | `children` é função e recebe `{ width, height, colors }`: não há `ResponsiveContainer` para medir por você, e a medida chega zerada no primeiro quadro |
| `ChartContainer` | `empty` | `empty` | `title` e `description` do vazio são `string`, e não `ReactNode`; o `icon` atravessa, e aceita também a função do `EmptyState` nativo |
| `ChartContainer` | `errorTitle` | `errorTitle` | `errorTitle`, `errorMessage` e `retryLabel` viram `string` |
| `ChartDonut` | `centerValue` | `centerValue` | `centerValue` e `centerLabel` viram `string` |
| `ChartRadial` | `color` | `color` | no web é qualquer cor de CSS; no nativo é papel de token (`chart-1`…`chart-8`), senão a peça fica surda ao tema |
| `Checkbox` | `indeterminate` | — | não há terceiro estado, e `parent` sai junto: o pai de um grupo se desenha à mão |
| `Checkbox` | — | `accessibilityLabel` | sem `children`, é ele que nomeia a caixa para o leitor de tela |
| `Clipboard` | `variant` | `variant` | só `secondary` e `ghost`: o copiar não é ação destrutiva nem primária |
| `Clipboard` | — | `toast` | o aviso falado vem junto e `toast={false}` desliga: rótulo trocado sob o dedo não é reanunciado |
| `Code` | — | `children` | `children` é `string`, e não `ReactNode`: o trecho é texto |
| `Collapsible` | — | `label` | o cabeçalho vira `label`, no lugar de `CollapsibleTrigger` e `CollapsiblePanel` |
| `ColorPicker` | `label` | `label` | `label` é `string`: sem `ReactNode`, como em toda peça do nativo |
| `Combobox` | `items` | `items` | `items` na raiz e obrigatória, rasa ou em grupos `{ label, items }`; sem `ComboboxItem` por filho |
| `Combobox` | — | `label` | `label` é obrigatório: é ele que o leitor de tela anuncia, no lugar do `aria-label` |
| `Combobox` | — | `searchPlaceholder` | a folha tem busca própria; `emptyMessage` é o texto de lista vazia |
| `Combobox` | `filter` | — | o filtro é da peça e ignora acento; não se troca |
| `ContextMenu` → `Menu` | — | `children` | o `ContextMenuTrigger` vira `children` do `Menu`, e o gesto é o toque longo, não o botão direito |
| `ContextMenu` → `Menu` | — | `actions` | os itens viram `actions`, no lugar de `MenuItem` por filho, e a folha sobe de baixo |
| `ContextMenu` → `Menu` | — | `title` | a folha tem cabeçalho obrigatório: sem ancoragem, é ele que diz do que o menu trata |
| `ContextMenu` → `Menu` | `open` | `open` | `open` e `onOpenChange` são obrigatórios, e `defaultOpen` não existe |
| `Conversation` | — | `items` | as mensagens vêm por `items`, `renderItem` e `keyExtractor`, e não por filhos; a ordem é a mesma, a mais nova por último |
| `Conversation` | `empty` | `empty` | `title` e `description` viram `string`, e o `icon` é a função que recebe a cor |
| `Conversation` | `classNames` | — | um `className` só, na raiz da lista |
| `CurrencyInput` | `value` | `value` | vira obrigatório, com `onValueChange`: não há `defaultValue` |
| `CurrencyInput` | `classNames` | `inputClassName` | `className` veste a raiz e `inputClassName` o campo; o "R$" não se veste |
| `DataTable` → `DataList` | `columns` | `renderItem` | não há coluna: `renderItem` desenha a linha inteira |
| `DataTable` → `DataList` | `rowKey` | `keyExtractor` | mesmo papel, nome do React Native |
| `DataTable` → `DataList` | `onRowClick` | `onRowPress` | mesmo papel, nome do toque |
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
| `EmptyState` | `icon` | `icon` | aceita também uma função que recebe `color` e `size`, porque a cor não desce da `View` para o SVG |
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
| `Highlight` | `classNames` | `markClassName` | a classe de cada trecho achado vira prop própria; a de fora é o `className` do `Text` |
| `IconButton` | `label` | `accessibilityLabel` | o nome obrigatório muda de nome, e continua obrigatório: o tipo recusa o botão sem ele |
| `IconButton` | `variant` | `variant` | `outline` não porta, como no `Button` nativo |
| `IconButton` | `shape` | — | sem pílula: o raio é o do token, igual em todo botão |
| `IconButton` | `tooltip` | — | no toque não há pousar; ícone que não se lê sozinho pede `Button` com texto |
| `IconButton` | `tooltipSide` | — | sai junto com o `tooltip` |
| `ImageViewer` | `index` | `index` | vira obrigatório, com `onIndexChange`: não há `defaultIndex`, e `null` é o fechado |
| `ImageViewer` | `classNames` | `className` | um `className` só, na grade de miniaturas |
| `Indicator` | `label` | `label` | `label` vira obrigatório: a pastilha é uma parada só do leitor de tela, e o que ela diz é a frase |
| `Indicator` | `classNames` | `badgeClassName` | uma classe só, a da pastilha: não há `classNames` no pacote nativo |
| `Input` | — | `font` | escolhe o papel de fonte, que o web resolve por classe |
| `InputGroup` | — | `prefix` | `prefix`, `suffix` e `actions` viram props: sem `InputPrefix`, `InputSuffix` e `InputAction` |
| `InputGroup` | — | `value` | a moldura desenha o próprio campo: `value` e `onValueChange` são dela, e não de um `Input` por dentro |
| `Item` | — | `title` | `title`, `description`, `media` e `actions` viram props: sem `ItemTitle`, `ItemDescription` e `ItemMedia` |
| `Item` | `interactive` | `onPress` | quem torna a linha tocável é o `onPress`, e não um booleano |
| `Link` | `render` | `onPress` | o link do router entra por callback, `onPress={() => router.push("/notas")}`: não há âncora para trocar |
| `Link` | `underline` | — | o sublinhado é fixo: sem ponteiro, não existe o `hover` |
| `MaskedInput` | `value` | `value` | no web `value` é o texto COM máscara; no nativo é só dígito, e a máscara é do campo |
| `Menu` | — | `actions` | os itens viram `actions`, no lugar de `MenuItem` por filho, e a folha sobe de baixo |
| `Menu` | — | `title` | a folha tem cabeçalho obrigatório: sem ancoragem, é ele que diz do que o menu trata |
| `Menu` | — | `children` | não há `MenuTrigger`: `children` é a área que abre no toque longo, e o botão de três pontinhos é seu |
| `Menu` | `open` | `open` | `open` e `onOpenChange` são obrigatórios, e `defaultOpen` não existe |
| `Message` | `copyValue` | `onCopy` | o botão chama quem copia, porque o `expo-clipboard` mora em `@rivocode/ui-native/clipboard` |
| `Message` | `error` | `error` | `string`: texto no nativo mora dentro de um `Text` |
| `Message` | `classNames` | — | um `className` só, na linha da mensagem |
| `Meter` | `label` | `label` | `label` vira obrigatório e é `string` |
| `NotificationCenter` | `open` | `open` | vira obrigatório, com `onOpenChange`: não há `defaultOpen` |
| `NotificationCenter` | — | `icon` | o sino entra por `icon`, obrigatório, porque o pacote não traz ícone; a função recebe a cor do botão |
| `NotificationCenter` | `onItemClick` | `onItemPress` | a linha não é link: sem `href` no item, quem navega é o router a partir do item recebido |
| `NotificationCenter` | `defaultFilter` | — | o filtro começa em `all`; `filter` com `onFilterChange` controla |
| `NotificationCenter` | `align` | — | a lista é sempre uma folha de baixo, e não um painel ancorado ao sino |
| `NotificationCenter` | `classNames` | `className` | um `className` só, no botão do sino |
| `NumberField` | `value` | `value` | `value` é `number` e nunca `null`: o stepper sempre tem um número |
| `NumberField` | `step` | `step` | sem `"any"`: o passo do stepper é um número |
| `NumberField` | — | `label` | `label` é obrigatório: é ele que nomeia os dois botões de passo |
| `OTPField` | `mask` | — | sem esconder o dígito, e sem `autoSubmit`, `normalizeValue` e `validationType` |
| `PageHeader` | `breadcrumb` | — | o caminho de volta é o botão de voltar do router |
| `PageHeader` | — | `badge` | a pastilha ao lado do título vira prop |
| `PageHeader` | `titleAs` | — | não há nível de título: o cabeçalho é uma parada só do leitor de tela |
| `PasswordInput` | `labels` | `labels` | `labels.show` e `labels.hide` são obrigatórios juntos, porque o botão troca de nome com o estado |
| `PixCode` | — | `renderCopy` | o botão de copiar vem de `@rivocode/ui-native/clipboard` por função; no web ele já vem dentro, e por isso o `PixCodeLabels` daqui não tem `copy` nem `copied` |
| `PixCode` | `classNames` | `className` | um `className` só, na raiz |
| `Popconfirm` → `AlertDialog` | `trigger` | — | não há ancoragem: você desenha o próprio botão e controla `open` |
| `Popconfirm` → `AlertDialog` | `onConfirm` | `onAction` | só o nome muda: devolvendo promessa, o modal segura o botão em espera e fecha quando ela resolve |
| `Popconfirm` → `AlertDialog` | `confirmLabel` | `actionLabel` | mesmo papel, e obrigatório |
| `Popconfirm` → `AlertDialog` | `description` | `description` | vira `string` obrigatória: o modal não abre sem dizer o que se perde |
| `Popconfirm` → `AlertDialog` | `side` | — | `align`, `sideOffset` e `finalFocus` saem junto: o modal ocupa o meio da tela |
| `PostalCodeField` | `value` | `value` | vira obrigatório e são só os dígitos; no web aceita o texto com máscara |
| `PostalCodeField` | `defaultValue` | — | não há estado interno: o campo é controlado |
| `PostalCodeField` | `classNames` | `inputClassName` | `className` veste a raiz e `inputClassName` o campo; o giro e o aviso não se vestem |
| `Progress` | `min` | — | a escala é 0 a 100, e `max` sai junto |
| `Progress` | `label` | `label` | `label` vira obrigatório e é `string` |
| `PromptInput` | `value` | `value` | obrigatório, junto com `onValueChange` e `onSubmit`: no nativo todo campo é controlado |
| `PromptInput` | `defaultValue` | — | sem estado próprio: quem limpa o campo depois do envio é quem chamou |
| `PromptInput` | `classNames` | — | um `className` só, na moldura do campo |
| `QRCode` | `classNames` | `className` | um `className` só, na raiz; o `svg` e o logo não se vestem por parte |
| `QueryBoundary` | `empty` | `empty` | `title` e `description` do vazio são `string`; o `icon` atravessa, e aceita também a função do `EmptyState` nativo |
| `QueryBoundary` | `errorTitle` | `errorTitle` | `errorTitle`, `errorMessage` e `retryLabel` viram `string` |
| `Questionnaire` | — | `items` | as perguntas vêm por `items`, com `type` `single`, `multiple` ou `text`, no lugar de `QuestionnaireItem` e das partes por filho |
| `Questionnaire` | `item` | `item` | vira obrigatório: a pergunta aberta é sempre controlada, junto com `onItemChange` |
| `Questionnaire` | `defaultItem` | — | não há estado interno de pergunta aberta |
| `Questionnaire` | — | `value` | as respostas são controladas; no web elas moram nos `<input>` do formulário |
| `Questionnaire` | `onSubmit` | `onSubmit` | vira obrigatório e recebe só as respostas: não há `FormData` fora do navegador |
| `Questionnaire` | `shortcuts` | — | sem teclado físico, não há atalho de letra nem de número |
| `Questionnaire` | — | `onStatusChange` | um só na raiz, com o `name` da pergunta; no web ele é de cada `QuestionnaireItem` |
| `Rating` | `value` | `value` | vira obrigatório: não há `defaultValue`, e sem `onValueChange` a peça só exibe |
| `Rating` | `icon` | `icon` | é função, e recebe `{ color, size, filled }`: a cor não desce da `View` para o SVG |
| `Rating` | `name` | — | não há `<form>` para levar a nota num campo escondido |
| `Rating` | `classNames` | `className` | um `className` só, na raiz |
| `RivoProvider` | `density` | — | a prop não existe: alvo de toque não encolhe, e `comfortable` é a única altura |
| `RivoProvider` | `theme` | `theme` | só `rivocode-dark`, `rivocode-light` e `system`: tema de cliente é decisão de BUILD |
| `RivoProvider` | — | `fonts` | as fontes entram pelo provider, com `isFontLoaded` para segurar a tela até carregarem |
| `RivoProvider` | `toastPosition` | — | o aviso sobe de baixo, e `scope` e `dir` saem junto |
| `SearchInput` | `onClear` | — | o limpar é botão da própria peça, e ele chama `onValueChange("")` |
| `SearchInput` | `shortcut` | — | não há teclado para desenhar o `Kbd` dentro do campo |
| `Select` | `items` | `items` | `items` na raiz e obrigatória, rasa ou em grupos `{ label, items }`; sem `SelectTrigger`, `SelectContent` e `SelectItem` |
| `Select` | — | `label` | `label` é obrigatório: é ele que o leitor de tela anuncia |
| `Select` | `value` | `value` | o valor é `string` ou `string[]`, e não o item genérico do web |
| `Sheet` | `side` | — | só de baixo, que já era o modo estreito do web; `snapPoints` sai junto |
| `Sheet` | — | `title` | `title` é prop obrigatória e `description` é prop |
| `SignaturePad` | `value` | `value` | vira obrigatório: não há `defaultValue`, e sem `onValueChange` a peça só exibe |
| `SignaturePad` | `name` | — | não há `<form>` para levar o SVG num campo escondido |
| `SignaturePad` | — | `onDrawingChange` | avisa o começo e o fim do traço, para a `ScrollView` em volta parar de rolar |
| `SignaturePad` | `classNames` | `className` | um `className` só, na raiz |
| `Slider` | `value` | `value` | um valor só: `number`, e não `number[]` |
| `Slider` | `label` | `label` | `label` vira obrigatório e é `string` |
| `Sparkline` | `variant` | `variant` | `area` não porta: pede polígono preenchido, e o desenho nativo é `View` |
| `Sparkline` | `color` | `color` | no web é qualquer cor de CSS; no nativo é papel de token |
| `Sparkline` | — | `height` | a altura é prop, porque não há CSS que a dê de fora |
| `Spinner` | `size` | `size` | os dois tamanhos do `ActivityIndicator`: `small` e `large`, e não `sm`/`md`/`lg` |
| `Spinner` | `label` | — | sem rótulo próprio: quem nomeia a espera é o texto ao lado |
| `Spoiler` | — | `fadeOver` | o degradê é pintado na cor do fundo em que o bloco pousa, porque o toque não tem máscara |
| `Spoiler` | `classNames` | — | um `className` só, na raiz |
| `Stat` | `value` | `value` | `value` é `string` já formatada, com `currencyShort` e os outros formatadores que a raiz exporta |
| `Stat` | `deltaVariant` | — | a variação é sempre texto com seta, sem a pastilha preenchida |
| `Stat` | `icon` | — | sem ícone, sem `footer`, sem `hint` e sem `actions`: o cartão é rótulo, valor e variação |
| `Steps` | `onStepClick` | — | só o modo estreito do web (texto e barra), e ele nunca foi clicável |
| `Switch` | `value` | — | não há formulário nativo para carregar valor: o estado é `checked` |
| `Tabs` | — | `items` | `items` na raiz, no lugar de `TabList`, `Tab` e `TabPanel`: é a caixinha segmentada, e o painel é seu |
| `Tabs` | `value` | `value` | o valor é `string`, e não o genérico do web |
| `Text` | `render` | — | o elemento é sempre `Text`; o bloco é uma `View` em volta |
| `Text` | — | `font` | escolhe o papel de fonte, que o web resolve por classe |
| `TimeField` | — | `label` | `label` é obrigatório, e as setas viram dois botões de passo |
| `TimePicker` | — | `label` | `label` é obrigatório, e a folha tem duas colunas: NÃO embute o `TimeField` |
| `Timeline` | — | `items` | os eventos vêm por `items`, e não por `TimelineItem` filho |
| `Timeline` | — | `label` | `label` diz o que a linha conta, e entra no anúncio de cada parada |
| `TimelineItem` → `Timeline` | `at` | — | vira `items[].at` e é `string` já escrita: um `RelativeTime` vivo lá dentro deixaria o rótulo falado preso na hora em que montou |
| `TimelineItem` → `Timeline` | `tone` | — | `tone` e `pending` viram campos de `items[]`, e `by` e `title` também |
| `Toggle` | `value` | — | não há formulário nativo para carregar valor: o estado é `pressed` |
| `ToggleGroup` | — | `items` | `items` na raiz, no lugar de `Toggle` por filho; `multiple` continua igual |
| `ToolCall` | `title` | `title` | `string`, como o `error`: texto no nativo mora dentro de um `Text` |
| `ToolCall` | `classNames` | — | um `className` só, no cartão |
| `Tour` | `open` | `open` | vira obrigatório, com `onOpenChange`: não há `defaultOpen` |
| `Tour` | `step` | `step` | vira obrigatório, com `onStepChange`: não há `defaultStep`, e é no `onStepChange` que a tela rola o alvo |
| `Tour` | `interactive` | — | o `Modal` é outra janela, e o toque não atravessa o recorte até o alvo |
| `Tour` | `classNames` | `className` | um `className` só, na folha de baixo; a máscara não se veste |
| `TransferList` | `classNames` | — | um `className` só, na raiz; as listas empilham e cada uma tem os próprios botões |
| `Tree` | `expanded` | — | não há aberto: um nível por vez, e tocar num galho empurra o de dentro |
| `Tree` | `filter` | — | sem busca dentro da árvore; `emptyMessage` é o texto de nada encontrado |
| `Tree` | — | `label` | `label` é obrigatório: é ele que nomeia o nível para o leitor de tela |
| `TreeSelect` | `searchable` | — | sem busca na folha |
| `TreeSelect` | — | `label` | `label` é obrigatório, e o rodapé traz a contagem do rascunho e o `Aplicar` |

Fora da tabela, uma perda que se repete: **15 peças perdem `size` no nativo** — `Badge`, `Clipboard`, `CurrencyInput`, `DatePicker`, `DateRangePicker`, `Input`, `InputGroup`, `MaskedInput`, `NumberField`, `PasswordInput`, `PostalCodeField`, `SearchInput`, `TimeField`, `TimePicker` e `TreeSelect`. Alvo de toque não encolhe, e `comfortable` é a única altura. Esta lista é medida a cada geração, e não escrita à mão.

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

`ChartContainer`, `ChartDonut`, `ChartRadial`, `ChartGauge`, `ChartHeatmap`,
`ChartFunnel` e `ChartTreemap` vivem em `@rivocode/ui-native/chart` e pedem `react-native-svg`, peer **opcional** e
módulo nativo, que o app instala e liga ao projeto só se desenhar gráfico
(`npx expo install react-native-svg`). O `QRCode` mora no mesmo caminho pelo
mesmo peer, e o `PixCode` com ele: a regra é um subcaminho por peer, e não um
por assunto. O copiar do `PixCode` entra por `renderCopy`, com o `Clipboard` de
`@rivocode/ui-native/clipboard`. O `SignaturePad` também mora aqui, pelo mesmo
peer, com `signatureToSvg` e `isSignatureEmpty`: o PNG não porta, porque não há
canvas.

```tsx
import { ChartBar, ChartContainer, ChartDonut, ChartLine, ChartRadial, PALETTE, PixCode, QRCode } from '@rivocode/ui-native/chart'
import { SignaturePad, isSignatureEmpty, signatureToSvg } from '@rivocode/ui-native/chart'
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

**Para a barra e a linha andarem, desenhe com `ChartBar` e `ChartLine`**, do
mesmo caminho, no lugar de `Rect` e `Path` crus. Na montagem elas entram (a
barra cresce da base, a linha sobe da `baseline`, ou do ponto mais baixo) e,
quando o dado muda, vão até o valor novo com os tokens de movimento, pelo
Reanimated; com "reduzir movimento", nascem no lugar e saltam. A rosca e o arco
já fazem isso sozinhos: entram varrendo do zero.

```tsx
<ChartContainer config={SERIES} data={meses} className="h-56">
  {({ width, height, colors }) => (
    <Svg width={width} height={height}>
      {meses.map((mes, index) => (
        <ChartBar key={mes.mes} x={index * 40} y={height - mes.total} width={24} height={mes.total} fill={colors.receita} />
      ))}
    </Svg>
  )}
</ChartContainer>
```

A `Sparkline` fica de fora disto, na raiz e desenhada com `View`: ela é o slot
`chart` do `Stat`, e o `Stat` sai da raiz. Ela entra só esmaecendo, nos dois
pacotes, e não anda na troca de dados.

**As peças entram na montagem, como no web.** `Alert`, `EmptyState`,
`FileUploadItem` e o aviso de erro do `DataList` sobem 4px esmaecendo;
`Stat`, `Tracker`, `Timeline`, `Sparkline` e a lista do `DataList` esmaecem; a
pastilha do `Indicator` cresce; a barra do `Progress` e do `Meter` enche do
zero. Tudo em `duration-base`, ou `fast` na pastilha e `slow` na barra, e nada
disso roda com "reduzir movimento". A moldura (`Card`, `PageHeader`) fica
parada, e controle no estado inicial também.

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

**134 peças no catálogo do web, medidas contra `native/src/index.ts`, `native/src/form/index.ts`, `native/src/chart/index.ts`, `native/src/clipboard/index.ts`, `native/src/file-upload/index.ts`, `native/src/ai/index.ts` e `native/src/dnd/index.ts` em 2026-09-25:** 103 traduzem com o mesmo nome, 5 traduzem com outro, 0 estão na fila e 26 não portam por decisão. A coluna do meio separa as duas ausências, que é a distinção que a tabela existe para fazer: `○` muda com o tempo, `✕` não muda. E `✔` não quer dizer copiar e colar: a seção acima explica por quê.

| Peça | No React Native | O que saber antes de contar com ela |
| --- | --- | --- |
| `AILabel` | ✔ traduz | vive em `@rivocode/ui-native/ai`; a explicação abre numa `Sheet`, e não num painel ancorado, e é `string` |
| `Accordion` | ✔ traduz | `value`, `defaultValue` e `onValueChange` na raiz, pelo `value` de cada `AccordionItem`; o padrão é vários abertos (`multiple={false}` dá o um só do web), e item sem `value` abre sozinho. Abre com a seta girando e o corpo em fade, e sem movimento quando o sistema pede para reduzir |
| `ActionBar` | ✔ traduz | o mesmo `count`, `onClear` e a mesma frase; gruda acima da área segura de baixo, que entra por `bottomInset` |
| `Affix` | ✕ não porta | a plataforma já dá: um irmão da `ScrollView` com `position: absolute` não rola com ela, e o que gruda ao rolar é o `stickyHeaderIndices` da lista |
| `Alert` | ✔ traduz | `title` é prop e o corpo é filho; sem `AlertTitle`/`AlertDescription` |
| `AlertDialog` | ✔ traduz | `actionLabel` e `onAction` em vez de composição; `tone` `danger` ou `neutral`, e `onAction` que devolve promessa segura o modal em espera até ela terminar; não fecha no toque fora, como no web |
| `AppShell` | ✕ não porta | o esqueleto do app no celular é o router: tab bar, drawer e a barra de título da pilha |
| `AspectRatio` | ✔ traduz | `ratio` numérico, igual |
| `Autocomplete` | ✔ vira `Combobox` | e **não** aceita valor fora da lista: a folha escolhe, não digita |
| `Avatar` | ✔ traduz | `src` remoto pela `Image` do core; `fallback` é obrigatório, porque é ele que aparece enquanto a foto baixa e se ela falhar |
| `Badge` | ✔ traduz | os mesmos tons; o texto e filho; NAO tem `size`, porque no nativo so ha uma densidade |
| `Banner` | ✔ traduz | `title` e `description` em texto; o ícone é opcional e entra por função, porque o pacote não traz ícone |
| `Breadcrumb` | ✕ não porta | o caminho de volta é o botão de voltar do router |
| `Button` | ✔ traduz | contrato controlado; `hitSlop` no `sm`, porque 32px de alvo não se toca sem ajuda. Afunda de leve no toque, e não afunda quando o sistema pede para reduzir movimento |
| `ButtonGroup` | ✕ não porta | `Tabs` e `ToggleGroup` cobrem o caso; botão encostado em botão vira um alvo só no dedo |
| `Calendar` | ✔ traduz | mês desenhado à mão; valor ISO `aaaa-mm-dd`, exibição `dd/mm/aaaa`; o mês novo entra por fade |
| `Card` | ✔ traduz | com `CardHeader`, `CardTitle`, `CardDescription` e `CardContent` (sem `CardFooter`) |
| `Carousel` | ✔ traduz | sobre `FlatList` horizontal com `pagingEnabled`; a lista vem por `items` e `renderItem`, o `index` é controlado, e não há `autoplay` |
| `ChartContainer` | ✔ traduz | vive em `@rivocode/ui-native/chart`; os quatro finais atravessam com os mesmos nomes, e o desenho entra por função: não há Recharts, nem contentor que meça, nem `var(--color-série)` |
| `ChartDonut` | ✔ traduz | a legenda é o controle: sem dica para abrir no toque, tocar a linha acende a fatia e leva nome e valor ao meio; `format` aceita nome de formatador ou função, como no web, e as pontas saem retas |
| `ChartFunnel` | ✔ traduz | mesmas props, com `color` como papel de token; cada etapa é uma parada com nome, número e taxa na mesma frase |
| `ChartGauge` | ✔ traduz | atravessa quase inteiro, como o `ChartRadial`; a régua das faixas entra no nome acessível, porque não há descrição separada no toque |
| `ChartHeatmap` | ✔ traduz | a grade vira uma parada `adjustable` só, como o `Tracker`, e o dedo escolhe a célula; sem dica, a leitura mora numa linha embaixo |
| `ChartRadial` | ✔ traduz | atravessa quase inteiro, porque nunca teve dica; `color` é papel de token e o nome sai do que está escrito no meio, não só da porcentagem |
| `ChartTreemap` | ✔ traduz | cada categoria é um botão com nome, valor e fatia; tocar acende o contorno e escreve a leitura embaixo, e a regra do rótulo que some é a mesma |
| `Checkbox` | ✔ traduz | `checked` e `onCheckedChange` **obrigatórios**; sem `defaultChecked` e sem `indeterminate`; o tique aparece crescendo ao marcar |
| `CheckboxGroup` | ✔ traduz | `items` na raiz e `value: string[]`; `label` nomeia o conjunto, no lugar do `aria-label` do web |
| `Clipboard` | ✔ traduz | vive em `@rivocode/ui-native/clipboard`; a confirmação é dupla: o botão troca de nome e um aviso fala, porque rótulo trocado debaixo do dedo não é reanunciado |
| `Code` | ✔ traduz | o trecho quebra linha junto com a frase que o cerca, e o toque longo copia (`selectable`); a rolagem própria é do `CodeBlock`, que continua fora |
| `Collapsible` | ✔ traduz | `label` no lugar de `CollapsibleTrigger` e `CollapsiblePanel`; `open`/`onOpenChange` ou `defaultOpen`, como no web; o mesmo movimento do `Accordion` |
| `ColorPicker` | ✔ traduz | sai na raiz; controlada, e sem seta: cada amostra é um alvo de 44px com o desenho de 32 por dentro, e são seis por linha, não dez |
| `Combobox` | ✔ traduz | a lista abre numa folha com busca sem acento, e a folha sobe com o teclado; `items` na raiz, rasa ou em grupos `{ label, items }`, não `ComboboxItem` por filho |
| `Command` | ✕ não porta | paleta de comandos é gesto de mesa: um campo, uma lista e o teclado |
| `Container` | ✕ não porta | o celular já é mais estreito que o menor passo; o respiro lateral é o padding da tela, dentro da área segura |
| `ContextMenu` | ✔ vira `Menu` | o toque longo é o botão direito do celular: a área alvo vai como `children` do `Menu` |
| `Conversation` | ✔ traduz | vive em `@rivocode/ui-native/ai`; a lista vem por `items`, `renderItem` e `keyExtractor`, sobre uma `FlatList` invertida |
| `CookieConsent` | ✕ não porta | app não tem cookie; o consentimento de rastreio no celular é o aviso da plataforma, o App Tracking Transparency no iOS |
| `CurrencyInput` | ✔ traduz | os mesmos centavos, a mesma digitação da direita e a mesma leitura do colado; o campo é controlado |
| `DataTable` | ✔ vira `DataList` | `filter`, `selectable` e a seleção por `value`/`onValueChange` portam com o mesmo nome; ordenar e `pageSize` ficam de fora por desenho |
| `DatePicker` | ✔ traduz | abre a folha com o mês; guarda ISO e exibe `dd/mm/aaaa` |
| `DateRangePicker` | ✔ traduz | um mês numa folha, com as duas pontas na mesma grade; a peça ordena os toques, e o intervalo invertido deixou de existir |
| `DescriptionList` | ✔ traduz | as bordas entram por `Children`: a utility de divisória do Tailwind não existe no RN |
| `Dialog` | ✔ traduz | `open`, `onOpenChange` e `title` como props; sem `DialogTrigger`. Abre em fade, e sem transição quando o sistema pede para reduzir movimento; o cartão sobe para o espaço acima do teclado |
| `Editable` | ✔ traduz | quem abre é o toque **longo**, o retorno do teclado confirma e há um `Cancelar` visível: sair do campo não salva, ao contrário do web |
| `EmptyState` | ✔ traduz | `description` obrigatória, pelo mesmo motivo do web; `icon` e `illustration` nos dois lados |
| `EventCalendar` | ✕ não porta | grade de tempo e idioma de mesa; no telefone a resposta e a lista, e o mes e o `Calendar` |
| `Field` | ✔ traduz | `label`, `description` e `error` como props; o erro vence a descrição, como no web, e o texto que chega depois entra por fade |
| `Fieldset` | ✔ traduz | `legend` como prop |
| `FileUpload` | ✔ traduz | vive em `@rivocode/ui-native/file-upload`; a área de soltar vira um botão, porque no celular não há soltar; o `accept` fala MIME e o tamanho sai formatado sem `Intl` |
| `FilterBar` | ✔ traduz | rola na horizontal com o limpar ancorado FORA do que rola; a linha reservada e uma altura de alvo de toque; a borda com mais escondido vira regua de 1pt, e nao esmaecido |
| `FilterChip` | ✔ traduz | a faixa de toque tem 44pt e a pilula pintada continua com 28; `size` muda o desenho, nunca o alvo |
| `Form` | ✔ traduz | vive em `@rivocode/ui-native/form`; o `Form` entrega o `submit` em vez de esperar um `type="submit"`, e há um adaptador a mais, o `forText` |
| `Gantt` | ✕ não porta | cronograma é idioma de mesa; no telefone a tarefa por dia é lista, e o prazo é o `Calendar` |
| `Grid` | ✔ traduz | `columns`, `minItemWidth` em pontos e `gap`; a grade mede a própria largura para contar as colunas |
| `Heading` | ✔ traduz | `level` e `size` com os mesmos nomes e a mesma escala; sai como `Text` com `accessibilityRole="header"`, e o leitor de tela do celular não anuncia o nível |
| `Highlight` | ✔ traduz | sobre o `Text`, com o mesmo `query` e a mesma regra sem acento; `markClassName` no lugar do `classNames.mark` |
| `IconButton` | ✔ traduz | `accessibilityLabel` obrigatório no lugar do `label`; o `sm` ganha `hitSlop` até 44pt de alvo; sem `tooltip`, porque no toque não há pousar |
| `ImageViewer` | ✔ traduz | sobre `Modal` e `FlatList` com `pagingEnabled`; `index` controlado, pinça pelo `PanResponder` do core, sem peer novo |
| `Indicator` | ✔ traduz | `label` é obrigatório: a pastilha é uma parada só do leitor de tela, e o que ela diz é a frase, nunca o número |
| `Input` | ✔ traduz | a borda acende no foco: não há `focus-visible` em tela de toque; `onValueChange` recebe o texto, como no web, e o `onChangeText` do `TextInput` continua valendo |
| `InputGroup` | ✔ traduz | `prefix`, `suffix` e `actions` são props e a moldura desenha o próprio campo; sem `size` |
| `Item` | ✔ traduz | `title`, `description`, `media` e `actions` como props; o corte com reticências é `numberOfLines`, que lá é prop e não classe |
| `Kanban` | ✕ não porta | o quadro é idioma de mesa: a 390px cabe uma coluna, e levar o cartão a outra é um menu "Mover para", e não um arrasto |
| `Kbd` | ✕ não porta | não há teclado para desenhar |
| `Link` | ✔ traduz | `Text` com `accessibilityRole="link"`; o toque abre o `href` pelo `Linking`, e `onPress` é o lugar do `render` do web, para o router |
| `MaskedInput` | ✔ traduz | os mesmos moldes do web (`cpf`, `cnpj`, `moeda`, o `9` do molde escrito à mão); o valor chega limpo, e o texto com máscara vem no segundo argumento do `onValueChange` |
| `Menu` | ✔ traduz | folha de baixo com `actions`, nunca popup ancorado; `children` abre no toque longo |
| `Menubar` | ✕ não porta | idioma de mesa; navegação nativa é tab bar e drawer do router |
| `Message` | ✔ traduz | vive em `@rivocode/ui-native/ai`; `onCopy` no lugar do `copyValue`, porque copiar precisa do `expo-clipboard`, que mora em outro caminho |
| `Meter` | ✔ traduz | `format` como no web, e o texto pronto em `valueLabel` quando a medida já vem escrita; a barra anda até o valor novo |
| `NavigationMenu` | ✕ não porta | idioma de mesa; navegação nativa é tab bar e drawer do router |
| `NotificationCenter` | ✔ traduz | a lista abre numa `Sheet`; `open` é controlado, o sino entra por `icon`, e a linha chama `onItemPress` no lugar do `href` |
| `NumberField` | ✔ traduz | vira stepper (menos, valor, mais), que é o idioma do toque |
| `OTPField` | ✔ traduz | caixas visíveis, um campo escondido: teclado, autofill de SMS e leitor veem um só; o dígito aparece crescendo |
| `PageHeader` | ✔ traduz | `title`, `description`, `badge` e `actions` como props |
| `Pagination` | ✕ não porta | lista de celular rola; escolher o número da página é gesto de mesa |
| `PasswordInput` | ✔ traduz | o botão troca de nome com o estado (`labels.show`/`labels.hide`), e sair do campo esconde de novo |
| `PixCode` | ✔ traduz | vive em `@rivocode/ui-native/chart`, junto do `QRCode`; o copiar entra por `renderCopy`, porque o `Clipboard` mora em outro caminho |
| `Popconfirm` | ✔ vira `AlertDialog` | vira `AlertDialog`; no celular a confirmacao e modal e NAO cancela ao tocar fora |
| `Popover` | ✕ não porta | painel ancorado que o próprio dedo cobre: use `Sheet` |
| `PostalCodeField` | ✔ traduz | a mesma `lookup` e os mesmos quatro finais; o valor são os dígitos, sem a pontuação |
| `PreviewCard` | ✕ não porta | aparece ao pousar o ponteiro, e não há pousar no toque |
| `Progress` | ✔ traduz | `value` de 0 a 100 e `label`; `showValue` e `format` como no web; a barra anda até o valor novo |
| `PromptInput` | ✔ traduz | vive em `@rivocode/ui-native/ai`; controlado (`value` e `onValueChange` obrigatórios), e o envio é só pelo botão, porque a tecla de retorno do teclado do celular quebra a linha |
| `QRCode` | ✔ traduz | vive em `@rivocode/ui-native/chart`, porque desenha com o `react-native-svg`; o codificador é o mesmo, a tinta e o papel são fixos e não há `classNames` |
| `QueryBoundary` | ✔ traduz | mesmos nomes e mesma ordem; texto vira `string`, e nao ha `classNames` no pacote nativo |
| `Questionnaire` | ✔ traduz | controlado, com as perguntas por `items` (`single`, `multiple`, `text`); os mesmos estados e os mesmos textos, sem atalho de teclado |
| `RadioGroup` | ✔ traduz | `items` na raiz; nao existe `Radio` solto; `label` nomeia o grupo, no lugar do `aria-label` do web; o ponto aparece crescendo |
| `Rating` | ✔ traduz | um controle ajustável só para o leitor de tela, com `value` controlado; cada estrela tem 44pt de alvo, e o ícone entra por função |
| `RelativeTime` | ✔ traduz | o relógio porta, com passo por unidade e refeitura ao voltar do fundo; sem `Intl`, o texto é sempre numérico |
| `ResizablePanelGroup` | ✕ não porta | painel que se arrasta para dividir a largura é idioma de mesa; no celular cada área é uma tela do router, ou uma folha por cima |
| `RichTextEditor` | ✕ não porta | editar texto formatado no toque é outro motor (WebView ou biblioteca nativa, com peer de módulo nativo) e a barra é superfície de mesa; o celular escreve com `Textarea` e lê o que o web salvou com `RichTextView` |
| `RichTextView` | ✔ traduz | no índice principal, sem `WebView` e sem peer: o mesmo leitor do web monta cada bloco como `View` e cada marca como `Text`, e o link abre pelo `Linking` |
| `RivoProvider` | ✔ traduz | `theme` troca em runtime só entre os dois temas de casa, e tema de cliente é decisão de BUILD; `density` não existe: alvo de toque não encolhe, e `comfortable` é a única altura; e ganha `fonts`, que o web não tem |
| `ScrollArea` | ✔ traduz | a barra continua a do sistema; o que a peça traz no celular é o teclado: rola até o campo em foco e prende um `footer` que sobe com ele |
| `ScrollToTop` | ✕ não porta | a plataforma já dá: o toque na barra de status no iOS e o toque de novo na aba do router sobem a lista |
| `SearchInput` | ✔ traduz | `value` e `onValueChange` obrigatórios |
| `Select` | ✔ traduz | poucas opções fixas; `items` e `label` na raiz, e a lista abre numa folha de baixo, em seções quando `items` vem em grupos |
| `Separator` | ✔ traduz | só a linha horizontal |
| `Sheet` | ✔ traduz | só o comportamento de baixo, que já era o modo estreito do web; sobe deslizando, e sem transição quando o sistema pede para reduzir movimento; com campo dentro, a folha sobe junto com o teclado |
| `Sidebar` | ✕ não porta | idioma de mesa; navegação nativa é tab bar e drawer do router |
| `SignaturePad` | ✔ traduz | vive em `@rivocode/ui-native/chart`, porque desenha com o `react-native-svg`; o traço é o mesmo arquivo do web, o gesto é o `PanResponder`, e o PNG fica de fora por não haver canvas |
| `Skeleton` | ✔ traduz | mesma marca de lugar, mesmo token, e o mesmo pulso de 2 s; parado com reduzir movimento |
| `Slider` | ✔ traduz | anda por gesto e responde às ações do leitor de tela; um valor só, `label` obrigatório, e `showValue` e `format` como no web |
| `SortableList` | ✔ traduz | vive em `@rivocode/ui-native/dnd`, sem peer: o gesto é o `PanResponder` do core, e só a alça arrasta; o leitor de tela move por ações, um passo por vez |
| `Sparkline` | ✔ traduz | `line` e `bar` valem nos dois lados; `area` fica de fora (pede polígono preenchido, e o desenho nativo é `View`) |
| `Spinner` | ✔ traduz | `small` e `large`, os dois tamanhos do `ActivityIndicator` |
| `Splitter` | ✕ não porta | duas áreas lado a lado não cabem em tela estreita; no celular a lista e o detalhe são duas telas do router |
| `Spoiler` | ✔ traduz | os mesmos `maxHeight`, `expanded` e `labels`; o degradê é pintado na cor de `fadeOver`, porque não há máscara |
| `Stack` | ✔ traduz | mesmas props, menos `render`; o vão é a escala confortável, porque no toque não há densidade compacta |
| `Stat` | ✔ traduz | `value` já formatado, `delta` numérico escrito pelo `deltaFormat` do web, e o slot `chart` que a `Sparkline` nativa preenche |
| `Steps` | ✔ traduz | só o modo estreito do web (texto e barra), e por isso sem `onStepClick`; o `useWizard()` atravessa inteiro; a barra anda e o passo novo entra por fade |
| `Switch` | ✔ traduz | `checked` e `onCheckedChange` obrigatórios; o trilho é o do sistema, pintado por token, e o pino desliza pela animação da própria plataforma |
| `Table` | ✕ não porta | não há tabela no celular; a consulta vira `DataList` |
| `TableOfContents` | ✕ não porta | tela de app não tem índice lateral: texto longo no celular vira seções numa lista que abre cada uma, ou `Tabs` |
| `Tabs` | ✔ traduz | só a caixinha segmentada, por `items`; seção de página é trabalho do router nativo; o fundo da ativa desliza entre as abas |
| `TagsInput` | ✔ traduz | Enter e separador digitado fecham a ficha; o Backspace com o campo vazio não porta; a ficha nova entra crescendo e a que sai some por fade |
| `Text` | ✔ traduz | o mesmo `Text` que as outras peças vestem, com `size`, `tone`, `weight`, `truncate` e `lineClamp`; sem eles, herda do `Text` de fora |
| `Textarea` | ✔ traduz | `rows` é a altura inicial e o campo cresce; `onValueChange` recebe o texto, como no web e no `Input` |
| `TimeField` | ✔ traduz | digita com mascara e teclado numerico; as setas viram dois botoes de passo, no molde do `NumberField` |
| `TimePicker` | ✔ traduz | gatilho mais folha de baixo com duas colunas; NAO embute o TimeField, ao contrario do web |
| `Timeline` | ✔ traduz | os eventos vêm por `items`, com `tone` e `pending` em cada um; `at` é texto pronto, e cada evento é uma parada só do leitor de tela, com a posição escrita no rótulo |
| `ToastViewport` | ✔ vira `useToast` | não se monta nada: o `RivoProvider` já traz a fiação, e o hook é o mesmo. O aviso sobe e desce com as durações do web, e aparece parado quando o sistema pede para reduzir movimento |
| `Toggle` | ✔ traduz | `pressed` e `onPressedChange` |
| `ToggleGroup` | ✔ traduz | `items` na raiz; `multiple` para vários, o mesmo nome e o mesmo sentido do web |
| `ToolCall` | ✔ traduz | vive em `@rivocode/ui-native/ai`; os mesmos cinco estados com marca e texto, a entrada e a saída em fonte mono, e aprovar e recusar fora do painel |
| `Toolbar` | ✕ não porta | superfície de edição de mesa: uma parada de tabulação e navegação por seta, que o toque não tem |
| `Tooltip` | ✕ não porta | hover não existe no toque; o rótulo precisa estar na tela |
| `Tour` | ✔ traduz | sobre `Modal` e `measureInWindow`, com o alvo por ref; o balão é sempre folha, que sobe para o topo quando o alvo está embaixo, o passo é controlado e não há `interactive` |
| `Tracker` | ✔ traduz | a faixa inteira é um alvo só: o dedo arrasta e o período lido aparece na linha de baixo; `label` de cada ponto é `string` |
| `TransferList` | ✔ traduz | as duas listas empilham, cada uma com os próprios botões de mover; os mesmos `items`, `value` e `labels` |
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

## O teclado já vem tratado

O `react-native-keyboard-controller` é peer obrigatório, e o `KeyboardProvider`
dela mora dentro do `RivoProvider`: não monte outro (se o app já tinha um por
fora, o provider reaproveita). Tela com campo é `ScrollArea`, que rola até o
campo em foco; a ação de enviar vai no `footer`, que sobe com o teclado e entra
na conta de onde o campo para:

```tsx
<ScrollArea
  contentContainerClassName="gap-4 p-5"
  footer={<Button onPress={emitir}>Emitir nota</Button>}
>
  <Field label="Descrição">…</Field>
</ScrollArea>
```

A `ScrollArea` ocupa a altura do pai (`flex-1`), então o pai precisa ter
altura. O `SafeAreaView` do `react-native-safe-area-context` é componente de
terceiro e **ignora `className`**: `<SafeAreaView className="flex-1">` fica sem
altura, a rolagem some e o `footer` sobe para o topo da tela. Use
`<SafeAreaView style={{ flex: 1 }}>`.

`Sheet` e `Dialog` (e o que abre em folha: `Select`, `Combobox`, `Menu`,
`DatePicker`, `TimePicker`, `TreeSelect`) sobem com o teclado sozinhos. Com o
"reduzir movimento" ligado, a folha e o rodapé pulam para o lugar final em vez
de acompanhar o teclado.

## O que nunca fazer no native

- `KeyboardAvoidingView` do React Native ou `useAnimatedKeyboard` do
  Reanimated em volta das peças: o teclado já é descontado por elas, e o
  segundo desconto empurra a tela duas vezes. O `useAnimatedKeyboard` ainda
  está descontinuado no Reanimated 4.

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
