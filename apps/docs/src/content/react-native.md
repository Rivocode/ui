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
| `Sidebar`, `Menubar`, `NavigationMenu`, `Tooltip` | **não portam** | são idiomas de desktop; navegação nativa é tab bar e drawer do router |

## Instalação

Num app Expo:

```sh
npx expo install nativewind react-native-css tailwindcss @tailwindcss/postcss postcss
npm install @rivocode/ui-native
```

Quatro arquivos do app participam, cada um por um motivo que morde:

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
