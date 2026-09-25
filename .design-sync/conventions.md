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
| Codigo lido por maquina | `fill-code-ink`, `bg-code-paper`, `text-code-ink`: escuro sobre claro com o mesmo valor em todo tema, e nao sao papel de tema |
| Palco de midia | `bg-media-stage`, `bg-media-control`, `text-media-fg`, `text-media-fg-muted`, `border-media-border`, `text-media-disabled`: escuro nos dois temas com o mesmo valor, e nao sao papel de tema. Sao do `ImageViewer` em tela cheia |
| Papel da assinatura | `bg-signature-paper`, `fill-signature-ink`, `text-signature-guide`, `stroke-signature-guide`, `text-signature-disabled`: tinta escura sobre papel claro nos dois temas, e nao sao papel de tema. Sao do `SignaturePad`, para a assinatura exportada nao sair invertida |
| Forma | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill` |
| Texto | `text-xs` a `text-3xl`, `font-sans`, `font-display`, `font-mono` |
| Peso | `font-rc-regular`, `font-rc-medium`, `font-rc-strong`, `font-rc-bold`, `font-rc-display` |
| Sombra | `shadow-1`, `shadow-2`, `shadow-3` |
| Empilhamento | `z-[var(--rc-z-sticky)]`, e os pares `base`, `dropdown`, `overlay`, `dialog`, `popover`, `toast`, `tooltip` |
| Entrada | `animate-enter`, `animate-appear`, `animate-pop`, `animate-fill`, `animate-reveal` |

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

**As pecas entram na montagem, e a moldura nao.** O que chega entra - o
grafico se desenha, a barra de progresso enche do zero, o `Alert` e o
`EmptyState` sobem 4px esmaecendo, o corpo do `DataTable` esmaece ao sair do
esqueleto - e o que e layout (`Card`, `PageHeader`, `Sidebar`) fica parado. As
classes de `Entrada` sao as mesmas que as pecas usam, para o que voce monta por
fora: todas duram um token, zeram com "reduzir movimento", rodam uma vez por
montagem e nao prendem estado depois de acabar. `animate-none` desliga numa
instancia.

**Movimento tem nome de intencao.** Duracao: `duration-fast`, `duration-base`,
`duration-slow`. Curva: `ease-rc` (padrao), `ease-rc-enter` (o que chega),
`ease-rc-exit` (o que sai). Mola, com a duracao do mesmo nome:
`ease-rc-spatial duration-spatial` para posicao e tamanho,
`ease-rc-expressive duration-expressive` para o mesmo com mais corpo, e
`ease-rc-effects duration-effects` para cor e opacidade, que nao podem passar do
alvo. Toda duracao zera com "reduzir movimento". Nunca `duration-150` nem
`ease-[cubic-bezier(...)]`.

**Altura de controle vem da densidade**, nunca cravada:
`h-[var(--rc-control-md)]`, com `sm` e `lg` disponiveis.

### A fonte é papel de tema, e vem em arquivo separado

`font-sans`, `font-display` e `font-mono` saem de `--rc-font-sans`,
`--rc-font-display` e `--rc-font-mono`, e os três são declarados **pelo tema**,
no mesmo seletor `[data-rc-theme="..."]` em que as cores estão. Não há valor de
`:root` por baixo: tema que não declara família fica sem família nenhuma, do
mesmo jeito que tema sem `--rc-bg` fica sem fundo.

As faces da RivoCode (Manrope, Poppins e JetBrains Mono) **não viajam mais
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

### O peso também é token, e tem nome de intenção

As peças não escrevem `font-medium` nem `font-semibold`: escrevem a intenção, e
o número mora em `--rc-weight-*`, com o valor da casa em `:root` e opcional no
tema.

| Classe | Token | Casa | Quando |
|---|---|---|---|
| `font-rc-regular` | `--rc-weight-regular` | 400 | corpo |
| `font-rc-medium` | `--rc-weight-medium` | 500 | rótulo, botão, aba, cabeçalho de tabela |
| `font-rc-strong` | `--rc-weight-strong` | 600 | ênfase forte no corpo |
| `font-rc-bold` | `--rc-weight-bold` | 700 | negrito de texto rico, chamada de marketing |
| `font-rc-display` | `--rc-weight-display` | 600 | todo texto em `font-display` |

Na sua tela, use as mesmas quando o texto tem que seguir a fonte do cliente:
`font-display font-rc-display` num título montado à mão pega o peso que o tema
decidiu, e `font-semibold` fica cravado em 600 mesmo que a família não o tenha.
O tema que troca a fonte redefine o peso no mesmo seletor:

```css
[data-rc-theme="cliente-acme"] {
  --rc-font-display: "Lato", system-ui, sans-serif;
  --rc-weight-display: 700;
}
```

O `cn` da biblioteca conhece as cinco classes: `cn("font-rc-medium", className)`
com `font-rc-strong` no `className` fica com a segunda, e `font-display` ao lado
de `font-rc-display` não se anulam. No React Native as cinco existem com os
mesmos valores, no `theme.css` do pacote.

### Os quatro subcaminhos

Alem do pacote principal, quatro familias vivem em subcaminhos e chegam pelo
mesmo global:

- **`@rivocode/ui/form`**, `Form`, `FormField`, `useZodForm` e os adaptadores
  `forDate`, `forValue`, `forChecked`: o nome diz o formato, e não a peça.
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
  | `ChartGauge` | Medidor de 0 a `max` com faixas (bom, atencao, critico) e o valor escrito no meio |
  | `ChartHeatmap` | Grade de linha por coluna, a cor dizendo o tamanho: emissoes por dia e hora |
  | `ChartFunnel` | As etapas de um caminho, com a taxa de conversao de uma para a seguinte |
  | `ChartTreemap` | Area proporcional por categoria, com o rotulo que some quando nao cabe |
  | `Sparkline` | A linha miuda que cabe dentro de um indicador |

  O `ChartContainer` cuida do movimento sozinho: toda marca que anima (`Line`,
  `Bar`, `Area`, `Pie`, `Radar`, `RadialBar`, `Scatter`) sai com
  `animationDuration` de `--rc-duration-slow`, `animationEasing` de `--rc-ease`
  e `isAnimationActive` ligado antes de a marca montar, e desligado com "reduzir
  movimento". Na primeira vez que aparece com dados, o grafico se desenha, e
  quando o dado muda cada marca anda ate o valor novo. Marca com
  `isAnimationActive={false}` fica parada. O `useChartMotion()` devolve o mesmo
  trio para quem desenha com a Recharts fora da moldura:

  ```tsx
  const movimento = useChartMotion()

  <Line dataKey="pagas" stroke="var(--color-pagas)" {...movimento} />
  ```

  A `ChartDonut` e a `ChartRadial` entram varrendo do zero e andam ate o valor
  novo do mesmo jeito; a `Sparkline` so esmaece ao entrar, e nao anda na troca
  de dados, porque aparece as dezenas numa tabela.

  As quatro de baixo nao usam a Recharts e nao entram no `ChartContainer`: os
  quatro finais de uma consulta vem do `QueryBoundary` em volta delas. A escala
  do `ChartHeatmap` e uma cor de serie so, em cinco degraus de tinta; o
  `ChartTreemap` escreve o rotulo em `fg` sobre a cor da categoria a 30%, par
  que a guarda de contraste mede nas oito series; e o `ChartGauge` pinta as
  faixas com os papeis `success-text`, `warning-text` e `danger-text`. Nenhuma
  das quatro depende de cor sozinha: o numero esta na dica, numa tabela ou lista
  escondida da vista, ou escrito na tela.

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

- **`@rivocode/ui/ai`**, as pecas de conversa com um assistente. Nao tem peer
  nenhum: ele e subcaminho pelo PESO, porque so app que conversa com um modelo
  precisa delas, e nao cobra de quem monta nota fiscal. **Nenhuma conhece SDK
  de IA**: a mensagem entra por prop, e o que a pessoa faz sai por evento. Quem
  fala com o modelo e a sua tela, com o SDK que ela ja usa.

  ```tsx
  import { Conversation, Message, PromptInput, ToolCall, AILabel } from '@rivocode/ui/ai'

  <div className="flex h-[32rem] flex-col gap-3">
    <Conversation className="flex-1" empty={vazio} onSuggestion={enviar}>
      {mensagens.map((m) => (
        <Message key={m.id} role={m.role} streaming={m.streaming} copyValue={m.texto}>
          {m.texto}
        </Message>
      ))}
    </Conversation>
    <PromptInput streaming={respondendo} onSubmit={enviar} onStop={parar} />
  </div>
  ```

  | Peca | Para que |
  |---|---|
  | `PromptInput` | O campo: cresce com o texto, Enter envia, Shift+Enter quebra a linha, e em `streaming` o enviar vira parar (`onStop`) |
  | `Message` | Um turno: `role` `user`, `assistant` ou `system` decide o desenho; `streaming` anuncia `aria-busy` e esconde copiar e tentar de novo |
  | `Conversation` | A lista rolavel: gruda no fim enquanto o texto chega, solta quando a pessoa rola para cima, e e `role="log"` educado |
  | `ToolCall` | A chamada de ferramenta: cinco estados com icone e texto, entrada e saida no `CodeBlock`, e aprovar e recusar em `approval` |
  | `AILabel` | O selo "IA" do conteudo gerado, com explicacao opcional num painel. `aiLabelVariants` sai junto, para quem precisa da classe |

  **A altura da `Conversation` e sua, por classe**, como a do grafico: sem ela
  a conversa cresce e empurra a pagina.

- **`@rivocode/ui/dnd`**, arrastar e soltar. Peer opcional: `@dnd-kit/core` e
  `@dnd-kit/sortable`, instalados por quem importa este caminho, e por mais
  ninguem.

  ```bash
  npm install @dnd-kit/core @dnd-kit/sortable
  ```

  ```tsx
  import { Kanban, SortableList } from '@rivocode/ui/dnd'

  <SortableList
    items={notas}
    getKey={(nota) => nota.id}
    getLabel={(nota) => `Nota ${nota.numero}`}
    onReorder={setNotas}
    renderItem={(nota) => nota.cliente}
  />
  ```

  | Peca | Para que |
  |---|---|
  | `SortableList` | A lista que a pessoa ordena a mao: alca com o icone de pegar, vertical ou horizontal, e `handle={false}` com `handleProps` para a alca ser sua |
  | `Kanban` | O quadro de colunas: cartao entre colunas e dentro delas, contagem, `limit` que avisa e nao tranca, coluna vazia que recebe |

  **As duas sao controladas.** A ordem nova sai pronta em `onReorder`, e a
  mudanca do quadro sai em `onMove({ itemId, from, to, index })`; quem troca
  `items` ou `columns` e a sua tela. Sem trocar, o item volta ao lugar.

  **O teclado nao e opcional**: Espaco pega, setas movem, Espaco solta, Esc
  cancela, e cada passo e anunciado em portugues ("Item Nota 1043 movido para
  a posicao 3 de 8"). `getLabel` da o nome que o anuncio fala, e `labels` troca
  qualquer frase. Os vizinhos andam com a mola espacial dos tokens, e com
  "reduzir movimento" trocam de lugar sem deslizar.

- **`@rivocode/ui/editor`**, o texto com formatacao, sobre o Tiptap 3. Os peers
  sao OPCIONAIS e so este caminho os cobra: `@tiptap/react`, `@tiptap/pm`,
  `@tiptap/core`, `@tiptap/starter-kit` e `@tiptap/extensions`.

  ```tsx
  import { RichTextEditor, RichTextView } from '@rivocode/ui/editor'

  <Field>
    <FieldLabel>Descrição do serviço</FieldLabel>
    <RichTextEditor value={html} onValueChange={setHtml} maxLength={2000} />
  </Field>

  <RichTextView value={nota.descricao} empty="Sem descrição." />
  ```

  | Peca | Para que |
  |---|---|
  | `RichTextEditor` | O campo: barra de ferramentas com setas e `aria-pressed`, atalhos, link com painel, `value` em HTML e `onJsonChange` opcional, `maxLength` com contador. O editor em branco entrega `""`, e no formulario o adaptador e o `forValue` mais o `onBlur` |
  | `RichTextView` | Exibe o HTML ou o JSON salvo com a mesma tipografia, sem `innerHTML` e sem o Tiptap: so os blocos e marcas do editor, e link so `http`, `https`, `mailto`, `tel` ou relativo |

  **O editor nao monta no servidor** (`immediatelyRender: false`): no lugar
  dele sai o conteudo ja formatado, e ele vira editavel quando o JavaScript
  chega. O HTML que chega ao servidor e entrada de usuario como qualquer outra;
  exibido por outro caminho que nao o `RichTextView`, passe por sanitizador.

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
`formatters` reune os nove, para quem monta a escolha em runtime. O
`@rivocode/ui-native` exporta os mesmos nove pela raiz, do mesmo arquivo, e o
`format` vale igual no `Meter`, no `Progress`, no `Slider`, no `ChartDonut` e no
`deltaFormat` do `Stat` de la:

```tsx
<Meter value={72} format="percent" />
<ChartYAxis format="currencyShort" />
<Slider defaultValue={25} max={50} format={(valor) => `${valor} dias`} />
```

Data e mascara tem as suas, pelo mesmo motivo: `formatDate`, `parseDate` e
`applyDateMask` para `dd/mm/aaaa`, e `applyMask`, `applyPattern`,
`applyCurrencyMask`, `unmask`, `toCents` e `phonePatternFor` para os moldes de
`MASKS`. Formatar CPF numa celula de tabela nao precisa de um campo por perto.
`isValidCpf` e `isValidCnpj` conferem os digitos verificadores, com ou sem
pontuacao e com o CNPJ alfanumerico. `isValidCnh`, `isValidVoterId` (titulo de
eleitor), `isValidPis` (PIS, PASEP, NIT e NIS), `isValidRenavam` (o de 9 digitos
continua valendo) e `isValidPlate` (a antiga e a Mercosul) seguem o mesmo
molde: texto com ou sem pontuacao, `true` ou `false`, e nenhuma consulta a
cadastro. Todas existem tambem no nativo, pela mesma conta, e o guia
"Documentos brasileiros" do site diz o que cada uma confere.

O Pix tem as tres dele, nos dois pacotes e pela raiz: `buildPixPayload` monta
o copia e cola estatico no padrao BR Code do Banco Central, com o CRC16 no fim;
`parsePixPayload` le de volta e devolve `null` quando o CRC nao confere; e
`isValidPixKey` confere a chave como o DICT a guarda (CPF e CNPJ sem
pontuacao, e-mail em minusculas, celular com `+55`, chave aleatoria com os
hifens). O desenho e o `PixCode`.

Dinheiro digitado e o `CurrencyInput`: `value` e `onValueChange` em centavos
inteiros (`number | null`, vazio e `null`), `min` e `max` em centavos que so
marcam invalido, `allowNegative` e `name` que poe os centavos num campo
escondido. No `FormField`, `{...forValue(field)}`. O nativo tem o mesmo nome,
controlado.

Assinatura na tela e o `SignaturePad`: `value` e `onValueChange` com
`SignatureValue | null` (os tracos em `kind: "drawn"`, ou o nome digitado em
`kind: "typed"`), vazio e `null`, e `onValueChange` chega ao fim de cada traco.
O modo de digitar o nome e a alternativa de quem nao desenha, e nao se desliga.
`signatureToSvg` e `signatureToPng` exportam com a tinta fixa, e
`isSignatureEmpty` responde se ha assinatura. No `FormField`,
`{...forValue(field)}`. No nativo mora em `@rivocode/ui-native/chart`, pelo
`react-native-svg`, e exporta so o SVG.

O boleto tem tres: `isValidBoletoLine` confere a linha digitavel inteira - a de
banco, de 47 digitos, com os tres campos no modulo 10 e o verificador geral no
11, e a de convenio, de 48 e comecando com 8, no modulo que a terceira casa
pede -, `boletoLineToBarcode` devolve os 44 digitos do codigo de barras ou
`null`, e `parseBoleto` devolve `BoletoData` (`kind`, `bank`, `amount` em
centavos, `dueDate`, `segment`, `line` e `barcode`) ou `null`. Ele aceita
tambem os 44 digitos do leitor otico. O fator de vencimento voltou a 1000 em
22/02/2025, e o mesmo fator serve a duas datas: `parseBoleto` escolhe a mais
perto de hoje, e `{ today }` fixa o dia de referencia. `MASKS` ganha o molde
`boleto`, que troca para o de convenio quando o primeiro digito e 8, e o
`MaskedInput` nativo aceita o mesmo nome.

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

### Hooks utilitarios

A raiz exporta os hooks que toda tela reescreve, sem dependencia nova. Antes de
escrever `useEffect` com `setTimeout`, `addEventListener` ou `localStorage`,
procure aqui. Todos limpam timer, escuta e observer no desmonte, e todos
renderizam no servidor sem tocar em `window`.

- **Estado:** `useDisclosure` (`[aberto, { open, close, toggle }]`),
  `useToggle`, `useCounter` (piso, teto, passo), `useListState` (`append`,
  `prepend`, `insert`, `remove`, `reorder`, `swap`, `replace`, `update`,
  `filter`, todos imutaveis), `useSetState` (mescla o parcial), `usePrevious`
  (o valor anterior DIFERENTE).
- **Tempo:** `useDebouncedValue`, `useDebouncedCallback`,
  `useThrottledCallback` (com `cancel`, `flush`, `isPending`), `useInterval` e
  `useTimeout` (atraso `null` pausa), `useIdle`.
- **Navegador:** `useLocalStorage` e `useSessionStorage` (JSON, padrao no
  servidor, sincroniza entre abas pelo evento `storage`, cai para memoria se o
  armazenamento lancar), `useClickOutside`, `useHotkeys` (`mod` e Cmd no Mac e
  Ctrl fora; ignora campo de texto por padrao), `useInfiniteScroll`
  (sentinela, `hasMore`, `loading`), `useIntersection`, `useElementSize`,
  `useClipboard` (`copied` volta sozinho), `useReducedMotion`,
  `useDocumentTitle`, `useNetworkStatus`, `useMounted`, `useIsFirstRender`.

```tsx
const [query, setQuery] = useState('')
const [settled] = useDebouncedValue(query, 300)
const [opened, { open, close }] = useDisclosure()
```

A peca vem antes do hook: `Popover`, `Menu`, `Dialog` e `Sheet` ja fecham no
clique fora, e o `Clipboard` ja e o botao de copiar. `useFocusTrap` nao existe
de proposito: a Base UI prende o foco nas sobreposicoes modais.

No nativo, a raiz exporta os doze que nao dependem do navegador, gerados da
mesma fonte do web: `useDisclosure`, `useToggle`, `useCounter`, `useListState`,
`useSetState`, `usePrevious`, `useIsFirstRender`, `useDebouncedValue`,
`useDebouncedCallback`, `useThrottledCallback`, `useInterval` e `useTimeout`.

### O pacote nativo, e os cinco subcaminhos dele

`@rivocode/ui-native` é o mesmo catálogo em React Native, publicado como
**fonte**: o vocabulário de classes acima é o mesmo, via NativeWind, sobre os
mesmos tokens. O que atravessa é a classe, o token e a escolha da peça: **o
JSX se reescreve**. No nativo tudo é controlado (sem `defaultValue`, sem
`defaultChecked`, sem `defaultOpen`; a exceção é `Accordion` e `Collapsible`,
que aceitam os dois modos) e a lista vem por `items`, e não por
composição: `<Select items={…} value onValueChange label />`, sem
`SelectTrigger` nem `SelectItem`.

**A classe atravessa com o mesmo endereço.** `className` veste a raiz, e a
peça nativa que aceita `classNames` usa as mesmas chaves da seção "Partes" da
página web: `<Banner classNames={{ title: 'font-rc-strong' }} />` se escreve
igual nos dois pacotes, e a classe de quem usa vence a da peça. Parte que o
nativo não desenha fica fora do tipo, e não vira nó inventado (o `pause` do
`Carousel`, sem `autoplay`; o `code` do `QRCode`, que é `Svg` e não recebe
classe). No React Native a cor de texto não desce de `View` para `Text`: para
pintar texto, vista a parte que é o próprio texto. Não há prop
`<parte>ClassName` em nenhum dos dois pacotes: onde o web compõe peças e o
nativo desenha uma só, as peças viram partes (`<InputGroup classNames={{ prefix
}} />`, `<Menu classNames={{ trigger }} />`). A exceção é o
`contentContainerClassName` do `ScrollArea` nativo, nome que a `ScrollView` já
dá ao conteúdo que rola.

**O nome falado é `label` nas peças nativas**, no lugar do `aria-label` do
web: o `Checkbox` e o `Switch` sem texto ao lado exigem `label`, e o
`OTPField` e o `SignaturePad` o aceitam. `accessibilityLabel` fica só onde a
peça é o `TextInput` da plataforma e no `Item`, cuja linha já tem texto.

A regra que desenha o pacote é **um subcaminho por peer, e não um por
assunto**. Quatro peers são opcionais, e é o peer que decide onde a porta
fica: no celular um módulo do Expo e o `react-native-svg` custam **build**, e
não só bytes, e o metro resolve import por arquivo. Então quem só quer um
`Button` não pode encontrar nenhum deles no índice da raiz. Juntar `Clipboard`
e `FileUpload` numa porta só, um `/expo`, cobraria o seletor de documentos de
quem apenas copia a chave de acesso de uma NF-e; por isso são duas. A
exceção escrita é o `/ai`, que não tem peer e é caminho próprio pelo peso,
explicado mais abaixo.

| Subcaminho | O peer que ele custa | O que sai por ele |
|---|---|---|
| `@rivocode/ui-native/form` | `react-hook-form`, mais `zod` e `@hookform/resolvers` no `useZodForm` | `Form`, `FormField`, `useZodForm` e os adaptadores `forText`, `forValue`, `forChecked`, `forDate` |
| `@rivocode/ui-native/chart` | `react-native-svg` | `ChartContainer`, `ChartDonut`, `ChartRadial`, `ChartGauge`, `ChartHeatmap`, `ChartFunnel`, `ChartTreemap`, as marcas `ChartBar` e `ChartLine`, a `PALETTE`, e o `QRCode` e o `PixCode`, que desenham com o mesmo peer |
| `@rivocode/ui-native/chart` | `react-native-svg` | `ChartContainer`, `ChartDonut`, `ChartRadial`, as marcas `ChartBar` e `ChartLine`, a `PALETTE`, o `QRCode`, o `PixCode` e o `SignaturePad` (com `signatureToSvg` e `isSignatureEmpty`), que desenham com o mesmo peer |
| `@rivocode/ui-native/clipboard` | `expo-clipboard` | `Clipboard` |
| `@rivocode/ui-native/file-upload` | `expo-document-picker` | `FileUpload`, `FileUploadList`, `FileUploadItem` |

```sh
npx expo install react-native-svg expo-clipboard expo-document-picker
```

**O formulário tem um adaptador a mais, o `forText`**, porque no nativo o campo
não devolve evento: o `TextInput` entrega o texto direto, e `forValue` não
serve. E **nada envia sozinho**: sem `<form>`, sem `type="submit"` e sem
Enter, o `Form` entrega `{ submit, isSubmitting }` por função. O rótulo viaja
no campo: sem `for` nem `id`, o `FormField` põe `accessibilityLabel` e
`invalid` na linha, e o adaptador os leva ao controle: como `label` nas peças,
que se nomeiam por ele, e como `accessibilityLabel` no `Input` e no `Textarea`,
que são o `TextInput` da plataforma.

```tsx
import { Form, FormField, forText, useZodForm } from '@rivocode/ui-native/form'
```

**O gráfico não tem Recharts, nem variável de CSS, nem contentor que meça.** O
`ChartContainer` faz as três coisas à mão e **entrega**: `children` como função
recebe `{ width, height, colors }`, no lugar de `var(--color-série)`, e a
medida chega zerada no primeiro quadro. Os quatro finais de uma consulta
(`isLoading`, `isError`, `onRetry`, `empty`) atravessam com os mesmos nomes, e
a altura continua sendo sua, por classe.

A `PALETTE` é a lista dos oito papéis de série do tema (`chart-1` a `chart-8`),
na ordem em que devem ser usados: série sem `color` no `config` recebe o
próximo da paleta, e é ela que o `ChartDonut` percorre fatia a fatia. **Cor de
série aqui é papel de token, nunca hexadecimal.** O web aceita qualquer cor de
CSS na mesma prop porque lá ela vira `var(--color-série)` e o tema continua no
comando; aqui a cor que a peça recebe é o valor final que vai para o desenho, e
um `#22c55e` escrito ali seria a única coisa da tela que não muda quando o
cliente troca de tema.

