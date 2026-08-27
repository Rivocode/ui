# @rivocode/ui-native

As peças do design system da RivoCode em React Native: o **mesmo vocabulário
de classes** do web (`bg-bg`, `text-fg-muted`, `rounded-pill`) via
NativeWind, sobre os mesmos tokens. Nenhum componente conhece a cor da marca:
ele pede um papel semântico e o tema responde. Entre os dois temas de casa a
troca acontece em runtime; vestir a cor de um cliente é decisão de build, e a
seção abaixo diz exatamente o que isso muda.

A documentação inteira vive em <https://ds.rivocode.com.br>; o guia de uso
nativo em <https://ds.rivocode.com.br/react-native.md>.

## Instalação

```sh
npx expo install nativewind react-native-css tailwindcss @tailwindcss/postcss postcss
npm install @rivocode/ui-native
```

Quatro arquivos do app participam, cada um por um motivo que morde:

1. **`metro.config.js`**. `withNativewind(config)`, como manda o NativeWind.
2. **`package.json`**. `"browserslist": ["chrome 130", "safari 18",
"firefox 130"]`. Sem isso o passe web que o Expo roda antes do compilador
   nativo reescreve o `light-dark()` dos tokens num polyfill de vars órfãs, e
   a compilação morre com "Specifier, found ()". É esse arquivo que sustenta a
   troca entre os dois temas de casa em runtime.
3. **`app.json`**. `"userInterfaceStyle": "automatic"`, senão o iOS prende a
   aparência no claro e o tema escuro nunca chega.
4. **`global.css`**. A fonte do CSS:

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
      {/* rivocode-light e system também; entre os temas de casa, trocar a prop troca a tela em runtime */}
      <Button onPress={() => {}}>Começar</Button>
    </RivoProvider>
  );
}
```

## Tokens derivados, nunca editados

A fonte única dos tokens é o CSS do repositório (`src/tokens/`): é lá que os
guards de contraste mordem. `tokens.json`, `tokens.ts` e `theme.css` são
gerados por `bun run gen:native`, e o `bun run check` falha se divergirem.
Cada cor sai como `light-dark(claro, escuro)`: o compilador nativo transforma
isso em regra de `prefers-color-scheme`, e o `RivoProvider` troca o tema com
um `Appearance.setColorScheme()`.

O que não traduz fica de fora de propósito: sombra de caixa (no RN é
`elevation`/`shadow*`, decisão da peça), `clamp()` de marketing, `z-index`, e
a densidade compacta, porque alvo de toque não encolhe em tela de dedo: não
há `density` na API nativa, e `comfortable` é a única altura.

### Medir o contraste do seu tema

A conta da WCAG que morde os tokens da casa viaja no pacote, e não só o
resultado dela. `@rivocode/ui-native/contrast` exporta o mesmo motor que o
`bun run check` usa — `checkThemeMap`, `contrastRatio` e `compose` — com a
tabela de pares inteira: os pares que carregam texto, a fronteira de controle
de 3:1, o alfa sobre alfa do `Calendar`, a camada achatada por `opacity` do
botão destrutivo e o trilho do `Switch` ligado.

```js
import { checkThemeMap } from "@rivocode/ui-native/contrast";

