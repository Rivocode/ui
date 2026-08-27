Nenhum componente da biblioteca conhece a cor da marca. Ele pede um papel, "a
cor de acento", "a superfície levantada", e o tema responde. É isso que permite
a mesma peça servir a RivoCode num projeto e a um cliente no seguinte, sem tocar
em componente.

## As três camadas

```
Camada 1  paleta      --rc-p-lima-500: oklch(...)       a cor crua, sem opinião
Camada 2  contrato    --color-accent: var(--rc-accent)  vira bg-accent no Tailwind
Camada 3  tema        --rc-accent: var(--rc-p-lima-500) quem faz o papel, aqui
```

A **paleta** é um dicionário de cores. A **camada de contrato** liga cada papel
ao vocabulário do Tailwind: todo nome ali vira utilitário, então `--color-surface`
produz `bg-surface`, `text-surface` e `border-surface`, dentro da biblioteca e
no layout que você escreve. O **tema** é a única camada que decide qual cor faz
qual papel.

Trocar de cliente é reescrever a camada 3. Nada mais.

## Os dois temas prontos

```tsx
<RivoProvider theme="rivocode-dark">   {/* padrão */}
<RivoProvider theme="rivocode-light">
<RivoProvider theme="system">          {/* segue o sistema operacional */}
```

Com `system`, o Provider lê `prefers-color-scheme` e acompanha a troca enquanto
a página está aberta, não é só a leitura inicial.

O `data-rc-theme` que o Provider escreve também **pinta o fundo e a cor de
texto** do elemento que o carrega. Com `scope="global"` isso é a página; com
`scope="local"`, só aquela árvore.

## Preenchimento e texto são tokens diferentes

Esta é a distinção que mais economiza tempo depois:

```tsx
<div className="bg-danger text-danger-fg">Botão vermelho, texto por cima</div>
<p className="text-danger-text">Mensagem de erro sobre o fundo da página</p>
```

`bg-danger` é o vermelho que **preenche** e recebe `text-danger-fg` em cima.
`text-danger-text` é o vermelho que **se lê** sobre o fundo. Nenhuma cor serve
bem para as duas coisas: a que tem contraste como texto não aguenta texto branco
por cima, e a que aguenta é clara demais para ler. Vale igual para o acento,
para `success`, `warning` e `info`.

## Todos os papéis

Um tema completo declara todos os que vêm abaixo; faltando um, o componente que o
usa cai no valor do tema anterior, e o sintoma costuma ser uma cor da RivoCode
isolada no meio do azul do cliente. Depois deles vêm três papéis de acabamento
(gradiente, brilho e vidro) que são os únicos opcionais.

### Superfície

| Token | Classe | O que veste |
|---|---|---|
| `--rc-bg` | `bg-bg` | O fundo da página |
| `--rc-surface` | `bg-surface` | Cartão, painel, campo |
| `--rc-surface-raised` | `bg-surface-raised` | O que salta do resto: menu, dica, cabeçalho de tabela |
| `--rc-overlay` | `bg-overlay` | A tarja escura atrás de diálogo e folha |

### Texto

| Token | Classe | O que veste |
|---|---|---|
| `--rc-fg` | `text-fg` | Texto principal |
| `--rc-fg-muted` | `text-fg-muted` | Texto de apoio, parágrafo secundário |
| `--rc-fg-subtle` | `text-fg-subtle` | Rótulo, legenda, cabeçalho de coluna |
| `--rc-fg-disabled` | `text-fg-disabled` | Controle desativado |

### Acento

| Token | Classe | O que veste |
|---|---|---|
| `--rc-accent` | `bg-accent` | Preenchimento da marca: botão primário, marca de escolha |
| `--rc-accent-hover` | - | O mesmo com o ponteiro em cima |
| `--rc-accent-active` | - | O mesmo no instante do clique |
| `--rc-accent-fg` | `text-accent-fg` | O que se lê **sobre** o acento |
| `--rc-accent-text` | `text-accent-text` | O acento que se lê **sobre o fundo**: link, item ativo |
| `--rc-accent-subtle` | `bg-accent-subtle` | Fundo tênue de item marcado, item de menu sob o ponteiro |