```tsx
import { ChartBar, ChartContainer, ChartDonut, ChartLine, ChartRadial, PALETTE } from '@rivocode/ui-native/chart'
```

`ChartBar` e `ChartLine` são as marcas que andam: desenhe a barra e a linha com
elas, dentro da função da moldura, no lugar de `Rect` e `Path` crus. Na
montagem elas entram (a barra cresce da base, a linha sobe da `baseline`, ou do
ponto mais baixo) e, quando o dado muda, vão até o valor novo com os tokens de
movimento, pelo Reanimated; com "reduzir movimento", nascem no lugar e saltam.
A rosca e o arco fazem o mesmo sozinhos, e a `Sparkline` só esmaece ao entrar.

A `Sparkline` fica fora deste subcaminho, na raiz e desenhada com `View`: ela é
o slot `chart` do `Stat`, o `Stat` sai da raiz, e trazê-la para cá cobraria o
`react-native-svg` de quem só queria um número num cartão.

**Copiar confirma duas vezes.** O `Clipboard` troca o nome do botão, como no
web, e dispara **também** um aviso: `accessibilityLabel` trocado num
`Pressable` que já está sob o foco não é reanunciado nem pelo VoiceOver nem
pelo TalkBack, e o aviso do `RivoProvider` é o único canal da tela que fala
sozinho (`toast={false}` desliga).

