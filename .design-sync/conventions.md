## Como construir com o @rivocode/ui

Biblioteca white-label da RivoCode. Nenhum componente conhece a cor da marca:
ele pede um token semantico e o tema responde. Isso e o que permite a mesma
peca servir a RivoCode num projeto e outro cliente no seguinte.

### Envolva tudo no RivoProvider

Sem ele nada tem estilo, e `Dialog`, `Menu`, `Select`, `Tooltip` e os avisos
lancam erro, porque leem o contexto dele.

```tsx
import { RivoProvider, Button } from '@rivocode/ui'

<RivoProvider theme="rivocode-dark" density="comfortable">
  <Button>Salvar alteracoes</Button>
</RivoProvider>
```

- `theme`: `rivocode-dark` (padrao), `rivocode-light` ou `system`.
- `density`: `comfortable` (padrao) ou `compact`, para tela de operacao.
- `scope`: `global` veste a pagina; `local` veste so esta arvore e **pinta o
  fundo**. Em preview e em cartao isolado use `local`, senao o conteudo fica
  claro sobre claro.

O Provider ja carrega por dentro o provedor de dica, a fiacao de aviso e um
container de portal que leva o tema junto. Nao monte nenhum deles a mao.

### O vocabulario, que e o do Tailwind v4

Escreva layout com as mesmas classes que os componentes usam. **Nunca escreva
cor literal nem `z-index` numerico.**

