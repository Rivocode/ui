O `@rivocode/ui-native` leva o design system para o celular falando o **mesmo
vocabulário de classes** do web (`bg-bg`, `text-fg-muted`, `rounded-pill`)
via NativeWind, sobre os mesmos tokens. Nenhum componente conhece a cor da
marca: ele pede um papel semântico e o tema responde. Entre os dois temas de
casa a troca acontece em runtime; vestir a cor de um cliente é decisão de build,
e há uma seção inteira abaixo sobre o que isso muda.

O catálogo nasce por **tradução, não por porte**: cada peça web foi julgada no
idioma da plataforma antes de atravessar. Isso tem duas consequências, e a
segunda é a que custa caro quando ninguém a escreve.

## Mesmo nome não é mesma API

Onde o nome da peça é o mesmo, o nome da **prop** também é: `Avatar` recebe
`fallback`, `OTPField` avisa por `onValueComplete`, `ToggleGroup` aceita vários
com `multiple`. E, sem `multiple`, desaperta o anterior, como no web. Até a
0.1.0 estas três divergiam (`initials`, `onComplete`, `single` com o sentido
invertido), e quem escrevia as duas telas do mesmo produto trocava de
vocabulário no meio do caminho.

Nome igual, porém, **não é assinatura igual**: nenhuma das peças que atravessam
aceita o mesmo JSX dos dois lados. Duas regras explicam quase toda a diferença.

**No nativo tudo é controlado.** Não existe `defaultValue`, `defaultChecked` nem
`defaultOpen` de raiz. O estado mora no app, e as duas props do par são
obrigatórias:

```tsx
web     <Checkbox defaultChecked>ISS retido</Checkbox>
nativo  <Checkbox checked={retido} onCheckedChange={setRetido} />   os dois obrigatórios
```

**A lista vem por `items`, e não por composição.** O web monta o gatilho, o
painel e cada opção; o nativo recebe o array e desenha a folha de baixo, que
não tem gatilho ancorado para vestir:

```tsx
web     <Select items={PERIODOS} defaultValue="30">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{/* um SelectItem por opção */}</SelectContent>
        </Select>

nativo  <Select items={PERIODOS} value={periodo} onValueChange={setPeriodo} label="Período" />
```

O mesmo vale para `RadioGroup`, `CheckboxGroup`, `ToggleGroup`, `Combobox` e
`Tabs`: onde o web pede filhos, o nativo pede `items`. E o `label` que aparece
ali não é enfeite: é por ele que o leitor de tela anuncia o controle, papel que
no web era do `SelectTrigger`.

A conclusão prática: **a tela não se copia de um lado para o outro.** O que se
reaproveita é o vocabulário de classes, o token e a decisão de qual peça usar.
O JSX se reescreve.

## O formulário entra por outro caminho

O `Form`, o `FormField`, os adaptadores e o `useZodForm` vivem em
`@rivocode/ui-native/form`, e não no índice principal, com o mesmo arranjo
do web e pela mesma razão: o `react-hook-form` é peer **opcional**, e o metro
resolve import por arquivo. Dentro do índice da raiz, um app que só quer um
`Button` teria de instalar o `react-hook-form` para o bundle fechar.

```tsx
import { Button, Input } from '@rivocode/ui-native'
import { Form, FormField, forText, useZodForm } from '@rivocode/ui-native/form'
```

Duas diferenças mordem na primeira tela. **Nada envia sozinho**: não há
`<form>`, `type="submit"` nem Enter que envie, então o `Form` entrega o envio
por função: `{({ submit, isSubmitting }) => …}`. E **o rótulo viaja no
campo**: no web o `Field` da Base UI liga rótulo e controle pelo `for`, e aqui
não há `for` nem `id`; o `FormField` põe `accessibilityLabel` e `invalid`
dentro do campo, e o adaptador os leva ao controle. Sem isso, um `TextInput`
embaixo de um rótulo fica sem nome para o leitor de tela.