**E a área de soltar não existe.** No celular não há arrastar: o `FileUpload`
abre o seletor do sistema por um botão de altura de controle, com o `hint`
dentro do nome falado, e o `accept` fala MIME, que é o que o seletor sabe
filtrar. O que volta é um `PickedFile` com `uri` local: `size` pode faltar, e
`maxSize` só recusa o que mediu. A lista do que já entrou é a `FileUploadList`,
com um `FileUploadItem` por arquivo.

```tsx
import { Clipboard } from '@rivocode/ui-native/clipboard'
import { FileUpload, FileUploadItem, FileUploadList } from '@rivocode/ui-native/file-upload'
```

**As peças de IA moram em `@rivocode/ui-native/ai`, um dos dois caminhos sem
peer.** A regra do peer continua valendo para os outros quatro; este existe
pelo peso. O metro não sacode árvore: importar um `Button` do índice da raiz
compila tudo o que ele alcança, e a conversa com um modelo não pode entrar no
aplicativo de quem só emite nota. É o mesmo caminho do web, trocando o nome do
pacote.

```tsx
import { AILabel, Conversation, Message, PromptInput, ToolCall } from '@rivocode/ui-native/ai'
```

A `Conversation` vem por `items`, `renderItem` e `keyExtractor`, sobre uma
`FlatList` invertida; o `PromptInput` é controlado e envia só pelo botão,
porque o retorno do teclado do celular quebra a linha; a `Message` tem `onCopy`
no lugar do `copyValue`, porque copiar é do `expo-clipboard`; e a explicação do
`AILabel` abre numa `Sheet`.

