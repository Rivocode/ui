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
| Empilhamento | `z-[var(--rc-z-dialog)]`, e os pares `dropdown`, `overlay`, `popover`, `toast`, `tooltip` |

**Preencher e escrever texto sao tokens diferentes.** `bg-danger` preenche e
recebe `text-danger-fg` por cima. `text-danger-text` e o vermelho que se le
sobre o fundo da pagina. Nenhuma cor serve para as duas funcoes. Vale igual
para o acento: `bg-accent` com `text-accent-fg`, ou `text-accent-text` solto.

**Altura de controle vem da densidade**, nunca cravada:
`h-[var(--rc-control-md)]`, com `sm` e `lg` disponiveis.

### Os dois subcaminhos

Alem do pacote principal, duas familias vivem em subcaminhos e chegam pelo
mesmo global:

- **`@rivocode/ui/form`**, `Form`, `FormField`, `useZodForm` e os adaptadores
  `paraDatePicker`, `paraSelect`, `paraCheckbox`. O controle vem por funcao,
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

  Os formatadores: `currency`, `currencyShort`, `compact`, `integer`,
  `percent`, `monthShort`, `dayMonth`. O `format` dos eixos aceita o nome de um
  deles, ou uma funcao sua.

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