## O gráfico entra por outro caminho, e traz um peer nativo

`ChartContainer`, `ChartDonut` e `ChartRadial` vivem em
`@rivocode/ui-native/chart`, pela mesma regra do formulário, só que aqui o
peer opcional custa mais do que bytes:

```sh
npx expo install react-native-svg
```

```tsx
import { ChartContainer, ChartDonut, ChartRadial } from '@rivocode/ui-native/chart'
```

O `react-native-svg` é **módulo nativo**: quem não desenha gráfico não o
instala, não o liga ao projeto de iOS e Android e não reconstrói por causa
dele. É por isso que as três peças não saem do índice da raiz, e é por isso
que a `Sparkline` continua desenhada com `View`, onde está: ela é o slot
`chart` do `Stat`, o `Stat` sai da raiz, e trazê-la para cá cobraria o peer de
quem só queria um número dentro de um cartão.

Duas decisões valem pelas três peças. **Nada mede sozinho**: no lugar do
`ResponsiveContainer` e das `var(--color-série)`, o `ChartContainer` mede com
`onLayout`, resolve as cores do `config` e entrega `{ width, height, colors }`
a quem desenha, com a medida zerada no primeiro quadro, porque no telefone não
existe largura antes do layout. E **no toque não há dica**: a rosca põe nome e
valor de cada fatia na legenda, que é também o controle: tocar a linha acende
a fatia e manda o valor para o meio do anel, no lugar exato onde o web abre a
dica. O resto está na tabela abaixo.

## Copiar e anexar entram por dois caminhos, e não por um

`Clipboard` e `FileUpload` fecham a mesma regra do formulário e do gráfico, e
levam a divisão um passo adiante: **um subcaminho por peer, e não um por
assunto**.

```sh
npx expo install expo-clipboard        # @rivocode/ui-native/clipboard
npx expo install expo-document-picker  # @rivocode/ui-native/file-upload
```

```tsx
import { Clipboard } from '@rivocode/ui-native/clipboard'
import { FileUpload, FileUploadItem, FileUploadList } from '@rivocode/ui-native/file-upload'
```

Os dois poderiam dividir uma porta só (`/expo`, digamos), e a conta de quem
instala diz que não. Quem põe um botão de copiar ao lado da chave de acesso de
uma NF-e não anexa arquivo nenhum; um índice comum arrastaria o
`expo-document-picker` para o projeto dele, que é exatamente o custo que este
arranjo existe para não cobrar. Módulo do Expo no celular não é bytes: é build.
A fronteira dos dois é guardada junto com a do gráfico e a do formulário, nos
dois pacotes, por `scripts/check-fronteira-do-chart.ts`.

**A confirmação de copiar passa a ser dupla, e no web bastava uma.** A regra da
peça não muda: copiar é a ação sem resultado visível, e sem confirmação a
pessoa toca de novo por dúvida. O que muda é por onde ela chega: o botão troca
o ícone e o nome acessível, como lá, e a peça dispara **também** um aviso,
porque aqui trocar o `accessibilityLabel` de um `Pressable` que já está sob o
foco **não é reanunciado** por leitor de tela nenhum. Quem não vê o ícone virar
visto não ficaria sabendo de nada; o aviso que o `RivoProvider` já monta mora
num `accessibilityLiveRegion="polite"` e é o único canal desta tela que fala
sozinho. `toast={false}` desliga, para a tela que copia várias coisas seguidas.
E quando a área de transferência recusa (o `setStringAsync` do Expo devolve
`false`, o que no telefone não acontece e no passe web sim), **nada é
confirmado**: mentir que copiou é pior do que não confirmar.