**A `SortableList` mora em `@rivocode/ui-native/dnd`, o outro caminho sem
peer.** No web ela carrega o dnd-kit; aqui o gesto é o `PanResponder` do core,
o mesmo do `Slider`, e o `react-native-gesture-handler` não é pedido. O caminho
próprio existe para a linha de import ser a mesma nos dois pacotes. **Só a
alça arrasta** (44pt, e ela segura o gesto até o dedo sair), porque a linha
inteira como alça transformaria todo gesto de rolar num arrasto; o leitor de
tela move por duas ações, "Mover para cima" e "Mover para baixo", com os
mesmos anúncios do web.

```tsx
import { SortableList } from '@rivocode/ui-native/dnd'
```

**O `Kanban` não porta, por decisão.** A 390px cabe uma coluna, e arrastar um
cartão para a coluna que não está na tela disputa o dedo com a rolagem. No
aplicativo, cada coluna vira uma lista (`Tabs` ou seções) e mudar de coluna é
um `Menu` com "Mover para"; o `onMove` do lado de quem guarda o estado é o
mesmo.

**Tema de cliente aqui é decisão de BUILD, e não prop de runtime.** Os dois
temas de casa trocam com a tela aberta, porque foram compilados como
`light-dark()` e o provider só gira o `Appearance`. A cor de um cliente, não: o
compilador do `react-native-css` crava o valor do token dentro da classe, e
`<RivoProvider theme={{ light, dark }}>` alcança só quem lê cor por JS (os
gráficos, o giro do `Button`, o trilho do `Switch`), deixando fundo, cartão,
botão, selo e borda com a cor da casa - a tela sai **misturada**, e não sem
marca. Vista o cliente sobrescrevendo os papéis num `@theme` do CSS do app antes
de compilar, e passe o mapa de tema junto para a metade de JS concordar. São
**dois temas por build**, porque `light-dark()` tem duas vagas. O passo a passo
está em <https://ds.rivocode.com.br/temas.md>.