| Familia | Classes |
|---|---|
| Superficie | `bg-bg`, `bg-surface`, `bg-surface-raised`, `bg-overlay` |
| Texto | `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-disabled` |
| Acento | `bg-accent`, `text-accent-fg`, `text-accent-text`, `bg-accent-subtle` |
| Linha e foco | `border-border`, `border-border-strong`, `ring-ring` |
| Estado | `bg-success`, `text-success-text`, `bg-danger-subtle`, e o mesmo para `warning` e `info` |
| Selecao e carga | `bg-selected`, `bg-skeleton` |
| Forma | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill` |
| Texto | `text-xs` a `text-3xl`, `font-sans`, `font-display`, `font-mono` |
| Sombra | `shadow-1`, `shadow-2`, `shadow-3` |
| Empilhamento | `z-[var(--rc-z-sticky)]`, e os pares `base`, `dropdown`, `overlay`, `dialog`, `popover`, `toast`, `tooltip` |

**Preencher e escrever texto sao tokens diferentes.** `bg-danger` preenche e
recebe `text-danger-fg` por cima. `text-danger-text` e o vermelho que se le
sobre o fundo da pagina. Nenhuma cor serve para as duas funcoes. Vale igual
para o acento: `bg-accent` com `text-accent-fg`, ou `text-accent-text` solto.

**Sao oito degraus de empilhamento, e os dois das pontas sao seus.** Os seis do
meio pertencem as pecas - o `Dialog` sobe sozinho para o `dialog`, o `Menu` para
o `dropdown` - e voce raramente os escreve. Os que a sua tela escreve sao os
outros dois: `--rc-z-base` para trazer um elemento de volta ao plano do
conteudo, e `--rc-z-sticky` para **cabecalho, coluna congelada e barra de acao
que gruda ao rolar**. Cabecalho grudado com `--rc-z-dropdown` fica na frente do
menu que ele mesmo abre; e o erro que a falta desta linha ja produziu.

**Altura de controle vem da densidade**, nunca cravada:
`h-[var(--rc-control-md)]`, com `sm` e `lg` disponiveis.

### A fonte é papel de tema, e vem em arquivo separado

`font-sans`, `font-display` e `font-mono` saem de `--rc-font-sans`,
`--rc-font-display` e `--rc-font-mono`, e os três são declarados **pelo tema**,
no mesmo seletor `[data-rc-theme="..."]` em que as cores estão. Não há valor de
`:root` por baixo: tema que não declara família fica sem família nenhuma, do
mesmo jeito que tema sem `--rc-bg` fica sem fundo.

As faces da RivoCode — Manrope, Poppins e JetBrains Mono — **não viajam mais
no `styles.css`**. Elas têm entrada própria, e só quem quer a marca a importa:

```css
@import "@rivocode/ui/styles.css";
@import "@rivocode/ui/fonts.css";   /* opcional: as faces da RivoCode */
```

Para vestir a fonte de um cliente, instale a família dele e aponte os três
tokens no seletor do tema dele, junto com as cores. Sem
`@rivocode/ui/fonts.css`, nenhum `.woff2` da RivoCode é baixado:

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

É assim que dois clientes com fontes diferentes convivem na mesma aplicação:
cada `data-rc-theme` carrega a sua família, e a troca acontece por seletor,
como a de cor.

### Os dois subcaminhos

Alem do pacote principal, duas familias vivem em subcaminhos e chegam pelo
mesmo global:

- **`@rivocode/ui/form`**, `Form`, `FormField`, `useZodForm` e os adaptadores
  `forDate`, `forValue`, `forChecked` — o nome diz o formato, e não a peça, e
  os nomes antigos (`forDatePicker`, `forSelect`, `forCheckbox`) seguem valendo.
  O controle vem por funcao,
  nao por clonagem do filho:

  ```tsx
  <FormField name="email" label="E-mail" description="Para onde vai a nota">
    {(campo) => <Input {...campo} />}
  </FormField>
  ```

- **`@rivocode/ui/chart`**, a Recharts vestida pelo tema.

  A moldura e o `ChartContainer`, que recebe tambem os quatro finais de uma
  consulta: `isLoading`, `isError`, `onRetry` e `empty`. **A altura e sua, por
  classe: grafico sem altura definida some.**

  A cor de cada serie vem do `config` e vira variavel com o nome da serie:

  ```tsx
  const config = { pagas: { label: "Pagas" } }

  <ChartContainer config={config} className="h-64">
    <LineChart data={dados}>
      <ChartXAxis dataKey="mes" />
      <ChartYAxis format="currencyShort" />
      <ChartTooltip content={<ChartTooltipContent config={config} />} />
      <Line dataKey="pagas" stroke="var(--color-pagas)" />
    </LineChart>
  </ChartContainer>
  ```

  | Peca | Para que |
  |---|---|
  | `ChartXAxis`, `ChartYAxis` | Eixos com o padrao ja certo, e `format` para o numero |
  | `ChartTooltip`, `ChartTooltipContent` | A dica, com o nome do `config` |
  | `ChartLegend`, `ChartLegendContent` | A legenda. Com `useSeriesToggle` ela vira filtro |
  | `ChartAreaGradient`, `areaGradient(id, serie)` | Gradiente de area. O `id` e seu, e precisa ser unico na pagina |
  | `ChartDonut` | Rosca com o total no buraco, e lista de fatias embaixo |
  | `ChartRadial` | O arco de uma medida so: meta, cota, conversao |
  | `Sparkline` | A linha miuda que cabe dentro de um indicador |

  O `useChartMotion()` liga a animacao da Recharts a preferencia de "reduzir
  movimento" do sistema. O resto do catalogo resolve isso por token - o
  `--rc-duration-*` vai a zero e toda transicao para -, mas a Recharts
  interpola em JS e nenhum token a alcanca. Espalhe o que ele devolve na marca:

  ```tsx
  const movimento = useChartMotion()

  <Line dataKey="pagas" stroke="var(--color-pagas)" {...movimento} />
  ```

  Os formatadores do eixo e da dica sao os mesmos do resto da biblioteca, e
  estao logo abaixo.

  As pecas da Recharts que saem por aqui: `Area`, `AreaChart`, `Bar`,
  `BarChart`, `Line`, `LineChart`, `Pie`, `PieChart`, `Cell`, `Scatter`,
  `ScatterChart`, `Radar`, `RadarChart`, `RadialBar`, `RadialBarChart`,
  `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `CartesianGrid`, `XAxis`,
  `YAxis`, `ZAxis`, `LabelList`, `Rectangle`, `ReferenceLine` e
  `ReferenceArea`. O `Tooltip` e o `Legend` dela **nao**: os nossos ja embrulham
  os dois, e o nome colidiria com o `Tooltip` do catalogo.

