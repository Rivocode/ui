O `@rivocode/ui-native` leva o design system para o celular falando o **mesmo
vocabulário de classes** do web — `bg-bg`, `text-fg-muted`, `rounded-pill` —
via NativeWind, sobre os mesmos tokens. Nenhum componente conhece a cor da
marca: ele pede um papel semântico e o tema responde, inclusive em runtime.

O catálogo nasce por **tradução, não por porte**: cada peça web foi julgada no
idioma da plataforma antes de atravessar. Isso tem duas consequências, e a
segunda é a que custa caro quando ninguém a escreve.

## Mesmo nome não é mesma API

Onde o nome da peça é o mesmo, o nome da **prop** também é: `Avatar` recebe
`fallback`, `OTPField` avisa por `onValueComplete`, `ToggleGroup` aceita vários
com `multiple` — e, sem `multiple`, desaperta o anterior, como no web. Até a
0.1.0 estas três divergiam (`initials`, `onComplete`, `single` com o sentido
invertido), e quem escrevia as duas telas do mesmo produto trocava de
vocabulário no meio do caminho.

Nome igual, porém, **não é assinatura igual**: nenhuma das peças que atravessam
aceita o mesmo JSX dos dois lados. Duas regras explicam quase toda a diferença.

**No nativo tudo é controlado.** Não existe `defaultValue`, `defaultChecked` nem
`defaultOpen` de raiz — o estado mora no app, e as duas props do par são
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
ali não é enfeite — é por ele que o leitor de tela anuncia o controle, papel que
no web era do `SelectTrigger`.

A conclusão prática: **a tela não se copia de um lado para o outro.** O que se
reaproveita é o vocabulário de classes, o token e a decisão de qual peça usar.
O JSX se reescreve.

## O formulário entra por outro caminho

O `Form`, o `FormField`, os adaptadores e o `useZodForm` vivem em
`@rivocode/ui-native/form`, e não no índice principal — o mesmo arranjo do
web, e pela mesma razão: o `react-hook-form` é peer **opcional**, e o metro
resolve import por arquivo. Dentro do índice da raiz, um app que só quer um
`Button` teria de instalar o `react-hook-form` para o bundle fechar.

```tsx
import { Button, Input } from '@rivocode/ui-native'
import { Form, FormField, forText, useZodForm } from '@rivocode/ui-native/form'
```

Duas diferenças mordem na primeira tela. **Nada envia sozinho**: não há
`<form>`, `type="submit"` nem Enter que envie, então o `Form` entrega o envio
por função — `{({ submit, isSubmitting }) => …}`. E **o rótulo viaja no
campo**: no web o `Field` da Base UI liga rótulo e controle pelo `for`, e aqui
não há `for` nem `id`; o `FormField` põe `accessibilityLabel` e `invalid`
dentro do campo, e o adaptador os leva ao controle. Sem isso, um `TextInput`
embaixo de um rótulo fica sem nome para o leitor de tela.

## O gráfico entra por outro caminho, e traz um peer nativo

`ChartContainer`, `ChartDonut` e `ChartRadial` vivem em
`@rivocode/ui-native/chart`, pela mesma regra do formulário — só que aqui o
peer opcional custa mais do que bytes:

```sh
npx expo install react-native-svg
```

```tsx
import { ChartContainer, ChartDonut, ChartRadial } from '@rivocode/ui-native/chart'
```

O `react-native-svg` é **módulo nativo**: quem não desenha gráfico não o
instala, não o liga ao projeto de iOS e Android e não reconstrói por causa
dele. É por isso que as três peças não saem do índice da raiz — e é por isso
que a `Sparkline` continua desenhada com `View`, onde está: ela é o slot
`chart` do `Stat`, o `Stat` sai da raiz, e trazê-la para cá cobraria o peer de
quem só queria um número dentro de um cartão.

Duas decisões valem pelas três peças. **Nada mede sozinho**: no lugar do
`ResponsiveContainer` e das `var(--color-série)`, o `ChartContainer` mede com
`onLayout`, resolve as cores do `config` e entrega `{ width, height, colors }`
a quem desenha — com a medida zerada no primeiro quadro, porque no telefone não
existe largura antes do layout. E **no toque não há dica**: a rosca põe nome e
valor de cada fatia na legenda, que é também o controle — tocar a linha acende
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

