# Construir tela nativa com o ui-native

O React Native fala o **mesmo vocabulário** do web (`bg-bg`, `text-fg-muted`,
`rounded-pill`) via NativeWind, sobre um `theme.css` gerado dos mesmos tokens
(`bun run gen:native` na raiz). Nenhum componente conhece a cor da marca aqui
também.

Os componentes vivem em `native/src` e o app de exemplo em `examples/native`
(`bunx expo start --ios`). O CSS do app é pré-compilado:
`node scripts/build-css.mjs` dentro do app: mudou classe nova, rode de novo.

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

**90 peças no catálogo do web, medidas contra `native/src/index.ts`, `native/src/form/index.ts`, `native/src/chart/index.ts`, `native/src/clipboard/index.ts` e `native/src/file-upload/index.ts` em 2026-08-27:** 69 traduzem com o mesmo nome, 4 traduzem com outro, 0 estão na fila e 17 não portam por decisão. A coluna do meio separa as duas ausências, que é a distinção que a tabela existe para fazer: `○` muda com o tempo, `✕` não muda. E `✔` não quer dizer copiar e colar: a seção acima explica por quê.

| Peça | No React Native | O que saber antes de contar com ela |
| --- | --- | --- |
| `Accordion` | ✔ traduz | cada `AccordionItem` guarda o próprio aberto; não há raiz controlada |
| `Alert` | ✔ traduz | `title` é prop e o corpo é filho; sem `AlertTitle`/`AlertDescription` |
| `AlertDialog` | ✔ traduz | `actionLabel` e `onAction` em vez de composição; não fecha no toque fora, como no web |
| `AspectRatio` | ✔ traduz | `ratio` numérico, igual |
| `Autocomplete` | ✔ vira `Combobox` | e **não** aceita valor fora da lista: a folha escolhe, não digita |
| `Avatar` | ✔ traduz | só `fallback`, as iniciais: imagem remota ainda não entra |
| `Badge` | ✔ traduz | os mesmos tons; o texto é filho |
| `Breadcrumb` | ✕ não porta | o caminho de volta é o botão de voltar do router |
| `Button` | ✔ traduz | contrato controlado; `hitSlop` no `sm`, porque 32px de alvo não se toca sem ajuda |
| `ButtonGroup` | ✕ não porta | `Tabs` e `ToggleGroup` cobrem o caso; botão encostado em botão vira um alvo só no dedo |
| `Calendar` | ✔ traduz | mês desenhado à mão; valor ISO `aaaa-mm-dd`, exibição `dd/mm/aaaa` |
| `Card` | ✔ traduz | com `CardHeader`, `CardTitle`, `CardDescription` e `CardContent` (sem `CardFooter`) |
| `ChartContainer` | ✔ traduz | vive em `@rivocode/ui-native/chart`; os quatro finais atravessam com os mesmos nomes, e o desenho entra por função: não há Recharts, nem contentor que meça, nem `var(--color-série)` |
| `ChartDonut` | ✔ traduz | a legenda é o controle: sem dica para abrir no toque, tocar a linha acende a fatia e leva nome e valor ao meio; `format` só aceita função, e as pontas saem retas |
| `ChartRadial` | ✔ traduz | atravessa quase inteiro, porque nunca teve dica; `color` é papel de token e o nome sai do que está escrito no meio, não só da porcentagem |
| `Checkbox` | ✔ traduz | `checked` e `onCheckedChange` **obrigatórios**; sem `defaultChecked` e sem `indeterminate` |
| `CheckboxGroup` | ✔ traduz | `items` na raiz e `value: string[]`, em vez de um `Checkbox` por filho |
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
| `Field` | ✔ traduz | `label`, `description` e `error` como props; o erro vence a descrição, como no web |
| `Fieldset` | ✔ traduz | `legend` como prop |
| `FileUpload` | ✔ traduz | vive em `@rivocode/ui-native/file-upload`; a área de soltar vira um botão, porque no celular não há soltar; o `accept` fala MIME e o tamanho sai formatado sem `Intl` |
| `FilterBar` | ✔ traduz | rola na horizontal com o limpar ancorado FORA do que rola; a linha reservada e uma altura de
      alvo de toque; a borda com mais escondido vira regua de 1pt, e nao esmaecido |
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
| `RadioGroup` | ✔ traduz | `items` na raiz; não existe `Radio` solto para compor |
| `RelativeTime` | ✔ traduz | o relógio porta, com passo por unidade e refeitura ao voltar do fundo; sem `Intl`, o texto é sempre numérico |
| `RivoProvider` | ✔ traduz | mesmo contrato de `theme`; `density` existe por paridade, e `comfortable` é a única altura (alvo de toque não encolhe); e ganha `fonts`, que o web não tem |
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
| `Textarea` | ✔ traduz | `rows` é a altura inicial; o campo cresce com o conteúdo |
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
  mata a compilação. É ele que sustenta a troca de tema em runtime: o
  `RivoProvider` aceita `rivocode-dark`, `rivocode-light` e `system`, e trocar
  a prop troca a tela inteira via `Appearance.setColorScheme()`.
- Densidade compacta: não porta de propósito. Alvo de toque não encolhe em
  tela de dedo; `density` existe na API por paridade, mas `comfortable` é a
  única altura.
- Glyph de texto como ícone de estado (o visto do Checkbox é borda
  rotacionada, porque fonte muda de corpo entre iOS e Android).
- Esquecer `accessibilityRole`/`accessibilityState` em controle custom.
- `text-center` como classe em `TextInput`: esse estilo vira prop no runtime
  e a aplicação quebra. Use a prop `textAlign`. O mesmo vale para atalhos
  lógicos (`border-x` gera `border-inline`, que não existe lá): escreva
  `border-l border-r`.
- A utility de divisória do Tailwind (a de bordas entre filhos): o seletor de
  filho não existe no RN. O `DescriptionList` interpõe bordas via `Children`.
- Escrever nome de classe em comentário: o scanner do Tailwind lê fonte crua
  e gera a classe. Foi assim que uma palavra num comentário derrubou o build.