**Paleta de serie:** oito cores por tema, em `var(--rc-chart-1)` a
`var(--rc-chart-8)`, mais `var(--rc-chart-grid)` para a grade. Aqui a variavel
vem antes da classe de propriedade: a folha que voce recebe e a compilada, e
uma classe utilitaria que nenhum componente usa nao existe nela. A variavel
sempre resolve.

### Formatar o numero

Um vocabulario so, para o eixo, a dica, o indicador, a celula da tabela e o
rotulo de um controle. Eles nasceram no subcaminho do grafico e saem hoje
**tambem pela raiz**, porque formatar dinheiro numa celula nunca foi assunto de
grafico:

```tsx
import { currencyShort, percent, formatters } from '@rivocode/ui'
```

| Formatador | Escreve |
|---|---|
| `currency` | `R$ 2.480,00` |
| `currencyShort` | `R$ 2,5K` |
| `currencyShortWords` | `R$ 2,5 mil` |
| `compact` | `12,4K` |
| `compactWords` | `12,4 mil` |
| `integer` | `1.240` |
| `percent` | `62%`, do numero como ele esta no dado |
| `monthShort` | `mar` |
| `dayMonth` | `12/03` |

`compact` abrevia com simbolo, que e a convencao de painel e cabe em menos
pixel. `compactWords` e `currencyShortWords` escrevem por extenso, que le melhor
em texto corrido. **Nao misture as duas na mesma tela.**

**Dinheiro sai abreviado.** Use `currencyShort` em indicador, tabela, eixo,
legenda e dica. O `currency`, que escreve por extenso, fica para o lugar onde o
centavo e o assunto: o valor que a pessoa confirma antes de emitir, e o
comprovante depois.

**A prop `format` aceita o nome de um deles, ou uma funcao sua.** Ela existe no
`Meter`, no `Progress`, no `Slider`, no `ChartXAxis`, no `ChartYAxis` e no
`ChartDonut` - o tipo e `Format`, e `FormatName` e so o nome. O objeto
`formatters` reune os nove, para quem monta a escolha em runtime:

```tsx
<Meter value={72} format="percent" />
<ChartYAxis format="currencyShort" />
<Slider defaultValue={25} max={50} format={(valor) => `${valor} dias`} />
```

Data e mascara tem as suas, pelo mesmo motivo: `formatDate`, `parseDate` e
`applyDateMask` para `dd/mm/aaaa`, e `applyMask`, `applyPattern`,
`applyCurrencyMask`, `unmask`, `toCents` e `phonePatternFor` para os moldes de
`MASKS`. Formatar CPF numa celula de tabela nao precisa de um campo por perto.

### O que o CSS nao alcanca

`useMobile()` e verdadeiro abaixo do `sm` do Tailwind, no mesmo corte que a
barra lateral usa para virar folha e o calendario para mostrar um mes so. Ele
existe exportado para a aplicacao decidir junto, em vez de escrever o proprio
`640` num canto: quando cada tela guarda o seu numero, uma delas muda e as duas
metades passam a discordar sobre o que e celular.

```tsx
const isMobile = useMobile()

return isMobile ? <Sheet>{filtros}</Sheet> : <aside>{filtros}</aside>
```

`useMediaQuery(query)` e o geral, para qualquer outra pergunta que so o JS
responde. **Layout continua sendo trabalho de classe utilitaria**: trocar
`grid-cols-3` por `grid-cols-1` e assunto de `sm:`, e nao de hook. O hook e para
o que muda de peca, e nao de tamanho. No servidor ele devolve `false`, e nao um
palpite.