**E a área de soltar não existe.** No celular nada pode ser arrastado para
lugar nenhum, e o retângulo tracejado do web é, letra por letra, o idioma de
"solte aqui". Tirado o soltar, o que sobra daquela caixa é um botão com muito
espaço vazio em volta: **o espaço era o alvo de soltar, e não a affordance**.
Então o `FileUpload` nativo é um botão de altura de controle, com o `hint`
dentro do nome falado (quem ouve a tela precisa saber "XML ou PDF, até 5 MB"
antes de abrir o seletor, e não depois de ser recusado), e a altura que ele
devolve é da lista. O `accept` fala **MIME**, que é o que o seletor do sistema
sabe filtrar. Extensão com ponto continua valendo na validação de volta, mas
não vai para o diálogo, onde não casaria nada. O que volta não é um `File`: é
um `PickedFile` com o `uri` local que o app usa para subir, e cujo `size` pode
faltar, porque nem todo provedor de arquivo do Android o informa. O `maxSize` só
recusa o que conseguiu medir.

## A paridade, peça por peça

**91 peças no catálogo do web, medidas contra `native/src/index.ts`, `native/src/form/index.ts`, `native/src/chart/index.ts`, `native/src/clipboard/index.ts` e `native/src/file-upload/index.ts` em 2026-08-28:** 69 traduzem com o mesmo nome, 5 traduzem com outro, 0 estão na fila e 17 não portam por decisão. A coluna do meio separa as duas ausências, que é a distinção que a tabela existe para fazer: `○` muda com o tempo, `✕` não muda. E `✔` não quer dizer copiar e colar: a seção acima explica por quê.

| Peça | No React Native | O que saber antes de contar com ela |
| --- | --- | --- |
| `Accordion` | ✔ traduz | cada `AccordionItem` guarda o próprio aberto; não há raiz controlada |
| `Alert` | ✔ traduz | `title` é prop e o corpo é filho; sem `AlertTitle`/`AlertDescription` |
| `AlertDialog` | ✔ traduz | `actionLabel` e `onAction` em vez de composição; não fecha no toque fora, como no web |
| `AspectRatio` | ✔ traduz | `ratio` numérico, igual |
| `Autocomplete` | ✔ vira `Combobox` | e **não** aceita valor fora da lista: a folha escolhe, não digita |
| `Avatar` | ✔ traduz | `src` remoto pela `Image` do core; `fallback` é obrigatório, porque é ele que aparece enquanto a foto baixa e se ela falhar |
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
| `ContextMenu` | ✔ vira `Menu` | o toque longo é o botão direito do celular: a área alvo vai como `children` do `Menu` |
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
| `Menu` | ✔ traduz | folha de baixo com `actions`, nunca popup ancorado; `children` abre no toque longo |
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

## Instalação

Num app Expo:

```sh
npx expo install nativewind@preview react-native-css tailwindcss @tailwindcss/postcss postcss
npm install @rivocode/ui-native
```

O `@preview` não é enfeite: no npm a tag `latest` do NativeWind ainda é a
4.2.6, e este pacote pede a 5 (`nativewind: ">=5.0.0-preview.1"` no peer).
Sem a tag você instala a v4, e aí o `metro.config.js` logo abaixo nem carrega:
a v5 exporta `withNativewind`, a v4 exporta `withNativeWind`, com W
maiúsculo, e o erro que sai é um `undefined is not a function` que não conta
de onde veio. Saiba antes de começar: **a NativeWind 5 ainda é pré-lançamento**
e é o único caminho que o `@rivocode/ui-native` conhece hoje, então ir para
produção com ele é ir para produção sobre um preview.

Cinco arquivos do app participam, cada um por um motivo que morde:

**1. `metro.config.js`**. O NativeWind entra no build:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

