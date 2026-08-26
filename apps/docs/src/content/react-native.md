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

## A paridade, peça por peça

**83 peças no catálogo do web, medidas contra `native/src/index.ts` em 2026-08-26:** 49 traduzem com o mesmo nome, 3 traduzem com outro, 15 estão na fila e 16 não portam por decisão. A coluna do meio separa as duas ausências, que é a distinção que a tabela existe para fazer: `○` muda com o tempo, `✕` não muda. E `✔` não quer dizer copiar e colar — a seção acima explica por quê.

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
| `ChartContainer` | ○ na fila | a Recharts é DOM e não atravessa; a `Sparkline` nativa é o único desenho de dado que existe hoje |
| `ChartDonut` | ○ na fila | depende de um gráfico nativo que ainda não existe |
| `ChartRadial` | ○ na fila | depende de um gráfico nativo que ainda não existe |
| `Checkbox` | ✔ traduz | `checked` e `onCheckedChange` **obrigatórios**; sem `defaultChecked` e sem `indeterminate` |
| `CheckboxGroup` | ✔ traduz | `items` na raiz e `value: string[]`, em vez de um `Checkbox` por filho |
| `Clipboard` | ○ na fila | precisa do `expo-clipboard`, e dependência é escolha do app |
| `Code` | ○ na fila | código em tela estreita quer rolagem horizontal própria, e isso ainda não foi resolvido |
| `Collapsible` | ✔ traduz | `label` no lugar de `CollapsibleTrigger` e `CollapsiblePanel` |
| `ColorPicker` | ○ na fila | a grade de amostras atravessa, e o campo hexadecimal também; falta escrever a peça |
| `Combobox` | ✔ traduz | a lista abre numa folha com busca sem acento; `items` na raiz, não `ComboboxItem` por filho |
| `Command` | ✕ não porta | paleta de comandos é gesto de mesa: um campo, uma lista e o teclado |
| `ContextMenu` | ✕ não porta | não precisa de peça nova: precisa de `longPress` no `Menu`, que ele ainda não aceita |
| `DataTable` | ✔ vira `DataList` | `filter` e `selectable` portam com o mesmo nome; ordenar e `pageSize` ficam de fora por desenho |
| `DatePicker` | ✔ traduz | abre a folha com o mês; guarda ISO e exibe `dd/mm/aaaa` |
| `DateRangePicker` | ○ na fila | dois `DatePicker` até lá — e a validação de fim-antes-do-começo passa a ser sua |
| `DescriptionList` | ✔ traduz | as bordas entram por `Children`: a utility de divisória do Tailwind não existe no RN |
| `Dialog` | ✔ traduz | `open`, `onOpenChange` e `title` como props; sem `DialogTrigger` |
| `Editable` | ○ na fila | o texto que vira campo depende de foco e de Escape; no toque ele quer outro gesto, ainda não desenhado |
| `EmptyState` | ✔ traduz | `description` obrigatória, pelo mesmo motivo do web |
| `Field` | ✔ traduz | `label`, `description` e `error` como props; o erro vence a descrição, como no web |
| `Fieldset` | ✔ traduz | `legend` como prop |
| `FileUpload` | ○ na fila | precisa do `expo-document-picker`; entra quando houver app dono da dependência |
| `Form` | ○ na fila | o `react-hook-form` roda no nativo; o que falta é o `FormField` que liga o campo ao controle |
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
| `RivoProvider` | ✔ traduz | mesmo contrato de `theme`; `density` existe por paridade, e `comfortable` é a única altura — alvo de toque não encolhe |
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
| `Steps` | ○ na fila | a régua de passos e o `useWizard()` não atravessaram |
| `Switch` | ✔ traduz | `checked` e `onCheckedChange` obrigatórios; o trilho é o do sistema, pintado por token |
| `Table` | ✕ não porta | não há tabela no celular; a consulta vira `DataList` |
| `Tabs` | ✔ traduz | só a caixinha segmentada, por `items`; seção de página é trabalho do router nativo |
| `TagsInput` | ✔ traduz | Enter e separador digitado fecham a ficha; o Backspace com o campo vazio não porta |
| `Textarea` | ✔ traduz | `rows` é a altura inicial; o campo cresce com o conteúdo |
| `Timeline` | ○ na fila | o que aconteceu, em ordem, ainda é composição sua |
| `ToastViewport` | ✔ vira `useToast` | não se monta nada: o `RivoProvider` já traz a fiação, e o hook é o mesmo |
| `Toggle` | ✔ traduz | `pressed` e `onPressedChange` |
| `ToggleGroup` | ✔ traduz | `items` na raiz; `multiple` para vários, o mesmo nome e o mesmo sentido do web |
| `Toolbar` | ✕ não porta | superfície de edição de mesa: uma parada de tabulação e navegação por seta, que o toque não tem |
| `Tooltip` | ✕ não porta | hover não existe no toque; o rótulo precisa estar na tela |
| `Tracker` | ○ na fila | a faixa de quadradinhos por período ainda não porta |
| `Tree` | ○ na fila | hierarquia em tela estreita quer navegação por níveis, e a peça que faz isso ainda não existe |
| `TreeSelect` | ○ na fila | escolher dentro de árvore vira folha com níveis; até lá, dois `Select` encadeados |

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