Os dois poderiam dividir uma porta só — `/expo`, digamos — e a conta de quem
instala diz que não. Quem põe um botão de copiar ao lado da chave de acesso de
uma NF-e não anexa arquivo nenhum; um índice comum arrastaria o
`expo-document-picker` para o projeto dele, que é exatamente o custo que este
arranjo existe para não cobrar. Módulo do Expo no celular não é bytes: é build.
A fronteira dos dois é guardada junto com a do gráfico e a do formulário, nos
dois pacotes, por `scripts/check-fronteira-do-chart.ts`.

**A confirmação de copiar passa a ser dupla, e no web bastava uma.** A regra da
peça não muda — copiar é a ação sem resultado visível, e sem confirmação a
pessoa toca de novo por dúvida. O que muda é por onde ela chega: o botão troca
o ícone e o nome acessível, como lá, e a peça dispara **também** um aviso,
porque aqui trocar o `accessibilityLabel` de um `Pressable` que já está sob o
foco **não é reanunciado** por leitor de tela nenhum. Quem não vê o ícone virar
visto não ficaria sabendo de nada; o aviso que o `RivoProvider` já monta mora
num `accessibilityLiveRegion="polite"` e é o único canal desta tela que fala
sozinho. `toast={false}` desliga, para a tela que copia várias coisas seguidas.
E quando a área de transferência recusa — o `setStringAsync` do Expo devolve
`false`, o que no telefone não acontece e no passe web sim — **nada é
confirmado**: mentir que copiou é pior do que não confirmar.

**E a área de soltar não existe.** No celular nada pode ser arrastado para
lugar nenhum, e o retângulo tracejado do web é, letra por letra, o idioma de
"solte aqui". Tirado o soltar, o que sobra daquela caixa é um botão com muito
espaço vazio em volta — **o espaço era o alvo de soltar, e não a affordance**.
Então o `FileUpload` nativo é um botão de altura de controle, com o `hint`
dentro do nome falado (quem ouve a tela precisa saber "XML ou PDF, até 5 MB"
antes de abrir o seletor, e não depois de ser recusado), e a altura que ele
devolve é da lista. O `accept` fala **MIME**, que é o que o seletor do sistema
sabe filtrar — extensão com ponto continua valendo na validação de volta, mas
não vai para o diálogo, onde não casaria nada. O que volta não é um `File`: é
um `PickedFile` com o `uri` local que o app usa para subir, e cujo `size` pode
faltar, porque nem todo provedor de arquivo do Android o informa — `maxSize` só
recusa o que conseguiu medir.

## A paridade, peça por peça