module.exports = withNativewind(getDefaultConfig(__dirname));
```

**2. `package.json`**. Navegadores modernos, cravados:

```json
"browserslist": ["chrome 130", "safari 18", "firefox 130"]
```

Não é sobre navegador nenhum: o Expo roda um passe web no CSS antes do
compilador nativo, e sem esse campo ele reescreve o `light-dark()` dos tokens
num polyfill de vars órfãs que mata a compilação. É esta linha que sustenta a
troca entre os dois temas de casa em runtime.

**3. `app.json`**. `"userInterfaceStyle": "automatic"`, senão o iOS prende a
aparência no claro e o tema escuro nunca chega.

**4. `global.css`**. A fonte do CSS:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "@rivocode/ui-native/theme.css";
@import "tailwindcss/utilities.css";

@source "./App.tsx";
@source "./node_modules/@rivocode/ui-native/src";
```

O app **não importa o `global.css`**: importa o pré-compilado.

```sh
npx rivocode-ui-native-css   # lê global.css, escreve generated.css
```

O pipeline do metro tropeça em `@import` e `@property` dentro do compilador
nativo; o comando entrega um arquivo já resolvido, e falha **com o nome da
var** quando algo não traduziria. Usou uma classe nova, rode de novo.

**5. `nativewind-env.d.ts`**. O TypeScript aprende o `className`:

```ts
/// <reference types="nativewind/types" />
```

O sintoma é o projeto novo abrir com uma parede de erro: *Property
`className` does not exist on type ...* em toda `View`, `Text` e `Pressable`
que você escreveu, e nas do `@rivocode/ui-native` junto (foram 167 num app
recém-criado). A causa é que `className` não existe no React Native: quem o
acrescenta às props é uma declaração de módulo que mora na NativeWind, e ela
só entra no programa se este arquivo a referenciar. Nada disso aparece em
runtime (o app roda e as cores estão certas), então é fácil ler os erros
como culpa da biblioteca.

O `withNativewind` do passo 1 gera o arquivo na primeira vez que o metro
sobe, com este nome exato (a opção `typescriptEnvPath` muda o caminho).
Escreva-o à mão quando o `tsc` roda antes do app (CI, ou o editor num clone
recém-baixado), e **não o coloque no `.gitignore`**: sem ele versionado, o
erro volta a cada clone.

## O Provider, uma vez, na raiz

```tsx
import "./generated.css";
import { RivoProvider, Button, useToast } from "@rivocode/ui-native";

export default function App() {
  return (
    <RivoProvider theme="rivocode-dark">
      <MinhaTela />
    </RivoProvider>
  );
}
```

- `theme`: `rivocode-dark` (padrão), `rivocode-light` ou `system`, que segue o
  aparelho. **Entre os dois temas de casa, trocar a prop troca a tela inteira em
  runtime**: essas cores foram compiladas como `light-dark()`, e o provider só
  gira o esquema de cor do Appearance. A prop aceita também o mapa de um tema de
  cliente, e aí a história é outra: leia a seção abaixo antes.
- `density`: **não existe no pacote nativo.** Alvo de toque não encolhe em tela
  de dedo, e `comfortable` é a única altura.
- O `useToast` já vem ligado, como no web: nenhum provedor extra para montar.

## Tema de cliente: é decisão de build, não prop de runtime

Esta é a diferença mais cara entre os dois pacotes, e a que mais se supõe
errado. No web a camada 3 é lida em runtime, e `<RivoProvider theme="acme">`
troca a página inteira com ela aberta. Aqui não.

**A cor de classe só muda em build.** O compilador do `react-native-css`
resolve o token e crava o valor dentro da regra: `.bg-accent` vira
`{"backgroundColor":"#d4f34a"}`, literal, e nos 56 KB de CSS compilado não sobra
**uma ocorrência de `--`**. Não há variável viva no aparelho para redefinir, e
por isso nenhum objeto de tema passado em runtime jamais trocou cor de classe.