### Linha, foco e estado de linha

| Token | Classe | O que veste |
|---|---|---|
| `--rc-border` | `border-border` | A linha comum |
| `--rc-border-strong` | `border-border-strong` | A borda de um controle, que precisa se ver |
| `--rc-border-disabled` | `border-border-disabled` | A borda de um controle travado, que precisa se ver **menos** |
| `--rc-line-hover` | - | A borda com o ponteiro em cima |
| `--rc-ring` | `ring-ring` | O anel de foco do teclado |
| `--rc-selected` | `bg-selected` | Linha escolhida numa tabela. Área grande pede alfa baixo |
| `--rc-skeleton` | `bg-skeleton` | Marca de lugar do carregamento |

### Estados

Quatro famílias com quatro papéis cada, sempre no mesmo formato:

| Padrão | Classe | O que veste |
|---|---|---|
| `--rc-<estado>` | `bg-<estado>` | Preenche |
| `--rc-<estado>-fg` | `text-<estado>-fg` | O que se lê sobre o preenchimento |
| `--rc-<estado>-text` | `text-<estado>-text` | A cor que se lê sobre o fundo da página |
| `--rc-<estado>-subtle` | `bg-<estado>-subtle` | Fundo tênue de aviso |

Onde `<estado>` é `success`, `warning`, `danger` ou `info`. São dezesseis
tokens, e nenhum deles é opcional: um `Alert tone="warning"` sem
`--rc-warning-subtle` sai sem fundo.

O perigo é o único estado que também vira botão sólido, então
`--rc-danger` e `--rc-danger-fg` precisam de contraste de botão, não só de
etiqueta.

### Gráfico

| Token | O que veste |
|---|---|
| `--rc-chart-1` a `--rc-chart-8` | As oito séries, **na ordem em que devem ser usadas** |
| `--rc-chart-grid` | A grade de fundo |

Elas têm guarda própria de 3:1 contra a superfície. **Tema de cliente que não as
declara desenha gráfico sem cor de série.**

No CSS use sempre `var(--rc-chart-1)`, e nunca a classe `bg-chart-1`: essa
classe não existe na folha compilada, porque o Tailwind só gera o que encontra
ao varrer, e o resultado seria uma cor que nunca resolve, em silêncio.

### Sombra e tipografia de marca

| Token | O que veste |
|---|---|
| `--rc-shadow-1` a `--rc-shadow-3` | `shadow-1`, `shadow-2`, `shadow-3`: linha, painel, sobreposição. Cada uma já carrega o hairline de 1px que separa o flutuante da página |
| `--rc-glow-accent` | `shadow-glow`: a lanterna do acento, opt-in (hero de landing e CTA que merece cerimônia); nenhum componente liga sozinho. Para o **tema** acender sem que cada tela peça, veja `--rc-accent-shadow` adiante |
| `--rc-text-display` | Tamanho de título de marketing, em `clamp()` |
| `--rc-text-hero` | Tamanho de herói, em `clamp()` |
| `--rc-font-sans` | `font-sans`: a família do corpo, e o padrão de toda a árvore |
| `--rc-font-display` | `font-display`: a família de título, a que carrega a marca |
| `--rc-font-mono` | `font-mono`: a família de código, tabela numérica e `Kbd` |

Os passos de marketing vivem no tema e não no núcleo de propósito: um sistema
de operação nunca os usa, e um site de marca quer os seus. O glow segue a mesma
lógica: no escuro a lima ilumina, no claro quem sombreia é o tom escurecido
dela, e um tema de cliente decide o próprio brilho.

**A fonte é papel de tema, e não escala.** Os dois temas da casa declaram as
três famílias, e um tema de cliente que não as declara fica **sem família
nenhuma**: a árvore cai na fonte do navegador, exatamente como acontece com um
tema que esquece `--rc-bg`. Não há valor de `:root` por baixo para segurar a
queda, e isso é deliberado: uma fonte de sistema silenciosa por baixo faria a
falta parecer escolha, e o cliente descobriria meses depois que metade da tela
nunca vestiu a marca dele.

