O `@rivocode/ui-native` leva o design system para o celular falando o **mesmo
vocabulário de classes** do web — `bg-bg`, `text-fg-muted`, `rounded-pill` —
via NativeWind, sobre os mesmos tokens. Nenhum componente conhece a cor da
marca: ele pede um papel semântico e o tema responde, inclusive em runtime.

O catálogo nasce por **tradução, não por porte**: cada peça web foi julgada no
idioma da plataforma antes de atravessar.

| Web | Native | O que muda |
| --- | --- | --- |
| `Button`, `Badge`, `Card`, `Stat`, `EmptyState`, `Skeleton`, `Avatar`, `Separator`, `Spinner`, `Progress`, `Alert` | mesmos nomes | traduzem direto |
| `Field` + `Input`, `Checkbox`, `Switch` | mesmos nomes | o Input acende a borda no foco (não há focus-visible em tela de toque); o rótulo já é clicável |
| `DataTable` | `DataList` | tabela não existe no celular; os quatro finais da consulta — carregando, erro, vazio, dados — e a ordem deles são os mesmos |
| `Sheet` | `Sheet` | só o comportamento de baixo, que já era o modo estreito do web |
| `Dialog` / `AlertDialog` | mesmos nomes | o AlertDialog não fecha no toque fora, como no web |
| `Select` | `Select` | poucas opções fixas; a lista abre numa folha de baixo, o idioma da plataforma |
| `TabList variant="segmented"` | `Tabs` | só a caixinha; seção de página é do router nativo |
| `useToast` | `useToast` | o RivoProvider monta a fiação, igual |
| `RadioGroup`, `CheckboxGroup`, `Textarea`, `Fieldset`, `SearchInput`, `MaskedInput`, `Toggle`, `ToggleGroup`, `Accordion`, `Collapsible`, `PageHeader`, `DescriptionList`, `AspectRatio`, `Slider` | mesmos nomes | traduzem direto; o Slider anda por gesto e responde às ações do leitor de tela |
| `NumberField` | `NumberField` | vira stepper — menos, valor, mais — que é o idioma do toque |
| `OTPField` | `OTPField` | caixas visíveis, um campo escondido: teclado, autofill de SMS e leitor de tela veem um só |
| `Combobox`, `Autocomplete` | `Combobox` | a lista longa abre numa folha com busca sem acento |
| `DatePicker`, `Calendar` | mesmos nomes | mês desenhado à mão, valor ISO `aaaa-mm-dd`, exibição `dd/mm/aaaa` |
| `Menu` | `Menu` | ações numa folha de baixo (action sheet), nunca popup ancorado |
| `Sidebar`, `Menubar`, `NavigationMenu`, `Tooltip` | **não portam** | são idiomas de desktop; navegação nativa é tab bar e drawer do router |
| `FileUpload` | **ainda não** | precisa do expo-document-picker; entra quando houver app dono da dependência |

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