**83 peças no catálogo do web, medidas contra `native/src/index.ts`, `native/src/form/index.ts`, `native/src/chart/index.ts`, `native/src/clipboard/index.ts` e `native/src/file-upload/index.ts` em 2026-08-26:** 64 traduzem com o mesmo nome, 3 traduzem com outro, 0 estão na fila e 16 não portam por decisão. A coluna do meio separa as duas ausências, que é a distinção que a tabela existe para fazer: `○` muda com o tempo, `✕` não muda. E `✔` não quer dizer copiar e colar — a seção acima explica por quê.

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
| `Card` | ✔ traduz | com `CardHeader`, `CardTitle`, `CardDescription` e `CardContent` — sem `CardFooter` |
| `ChartContainer` | ✔ traduz | vive em `@rivocode/ui-native/chart`; os quatro finais atravessam com os mesmos nomes, e o desenho entra por função — não há Recharts, nem contentor que meça, nem `var(--color-série)` |
| `ChartDonut` | ✔ traduz | a legenda é o controle: sem dica para abrir no toque, tocar a linha acende a fatia e leva nome e valor ao meio; `format` só aceita função, e as pontas saem retas |
| `ChartRadial` | ✔ traduz | atravessa quase inteiro, porque nunca teve dica; `color` é papel de token e o nome sai do que está escrito no meio, não só da porcentagem |
| `Checkbox` | ✔ traduz | `checked` e `onCheckedChange` **obrigatórios**; sem `defaultChecked` e sem `indeterminate` |
| `CheckboxGroup` | ✔ traduz | `items` na raiz e `value: string[]`, em vez de um `Checkbox` por filho |
| `Clipboard` | ✔ traduz | vive em `@rivocode/ui-native/clipboard`; a confirmação é dupla — o botão troca de nome e um aviso fala, porque rótulo trocado debaixo do dedo não é reanunciado |
| `Code` | ✔ traduz | o trecho quebra linha junto com a frase que o cerca, e o toque longo copia (`selectable`); a rolagem própria é do `CodeBlock`, que continua fora |
| `Collapsible` | ✔ traduz | `label` no lugar de `CollapsibleTrigger` e `CollapsiblePanel` |
| `ColorPicker` | ✔ traduz | sai na raiz; controlada, e sem seta — cada amostra é um alvo de 44px com o desenho de 32 por dentro, e são seis por linha, não dez |
| `Combobox` | ✔ traduz | a lista abre numa folha com busca sem acento; `items` na raiz, não `ComboboxItem` por filho |
| `Command` | ✕ não porta | paleta de comandos é gesto de mesa: um campo, uma lista e o teclado |
| `ContextMenu` | ✕ não porta | não precisa de peça nova: precisa de `longPress` no `Menu`, que ele ainda não aceita |
| `DataTable` | ✔ vira `DataList` | `filter` e `selectable` portam com o mesmo nome; ordenar e `pageSize` ficam de fora por desenho |
| `DatePicker` | ✔ traduz | abre a folha com o mês; guarda ISO e exibe `dd/mm/aaaa` |
| `DateRangePicker` | ✔ traduz | um mês numa folha, com as duas pontas na mesma grade; a peça ordena os toques, e o intervalo invertido deixou de existir |
| `DescriptionList` | ✔ traduz | as bordas entram por `Children`: a utility de divisória do Tailwind não existe no RN |
| `Dialog` | ✔ traduz | `open`, `onOpenChange` e `title` como props; sem `DialogTrigger` |
| `Editable` | ✔ traduz | quem abre é o toque **longo**, o retorno do teclado confirma e há um `Cancelar` visível — sair do campo não salva, ao contrário do web |
| `EmptyState` | ✔ traduz | `description` obrigatória, pelo mesmo motivo do web |
| `Field` | ✔ traduz | `label`, `description` e `error` como props; o erro vence a descrição, como no web |
| `Fieldset` | ✔ traduz | `legend` como prop |
| `FileUpload` | ✔ traduz | vive em `@rivocode/ui-native/file-upload`; a área de soltar vira um botão, porque no celular não há soltar — o `accept` fala MIME e o tamanho sai formatado sem `Intl` |
| `Form` | ✔ traduz | vive em `@rivocode/ui-native/form`; o `Form` entrega o `submit` em vez de esperar um `type="submit"`, e há um adaptador a mais, o `forText` |
| `Indicator` | ✔ traduz | `label` é obrigatório: a pastilha é uma parada só do leitor de tela, e o que ela diz é a frase, nunca o número |
| `Input` | ✔ traduz | a borda acende no foco — não há `focus-visible` em tela de toque |
| `InputGroup` | ✔ traduz | `prefix`, `suffix` e `actions` são props e a moldura desenha o próprio campo; sem `size` |
| `Item` | ✔ traduz | `title`, `description`, `media` e `actions` como props; o corte com reticências é `numberOfLines`, que lá é prop e não classe |
| `Kbd` | ✕ não porta | não há teclado para desenhar |
| `MaskedInput` | ✔ traduz | o valor é só dígitos; a máscara é do campo, o dado não a carrega |
| `Menu` | ✔ traduz | folha de baixo com `actions`, nunca popup ancorado |
| `Menubar` | ✕ não porta | idioma de mesa; navegação nativa é tab bar e drawer do router |
| `Meter` | ✔ traduz | sem `format`: resolver nome de formatador custaria o `Intl` no bundle do celular, e o texto vai pronto em `valueLabel` |
| `NavigationMenu` | ✕ não porta | idioma de mesa; navegação nativa é tab bar e drawer do router |
| `NumberField` | ✔ traduz | vira stepper — menos, valor, mais —, que é o idioma do toque |
| `OTPField` | ✔ traduz | caixas visíveis, um campo escondido: teclado, autofill de SMS e leitor veem um só |
| `PageHeader` | ✔ traduz | `title`, `description`, `badge` e `actions` como props |
| `Pagination` | ✕ não porta | lista de celular rola; escolher o número da página é gesto de mesa |
| `PasswordInput` | ✔ traduz | o botão troca de nome com o estado (`labels.show`/`labels.hide`), e sair do campo esconde de novo |
| `Popover` | ✕ não porta | painel ancorado que o próprio dedo cobre — use `Sheet` |
| `PreviewCard` | ✕ não porta | aparece ao pousar o ponteiro, e não há pousar no toque |
| `Progress` | ✔ traduz | `value` de 0 a 100 e `label`; sem `format` |
| `RadioGroup` | ✔ traduz | `items` na raiz; não existe `Radio` solto para compor |
| `RelativeTime` | ✔ traduz | o relógio porta, com passo por unidade e refeitura ao voltar do fundo; sem `Intl`, o texto é sempre numérico |
| `RivoProvider` | ✔ traduz | mesmo contrato de `theme`; `density` existe por paridade, e `comfortable` é a única altura — alvo de toque não encolhe; e ganha `fonts`, que o web não tem |
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
| `Steps` | ✔ traduz | só o modo estreito do web — texto e barra —, e por isso sem `onStepClick`; o `useWizard()` atravessa inteiro |
| `Switch` | ✔ traduz | `checked` e `onCheckedChange` obrigatórios; o trilho é o do sistema, pintado por token |
| `Table` | ✕ não porta | não há tabela no celular; a consulta vira `DataList` |
| `Tabs` | ✔ traduz | só a caixinha segmentada, por `items`; seção de página é trabalho do router nativo |
| `TagsInput` | ✔ traduz | Enter e separador digitado fecham a ficha; o Backspace com o campo vazio não porta |
| `Textarea` | ✔ traduz | `rows` é a altura inicial; o campo cresce com o conteúdo |
| `Timeline` | ✔ traduz | os eventos vêm por `items`, com `tone` e `pending` em cada um; `at` é texto pronto, e cada evento é uma parada só do leitor de tela, com a posição escrita no rótulo |
| `ToastViewport` | ✔ vira `useToast` | não se monta nada: o `RivoProvider` já traz a fiação, e o hook é o mesmo |
| `Toggle` | ✔ traduz | `pressed` e `onPressedChange` |
| `ToggleGroup` | ✔ traduz | `items` na raiz; `multiple` para vários, o mesmo nome e o mesmo sentido do web |
| `Toolbar` | ✕ não porta | superfície de edição de mesa: uma parada de tabulação e navegação por seta, que o toque não tem |
| `Tooltip` | ✕ não porta | hover não existe no toque; o rótulo precisa estar na tela |
| `Tracker` | ✔ traduz | a faixa inteira é um alvo só: o dedo arrasta e o período lido aparece na linha de baixo; `label` de cada ponto é `string` |
| `Tree` | ✔ traduz | um nível por vez, empilhado: tocar num galho empurra o nível de dentro e o cabeçalho mostra o caminho e volta; sem recuo, sem busca |
| `TreeSelect` | ✔ traduz | o `Tree` dentro de uma folha, com a contagem do rascunho e o `Aplicar` no rodapé; sair pela lateral desiste |