As famílias da RivoCode (Manrope, Poppins e JetBrains Mono) **não vêm mais
junto com o `styles.css`**. Quem quer a marca importa o arquivo de faces
separado; quem veste outra fonte instala a dela e nunca baixa as nossas:

```css
@import "@rivocode/ui/styles.css";
@import "@rivocode/ui/fonts.css";   /* só quem quer as faces da RivoCode */
```

Para vestir a fonte do cliente, instale a família e aponte os três tokens no
mesmo seletor de tema em que você já declarou as cores:

```css
@import "@rivocode/ui/styles.css";
@import "@fontsource-variable/inter";

[data-rc-theme="cliente-acme"] {
  --rc-font-sans: "Inter Variable", system-ui, sans-serif;
  --rc-font-display: "Inter Variable", system-ui, sans-serif;
  --rc-font-mono: ui-monospace, SFMono-Regular, monospace;

  /* …e os cinquenta papéis de cor. */
}
```

Repare que o `@rivocode/ui/fonts.css` **não** aparece aí: é assim que dois
clientes convivem na mesma aplicação, cada um com a sua família, e nenhum dos
dois carregando os 220 KB de `.woff2` da RivoCode.

### Acabamento: gradiente, vidro e brilho

Três papéis que não pintam cor, e sim o que vem por cima dela. São os **únicos
opcionais** do guia: ausentes, o gesto simplesmente não acontece, e é assim que
os dois temas da casa nascem: os três declarados como `none`.

| Token | Onde chega | O gesto |
|---|---|---|
| `--rc-accent-image` | `background-image` de quem veste `bg-accent` | O acento em gradiente |
| `--rc-accent-shadow` | `box-shadow` do mesmo `bg-accent` | "Neste tema o primário brilha", sem `shadow-glow` em tela nenhuma |
| `--rc-overlay-filter` | `backdrop-filter` da tarja, `bg-overlay` | Vidro fosco atrás de diálogo, folha e paleta de comando |

O acabamento viaja junto com o papel, e não com a peça: quem já vestia
`bg-accent` recebe o gradiente e o brilho, quem já vestia `bg-overlay` recebe o
vidro. É o que torna a tarja alcançável: ela é um nó interno do portal, e
`classNames={{ backdrop }}` resolve **uma tela**, enquanto o token resolve o
tema inteiro, nas quatro peças que têm tarja, de uma vez.

Quatro coisas para saber antes de usar:

- **A classe de quem escreve a tela continua vencendo.** As regras são
  `:where()`, de especificidade zero: um `bg-none` ou um `shadow-none` no
  `className` desfaz o acabamento naquela peça, e um `bg-linear-to-r` seu
  substitui o gradiente do tema.
- **O gradiente cobre a cor.** `background-image` pinta por cima de
  `background-color`, então com um gradiente opaco o `hover:bg-accent-hover` do
  Button acontece embaixo e ninguém vê. Dê alfa ao gradiente e o hover volta a
  aparecer através dele.
- **Botão desabilitado fica de fora.** O Button neutraliza o primário morto
  trocando a cor de fundo, e o gradiente sobreviveria a essa troca; a regra o
  exclui. Carregando não é desabilitado para esse fim: ali a cor ainda diz qual
  ação está em andamento.
- **O alcance é o `bg-accent` escrito direto**: botão primário, barra de
  progresso. O acento que só chega sob estado, como o `data-[checked]:bg-accent`
  da caixa de marcar, compila com outro nome de classe e não recebe o
  acabamento.

No React Native os três não atravessam: gradiente e `backdrop-filter` não são
propriedades de `View`, e o gerador de tema nativo os ignora em silêncio, como
já faz com `box-shadow` e `clamp()`. São papéis de web.

#### Um tema futurista, os três de uma vez