for (const { ok, line } of checkThemeMap("acme", acmeTheme)) {
  if (!ok) console.error(line);
}
```

O arquivo é gerado de `src/lib/contrast.ts` do repositório e versionado aqui,
como `tokens.ts` e `theme.css`: um espelho, e não uma segunda cópia que
envelhece sozinha. Quem preferir a linha de comando mede o mesmo mapa com
`npx rivocode-ui check-theme acme.theme.ts`, do pacote web, que chama este
mesmo motor.

### Tema de cliente: hoje é decisão de build, não prop de runtime

Três fatos, e o primeiro explica os outros dois.

**1. A cor de classe só muda em build.** O compilador do `react-native-css`
resolve o token e crava o valor dentro da regra: `.bg-accent` vira
`{"backgroundColor":"#d4f34a"}`, literal, e nos 56 KB de CSS compilado não sobra
**uma ocorrência de `--`**. Não existe variável viva no aparelho, então
`<RivoProvider theme={{ light, dark }}>` **não troca cor de classe nenhuma**.
Tema de cliente aqui é geração de CSS, e não troca em runtime. O que troca em
runtime são os dois temas de casa, que nasceram dentro do `light-dark()` que o
compilador entende.

**2. O mapa está DESCONTINUADO, e agora é inerte.** O objeto de tema alcançava
só quem lê a cor por JS, do contexto: `ChartDonut`, `ChartRadial`, o giro do
`Button` e do `Spinner`, o trilho do `Switch`, a `Sparkline`, o texto de dica
dos campos. Fundo, cartão, botão, selo e borda são classe, e continuavam com a
cor da RivoCode: na tela isso era donut de um tema e botão de outro, lado a
lado, sem nada vermelho no console além do aviso em `__DEV__`.

Uma metade que discorda da outra é pior do que nenhuma. O provider passou a
resolver os 45 papéis **lendo o CSS compilado**, uma classe `bg-` por papel, e
publica no contexto que as peças já liam: contexto e classe dizem sempre a mesma
cor. `RivoNativeThemeMap` está marcado como descontinuado, e a prop `scheme`
continua escolhendo claro ou escuro.

**3. O teto é de dois temas por build.** Cada papel sai como
`light-dark(claro, escuro)`, e `light-dark()` tem duas vagas: uma clara e uma
escura. App de cliente único cabe folgado, e é o caso normal. Uma vitrine de
cinco temas, como a do web, **não cabe sem cinco bundles**. É teto de
arquitetura, e não pendência.

#### O caminho que funciona

Sobrescreva os papéis no `@theme` do CSS do app, antes de compilar. É a mesma
camada 3 do web, no vocabulário `--color-*` que o compilador nativo lê:

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

Rode `npx rivocode-ui-native-css` de novo e a tela vira do cliente **inteira**:
a classe pinta a cor nova, e a peça que lê cor por JS lê a mesma cor do mesmo
CSS, porque é dali que o provider a tira. Não passe mapa nenhum na prop `theme`.
O passo a passo está em <https://ds.rivocode.com.br/temas.md>.

#### Escreva só a paleta: `rivocode-ui-native-theme`

O `@theme` do app tem **45 papéis** para preencher, e escrever os 45 à mão é
onde o tema de cliente começa a envelhecer. Os nomes de papel, os pares de contraste, os
mínimos, a composição de alfa e o formato que o compilador nativo aceita são
conhecimento da biblioteca, e, antes deste comando, eles moravam no app de quem
vestia o cliente. O segundo binário do pacote traz essa conta de volta para
dentro:

```sh
npx rivocode-ui-native-theme acme.ts    # lê a paleta, escreve acme.theme.css
npx rivocode-ui-native-theme acme.ts saida.css
npx rivocode-ui-native-theme --papeis   # o que você escreve, o que ele deriva
```

Você escreve **oito papéis por esquema**, e mais nada:

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

O arquivo pode ser `.ts`, `.js`, `.mjs` ou `.json`; qualquer papel dos 45 se
escreve a mão ali e o comando para de derivar aquele. A saída entra no
`global.css` **depois** do tema do pacote, e o pré-compilado sai como sempre:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "@rivocode/ui-native/theme.css";
@import "./acme.theme.css";
@import "tailwindcss/utilities.css";
```

```sh
npx rivocode-ui-native-css
```

**Ele recusa escrever tema que não passa no contraste.** A medida é a do
`@rivocode/ui-native/contrast`, o mesmo motor do `bun run check`: os pares de
texto, a fronteira de 3:1, o alfa sobre alfa do `Calendar`, a camada achatada
por `opacity` do botão destrutivo e o trilho do `Switch` ligado:

```
Guarda de contraste:
  claro: 1 falha(s)
    accent-fg sobre accent  2.45:1 (min 4.5)
  escuro: passa

Nada foi escrito: conserte o contraste antes de gerar o CSS.
```

Quatro coisas que vale saber antes de rodar:

- **Ele nunca inventa matiz nova.** Derivar é reusar cor que você escreveu, ou
  compor alfa dela: `accent-subtle` é o seu `accent` a 22%, `fg-muted` é o seu
  `fg` puxado 30% para o `bg`, `accent-fg` é o tom de `fg`/`bg` que pesa mais
  sobre o botão. Papel derivado errado é pior que papel pedido, então onde
  reusar não passa na medida ele **recusa e diz o valor que passaria**.
  `accent-text` e os quatro `*-text` são os casos típicos, porque são a cor que
  se lê. A única exceção declarada é `chart-1` a `chart-8`, que caem na série da
  RivoCode: série de gráfico é escala categórica, e não identidade de marca. Ela
  é medida sobre o **seu** fundo, e reprova se não couber.
- **Dois temas por build, e o comando explica o teto em vez de o ignorar.** Cada
  papel sai como `light-dark(claro, escuro)`, que tem duas vagas. Um terceiro
  esquema no arquivo é recusado com o motivo: é um terceiro **bundle**, e não uma
  terceira vaga.
- **Papel novo em versão nova acusa.** A lista de papéis sai do `tokens.json` do
  pacote **instalado**, e não de uma cópia dentro do comando. Quando a 0.4.0
  trouxer um papel, o comando o cobra pelo nome na primeira vez que você rodar,
  em vez de o tema sair pela metade e a peça herdar a cor da RivoCode. Nome
  errado na paleta também é acusado, com sugestão do papel que você quis dizer.