O resto da paridade (o que traduz, o que muda de nome e o que não porta por
decisão) está em <https://ds.rivocode.com.br/react-native.md>.

### Onde esta a verdade

| O que | Onde |
|---|---|
| Indice de tudo | <https://ds.rivocode.com.br/llms.txt> |
| Uma peca, com props e exemplos | `https://ds.rivocode.com.br/componentes/<nome-em-kebab>.md` |
| Os papeis de um tema, todos | <https://ds.rivocode.com.br/temas.md> |
| Um sistema inteiro, montado | <https://ds.rivocode.com.br/demonstracao> |

**Nunca invente prop.** Se o `.md` da peca nao a lista, ela nao existe.

### Os nomes do estado

Cada ideia de estado tem um nome só, nos dois pacotes: o controlado, o inicial
(onde a peça sabe se guardar sozinha) e o aviso.

| A ideia | O trio | Onde |
|---|---|---|
| aberto ou fechado | `open`, `defaultOpen`, `onOpenChange` | `Collapsible`, `AccordionItem`, `Spoiler`, `Tour`, `ToolCall`, os `Dialog`; na `Tree`, a lista de galhos abertos |
| o passo de uma sequência | `step`, `defaultStep`, `onStepChange` | `Tour`; o `Steps` só controlado, pelo `useWizard` |
| a posição numa coleção | `index`, `defaultIndex`, `onIndexChange` | `Carousel`, `ImageViewer` |
| a página de uma lista paginada | `page`, `onPageChange` | `Pagination` |
| o que foi escolhido ou digitado | `value`, `defaultValue`, `onValueChange` | campos, `Accordion`, `Tabs` |