```css
/* tema-neon.css */
[data-rc-theme="neon"] {
  color-scheme: dark;

  --rc-bg: oklch(16% 0.02 285);
  --rc-surface: oklch(21% 0.03 285);
  --rc-surface-raised: oklch(26% 0.03 285);

  /* Com vidro, a tarja preta de sempre vira lama: ela clareia e desfoca. */
  --rc-overlay: oklch(14% 0.04 285 / 0.55);
  --rc-overlay-filter: blur(10px) saturate(130%);

  --rc-accent: oklch(64% 0.21 300);
  --rc-accent-hover: oklch(70% 0.21 300);
  --rc-accent-active: oklch(58% 0.21 300);
  --rc-accent-fg: oklch(99% 0 0);

  /* Alfa de propósito: o gradiente cobre a cor, e sem ele o hover do Button
     acontece embaixo, invisível. */
  --rc-accent-image: linear-gradient(
    135deg,
    oklch(64% 0.21 300 / 0.92),
    oklch(72% 0.16 200 / 0.92)
  );

  /* O brilho deixa de ser enfeite que cada tela liga e vira estado do acento. */
  --rc-accent-shadow: 0 0 28px oklch(64% 0.21 300 / 0.45);

  /* …e os cinquenta papéis obrigatórios. */
}
```

O que muda na tela, sem uma linha de componente ou de página: o botão primário
sai em degradê violeta→ciano e acende sozinho, e volta ao roxo chapado quando
desabilita; a tarja do `Dialog`, do `AlertDialog`, do `Sheet` e do `Command`
vira vidro fosco.

### Forma e movimento

Cor não é a única coisa que um tema decide. Canto reto e movimento seco dizem
"futurista" antes de qualquer cor, e esses nove tokens vivem em
`src/tokens/forma.css`, fora da escala, justamente para o tema poder redefinir:

| Token | O que decide |
|---|---|
| `--rc-radius-sm` a `--rc-radius-xl` | O canto de campo, cartão, painel e diálogo |
| `--rc-radius-pill` | A pílula: chave, badge, avatar, barra |
| `--rc-duration-fast`, `--rc-duration-base`, `--rc-duration-slow` | O tempo de cada transição |
| `--rc-duration-sheet`, `--rc-ease-sheet` | O tempo e a curva da folha lateral, que segue o dedo |
| `--rc-ease` | A curva de todo o resto: seca e mecânica, ou macia |
| `--rc-tracking-display`, `--rc-tracking-tight` | O espaçamento de letra do título |

Redefina no mesmo seletor do tema, junto com os papéis de cor:

