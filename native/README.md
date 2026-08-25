# @rivocode/ui-native

As peças do design system da RivoCode em React Native: o **mesmo vocabulário
de classes** do web — `bg-bg`, `text-fg-muted`, `rounded-pill` — via
NativeWind, sobre os mesmos tokens. Nenhum componente conhece a cor da marca:
ele pede um papel semântico e o tema responde, inclusive em runtime.

A documentação inteira vive em <https://ds.rivocode.com.br>; o guia de uso
nativo em <https://ds.rivocode.com.br/react-native.md>.

## Instalação

```sh
npx expo install nativewind react-native-css tailwindcss @tailwindcss/postcss postcss
npm install @rivocode/ui-native
```

Quatro arquivos do app participam, cada um por um motivo que morde:

1. **`metro.config.js`** — `withNativewind(config)`, como manda o NativeWind.
2. **`package.json`** — `"browserslist": ["chrome 130", "safari 18",
   "firefox 130"]`. Sem isso o passe web que o Expo roda antes do compilador
   nativo reescreve o `light-dark()` dos tokens num polyfill de vars órfãs, e
   a compilação morre com "Specifier, found ()". É esse arquivo que sustenta a
   troca de tema em runtime.
3. **`app.json`** — `"userInterfaceStyle": "automatic"`, senão o iOS prende a
   aparência no claro e o tema escuro nunca chega.
4. **`global.css`** — a fonte do CSS:

   ```css
   @import "tailwindcss/theme.css" layer(theme);
   @import "@rivocode/ui-native/theme.css";
   @import "tailwindcss/utilities.css";

   @source "./App.tsx";
   @source "./node_modules/@rivocode/ui-native/src";
   ```

O app não importa o `global.css`: importa o **pré-compilado**. Gere-o com

```sh
npx rivocode-ui-native-css   # lê global.css, escreve generated.css
```

e rode de novo sempre que usar uma classe nova. O pipeline do metro tropeça em
`@import` e em `@property` dentro do compilador nativo; o comando entrega um
arquivo já resolvido e **falha com o nome da var** quando algo não traduziria.

```tsx
import "./generated.css";
import { RivoProvider, Button } from "@rivocode/ui-native";

export default function App() {
  return (
    <RivoProvider theme="rivocode-dark">
      {/* rivocode-light e system também; trocar a prop troca a tela em runtime */}
      <Button onPress={() => {}}>Começar</Button>
    </RivoProvider>
  );
}
```

## Tokens derivados, nunca editados

A fonte única dos tokens é o CSS do repositório (`src/tokens/`) — é lá que os
guards de contraste mordem. `tokens.json`, `tokens.ts` e `theme.css` são
gerados por `bun run gen:native`, e o `bun run check` falha se divergirem.
Cada cor sai como `light-dark(claro, escuro)`: o compilador nativo transforma
isso em regra de `prefers-color-scheme`, e o `RivoProvider` troca o tema com
um `Appearance.setColorScheme()`.

O que não traduz fica de fora de propósito: sombra de caixa (no RN é
`elevation`/`shadow*`, decisão da peça), `clamp()` de marketing, `z-index` — e
a densidade compacta, porque alvo de toque não encolhe em tela de dedo.

## O catálogo

43 peças, por tradução e não por porte: `DataTable` vira `DataList`, `Sheet`
só conhece o comportamento de baixo, `Select` abre numa folha, e `Sidebar`,
`Menubar` e `Tooltip` não portam — são idiomas de desktop. A tabela completa
de tradução está no guia.