`step` e `index` contam de zero, porque são posição de programa. `page` conta
de um, porque é o número que a pessoa lê na tela e que o servidor recebe na
query: `page={3}` é a página 3, e converter nos dois sentidos em toda chamada
é onde nasce o erro de um a mais. `step` é passo de uma sequência que anda
para a frente; `index` é lugar numa coleção que se percorre em qualquer ordem,
como o slide do `Carousel`.

Não existe `expanded`, `visible` nem `current` para essas ideias. O
`Accordion` fica em `value` porque o que ele guarda é quais itens estão
abertos, e não se um está; com `multiple` ele deixa vários ao mesmo tempo, e
sem ela abre um por vez, nos dois pacotes.

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

### Texto de interface mora em `labels`

O texto que a peca escreve sozinha - o nome de um botao, o que o leitor de tela
ouve, uma frase fixa - se troca por um objeto so, `labels`, nos dois pacotes e
com as mesmas chaves. Passe so as chaves que mudam; o resto fica no padrao em
portugues:

```tsx
<Popconfirm
  trigger={<Button variant="ghost">Excluir</Button>}
  title="Excluir a nota 4813?"
  onConfirm={remove}
  labels={{ confirm: "Excluir" }}
/>
<QueryBoundary data={data} isError={isError} onRetry={refetch} labels={{ retry: "Try again" }}>
  {(invoices) => <InvoiceList invoices={invoices} />}
</QueryBoundary>
```

Nao existe prop solta terminada em `Label` para texto de interface: a chave e o
nome da prop antiga sem o `Label` (`retry`, `dismiss`, `confirm`, `cancel`,
`busy`, `submit`, `stop`, `scroll`, `swatches`, `external`, `empty`). O que fica
fora de `labels` e CONTEUDO, e continua prop: o `label` que da nome ao campo ou a
regiao, o `title` e o `errorTitle` de um aviso, o `centerLabel` de um grafico, o
`deltaLabel` de um `Stat`, o `thumbLabel` de um `Slider`, o `placeholder`.

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