```css
[data-rc-theme="acme"] {
  --rc-radius-md: 0px;                          /* canto reto */
  --rc-duration-base: 140ms;                    /* movimento seco */
  --rc-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

A ordem já está resolvida pelo preset: `forma.css` entra antes dos temas, e
`:root` e `[data-rc-theme="x"]` têm a mesma especificidade, então o tema vence.

## O que o tema precisa garantir

Os papéis não são independentes. Estas relações precisam valer, e as quatro
primeiras são medidas por `bun run check`. Um tema que as quebra falha no CI,
e não na tela do cliente:

| Invariante | Por quê |
|---|---|
| `--rc-border-strong` a 3:1 da superfície | É a fronteira que identifica o controle (WCAG 1.4.11). Abaixo disso o campo não se distingue da página |
| `--rc-border-disabled` acima de 1,6:1 da superfície, e a 1,4× **abaixo** de `--rc-border-strong` | É o único papel com teto além de piso. Muito fraca, o controle travado some; igual à viva, ele fica idêntico ao controle que ainda responde, e a WCAG 1.4.11 dispensa componente inativo dos 3:1 justamente para abrir essa faixa |
| `--rc-<estado>-text` a 4,5:1 sobre `--rc-<estado>-subtle` | É o par que a pessoa lê no `Alert`, e não o texto contra `--rc-bg`. O alfa é composto antes de medir |
| `--rc-ring` a 3:1 contra `--rc-bg` e contra `--rc-surface` | O foco precisa aparecer nos dois fundos, e não só num |
| `--rc-skeleton` diferente da superfície | Ele é a marca de lugar do que está carregando, e o corpo do `Avatar`. Igual à superfície, os dois somem |

`--rc-surface` e `--rc-surface-raised` **podem** ser a mesma cor: no tema claro
da casa as duas são branco puro, e cartão branco sobre página cinza é o padrão
de nove entre dez painéis. Componente nenhum pode depender dessa diferença para
existir visualmente; quem precisa de corpo próprio veste `--rc-skeleton`, e quem
precisa dizer "travado" veste `--rc-border-disabled`. Os dois tokens existem pelo
mesmo motivo: são a saída de quem tropeçou em branco sobre branco e tentou
resolver subindo a superfície.

## O que **não** entra no tema

Altura de controle e respiro vivem em `src/tokens/scales.css` e valem para
todos os temas. Um tema que redefine `--rc-control-md` está resolvendo
densidade no lugar errado, para isso existe `density="compact"`, e ele muda a
escala inteira de uma vez. Escala de texto e empilhamento seguem a mesma
regra: são estrutura, e mudar deixaria de ser tema.

## Um tema de cliente, do começo ao fim

Digamos que o cliente é azul.

**1. Declare os papéis num seletor de tema.** Só os papéis; a paleta pode ser
sua ou a nossa:

```css
/* tema-acme.css */
[data-rc-theme="acme"] {
  color-scheme: dark;

  --rc-bg: oklch(21% 0.02 250);
  --rc-surface: oklch(26% 0.02 250);
  --rc-surface-raised: oklch(31% 0.02 250);
  --rc-overlay: oklch(0% 0 0 / 0.62);

  --rc-fg: oklch(97% 0.01 250);
  --rc-fg-muted: oklch(82% 0.01 250);
  --rc-fg-subtle: oklch(64% 0.01 250);
  --rc-fg-disabled: oklch(50% 0.01 250);

  --rc-accent: oklch(62% 0.19 250);
  --rc-accent-hover: oklch(66% 0.19 250);
  --rc-accent-active: oklch(58% 0.19 250);
  --rc-accent-fg: oklch(99% 0 0);
  --rc-accent-text: oklch(74% 0.16 250);
  --rc-accent-subtle: oklch(62% 0.19 250 / 0.14);

  --rc-border: oklch(100% 0 0 / 0.1);
  --rc-border-strong: oklch(100% 0 0 / 0.14);
  --rc-line-hover: oklch(100% 0 0 / 0.26);
  --rc-ring: oklch(62% 0.19 250);
  --rc-selected: oklch(62% 0.19 250 / 0.08);
  --rc-skeleton: oklch(100% 0 0 / 0.08);

  /* …e as quatro famílias de estado, as oito séries de gráfico,
     as três sombras e os dois tamanhos de marca. */
}
```

**2. Importe depois do preset**, para a sua camada 3 vencer:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";
@import "./tema-acme.css";

@source '../node_modules/@rivocode/ui/dist';
```

**3. Vista a árvore:**

```tsx
<RivoProvider theme="acme">
```

A prop aceita o nome do seu tema, e não só os dois de casa. Para guardar a
escolha num seletor, o tipo é `RivoThemeSetting` (os de casa, `system` e o
nome do cliente), com o autocomplete dos conhecidos preservado:

```tsx
const [tema, setTema] = useState<RivoThemeSetting>("acme")
```

O `color-scheme` na primeira linha não é enfeite: sem ele o navegador desenha
barra de rolagem, campo de data e menu nativo no esquema errado, e nenhum token
alcança essas peças.

## O mesmo tema no React Native

O arquivo que você acabou de escrever veste as duas plataformas. **A fonte é
uma só de propósito**: um segundo lugar para manter a cor de um cliente é como
a promessa se quebra na prática, não por decisão, por divergência silenciosa
seis meses depois.

**1. Gere o mapa nativo a partir do mesmo CSS:**

```sh
bun run gen:native --tema tema-acme.css --saida acme.theme.ts
```

Ele lê os blocos `[data-rc-theme="acme-light"]` e `[data-rc-theme="acme-dark"]`
(um seletor sozinho serve aos dois esquemas) e emite um `RivoNativeThemeMap`.
**Se faltar um papel, ele falha e diz quais**: um tema incompleto herda a cor da
RivoCode em peças isoladas, e isso só aparece na tela do cliente.

**2. Vista a árvore:**

```tsx
import { RivoProvider } from '@rivocode/ui-native'
import { acmeTheme } from './acme.theme'

<RivoProvider theme={acmeTheme} scheme="system">
```

