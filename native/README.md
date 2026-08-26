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

## Quatro subcaminhos, e um peer por porta

O formulário, o gráfico, o copiar e o anexar não saem do índice da raiz:

```tsx
import { Form, FormField, forText, useZodForm } from '@rivocode/ui-native/form'
import { ChartContainer, ChartDonut, ChartRadial } from '@rivocode/ui-native/chart'
import { Clipboard } from '@rivocode/ui-native/clipboard'
import { FileUpload, FileUploadItem, FileUploadList } from '@rivocode/ui-native/file-upload'
```

Cada porta tem **um** peer opcional atrás, e o metro resolve import por
arquivo: dentro do índice principal, um app que só quer um `Button` teria de
instalar os quatro para o bundle fechar. Nos três de baixo o preço é maior que
bytes — são módulos nativos, que o app liga ao projeto de iOS e Android e
reconstrói.

```sh
npx expo install react-native-svg         # só quem desenha gráfico
npx expo install expo-clipboard           # só quem copia
npx expo install expo-document-picker     # só quem anexa
```

**É um subcaminho por peer, e não um por assunto.** O `Clipboard` e o
`FileUpload` dividiriam bem uma porta chamada `/expo`, e a conta de quem
instala diz que não: quem põe um botão de copiar ao lado da chave de acesso de
uma NF-e não anexa arquivo nenhum, e um índice comum cobraria dele o seletor
de documentos. `scripts/check-fronteira-do-chart.ts`, na raiz do repositório,
guarda as quatro fronteiras — nada alcançável pelo índice da raiz pode
importar de dentro delas.

## A fonte é do app, e o provider só passa o nome adiante

No web as três famílias chegam pelo CSS de tokens. No celular não há CSS de
fonte: o arquivo `.ttf`/`.otf` entra no bundle do app e é o app quem registra a
família, com o `expo-font`. Por isso a biblioteca **não carrega fonte nenhuma**
— ela recebe os nomes já registrados e os aplica ao catálogo inteiro.

Sem configuração, tudo sai na fonte do sistema e nada quebra. `mono` é a única
com padrão de casa, porque o sistema já a tem: Menlo no iOS, `monospace` no
Android.

```tsx
import { useFonts, isLoaded } from 'expo-font'
import { RivoProvider } from '@rivocode/ui-native'

export default function App() {
  const [ready] = useFonts({
    Manrope: require('./assets/Manrope.ttf'),
    Poppins: require('./assets/Poppins.ttf'),
    JetBrainsMono: require('./assets/JetBrainsMono.ttf'),
  })
  if (!ready) return null

  return (
    <RivoProvider
      fonts={{ sans: 'Manrope', display: 'Poppins', mono: 'JetBrainsMono' }}
      isFontLoaded={isLoaded}
    >
      {/* … */}
    </RivoProvider>
  )
}
```

`sans` veste o texto corrido, `display` os títulos — Card, Dialog, Sheet,
PageHeader, Stat, Steps, Fieldset e o miolo dos gráficos — e `mono` o que
alinha por largura fixa: `Code`, o carimbo da `Timeline`, as iniciais de dia do
`Calendar`, o campo hexadecimal do `ColorPicker`. Declarar só `sans` é legítimo:
`display` cai nela, como a pilha do web faz.

Para a sua própria tela usar as mesmas famílias, `useRivoFonts()` devolve as
três já resolvidas.

**Isto não é um subcaminho, e a regra de cima continua valendo.** Um subcaminho
existe para conter um peer; aqui não há peer: a biblioteca nunca importa
`expo-font`, nem em tipo. O app importa, o app carrega, e o que atravessa a
fronteira é uma string.

### Nome errado falha calado — o provider grita por você

O React Native ignora família que o aparelho não tem: o texto sai na fonte
padrão, sem erro e sem aviso. Foi assim que `font-mono` viveu meses compilada
para `ui-monospace`, que é genérica de CSS e não existe instalada em celular
nenhum.

Em `__DEV__`, o `RivoProvider` acusa o que consegue ver sozinho: pilha de CSS
com vírgula (`"Manrope, system-ui, sans-serif"` — o RN lê a linha inteira como
um nome só), aspas herdadas do CSS, `var(--…)`, nome vazio, família genérica, e
`monospace` fora do Android. O que ele **não** consegue ver sozinho é a tabela
de fontes do aparelho — daí o `isFontLoaded`: passe o `isLoaded` do `expo-font`
e cada nome declarado que não chegou ao aparelho sai nomeado no aviso.

## O catálogo

62 peças, por tradução e não por porte: `DataTable` vira `DataList`, `Sheet`
só conhece o comportamento de baixo, `Select` abre numa folha, e `Sidebar`,
`Menubar` e `Tooltip` não portam — são idiomas de desktop. A tabela completa
de tradução está no guia.