- **`oklch()` entra direto, e a paleta do Tailwind 4 com ele.** A conta lê
  hexadecimal de 3, 4, 6 e 8 dígitos, `rgb()`, `rgba()`, `hsl()`, `hsla()`,
  `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()` e `color()` nos espaços
  predefinidos do CSS, e converte tudo para sRGB antes de medir. O CSS que o
  comando **escreve** continua sRGB literal, porque é o que o compilador nativo
  crava. Recusadas seguem `color-mix()` — que é conta, e não cor — e semente com
  alfa. Cor fora do gamut do sRGB é medida no pixel que o aparelho mostra, e o
  comando diz quais papéis caíram ali.

## Quatro subcaminhos, e um peer por porta

O formulário, o gráfico, o copiar e o anexar não saem do índice da raiz:

```tsx
import { Form, FormField, forText, useZodForm } from "@rivocode/ui-native/form";
import { ChartContainer, ChartDonut, ChartRadial } from "@rivocode/ui-native/chart";
import { Clipboard } from "@rivocode/ui-native/clipboard";
import { FileUpload, FileUploadItem, FileUploadList } from "@rivocode/ui-native/file-upload";
```

Cada porta tem **um** peer opcional atrás, e o metro resolve import por
arquivo: dentro do índice principal, um app que só quer um `Button` teria de
instalar os quatro para o bundle fechar. Nos três de baixo o preço é maior que
bytes: são módulos nativos, que o app liga ao projeto de iOS e Android e
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
guarda as quatro fronteiras: nada alcançável pelo índice da raiz pode
importar de dentro delas.

## A fonte é do app, e o provider só passa o nome adiante

No web as três famílias chegam pelo CSS de tokens. No celular não há CSS de
fonte: o arquivo `.ttf`/`.otf` entra no bundle do app e é o app quem registra a
família, com o `expo-font`. Por isso a biblioteca **não carrega fonte nenhuma**:
ela recebe os nomes já registrados e os aplica ao catálogo inteiro.

Sem configuração, tudo sai na fonte do sistema e nada quebra. `mono` é a única
com padrão de casa, porque o sistema já a tem: Menlo no iOS, `monospace` no
Android.

```tsx
import { useFonts, isLoaded } from "expo-font";
import { RivoProvider } from "@rivocode/ui-native";

export default function App() {
  const [ready] = useFonts({
    Manrope: require("./assets/Manrope.ttf"),
    Poppins: require("./assets/Poppins.ttf"),
    JetBrainsMono: require("./assets/JetBrainsMono.ttf"),
  });
  if (!ready) return null;

  return (
    <RivoProvider
      fonts={{ sans: "Manrope", display: "Poppins", mono: "JetBrainsMono" }}
      isFontLoaded={isLoaded}
    >
      {/* … */}
    </RivoProvider>
  );
}
```

`sans` veste o texto corrido, `display` os títulos (Card, Dialog, Sheet,
PageHeader, Stat, Steps, Fieldset e o miolo dos gráficos), e `mono` o que
alinha por largura fixa: `Code`, o carimbo da `Timeline`, as iniciais de dia do
`Calendar`, o campo hexadecimal do `ColorPicker`. Declarar só `sans` é legítimo:
`display` cai nela, como a pilha do web faz.

Para a sua própria tela usar as mesmas famílias, `useRivoFonts()` devolve as
três já resolvidas.

**Isto não é um subcaminho, e a regra de cima continua valendo.** Um subcaminho
existe para conter um peer; aqui não há peer: a biblioteca nunca importa
`expo-font`, nem em tipo. O app importa, o app carrega, e o que atravessa a
fronteira é uma string.

### Nome errado falha calado: o provider grita por você

O React Native ignora família que o aparelho não tem: o texto sai na fonte
padrão, sem erro e sem aviso. Foi assim que `font-mono` viveu meses compilada
para `ui-monospace`, que é genérica de CSS e não existe instalada em celular
nenhum.

Em `__DEV__`, o `RivoProvider` acusa o que consegue ver sozinho: pilha de CSS
com vírgula (`"Manrope, system-ui, sans-serif"`: o RN lê a linha inteira como
um nome só), aspas herdadas do CSS, `var(--…)`, nome vazio, família genérica, e
`monospace` fora do Android. O que ele **não** consegue ver sozinho é a tabela
de fontes do aparelho. Daí o `isFontLoaded`: passe o `isLoaded` do `expo-font`
e cada nome declarado que não chegou ao aparelho sai nomeado no aviso.

## O catálogo

O catálogo do web atravessa por tradução e não por porte: `DataTable` vira
`DataList`, `Sheet` só conhece o comportamento de baixo, `Select` abre numa
folha, e `Sidebar`, `Menubar` e `Tooltip` não portam (são idiomas de desktop).
A tabela completa de tradução está no guia, e ela é gerada: quantas atravessam
e quantas não portam se lê lá, e não aqui.