## Instalação

Num app Expo:

```sh
npx expo install nativewind@preview react-native-css tailwindcss @tailwindcss/postcss postcss
npm install @rivocode/ui-native
```

O `@preview` não é enfeite: no npm a tag `latest` do NativeWind ainda é a
4.2.6, e este pacote pede a 5 (`nativewind: ">=5.0.0-preview.1"` no peer).
Sem a tag você instala a v4, e aí o `metro.config.js` logo abaixo nem carrega
— a v5 exporta `withNativewind`, a v4 exporta `withNativeWind`, com W
maiúsculo, e o erro que sai é um `undefined is not a function` que não conta
de onde veio. Saiba antes de começar: **a NativeWind 5 ainda é pré-lançamento**
e é o único caminho que o `@rivocode/ui-native` conhece hoje, então ir para
produção com ele é ir para produção sobre um preview.

Cinco arquivos do app participam, cada um por um motivo que morde:

**1. `metro.config.js`** — o NativeWind entra no build:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

module.exports = withNativewind(getDefaultConfig(__dirname));
```

**2. `package.json`** — navegadores modernos, cravados:

```json
"browserslist": ["chrome 130", "safari 18", "firefox 130"]
```

Não é sobre navegador nenhum: o Expo roda um passe web no CSS antes do
compilador nativo, e sem esse campo ele reescreve o `light-dark()` dos tokens
num polyfill de vars órfãs que mata a compilação. É esta linha que sustenta a
troca de tema em runtime.

**3. `app.json`** — `"userInterfaceStyle": "automatic"`, senão o iOS prende a
aparência no claro e o tema escuro nunca chega.

**4. `global.css`** — a fonte do CSS:

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

**5. `nativewind-env.d.ts`** — o TypeScript aprende o `className`:

```ts
/// <reference types="nativewind/types" />
```

O sintoma é o projeto novo abrir com uma parede de erro: *Property
`className` does not exist on type ...* em toda `View`, `Text` e `Pressable`
que você escreveu, e nas do `@rivocode/ui-native` junto — foram 167 num app
recém-criado. A causa é que `className` não existe no React Native: quem o
acrescenta às props é uma declaração de módulo que mora na NativeWind, e ela
só entra no programa se este arquivo a referenciar. Nada disso aparece em
runtime — o app roda e as cores estão certas —, então é fácil ler os erros
como culpa da biblioteca.

O `withNativewind` do passo 1 gera o arquivo na primeira vez que o metro
sobe, com este nome exato (a opção `typescriptEnvPath` muda o caminho).
Escreva-o à mão quando o `tsc` roda antes do app — CI, ou o editor num clone
recém-baixado —, e **não o coloque no `.gitignore`**: sem ele versionado, o
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
  aparelho. **Trocar a prop troca a tela inteira em runtime**: as cores foram
  compiladas como `light-dark()`, e o provider só gira o esquema de cor do
  Appearance.
- `density`: existe por paridade de API, mas `comfortable` é a única altura —
  alvo de toque não encolhe em tela de dedo.
- O `useToast` já vem ligado, como no web: nenhum provedor extra para montar.

## Ajuste fino com className

Como no web, toda peça aceita `className` na raiz e a classe de quem usa vence
a da peça — `h-14` derruba o `h-12` do Button, `rounded-pill` derruba o
`rounded-md`. É o que permite um wrapper de cliente num arquivo do app, sem
fork. Nas peças com folha (Select, Combobox, DatePicker, Sheet, Dialog, Menu),
a documentação da prop diz o que ela veste — o gatilho ou o painel. Lembre da
regra do pré-compilador: classe nova usada no app pede `npx
rivocode-ui-native-css` de novo.

## Ícones

O mesmo Lucide do web, pelo pacote irmão:

```sh
npx expo install lucide-react-native react-native-svg
```

Os nomes são os mesmos — `Receipt` lá é `Receipt` aqui — então o vocabulário
canônico do [guia de ícones](/icones) vale nos dois mundos, e a
[galeria com busca](/icones) serve aos dois. Dentro das peças da biblioteca os
ícones de estado continuam desenhados com borda (o visto do Checkbox, os
chevrons do Calendar): peça não carrega dependência de ícone, app carrega se
quiser.

## O que nunca fazer

- Classe com var arbitrária (`h-[--rc-control-md]`) ou `translate-*`: o
  compilador do react-native-css atual não tolera var viva nem a shorthand
  `translate`. Altura de controle é fixa por tamanho.
- Remover o `browserslist` moderno do `package.json`. O erro que aparece —
  `expected an object-like struct named Specifier` — não diz o porquê; esta
  linha diz.
- Glyph de texto como ícone de estado: o visto do Checkbox é borda rotacionada,
  porque fonte muda de corpo entre iOS e Android.
- Esquecer `accessibilityRole`/`accessibilityState` em controle custom. Toda
  peça do catálogo já os traz.

## O exemplo completo

O repositório traz um app Expo em `examples/native` com todas as peças em uso
numa tela de produto — painel, listagem com detalhe em Sheet, formulário,
confirmação destrutiva e o interruptor de tema. `bunx expo start --ios` dentro
dele, e o simulador conta o resto.