Dentro de um `SidebarProvider`, prefira `useSidebar().isMobile`: e o mesmo
valor, e evita um segundo assinante da mesma media query.

### O pacote nativo, e os quatro subcaminhos dele

`@rivocode/ui-native` é o mesmo catálogo em React Native, publicado como
**fonte**: o vocabulário de classes acima é o mesmo, via NativeWind, sobre os
mesmos tokens. O que atravessa é a classe, o token e a escolha da peça — **o
JSX se reescreve**. No nativo tudo é controlado (sem `defaultValue`, sem
`defaultChecked`, sem `defaultOpen`) e a lista vem por `items`, e não por
composição: `<Select items={…} value onValueChange label />`, sem
`SelectTrigger` nem `SelectItem`.

A regra que desenha o pacote é **um subcaminho por peer, e não um por
assunto**. Quatro peers são opcionais, e é o peer que decide onde a porta
fica: no celular um módulo do Expo e o `react-native-svg` custam **build**, e
não só bytes, e o metro resolve import por arquivo — então quem só quer um
`Button` não pode encontrar nenhum deles no índice da raiz. Juntar `Clipboard`
e `FileUpload` numa porta só, um `/expo`, cobraria o seletor de documentos de
quem apenas copia a chave de acesso de uma NF-e; por isso são duas.

| Subcaminho | O peer que ele custa | O que sai por ele |
|---|---|---|
| `@rivocode/ui-native/form` | `react-hook-form`, mais `zod` e `@hookform/resolvers` no `useZodForm` | `Form`, `FormField`, `useZodForm` e os adaptadores `forText`, `forValue`, `forChecked`, `forDate` |
| `@rivocode/ui-native/chart` | `react-native-svg` | `ChartContainer`, `ChartDonut`, `ChartRadial` e a `PALETTE` |
| `@rivocode/ui-native/clipboard` | `expo-clipboard` | `Clipboard` |
| `@rivocode/ui-native/file-upload` | `expo-document-picker` | `FileUpload`, `FileUploadList`, `FileUploadItem` |

```sh
npx expo install react-native-svg expo-clipboard expo-document-picker
```

**O formulário tem um adaptador a mais, o `forText`**, porque no nativo o campo
não devolve evento: o `TextInput` entrega o texto direto, e `forValue` não
serve. E **nada envia sozinho** — sem `<form>`, sem `type="submit"` e sem
Enter, o `Form` entrega `{ submit, isSubmitting }` por função. O rótulo viaja
no campo: sem `for` nem `id`, o `FormField` põe `accessibilityLabel` e
`invalid` na linha, e o adaptador os leva ao controle.

```tsx
import { Form, FormField, forText, useZodForm } from '@rivocode/ui-native/form'
```

**O gráfico não tem Recharts, nem variável de CSS, nem contentor que meça.** O
`ChartContainer` faz as três coisas à mão e **entrega**: `children` como função
recebe `{ width, height, colors }`, no lugar de `var(--color-série)` — e a
medida chega zerada no primeiro quadro. Os quatro finais de uma consulta
(`isLoading`, `isError`, `onRetry`, `empty`) atravessam com os mesmos nomes, e
a altura continua sendo sua, por classe.

A `PALETTE` é a lista dos oito papéis de série do tema — `chart-1` a `chart-8`
—, na ordem em que devem ser usados: série sem `color` no `config` recebe o
próximo da paleta, e é ela que o `ChartDonut` percorre fatia a fatia. **Cor de
série aqui é papel de token, nunca hexadecimal.** O web aceita qualquer cor de
CSS na mesma prop porque lá ela vira `var(--color-série)` e o tema continua no
comando; aqui a cor que a peça recebe é o valor final que vai para o desenho, e
um `#22c55e` escrito ali seria a única coisa da tela que não muda quando o
cliente troca de tema.

