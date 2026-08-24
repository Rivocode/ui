---
name: rivocode-ui
description: Construir telas com o design system @rivocode/ui da RivoCode. Use ao criar ou alterar qualquer interface React neste projeto - escolher componente, escrever layout, aplicar tema e densidade, montar formulário ou gráfico. Traz o contrato da biblioteca e o endereço da documentação de cada peça.
---

# Construir UI com o @rivocode/ui

Biblioteca white-label da RivoCode, sobre a Base UI. **Nenhum componente
conhece a cor da marca**: ele pede um papel semântico e o tema responde. É isso
que deixa a mesma peça servir a RivoCode num projeto e outro cliente no
seguinte.

## Antes de escrever a primeira linha

1. **Confira se a peça já existe.** São 65, e o catálogo cobre quase tudo que
   uma tela de produto pede. Escrever um `<div>` com borda no lugar de um
   `Card`, ou um `<select>` nativo no lugar do `Select`, quebra o tema e a
   acessibilidade de uma vez.

   O índice fica em <https://ds.rivocode.com.br/llms.txt>.

2. **Leia o documento da peça antes de usá-la**, em
   `https://ds.rivocode.com.br/componentes/<nome-em-kebab>.md`. Ele traz a
   importação, exemplos que rodam, a tabela de props e as partes que a compõem.
   `ToggleGroup` mora em `/componentes/toggle-group.md`.

3. **Nunca invente prop.** Se o documento não a lista, ela não existe. A
   biblioteca é tipada; um chute falha no `tsc` na melhor das hipóteses, e passa
   despercebido como atributo solto no DOM na pior.

## O Provider, uma vez, na raiz

Sem ele nada tem estilo, e `Dialog`, `Menu`, `Select`, `Tooltip` e os avisos
lançam erro, porque leem o contexto dele.

```tsx
import '@rivocode/ui/styles.css'
import { RivoProvider } from '@rivocode/ui'

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <InvoiceScreen />
    </RivoProvider>
  )
}
```

- `theme`: `rivocode-dark` (padrão), `rivocode-light` ou `system`.
- `density`: `comfortable` (padrão) ou `compact`, para tela de operação, onde
  cabe mais linha na mesma altura.
- `scope`: `global` veste a página; `local` veste só aquela árvore e pinta o
  fundo dela. Em preview e cartão isolado use `local`, senão o conteúdo sai
  claro sobre claro.

O Provider já monta por dentro o provedor de dica, a fiação de aviso e um
container de portal que leva o tema junto. **Não monte nenhum deles à mão.**

## O vocabulário de classes

Escreva layout com as mesmas classes que os componentes usam.

**Nunca escreva cor literal nem `z-index` numérico.** O `bun run check` do
repositório da biblioteca falha nisso, e no seu projeto o efeito é pior: a peça
para de responder ao tema do cliente.

| Família | Classes |
|---|---|
| Superfície | `bg-bg`, `bg-surface`, `bg-surface-raised`, `bg-overlay` |
| Texto | `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-disabled` |
| Acento | `bg-accent`, `text-accent-fg`, `text-accent-text`, `bg-accent-subtle` |
| Linha e foco | `border-border`, `border-border-strong`, `ring-ring` |
| Estado | `bg-success`, `text-success-text`, `bg-danger-subtle`, e o mesmo para `warning` e `info` |
| Seleção e carga | `bg-selected`, `bg-skeleton` |
| Forma | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill` |
| Tipografia | `text-xs` a `text-3xl`, `font-sans`, `font-display`, `font-mono` |
| Sombra | `shadow-1`, `shadow-2`, `shadow-3` |
| Empilhamento | `z-[var(--rc-z-dialog)]`, e os pares `dropdown`, `overlay`, `popover`, `toast`, `tooltip` |

**Preencher e escrever texto são tokens diferentes.** `bg-danger` preenche e
recebe `text-danger-fg` por cima; `text-danger-text` é o vermelho que se lê
sobre o fundo da página. Nenhuma cor serve para as duas funções. Vale igual para
o acento: `bg-accent` com `text-accent-fg`, ou `text-accent-text` solto.

**Altura de controle vem da densidade**, nunca cravada:
`h-[var(--rc-control-md)]`, com `sm` e `lg` disponíveis. Cravar `h-10` quebra a
densidade compacta.

## Escolhas que costumam sair erradas

| Situação | Peça certa | Por quê |
|---|---|---|
| Aviso que fica na tela | `Alert` | O `Toast` passa, e quem estava olhando para outro canto perde |
| Confirmação destrutiva | `AlertDialog` | Ele exige resposta; o `Dialog` deixa fechar clicando fora |
| Escolha entre poucas opções fixas | `Select` | O `Combobox` pede digitação sem precisar |
| Lista longa, ou vinda do servidor | `Combobox` | Não cabe na cabeça de quem escolhe |
| Liga agora, sem confirmar | `Switch` | O `Checkbox` só vale quando o formulário for enviado |
| Marcar uma opção entre várias | `ToggleGroup` | Guarda estado e diz isso no aria |
| Ações irmãs encostadas | `ButtonGroup` | Não guarda estado; são ações, não escolha |
| Quanto de uma capacidade está em uso | `Meter` | O `Progress` anda para o fim e termina |
| Listagem com estados de consulta | `DataTable` | Recebe carregando, erro e vazio prontos |
| Tabela montada à mão | `Table` e suas partes | Sai como `<table>` de verdade |

## Toda consulta tem quatro finais

Carregando, deu certo, deu errado, veio vazia. O `DataTable` e o
`ChartContainer` recebem os quatro:

```tsx
<DataTable
  data={query.data}
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={query.refetch}
  rowKey={(invoice) => invoice.id}
  empty={{
    title: 'Nenhuma nota por aqui',
    description: 'Quando você emitir a primeira, ela aparece nesta lista.',
  }}
  columns={[
    { key: 'number', header: 'Número' },
    { key: 'customer', header: 'Cliente' },
    { key: 'amount', header: 'Valor', align: 'right' },
    { key: 'status', header: 'Situação', hideOnMobile: true },
  ]}