Com tema de casa, quem decide claro e escuro é o próprio nome do tema; com tema
de cliente, é a prop `scheme`.

### O que isso custa, e o que não custa

Os dois temas de casa continuam compilados como `light-dark(claro, escuro)`, que
o runtime de CSS nativo avalia sozinho: trocar entre eles acontece **no mesmo
frame, sem re-renderização**. Nada disso muda.

O tema de cliente não cabe nesse caminho (os valores dele não existem em build),
então ele entra pelo `VariableContextProvider`, que redefine as variáveis para
a árvore abaixo. O custo é **uma re-renderização quando o tema ou o esquema
mudam**, e só é pago por quem veste um cliente.

Em troca, ele aninha: um provider de tema escuro dentro de uma tela clara veste
só a sua árvore, que é o mesmo que o `scope="local"` faz no web.

### A regra que as peças seguem

Peça que pinta por fora da classe (o trilho do `Switch`, o giro do `Button`, a
cor da `Sparkline`) lê os papéis do contexto (`useRivo().colors`), e nunca de
`tokens.themes`. Lendo o mapa direto ela pegaria sempre o tema de casa, e a tela
do cliente sairia com metade das cores dele e metade da lima da RivoCode. Há um
teste que falha se alguém voltar a ler direto.

## Como pedir isto a um agente

O endereço cru deste guia é
[`/temas.md`](https://ds.rivocode.com.br/temas.md). Um prompt que costuma
funcionar:

```
Leia https://ds.rivocode.com.br/temas.md e escreva o tema "acme" completo,
com todos os cinquenta papéis. A marca é azul (#2563eb), fundo escuro.
Depois confira o contraste de texto contra fundo em cada par.
```

Pedir "todos os cinquenta papéis" importa: sem isso o agente escreve os dez
óbvios e deixa gráfico e estados sem cor, que é exatamente a falha silenciosa
que a lista acima existe para evitar.

## As guardas

O repositório da biblioteca tem travas que rodam em `bun run check`, e existem
porque todas essas falhas são silenciosas:

**Cor literal.** Nenhum componente pode escrever `#d4f34a`, `bg-lime-400` ou
`rgb(...)` direto. Se pudesse, o tema do cliente não alcançaria aquela peça, e o
erro só apareceria na tela dele.

**Contraste.** Os pares de texto, os pares compostos de estado sobre o próprio
fundo, e a fronteira não-textual de 1.4.11 (nos dois temas, com o alfa
composto antes de medir). Um tema novo deve passar pela mesma medida, é a
diferença entre "parece bom no meu monitor" e "dá para ler".

**Forma documentada.** Todo token que um tema pode declarar precisa estar
citado neste guia: os papéis de cor e os de forma. Sem isso o guia passa a
mentir em silêncio, e a mentira aparece meses depois, na tela de um cliente.

## Ajuste fino com className

Toda peça (no web e no React Native) aceita `className` na raiz, e **a classe
de quem usa vence a da peça**: o merge é por grupo do Tailwind, então um
`h-14` derruba o `h-10` do Button e um `rounded-pill` derruba o `rounded-md`,
em vez de conviver com ele.

```tsx
<Button className="h-14 rounded-pill">Assinar agora</Button>
```

É isto que torna o wrapper de cliente um arquivo pequeno no projeto dele, em
vez de um fork:

```tsx
// o botão da Acme, no repositório da Acme
import { Button, type ButtonProps } from '@rivocode/ui'
import { cn } from './cn'

export function AcmeButton({ className, ...props }: ButtonProps) {
  return <Button className={cn('rounded-pill uppercase tracking-widest', className)} {...props} />
}
```

Duas regras mantêm o gesto saudável:

- **Token, nunca cor literal.** O `className` do wrapper obedece às mesmas
  regras da peça: `bg-accent` responde ao tema do cliente, `bg-[#2563eb]` não
  responde a ninguém.
- **A raiz, não as partes.** O `className` veste o elemento externo da peça.
  Nas peças com camadas (Sheet, Dialog, Select), a documentação da prop diz o
  que ela veste (o painel, o gatilho), e o que é da plataforma continua da
  plataforma.