**O mapa de tema SAIU do provider.** Ele alcançava quem lê a
cor por JS, do contexto - `ChartDonut`, `ChartRadial`, o giro do `Button` e do
`Spinner`, o trilho do `Switch`, a `Sparkline`, o texto de dica dos campos -, e
não alcançava fundo, cartão, botão, selo e borda, que são classe: dava donut de
um tema e botão de outro na mesma tela, sem nada vermelho no console além do
aviso em `__DEV__`.

Uma metade que discorda da outra é pior do que nenhuma. O provider passou a
resolver os 45 papéis **lendo o CSS compilado**, uma classe `bg-` por papel, e
publica no mesmo contexto que as peças já liam: contexto e classe dizem sempre a
mesma cor. Com isso o mapa deixou de ter o que fazer e foi removido: a prop
`theme` aceita só `rivocode-dark`, `rivocode-light` e `system`, e a prop `scheme`
saiu junto, porque era ela que escolhia o esquema do mapa.

### O caminho que funciona

Sobrescreva os papéis num `@theme` seu no `global.css`, depois do `theme.css` do
pacote, e pré-compile de novo. É a mesma camada 3, no vocabulário `--color-*`
que o compilador nativo lê:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "@rivocode/ui-native/theme.css";
@import "tailwindcss/utilities.css";