/>
```

A descrição do vazio é obrigatória de propósito: "nenhum resultado" transfere
para a pessoa o trabalho de descobrir por quê, e ela quase nunca descobre.

## Os dois subcaminhos

Não vêm no pacote principal. São dependências opcionais, e chegam pelo mesmo
provider.

### `@rivocode/ui/form`

React Hook Form com Zod. O esquema é a fonte da verdade: valida e ainda dá o
tipo do formulário. O controle vem por função, não por clonagem do filho.

```tsx
import { Form, FormField, useZodForm } from '@rivocode/ui/form'
import { Input } from '@rivocode/ui'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  amount: z.string().min(1, 'Informe o valor'),
})

function InvoiceForm({ onIssue }: { onIssue: (data: unknown) => void }) {
  const form = useZodForm(schema)

  return (
    <Form form={form} onSubmit={onIssue}>
      <FormField
        name="email"
        label="E-mail do cliente"
        description="Para onde vai a nota"
        render={(field) => <Input {...field} type="email" />}
      />
      <Button type="submit" loading={form.formState.isSubmitting}>
        Emitir nota
      </Button>
    </Form>
  )
}
```

O `FormField` não inventa `id`: ele monta rótulo, controle, ajuda e erro dentro
do `Field`, e a Base UI liga `aria-describedby` e `aria-invalid` sozinha.

### `@rivocode/ui/chart`

Recharts vestida pelo tema. A cor de cada série vem do `config` e vira variável
com o nome da série. **A altura é sua, por classe: gráfico sem altura some.**

```tsx
import {
  Area, AreaChart, CartesianGrid, ChartContainer, ChartTooltip,
  ChartTooltipContent, ChartXAxis, ChartYAxis, type ChartConfig,
} from '@rivocode/ui/chart'

const config: ChartConfig = { billed: { label: 'Faturado' } }

<ChartContainer config={config} className="h-72">
  <AreaChart data={months}>
    <CartesianGrid vertical={false} />
    <ChartXAxis dataKey="month" />
    <ChartYAxis format="currencyShort" />
    <ChartTooltip content={<ChartTooltipContent config={config} />} />
    <Area dataKey="billed" stroke="var(--color-billed)" fill="var(--color-billed)" />
  </AreaChart>
</ChartContainer>
```

`ChartXAxis` e `ChartYAxis` já vêm sem a linha grossa e sem o tracinho de 2015.
O `format` aceita `currency`, `currencyShort`, `compact`, `integer`, `percent`,
`monthShort`, `dayMonth`, ou uma função sua.

Também há `ChartDonut`, com o total no buraco, e `Sparkline`, a linha miúda que
cabe dentro de um indicador. O `Tooltip` e o `Legend` da Recharts **não** saem
por aqui: os nossos já embrulham os dois.

## Mobile primeiro

Todo componente decide o comportamento estreito antes do largo, e o seu layout
deve fazer o mesmo. O `Sheet` encosta embaixo no celular, a coluna com
`hideOnMobile` some, a fila de abas rola de lado em vez de quebrar linha.

Escreva a versão estreita e acrescente `sm:` e `lg:` por cima, nunca o
contrário.

## O que nunca fazer

- Cor literal em `className` ou em `style`. Sempre token.
- `z-index` numérico. Sempre `z-[var(--rc-z-*)]`.
- Altura cravada em controle. Sempre `var(--rc-control-*)`.
- Montar `TooltipProvider`, `ToastViewport` ou container de portal à mão. O
  Provider já fez.
- Usar `Toast` para o que precisa continuar visível, ou `Dialog` para o que não
  pode ser dispensado clicando fora.
- Inventar prop sem conferir o `.md` da peça.
- Texto de interface em inglês. **Código em inglês, conteúdo em PT-BR.** Termo
  do ecossistema não se traduz: é "agents", não "agentes".

## Vestir com a cor de outro cliente

Um tema é a camada 3, e são **cinquenta papéis**. Escrever só os dez óbvios
deixa gráfico e estados sem cor, e a falha é silenciosa: o componente cai no
valor do tema anterior, e aparece uma cor da RivoCode isolada no meio da marca
do cliente.

Antes de escrever um tema, leia <https://ds.rivocode.com.br/temas.md>. Ele traz
a lista completa dos papéis, o que cada um veste, e o esqueleto pronto.

## Endereços

| O quê | Onde |
|---|---|
| Índice de tudo | <https://ds.rivocode.com.br/llms.txt> |
| Contrato completo | <https://ds.rivocode.com.br/convencoes.md> |
| Uma peça | `https://ds.rivocode.com.br/componentes/<nome-em-kebab>.md` |
| Um guia | `https://ds.rivocode.com.br/<slug>.md`, como `/temas.md` |
| Um sistema inteiro, montado | <https://ds.rivocode.com.br/demonstracao> |