```tsx
import { ChartContainer, ChartDonut, ChartRadial, PALETTE } from '@rivocode/ui-native/chart'
```

A `Sparkline` fica fora deste subcaminho, na raiz e desenhada com `View`: ela é
o slot `chart` do `Stat`, o `Stat` sai da raiz, e trazê-la para cá cobraria o
`react-native-svg` de quem só queria um número num cartão.

**Copiar confirma duas vezes.** O `Clipboard` troca o nome do botão, como no
web, e dispara **também** um aviso — `accessibilityLabel` trocado num
`Pressable` que já está sob o foco não é reanunciado nem pelo VoiceOver nem
pelo TalkBack, e o aviso do `RivoProvider` é o único canal da tela que fala
sozinho (`toast={false}` desliga).

**E a área de soltar não existe.** No celular não há arrastar: o `FileUpload`
abre o seletor do sistema por um botão de altura de controle, com o `hint`
dentro do nome falado, e o `accept` fala MIME, que é o que o seletor sabe
filtrar. O que volta é um `PickedFile` com `uri` local — `size` pode faltar, e
`maxSize` só recusa o que mediu. A lista do que já entrou é a `FileUploadList`,
com um `FileUploadItem` por arquivo.

```tsx
import { Clipboard } from '@rivocode/ui-native/clipboard'
import { FileUpload, FileUploadItem, FileUploadList } from '@rivocode/ui-native/file-upload'
```

O resto da paridade — o que traduz, o que muda de nome e o que não porta por
decisão — está em <https://ds.rivocode.com.br/react-native.md>.

### Onde esta a verdade

| O que | Onde |
|---|---|
| Indice de tudo | <https://ds.rivocode.com.br/llms.txt> |
| Uma peca, com props e exemplos | `https://ds.rivocode.com.br/componentes/<nome-em-kebab>.md` |
| Os cinquenta papeis de um tema | <https://ds.rivocode.com.br/temas.md> |
| Um sistema inteiro, montado | <https://ds.rivocode.com.br/demonstracao> |

**Nunca invente prop.** Se o `.md` da peca nao a lista, ela nao existe.

### Rotulo de controle vem como filho

`Checkbox`, `Radio` e `Switch` aceitam o texto como filho e se embrulham num
`<label>`, entao clicar no texto tambem marca:

```tsx
<Checkbox defaultChecked>ISS retido na fonte</Checkbox>
<Radio value="pix">Pix</Radio>
<Switch>Enviar o XML junto com o PDF</Switch>
```

Sem filho sai so o controle, para quando o rotulo tiver estrutura propria. Ai o
`<label>` em volta e seu.

### As duas formas de aba

`TabList` tem `variant`. O risco embaixo, que e o padrao, diz "esta parte da
pagina". A caixinha, `variant="segmented"`, diz "a mesma coisa, de outro jeito":
largura de tela, preview e codigo, escuro e claro. Trocar uma pela outra faz o
controle prometer o que ele nao faz.

### Um exemplo do idioma

```tsx
<RivoProvider theme="rivocode-dark">
  <main className="min-h-screen bg-bg p-8 font-sans text-fg">
    <h1 className="mb-6 font-display text-3xl">Notas fiscais</h1>
    <Card>
      <CardHeader>
        <CardTitle>Resumo do mes</CardTitle>
        <CardDescription>Agosto de 2026</CardDescription>
      </CardHeader>
      <CardContent className="text-fg-muted">
        Doze notas processadas, tres pendentes.
      </CardContent>
      <CardFooter>
        <Button size="sm">Ver detalhes</Button>
        <Button size="sm" variant="ghost">Exportar</Button>
      </CardFooter>
    </Card>
  </main>
</RivoProvider>
```

Botao em pilula (`shape="pill"`) e o tamanho `cta` sao de pagina de marketing.
Em tela de produto o padrao e o canto de 8px.