@theme {
  --color-accent: #2563eb;
  --color-accent-hover: #3b82f6;
  --color-accent-fg: #ffffff;
  --color-bg: light-dark(#f7f8fa, #0d1220);
  --color-surface: light-dark(#ffffff, #141b2d);
  /* …e os outros papéis que a marca troca. */
}

@source "./App.tsx";
@source "./node_modules/@rivocode/ui-native/src";
```

```sh
npx rivocode-ui-native-css
```

Isto sozinho veste a marca inteira, gráfico incluído: a classe pinta a cor nova,
e a peça que pinta por fora da classe lê a mesma cor do mesmo CSS. Não passe
mapa nenhum na prop `theme`.

**E há um teto: dois temas por build.** `light-dark()` tem duas vagas, uma clara
e uma escura. Um app de um cliente cabe folgado, e é o caso normal; uma vitrine
de cinco temas, como a deste site no web, **não cabe sem cinco bundles**. É teto
de arquitetura, e não pendência. O [guia de temas](/temas) tem o passo a passo e
a lista completa de papéis.

### Escreva só a paleta, e o comando escreve o tema

O `@theme` acima tem 45 papéis para preencher, e é aí que o tema de cliente
começa a envelhecer. Os nomes de papel, os pares de contraste, os mínimos, a
composição de alfa e o formato que o compilador nativo aceita são conhecimento da
biblioteca. Antes deste comando eles moravam no app de quem vestia o cliente: um
consumidor real escreveu 220 linhas para isso, e portou a conta de contraste com
um defeito calado justo nos 12 papéis que carregam alfa.

O segundo binário do pacote traz essa conta de volta para dentro:

```sh
npx rivocode-ui-native-theme acme.ts    # lê a paleta, escreve acme.theme.css
npx rivocode-ui-native-theme acme.ts saida.css
npx rivocode-ui-native-theme --papeis   # o que você escreve, o que ele deriva
```

Você escreve **oito papéis por esquema**, num `.ts`, `.js`, `.mjs` ou `.json`:

```ts
export const acme = {
  light: {
    bg: "#ffffff",
    surface: "#ffffff",
    fg: "#111111",
    accent: "#1d4ed8",
    success: "#0f6b52",
    warning: "#7a4a00",
    danger: "#b3261e",
    info: "#1d4ed8",
  },
  dark: {
    bg: "#101314",
    surface: "#191d1f",
    fg: "#f2f3f0",
    accent: "#8ab4f8",
    success: "#3ddc97",
    warning: "#f2b21c",
    danger: "#ff8a8a",
    info: "#8ab4f8",
  },
};
```

A saída entra no `global.css` **depois** do tema do pacote, e o pré-compilado sai
como sempre:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "@rivocode/ui-native/theme.css";
@import "./acme.theme.css";
@import "tailwindcss/utilities.css";

@source "./App.tsx";
@source "./node_modules/@rivocode/ui-native/src";
```

```sh
npx rivocode-ui-native-css
```

Qualquer um dos 45 papéis se escreve à mão na paleta, e o comando para de derivar
aquele.

#### Ele recusa escrever tema que não passa no contraste

A medida é a do `@rivocode/ui-native/contrast`, o mesmo motor que o `bun run
check` do repositório usa: os pares que carregam texto, a fronteira de controle
de 3:1, o alfa sobre alfa do `Calendar`, a camada achatada por `opacity` do botão
destrutivo e o trilho do `Switch` ligado.

```
Guarda de contraste:
  claro: 1 falha(s)
    accent-fg sobre accent  2.45:1 (min 4.5)
  escuro: passa

Nada foi escrito: conserte o contraste antes de gerar o CSS.
```

Nada é escrito enquanto um par estiver abaixo do mínimo. Tema que ninguém mediu é
exatamente o que este comando existe para não deixar acontecer.

#### O que ele deriva, e o que ele se recusa a adivinhar

Derivar aqui é **reusar cor que você escreveu, ou compor alfa dela**. O comando
nunca inventa matiz nova:

| Papéis | De onde saem |
|---|---|
| `surface-raised` | igual a `surface` |
| `fg-muted`, `fg-subtle`, `fg-disabled` | `fg` puxado 30%, 38% e 55% para o `bg` |
| `border`, `border-strong`, `border-disabled`, `line-hover`, `skeleton`, `overlay` | alfa de `fg` na escada da casa |
| `accent-hover`, `accent-active` | `accent` um passo para o claro e um para o escuro |
| `accent-subtle`, `selected`, os quatro `*-subtle` | alfa da cor correspondente |
| `accent-fg` e os quatro `*-fg` | o tom de `fg`/`bg` que pesa mais sobre o preenchimento, e o branco ou o preto puro quando nenhum dos dois alcança 4,5:1 |
| `ring` | igual a `accent-text` |
| `chart-1` a `chart-8` | a série da RivoCode, medida sobre o **seu** fundo |

Duas escolhas dessa tabela merecem o motivo escrito.

**`accent-text` e os quatro `*-text` são reusados, e só quando passam.** Eles são
a cor que se **lê**: escurecer o vermelho da marca um passo sem avisar é decisão
de quem desenha, e não de um script. Então o comando tenta o próprio
preenchimento, e onde ele não alcança 4,5:1 sobre os três fundos ele **recusa e
diz o valor que passaria**:

```
    light.accent-text foi DERIVADO: o proprio `accent`, e so quando ele passa em 4,5:1
      `accent-text: "#667524"` passaria - confira se e a cor da marca.
```

**`chart-1` a `chart-8` caem na série da RivoCode.** É a única exceção declarada,
e ela não é derivação: série de gráfico é escala categórica, e não identidade de
marca. Mesmo sendo padrão, ela é medida sobre o **seu** fundo, e reprova se não
couber. Escreva as oito na paleta se a marca tiver a dela.

#### Papel novo em versão nova acusa, em vez de o tema quebrar calado

A lista de papéis sai do `tokens.json` do pacote **instalado**, e não de uma cópia
dentro do comando. Quando uma versão nova trouxer um papel, o comando o cobra
pelo nome na primeira vez que você rodar:

```
1 papel(eis) sem valor:
    light.accent-quiet  - papel novo no @rivocode/ui-native 0.4.0, e este comando ainda nao sabe derivar
```

Sem isso o papel novo simplesmente não sairia no seu `@theme`, a classe cairia no
valor do `theme.css` do pacote, e a tela sairia misturada: metade do cliente,
metade da RivoCode. Nome errado na paleta é acusado do mesmo jeito, com sugestão
do papel que você quis dizer.

#### `oklch()` entra direto, e a paleta do Tailwind 4 com ele

A conta da WCAG desta casa lê hexadecimal de 3, 4, 6 e 8 dígitos, `rgb()`,
`rgba()`, `hsl()`, `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()` e
`color()` nos espaços predefinidos do CSS, e converte tudo para sRGB antes de
medir. A paleta do Tailwind 4 é escrita em `oklch()`: copie a cor de lá e o
comando mede, sem conversor no meio. O CSS que ele **escreve** continua sendo
sRGB literal, porque é o que o compilador nativo crava — a conversão acontece na
entrada, e não na sua mão.

Duas coisas ainda são recusadas, e as duas por não terem medida possível:
`color-mix()`, que não é uma cor e sim uma conta cujo resultado depende do espaço
de interpolação e do método de matiz, e semente que carrega alfa — semente é cor
cheia, porque é dela que sai a escada de alfa dos papéis derivados.

Cor que descreve tom fora do gamut do sRGB — 82 das 286 cores nomeadas do
Tailwind 4 estão nessa faixa — é medida no valor que o aparelho mostra: o
excedente é cortado canal por canal, e o comando avisa quais papéis caíram ali e
para qual valor.

#### O teto de dois temas está na mensagem de erro, e não só aqui

Um terceiro esquema no arquivo é recusado com o motivo, porque quem passa três
precisa **ouvir** por que não cabem:

```
3 esquemas em acme.ts: light, dark, contraste.

    Cabem dois, e o teto nao e escolha nossa. Cada papel sai como
    `light-dark(claro, escuro)`, e `light-dark()` tem DUAS vagas: uma clara
    e uma escura. [...]
    Um terceiro esquema e um terceiro BUNDLE: rode o comando uma vez por par
    e escolha o CSS no build.
```

## Ajuste fino com className

Como no web, toda peça aceita `className` na raiz e a classe de quem usa vence
a da peça: `h-14` derruba o `h-12` do Button, `rounded-pill` derruba o
`rounded-md`. É o que permite um wrapper de cliente num arquivo do app, sem
fork. Nas peças com folha (Select, Combobox, DatePicker, Sheet, Dialog, Menu),
a documentação da prop diz o que ela veste, o gatilho ou o painel. Lembre da
regra do pré-compilador: classe nova usada no app pede `npx
rivocode-ui-native-css` de novo.

## Ícones

O mesmo Lucide do web, pelo pacote irmão:

```sh
npx expo install lucide-react-native react-native-svg
```

Os nomes são os mesmos (`Receipt` lá é `Receipt` aqui), então o vocabulário
canônico do [guia de ícones](/icones) vale nos dois mundos, e a
[galeria com busca](/icones) serve aos dois. Dentro das peças da biblioteca os
ícones de estado continuam desenhados com borda (o visto do Checkbox, os
chevrons do Calendar): peça não carrega dependência de ícone, app carrega se
quiser.

## O que nunca fazer

- Classe com var arbitrária (`h-[--rc-control-md]`) ou `translate-*`: o
  compilador do react-native-css atual não tolera var viva nem a shorthand
  `translate`. Altura de controle é fixa por tamanho.
- Remover o `browserslist` moderno do `package.json`. O erro que aparece
  (`expected an object-like struct named Specifier`) não diz o porquê; esta
  linha diz.
- Glyph de texto como ícone de estado: o visto do Checkbox é borda rotacionada,
  porque fonte muda de corpo entre iOS e Android.
- Esquecer `accessibilityRole`/`accessibilityState` em controle custom. Toda
  peça do catálogo já os traz.

## O exemplo completo

O repositório traz um app Expo em `examples/native` com todas as peças em uso
numa tela de produto: painel, listagem com detalhe em Sheet, formulário,
confirmação destrutiva e o interruptor de tema. `bunx expo start --ios` dentro
dele, e o simulador conta o resto.
